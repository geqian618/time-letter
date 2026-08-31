<template>
  <div class="canvas-viewport">
    <div class="uploader" ref="uploaderRef" v-show="canvasesStore.uploadVisible"
         @click="requestImportFiles({isDragOver: false})">
      <img src="/src/assets/icon/upload.svg" alt="上传">
      <span>拖拽上传文件</span>
    </div>
    <div class="canvas-workspace" id="canvas-workspace" ref="canvasWorkspaceRef" @mousedown="triggerContextMenu">
      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas id="background-canvas" ref="backgroundElement"></canvas>
        <canvas id="foreground-canvas" ref="canvasElement"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="js">

import {ref, onMounted, onUnmounted} from 'vue'

import _ from 'lodash'

import useEventListener from '@/composables/useEventListener'

import {CanvasEditor, Image, LazyImage, Rect, Text} from '@/canvas/CanvasEditor'

import {getCurrentDate, getCurrentDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import CanvasManager from '@/object/CanvasManager'

import DraggableElementFactory from '@/object/DraggableElementFactory'

import {canvasActions} from '@/object/CanvasActions'

import {BorderOptions, PhotographOptions} from '@/object/Configuration'

import {useCanvasesStore} from '@/stores/canvases'
import {useProjectSettingsStore} from '@/stores/project-settings'
import {useTemplatesStore} from '@/stores/templates'

const canvasesStore = useCanvasesStore()

const settingsStore = useProjectSettingsStore()

const templatesStore = useTemplatesStore()

const uploaderRef = ref(null)

const canvasWorkspaceRef = ref(null)

const canvasElement = ref(null)

const canvasWrapper = ref(null)

const backgroundElement = ref(null)

// 前景 / 背景层编辑器实例（非响应式）
let canvasEditor = null;

let backgroundCanvasEditor = null;

// 渲染版本号，防止快速切图时的异步渲染竞态
let renderVersion = 0;

const zoomOptions = {
  minZoom: 0.1,
  maxZoom: 5
}

let scrollTimeout = null;

let isCanvasDraggingMode = false

// 缩放跟随动画状态：rAF 每帧读取画布过渡中的真实尺寸并同步滚动条，
// 使光标下的内容点在整段 0.1s 缩放动画期间始终钉住，既保留平滑感又无漂移
let zoomRafId = null
// { sx, sy, w0, h0, fx, fy } 锚点，每次滚轮事件按当前状态刷新
let zoomPin = null
let zoomLastEvent = 0
// 覆盖 100ms 过渡 + 连续滚轮重定向的余量
const ZOOM_RAF_MS = 220

const requestImportFiles = (options) => {
  window.electronAPI.requestImportFiles(options)
}

// 画布工作区右键菜单
const triggerContextMenu = (e) => {
  if (e.button === 2) {
    if (CanvasManager.isNotEmpty()) {
      window.electronAPI.openContextMenu()
    }
  }
}

// 画布 / 预览右键菜单命令分发
const watchContextMenu = () => {
  window.electronAPI.watchContextMenu(async (event, data) => {
    if (data) {
      const {type} = data;
      if (type === 1) {
        removeSelectedCanvas()
      } else if (type === 2) {
        if (!canvasesStore.selectedPreviewList?.size) return
        canvasesStore.deleteTipsDialogVisible = settingsStore.projectSettings.others.deleteTipVisible;
        if (!settingsStore.projectSettings.others.deleteTipVisible) {
          permanentlyRemoveSelectedCanvas();
        }
      } else if (type === 3) {
        const paths = Array.from(canvasesStore.selectedPreviewList.keys());
        const settings = paths.map((path, index) => {
          const canvas = CanvasManager.getCanvas(path);
          const {height: imageHeight, width: imageWidth, filename} = canvas.metadata;
          if (!canvas.completed) {
            const background = {
              width: imageWidth,
              height: imageHeight,
              elements: [
                new Rect({imageWidth, imageHeight, meta: new BorderOptions()}),
                new LazyImage(canvas.url, {
                  selectable: false,
                  cacheable: true,
                  meta: {...new PhotographOptions(), path: canvas.path}
                })
              ]
            };
            return {filePath: path, index, filename, json: JSON.stringify(background)}
          }

          let {background, foreground} = _.cloneDeep(canvas);

          if (typeof background === 'string') {
            background = JSON.parse(background)
          }

          if (typeof foreground === 'string') {
            foreground = JSON.parse(foreground)
          }

          for (let element of foreground.elements) {
            background.elements.push(element);
          }
          return {filePath: path, index, filename, json: JSON.stringify(background)}
        });

        window.electronAPI.requestExportFiles(_.cloneDeep({
          projectSettings: settingsStore.projectSettings,
          outputDirectory: data.outputDirectory,
          settings
        }))
        canvasesStore.downloadProgressVisible = true
      } else if (type === 4) {
        templatesStore.saveTemplateDialogVisible = true
      } else if (type === 5) {
        templatesStore.synchronousMode = data.method
        synchronizeTemplate()
      } else if (type === 6) {
        const paths = Array.from(canvasesStore.selectedPreviewList.keys());
        paths.forEach(path => clearCanvasElements(path))
      } else if (type === 7) {
        const paths = Array.from(canvasesStore.selectedPreviewList.keys());
        paths.forEach(path => resetCanvas(path))
      }
    }
  });
}

// 画布右键菜单命令监听
watchContextMenu()


// ---------- 画布编辑器初始化与渲染 ----------

const initCanvasSize = () => {

  setTimeout(() => {

    const {canvasWorkspace: canvasWorkspaceResize} = settingsStore.projectSettings.resize;

    const {clientWidth, clientHeight} = canvasesStore.getDomRefs().page;

    canvasWorkspaceRef.value.idealWidth = Number.parseFloat(canvasWorkspaceResize.width || 0) / 100 * clientWidth || canvasWorkspaceRef.value.clientWidth

    canvasWorkspaceRef.value.idealHeight = Number.parseFloat(canvasWorkspaceResize.height || 0) / 100 * clientHeight || canvasWorkspaceRef.value.clientHeight

    renderCanvasScrollbar()

    canvasEditor = new CanvasEditor(canvasElement.value, {
      enableCache: true,
      eventScope: canvasElement.value.parentNode
    });

    backgroundCanvasEditor = new CanvasEditor(backgroundElement.value, {enableCache: true});

    // 注册编辑器实例，供其他组件读写画布
    canvasesStore.setCanvasEditor(canvasEditor)
    canvasesStore.setBackgroundCanvasEditor(backgroundCanvasEditor)

    canvasEditor.on('selection:object', (event) => {
      const {initZoom} = CanvasManager.getCurrentCanvas();
      const target = event.target;
      const {x, y, ...element} = _.cloneDeep(target);
      if (target.type === 'text') {
        const {fontSize, spacing, order, shadow: {offsetX, offsetY, blur}} = element;
        element.fontSize = fontSize * initZoom
        element.spacing = spacing * initZoom
        element.shadow.offsetX = offsetX * initZoom
        element.shadow.offsetY = offsetY * initZoom
        element.shadow.blur = blur * initZoom
        element.zIndex = order
        canvasesStore.textOptions = element
      } else if (target.type === 'image') {
        const {order, shadow: {offsetX, offsetY, blur}} = element;
        element.shadow.offsetX = offsetX * initZoom
        element.shadow.offsetY = offsetY * initZoom
        element.shadow.blur = blur * initZoom
        element.zIndex = order
        canvasesStore.imageOptions = element
      }
    })

    canvasEditor.on('update:object', (event) => {
      // console.log('修改元素', event)
    })

    canvasEditor.on('move:object', (event) => {
      const canvas = CanvasManager.getCurrentCanvas();
      canvas.foreground = canvasEditor.exportToObject()
      canvas.background = backgroundCanvasEditor.exportToObject()
    })

    canvasEditor.on('add:object', (event) => {
      // console.log('添加元素', event)
    })

  }, 1000)
}

const renderCanvasScrollbar = () => {
  canvasWorkspaceRef.value.style.overflow = settingsStore.projectSettings.appearance.enableScrollbar ? 'auto' : 'hidden'
}


// 初始化时自动滚动到图形内容区域
function scrollBarMoveToCenter(canvas) {
  if (!canvas) return
  const {offsetWidth: canvasWrapperWidth, offsetHeight: canvasWrapperHeight} = canvasWrapper.value
  const {offsetWidth: canvasWorkspaceWidth, offsetHeight: canvasWorkspaceHeight} = canvasWorkspaceRef.value
  // 计算滚动位置，使图形内容居中
  const scrollLeft = (canvasWrapperWidth - canvasWorkspaceWidth) / 2;
  const scrollTop = (canvasWrapperHeight - canvasWorkspaceHeight) / 2;
  // 设置滚动位置
  canvasWorkspaceRef.value.scrollLeft = Math.max(0, scrollLeft);
  canvasWorkspaceRef.value.scrollTop = Math.max(0, scrollTop);
  canvas.scrollLeft = Math.max(0, scrollLeft);
  canvas.scrollTop = Math.max(0, scrollTop);
}

// 将画布内容滚动到工作区居中位置（供预览面板 / 设置弹窗调用）
const centerCanvasScrollBar = () => {
  if (CanvasManager.getSelectedPath()) {
    scrollBarMoveToCenter(CanvasManager.getCurrentCanvas())
  }
}

const updateScrollBar = (canvas) => {
  // 设置滚动位置
  canvasWorkspaceRef.value.scrollLeft = canvas.scrollLeft;
  canvasWorkspaceRef.value.scrollTop = canvas.scrollTop;
}

const renderCanvas = async (canvas) => {
  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  // 切换/重渲染画布时取消进行中的缩放跟随，避免旧锚点作用到新画布
  cancelZoomPin()
  const currentVersion = ++renderVersion;
  if (!canvas.completed) {
    canvasEditor.clearCanvas();
    backgroundCanvasEditor.clearCanvas();
    const image = await Image.fromURL(canvas.url, {
      selectable: false,
      cacheable: true,
      meta: {...new PhotographOptions(), path: canvas.path, url: canvas.url}
    });

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    const width = image.width;
    const height = image.height;
    const background = new Rect({width, height, strokeWidth: 0, meta: new BorderOptions()});
    // 设置画布宽高等于缩放后的图片尺寸
    canvasEditor.resizeCanvas(width, height);
    backgroundCanvasEditor.resizeCanvas(width, height);
    const {idealWidth, idealHeight} = canvasWorkspaceRef.value;
    const initZoom = Math.min(idealHeight / height, idealWidth / width);
    const scale = initZoom * settingsStore.projectSettings.others.defaultCanvasScale;
    canvasEditor.setZoom(scale)
    backgroundCanvasEditor.setZoom(scale)
    backgroundCanvasEditor.addElement(background);
    backgroundCanvasEditor.addElement(image);
    backgroundCanvasEditor.renderAll()

    // 非最终渲染图片，放弃更新数据
    if (currentVersion !== renderVersion) return;

    canvasWrapper.value.style.width = Math.max(width, idealWidth) + 'px'
    canvasWrapper.value.style.height = Math.max(height, idealHeight) + 'px'
    scrollBarMoveToCenter(canvas)
    canvasesStore.borderOptions = background.meta
    canvasesStore.photographOptions = image.meta
    canvasesStore.metadataOptions = canvas.metadata
    canvas.completed = true
    canvas.width = width;
    canvas.height = height
    canvas.initZoom = initZoom
    canvas.zoom = canvasEditor.getZoom()
    canvas.borderOptions = _.cloneDeep(background.meta)
    canvas.photographOptions = _.cloneDeep(image.meta)
    canvas.foreground = canvasEditor.exportToObject()
    canvas.background = backgroundCanvasEditor.exportToObject()
  } else {

    const {foreground, background, zoom, metadata: {width: imageWidth, height: imageHeight}} = canvas;
    typeof foreground === 'string' ? await canvasEditor.loadFromJSON(foreground) : await canvasEditor.loadFromObject(foreground)

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    typeof background === 'string' ? await backgroundCanvasEditor.loadFromJSON(background) : await backgroundCanvasEditor.loadFromObject(background)

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    const {idealWidth, idealHeight} = canvasWorkspaceRef.value;
    // 设置缩放
    canvasEditor.setZoom(zoom);
    backgroundCanvasEditor.setZoom(zoom);
    backgroundCanvasEditor.renderAll();
    canvasEditor.renderAll();

    // 非最终渲染图片，放弃更新数据
    if (currentVersion !== renderVersion) return;

    canvasWrapper.value.style.width = Math.max(imageWidth, idealWidth) + 'px'
    canvasWrapper.value.style.height = Math.max(imageHeight, idealHeight) + 'px'
    updateScrollBar(canvas)
    const elements = backgroundCanvasEditor.getElements();
    canvasesStore.borderOptions = elements[0].meta
    canvasesStore.photographOptions = elements[1].meta
    canvasesStore.metadataOptions = canvas.metadata
    if (typeof foreground === 'string') {
      canvas.foreground = canvasEditor.exportToObject();
    }
    if (typeof background === 'string') {
      canvas.background = backgroundCanvasEditor.exportToObject()
    }
  }
}


// ---------- 画布删除 / 清空 / 重置 ----------

/**
 * 移除已选中 Canvas 列表，删除其对应磁盘文件
 */
const permanentlyRemoveSelectedCanvas = () => {
  const selectedPaths = Array.from(canvasesStore.selectedPreviewList.keys());
  window.electronAPI.deleteImages(selectedPaths)
  removeSelectedCanvas();
  if (!settingsStore.projectSettings.others.deleteTipVisible) {
    settingsStore.projectSettings.others.deleteTipVisible = false;
  }
  canvasesStore.deleteTipsDialogVisible = false
}


/**
 * 移除已选中 Canvas 列表，不删除其对应磁盘文件
 */
const removeSelectedCanvas = () => {
  const selectedPaths = Array.from(canvasesStore.selectedPreviewList.keys());
  for (let path of selectedPaths) {
    CanvasManager.deleteCanvas(path)
    if (path === CanvasManager.getSelectedPath()) {
      clearCanvas()
    }
  }
  canvasesStore.selectedPreviewList.clear();
}

const resetCanvas = (path) => {

  const canvas = CanvasManager.getCanvas(path);

  const {metadata: {width: imageWidth, height: imageHeight}} = canvas;

  const foreground = {
    width: imageWidth,
    height: imageHeight,
    elements: []
  };

  const background = {
    width: imageWidth,
    height: imageHeight,
    elements: [
      new Rect({imageWidth, imageHeight, meta: new BorderOptions()}),
      new LazyImage(canvas.url, {
        selectable: false,
        cacheable: true,
        meta: {...new PhotographOptions(), path: canvas.path}
      })
    ]
  };

  canvas.foreground = JSON.stringify(foreground);

  canvas.background = JSON.stringify(background);

  if (path === CanvasManager.getSelectedPath()) {
    renderCanvas(canvas)
  }
}

const clearCanvasElements = (path) => {

  const canvas = CanvasManager.getCanvas(path);

  let foreground = canvas.foreground;

  if (!foreground) return

  if (typeof foreground === 'string') {
    foreground = JSON.parse(foreground);
  }

  foreground.elements.length = 0;

  canvas.foreground = JSON.stringify(foreground);

  if (path === CanvasManager.getSelectedPath()) {
    canvasEditor.clearCanvas();
    canvasEditor.renderAll()
  }
}


const clearCanvas = () => {
  canvasEditor.clearCanvas();
  backgroundCanvasEditor.clearCanvas()
  CanvasManager.setSelectedObject({path: '', previewElement: null})
}


// ---------- 模版应用 ----------

// 按类型解析文本内容（日期 / 脚本 / 元数据等）
const getText = (meta) => {
  const {path, type, content, expression} = meta
  switch (type) {
    case 'date':
      return getCurrentDate();
    case 'datetime':
      return getCurrentDateTime();
    case 'script':
      return executeFunctionScript(expression);
    case 'text':
      return content;
    case 'metadata':
      return (() => {
        const {metadata} = CanvasManager.getCanvas(path);
        return metadata ? metadata[expression] : ''
      })();
  }
}

// 将选中画布的前景元素按定位方式同步到其他画布
const synchronizeTemplate = () => {
  if (CanvasManager.getSelectedPath()) {
    const {background, foreground: {width, height, elements}, initZoom} = CanvasManager.getCurrentCanvas();
    canvasesStore.selectedPreviewList.forEach((image, path) => {
      if (CanvasManager.getSelectedPath() !== path) {
        const items = []
        for (const element of elements) {
          const centerX = element.x + element.width / 2
          const centerY = element.y + element.height / 2
          const horizontal = centerX < width / 2 ? 'left' : 'right';
          const vertical = centerY < height / 2 ? 'top' : 'bottom';
          const item = {...element}
          item.position = [horizontal, vertical]
          item.offsetX = horizontal === 'left' ? element.x * initZoom : (width - element.x - element.width) * initZoom
          item.offsetY = vertical === 'top' ? element.y * initZoom : (height - element.y - element.height) * initZoom
          item.centerXRatio = horizontal === 'left' ? centerX / width : (width - centerX) / width
          item.centerYRatio = vertical === 'top' ? centerY / height : (height - centerY) / height
          item.width = element.width * initZoom
          item.height = element.height * initZoom
          if (element.type === 'text') {
            item.fontSize = element.fontSize * initZoom
          }
          items.push(item)
        }
        const {idealWidth, idealHeight} = canvasWorkspaceRef.value;
        useTemplate(_.cloneDeep({
          idealWidth,
          idealHeight,
          background,
          foreground: {width, height, elements: items}
        }), path)
      }
    })
  }
}


const useTemplate = async (settings, path) => {
  const canvas = CanvasManager.getCanvas(path);
  const {idealWidth, idealHeight, background, foreground} = settings;
  const {height: imageHeight, width: imageWidth} = canvas.metadata;

  const {idealWidth: containerWidth, idealHeight: containerHeight} = canvasWorkspaceRef.value;
  const initZoom = Math.min(containerHeight / imageHeight, containerWidth / imageWidth);
  const zoom = initZoom * settingsStore.projectSettings.others.defaultCanvasScale;
  const idealZoom = Math.min(idealHeight / imageHeight, idealWidth / imageWidth);

  const zoomRatio = initZoom / idealZoom;

  const border = background.elements[0];
  const photo = background.elements[1];
  const borderOptions = border.meta;
  const photoOptions = photo.meta;

  borderOptions.borderLeft = borderOptions.borderLeft * zoomRatio
  borderOptions.borderRight = borderOptions.borderRight * zoomRatio
  borderOptions.borderTop = borderOptions.borderTop * zoomRatio
  borderOptions.borderBottom = borderOptions.borderBottom * zoomRatio
  borderOptions.borderRadius = borderOptions.borderRadius * zoomRatio
  borderOptions.borderBlur = borderOptions.borderBlur * zoomRatio

  photoOptions.borderRadius = photoOptions.borderRadius * zoomRatio

  const borderLeft = borderOptions.borderLeft / initZoom
  const borderRight = borderOptions.borderRight / initZoom
  const borderTop = borderOptions.borderTop / initZoom
  const borderBottom = borderOptions.borderBottom / initZoom

  const newWidth = imageWidth + borderLeft + borderRight
  const newHeight = imageHeight + borderTop + borderBottom

  background.width = foreground.width = newWidth
  background.height = foreground.height = newHeight

  border.radius = borderOptions.borderRadius / initZoom
  border.width = newWidth
  border.height = newHeight

  if (border.type === 'image') {
    border.blur = borderOptions.borderBlur / initZoom
    if (borderOptions.borderType === 1) {
      border.src = canvas.url
      borderOptions.url = canvas.url;
      borderOptions.path = canvas.path;
    }
  }

  photo.src = canvas.url
  photo.width = imageWidth
  photo.height = imageHeight
  photo.x = borderLeft
  photo.y = borderTop
  photo.radius = photoOptions.borderRadius / initZoom

  photoOptions.path = canvas.path

  for (let element of foreground.elements) {

    element.width = (element.width * zoomRatio) / initZoom;
    element.height = (element.height * zoomRatio) / initZoom;
    element.offsetX = (element.offsetX * zoomRatio) / initZoom;
    element.offsetY = (element.offsetY * zoomRatio) / initZoom;

    const {position, centerXRatio, centerYRatio} = element;

    if (element.type === 'text') {
      element.fontSize = (element.fontSize * zoomRatio) / initZoom;
      const newText = getText({path, ...element.meta, content: element.text})
      if (initZoom !== idealZoom || element.text !== newText) {
        const text = new Text(newText, {...element});
        const measureText = text.measureText(canvasEditor.ctx);
        element.width = measureText.width;
        element.height = measureText.height;
        element.text = newText;
      }
    }

    if (templatesStore.synchronousMode === 0) {
      element.x = position[0] === 'left' ? element.offsetX : newWidth - (element.offsetX + element.width)
      element.y = position[1] === 'top' ? element.offsetY : newHeight - (element.offsetY + element.height)
    }

    if (templatesStore.synchronousMode === 1) {
      element.x = position[0] === 'left' ? centerXRatio * newWidth - element.width / 2 : newWidth - (centerXRatio * newWidth + element.width / 2)
      element.y = position[1] === 'top' ? centerYRatio * newHeight - element.height / 2 : newHeight - (centerYRatio * newHeight + element.height / 2)
    }

  }

  canvas.borderOptions = _.cloneDeep(border.meta)
  canvas.background = JSON.stringify(background)
  canvas.foreground = JSON.stringify(foreground)
  canvas.initZoom = initZoom;
  canvas.zoom = canvas.zoom !== 1 ? canvas.zoom : zoom;
  canvas.width = imageWidth;
  canvas.height = imageHeight;

  if (!canvas.completed) {
    // 计算滚动位置，使图形内容居中
    const scrollLeft = (imageWidth - containerWidth) / 2;
    const scrollTop = (imageHeight - containerHeight) / 2;
    canvas.scrollLeft = Math.max(0, scrollLeft);
    canvas.scrollTop = Math.max(0, scrollTop);
    canvas.completed = true;
  }

  if (CanvasManager.getSelectedPath() === path) {
    await renderCanvas(canvas);
  }
}


// 注册共享画布操作，供预览面板 / 设置弹窗 / 模版弹窗等组件调用
Object.assign(canvasActions, {
  renderCanvas,
  clearCanvas,
  centerCanvasScrollBar,
  permanentlyRemoveSelectedCanvas,
  useTemplate,
})


const handleDropElement = async function (event) {

  event.preventDefault();

  if (!CanvasManager.getCurrentCanvas() || !event.dataTransfer.types.includes('text/plain')) return

  const data = JSON.parse(event.dataTransfer.getData('text/plain'))

  const {settings: elementSettings, mouse: {offsetX, offsetY}} = data

  const factory = new DraggableElementFactory(elementSettings, canvasesStore.metadataOptions);

  const dragElement = await factory.getElement();

  if (!dragElement) return;

  const {x, y} = canvasEditor.getCanvasPosition(event);

  dragElement.x = x - offsetX / canvasEditor.getZoom();

  dragElement.y = y - offsetY / canvasEditor.getZoom();

  canvasEditor.addElement(dragElement)

  canvasEditor.renderAll()

  const currentCanvas = CanvasManager.getCurrentCanvas();
  currentCanvas.zoom = canvasEditor.getZoom()
  currentCanvas.foreground = canvasEditor.exportToObject()
}

const handleDropFiles = (event) => {

  if (event.dataTransfer.types.includes('text/plain')) return

  const files = Array.from(event.dataTransfer.files || []);

  // 允许的文件扩展名（不区分大小写）
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // 过滤文件，只保留指定格式文件
  const paths = files.filter(file => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }).map(file => file.path);

  // 如果有符合条件的文件，发送请求
  if (paths.length > 0) {
    requestImportFiles({isDragOver: true, paths})
  }

  uploaderRef.value.style.pointerEvents = '';
}


const handleDragenter = (event) => {
  event.preventDefault();
  uploaderRef.value.style.pointerEvents = 'none';
}

const handleDragover = (event) => {
  // 允许放置
  event.preventDefault();
}

const handleDragleave = (event) => {
  event.preventDefault();
}


const handleDragend = (event) => {
  uploaderRef.value.style.pointerEvents = '';
}


// 缩放跟随动画的逐帧同步（状态变量声明在 setup 顶部）
function runZoomPin() {
  zoomRafId = null
  const workspace = canvasWorkspaceRef.value
  if (!zoomPin || !workspace || !canvasElement.value || !canvasEditor) {
    zoomPin = null
    return
  }
  const rect = canvasElement.value.getBoundingClientRect()
  const curW = rect.width
  const curH = rect.height
  // 目标滚动 = 起始滚动 + 居中伸缩一半 + 光标占比随尺寸变化
  // 画布在 flex 容器中居中，尺寸变化时左右各伸缩一半；光标在画布中的相对占比 fx 不变
  const wantLeft = zoomPin.sx + (zoomPin.w0 - curW) / 2 + zoomPin.fx * (curW - zoomPin.w0)
  const wantTop = zoomPin.sy + (zoomPin.h0 - curH) / 2 + zoomPin.fy * (curH - zoomPin.h0)
  const maxScrollLeft = Math.max(0, workspace.scrollWidth - workspace.clientWidth)
  const maxScrollTop = Math.max(0, workspace.scrollHeight - workspace.clientHeight)
  const newScrollLeft = Math.max(0, Math.min(wantLeft, maxScrollLeft))
  const newScrollTop = Math.max(0, Math.min(wantTop, maxScrollTop))
  workspace.scrollLeft = newScrollLeft
  workspace.scrollTop = newScrollTop
  const canvas = CanvasManager.getCurrentCanvas()
  if (canvas) {
    canvas.scrollLeft = newScrollLeft
    canvas.scrollTop = newScrollTop
  }
  if (Date.now() - zoomLastEvent < ZOOM_RAF_MS) {
    zoomRafId = requestAnimationFrame(runZoomPin)
  } else {
    zoomPin = null
  }
}

function cancelZoomPin() {
  if (zoomRafId != null) {
    cancelAnimationFrame(zoomRafId)
    zoomRafId = null
  }
  zoomPin = null
}

// 处理 canvas 缩放（以鼠标位置为锚点，带平滑动画且全程钉住光标）
const handleCanvasResize = (event) => {
  // 阻止默认滚动行为
  event.preventDefault();
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const workspace = canvasWorkspaceRef.value;
  const oldZoom = canvasEditor.getZoom();
  if (!oldZoom) return

  // 计算并夹取缩放比例
  const initZoom = canvas.initZoom;
  const {maxZoom, minZoom} = zoomOptions;
  const direction = event.deltaY < 0 ? 'in' : 'out';
  let newZoom = direction === 'in' ? oldZoom + oldZoom * 0.1 : oldZoom - oldZoom * 0.1;
  newZoom = Math.min(Math.max(minZoom * initZoom, newZoom), maxZoom * initZoom);
  if (newZoom === oldZoom) return

  // 以当前（可能正处在过渡中的）画布尺寸与光标位置重新建立锚点：
  // fx/fy 为光标在画布中的相对占比（0~1），是缩放不变量
  const rect = canvasElement.value.getBoundingClientRect();
  zoomPin = {
    sx: workspace.scrollLeft,
    sy: workspace.scrollTop,
    w0: rect.width,
    h0: rect.height,
    fx: (event.clientX - rect.left) / rect.width,
    fy: (event.clientY - rect.top) / rect.height
  }
  zoomLastEvent = Date.now()

  // 启用缩放动画（0.1s 过渡）
  canvasElement.value.classList.add('scale-animation')
  backgroundElement.value.classList.add('scale-animation')
  // 应用缩放：内部变换瞬时跳到 newZoom，CSS 盒子走 0.1s 过渡，rAF 同步滚动条钉住光标
  canvas.zoom = newZoom
  canvasEditor.setZoom(newZoom)
  backgroundCanvasEditor.setZoom(newZoom)

  if (zoomRafId == null) zoomRafId = requestAnimationFrame(runZoomPin)
}

const handleDragMoveCanvas = (event) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (canvas && isCanvasDraggingMode) {
    // 拖拽开始时设置光标为正在抓取的状态
    canvasWorkspaceRef.value.style.cursor = 'grabbing';
    const {scrollWidth, scrollHeight, clientWidth, clientHeight} = canvasWorkspaceRef.value
    // 记录初始滚动位置和鼠标位置
    const initialScrollLeft = canvas.scrollLeft;
    const initialScrollTop = canvas.scrollTop;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
    const startX = event.clientX;
    const startY = event.clientY;
    const handleMousemove = function (event) {
      // 取消拖拽模式，不更改滚动条位置
      if (!isCanvasDraggingMode) return
      // 计算鼠标移动的距离
      const offsetX = event.clientX - startX;
      const offsetY = event.clientY - startY;
      // 限制滚动位置在边界内
      const scrollLeft = Math.max(0, Math.min(initialScrollLeft - offsetX, maxScrollLeft));
      const scrollTop = Math.max(0, Math.min(initialScrollTop - offsetY, maxScrollTop));
      // 设置滚动位置
      canvasWorkspaceRef.value.scrollLeft = scrollLeft;
      canvasWorkspaceRef.value.scrollTop = scrollTop;
      // 应用鼠标移动的距离到滚动位置
      canvas.scrollLeft = scrollLeft;
      canvas.scrollTop = scrollTop;
    };

    const handleMouseup = function (event) {
      // 拖拽结束，恢复光标为抓手的准备状态（空格键仍按住）
      canvasWorkspaceRef.value.style.cursor = '';
      canvasWorkspaceRef.value.removeEventListener('mousemove', handleMousemove)
      document.removeEventListener('mouseup', handleMouseup)
    };
    canvasWorkspaceRef.value.addEventListener('mousemove', handleMousemove)
    document.addEventListener('mouseup', handleMouseup)
  }
};


const triggerDragCanvas = (event) => {
  const activeElement = document.activeElement;
  const isEditableElement = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
  if (event.code === 'Space' && !isEditableElement && !canvasEditor.isEditing) {
    event.preventDefault();
    isCanvasDraggingMode = true;
    // 设置全局样式提示用户
    canvasWorkspaceRef.value.style.cursor = 'grab';
    const handleKeyup = function (event) {
      if (event.code === 'Space') {
        isCanvasDraggingMode = false;
        canvasWorkspaceRef.value.style.cursor = '';
        document.removeEventListener('keyup', handleKeyup)
      }
    }
    document.addEventListener('keyup', handleKeyup)
  }
}


const handleMoveScrollbar = (event) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  // 清除之前的定时器
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  // 设置新的定时器（防抖：100ms）
  scrollTimeout = setTimeout(() => {
    const target = event.target;
    // 设置滚动条参数到 image 对象
    canvas.scrollTop = target.scrollTop;
    canvas.scrollLeft = target.scrollLeft;
  }, 100);

}

const handleKeyDownMoveElement = (event) => {

  const activeElement = document.activeElement;

  const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  const canvas = CanvasManager.getCurrentCanvas();

  if (!canvas || !validKeys.includes(event.key) || activeElement !== document.body) return;

  event.preventDefault();

  const step = settingsStore.projectSettings.others.movingStepSize / canvas.initZoom;

  const activeElements = canvasEditor.getActiveElements();

  for (const activeElement of activeElements) {
    switch (event.key) {
      case 'ArrowUp':
        activeElement.y -= step;
        activeElement.centerY -= step;
        break;
      case 'ArrowDown':
        activeElement.y += step;
        activeElement.centerY += step;
        break;
      case 'ArrowLeft':
        activeElement.x -= step;
        activeElement.centerX -= step;
        break;
      case 'ArrowRight':
        activeElement.x += step;
        activeElement.centerX += step;
        break;
    }
  }

  canvasEditor.renderAll();
  canvas.foreground = canvasEditor.exportToObject()
}


// 删除元素
const handleRemoveElement = (event) => {

  // 检查当前焦点元素是否为可输入元素
  const activeElement = document.activeElement;

  // 判断是否为可输入元素
  const isEditable = activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('contenteditable') === 'true';

  // 如果是可输入元素，则允许默认的删除行为
  if (isEditable) return;

  const canvas = CanvasManager.getCurrentCanvas();
  // 判断是否为删除键（Backspace 或 Delete）
  if (canvas && (event.key === 'Backspace' || event.key === 'Delete')) {
    const activeElements = canvasEditor.getActiveElements();
    const length = activeElements.length;
    canvasEditor.removeElements(activeElements)
    if (length) {
      canvas.foreground = canvasEditor.exportToObject()
    }
    canvasEditor.renderAll()
  }
}


const preventSwitchingElements = (event) => {
  if (event.key === 'Tab') {
    // 阻止切换元素
    event.preventDefault();
  }
}


// 画布工作区的拖放与滚动事件
useEventListener(canvasWorkspaceRef, 'drop', handleDropElement);
useEventListener(canvasWorkspaceRef, 'drop', handleDropFiles);
useEventListener(canvasWorkspaceRef, 'dragenter', handleDragenter);
useEventListener(canvasWorkspaceRef, 'dragover', handleDragover);
useEventListener(canvasWorkspaceRef, 'dragleave', handleDragleave);
useEventListener(canvasWorkspaceRef, 'scroll', handleMoveScrollbar);
useEventListener(canvasWorkspaceRef, 'mousedown', handleDragMoveCanvas);
useEventListener(canvasWorkspaceRef, 'wheel', handleCanvasResize, {passive: false});

// 文档级按键：删除元素 / 方向键移动 / 空格拖拽画布 / 阻止 Tab 切换
useEventListener(document, 'dragend', handleDragend);
useEventListener(document, 'keydown', handleRemoveElement)
useEventListener(document, 'keydown', handleKeyDownMoveElement)
useEventListener(document, 'keydown', triggerDragCanvas)
useEventListener(document, 'keydown', preventSwitchingElements)

// ---------- 生命周期 ----------
// 注册画布工作区 DOM 引用，供其他组件读写布局参数
onMounted(() => {
  canvasesStore.registerCanvasRefs({
    canvasWorkspace: canvasWorkspaceRef.value,
    canvasElement: canvasElement.value,
    backgroundElement: backgroundElement.value,
  })

  initCanvasSize()
})

// 卸载时取消进行中的缩放跟随，避免悬空 rAF
onUnmounted(() => cancelZoomPin())

</script>

<style scoped lang="scss">

.canvas-viewport {
  width: var(--canvas-workspace-width);
  height: 100%;
  position: relative;

  .uploader {
    font-weight: bold;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%); /* 相对于自身偏移，实现完美居中 */
    z-index: 999;

    img {
      width: 60px;
    }

    span {
      font-size: 14px;
      color: var(--app-secondary-text);
    }
  }

  .canvas-workspace {
    background-color: var(--preview-background-color);
    width: 100%;
    height: 100%;
    position: absolute;
    min-width: 300px;
    min-height: 100px;

    .canvas-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 0;

      #foreground-canvas {
        position: absolute;
        background-color: transparent;
        z-index: 1;
        will-change: width, height;
      }

      .scale-animation {
        transition: width 0.1s, height 0.1s;
      }

      #background-canvas {
        position: absolute;
        will-change: width, height;
      }

      #background-canvas,
      #foreground-canvas {
        border: none;
        outline: none;
        box-shadow: none;
      }
    }
  }
}

</style>
