<template>
  <div class="canvas-viewport">

    <!-- 空状态：虚线容器 + 托盘上传图标 + 格式说明 + 选择文件按钮 -->
    <div class="uploader empty-state" ref="uploaderRef" v-show="canvasesStore.uploadVisible"
         @click="requestImportFiles({isDragOver: false})">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15.2 V4.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M8.3 8.3 L12 4.6 L15.7 8.3" fill="none" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4.6 13.6 v3.4 a2.6 2.6 0 0 0 2.6 2.6 h9.6 a2.6 2.6 0 0 0 2.6 -2.6 v-3.4"
                fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2 class="empty-title">{{ $t('workspace.dropTitle') }}</h2>
      <p class="empty-hint">{{ $t('workspace.dropHint') }}</p>
      <button type="button" class="empty-button">{{ $t('workspace.chooseFile') }}</button>
      <p class="empty-shortcut">{{ $t('workspace.quickImport') }}</p>
    </div>

    <div class="canvas-workspace" id="canvas-workspace" ref="canvasWorkspaceRef" @mousedown="triggerContextMenu">
      <div class="canvas-wrapper" ref="canvasWrapper">
        <canvas id="background-canvas" ref="backgroundElement"></canvas>
        <canvas id="foreground-canvas" ref="canvasElement"></canvas>
      </div>
    </div>

    <!-- 浮动缩放胶囊 -->
    <div class="zoom-pill" v-if="settingsStore.projectSettings.appearance.enableZoomPill">
      <el-tooltip :content="$t('preview.zoomOut')" placement="top">
        <button type="button" class="zoom-button" @click="stepZoom(-1)">
          <svg viewBox="0 0 16 16"><path d="M4 8 H12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </el-tooltip>
      <span class="zoom-value">{{ zoomPct }}%</span>
      <el-tooltip :content="$t('preview.zoomIn')" placement="top">
        <button type="button" class="zoom-button" @click="stepZoom(1)">
          <svg viewBox="0 0 16 16">
            <path d="M8 4 V12 M4 8 H12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>
      </el-tooltip>
      <span class="zoom-divider"></span>
      <el-tooltip :content="$t('preview.center')" placement="top">
        <button type="button" class="zoom-button" @click="fitToView">
          <svg viewBox="0 0 16 16">
            <path d="M3 6 V4.2 A1.2 1.2 0 0 1 4.2 3 H6" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 3 H11.8 A1.2 1.2 0 0 1 13 4.2 V6" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13 10 V11.8 A1.2 1.2 0 0 1 11.8 13 H10" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 13 H4.2 A1.2 1.2 0 0 1 3 11.8 V10" fill="none" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </el-tooltip>
    </div>

  </div>
</template>

<script setup lang="js">

import {ref, onMounted, onUnmounted} from 'vue'

import _ from 'lodash'

import useEventListener from '@/composables/common/useEventListener'

import {CanvasEditor, Image, LazyImage, Rect, Text} from '@/canvas/CanvasEditor'

import {getCurrentDate, getCurrentDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import CanvasManager from '@/object/canvas-manager'

import DraggableElementFactory from '@/object/DraggableElementFactory'

import {canvasActions} from '@/object/canvas-actions'

import {BorderOptions, PhotographOptions} from '@/object/Configuration'

import FontManager from '@/utils/font-manager'

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

// 渲染串行队列：保证同一时刻最多一个渲染在操作 canvasEditor / backgroundCanvasEditor
// 这两个共享实例。避免多次 load 的配置在 await 期间交错写入同一编辑器造成渲染错乱
let renderTask = Promise.resolve();

const zoomOptions = {
  minZoom: 0.1,
  maxZoom: 5
}

// ---------- 浮动缩放胶囊 ----------

// 缩放百分比预设档位（与底部预览栏的下拉预设保持一致）
const ZOOM_STEPS = [10, 25, 50, 75, 100, 150, 200, 300, 500]

const zoomPct = ref(100)

// 从当前画布读取缩放百分比（相对 initZoom，100% 即适配工作区的尺寸）
const refreshZoom = () => {
  const canvas = CanvasManager.getCurrentCanvas()
  zoomPct.value = canvas && canvas.initZoom && canvas.zoom
      ? Math.round(canvas.zoom / canvas.initZoom * 100)
      : 100
}

// 应用缩放百分比
const applyZoom = (val) => {
  const canvas = CanvasManager.getCurrentCanvas()
  const editor = canvasesStore.getCanvasEditor()
  const backgroundEditor = canvasesStore.getBackgroundCanvasEditor()
  if (!canvas || !canvas.initZoom || !editor) return
  const newZoom = canvas.initZoom * (val / 100)
  canvas.zoom = newZoom
  editor.setZoom(newZoom)
  backgroundEditor?.setZoom(newZoom)
  reflowWorkspace()
  refreshZoom()
}

// 按预设档位步进缩放
const stepZoom = (direction) => {
  const current = zoomPct.value
  if (direction < 0) {
    const lower = ZOOM_STEPS.filter(value => value < current)
    applyZoom(lower.length ? lower[lower.length - 1] : ZOOM_STEPS[0])
  } else {
    const higher = ZOOM_STEPS.filter(value => value > current)
    applyZoom(higher.length ? higher[0] : ZOOM_STEPS[ZOOM_STEPS.length - 1])
  }
}

// 适配视图：回到 100%（画布按工作区尺寸自适应的大小）
const fitToView = () => applyZoom(100)

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
      eventScope: canvasElement.value.parentNode
    });

    backgroundCanvasEditor = new CanvasEditor(backgroundElement.value);

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
      // const canvas = CanvasManager.getCurrentCanvas();
      // canvas.foreground = canvasEditor.exportToObject()
      // canvas.background = backgroundCanvasEditor.exportToObject()
    })

    canvasEditor.on('move:object', (event) => {
      // const canvas = CanvasManager.getCurrentCanvas();
      // canvas.foreground = canvasEditor.exportToObject()
      // canvas.background = backgroundCanvasEditor.exportToObject()
    })

    canvasEditor.on('add:object', (event) => {
      // const canvas = CanvasManager.getCurrentCanvas();
      // canvas.foreground = canvasEditor.exportToObject()
      // canvas.background = backgroundCanvasEditor.exportToObject()
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

// 面板收放过渡期间逐帧重设 wrapper 大小至 max(画布宽, 工作区宽)，
// 使 wrapper 始终填满工作区，画布靠 wrapper 内部 flex 居中，避免滚动钳制导致靠左
const reflowWorkspace = () => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas || !canvasWrapper.value || !canvasWorkspaceRef.value) return;
  const wsWidth = canvasWorkspaceRef.value.offsetWidth;
  const wsHeight = canvasWorkspaceRef.value.offsetHeight;
  const width = canvas.width || 0;
  const height = canvas.height || 0;
  canvasWrapper.value.style.width = Math.max(width, wsWidth) + 'px';
  canvasWrapper.value.style.height = Math.max(height, wsHeight) + 'px';
  scrollBarMoveToCenter(canvas);
}

const updateScrollBar = (canvas) => {
  // 设置滚动位置
  canvasWorkspaceRef.value.scrollLeft = canvas.scrollLeft;
  canvasWorkspaceRef.value.scrollTop = canvas.scrollTop;
}

const doRenderCanvas = async (canvas, currentVersion) => {

  if (!canvas.completed) {

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

    const {idealWidth, idealHeight} = canvasWorkspaceRef.value;
    const initZoom = Math.min(idealHeight / height, idealWidth / width);
    const scale = initZoom * settingsStore.projectSettings.others.defaultCanvasScale;

    canvasEditor.clearCanvas();
    backgroundCanvasEditor.clearCanvas();

    // 设置画布宽高等于缩放后的图片尺寸
    canvasEditor.resizeCanvas(width, height, scale);
    backgroundCanvasEditor.resizeCanvas(width, height, scale);
    backgroundCanvasEditor.addElement(background);
    backgroundCanvasEditor.addElement(image);

    backgroundCanvasEditor.renderAll()

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

    const {foreground, background, metadata: {width: imageWidth, height: imageHeight}} = canvas;

    if (typeof foreground !== 'string' && typeof foreground !== 'object') throw new Error('unsupported data type')

    if (typeof background !== 'string' && typeof background !== 'object') throw new Error('unsupported data type')

    const batchExecutor = await CanvasEditor.preloadAll([
      {editor: backgroundCanvasEditor, data: background},
      {editor: canvasEditor, data: foreground}
    ]);

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    // 同帧原子应用：两层画布的清空、灌入、改尺寸与重绘一次完成，浏览器只绘制最终状态，不产生中间空白帧与尺寸错位帧
    batchExecutor.apply()

    const {idealWidth, idealHeight} = canvasWorkspaceRef.value;

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

  // 渲染完成后同步浮动缩放胶囊的百分比
  refreshZoom()
}

const renderCanvas = (canvas) => {
  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  // 切换/重渲染画布时取消进行中的缩放跟随，避免旧锚点作用到新画布
  cancelZoomPin()
  const currentVersion = ++renderVersion;
  // 串行执行：等待上一次渲染落定后再开始本次变更。
  renderTask = renderTask.then(async () => {
    // 排队期间已有更新的渲染入队，本次为过期请求，直接跳过避免无谓的 load
    if (currentVersion !== renderVersion) return;
    await doRenderCanvas(canvas, currentVersion);
  }).catch((error) => {
    // 单次渲染失败不能打断队列，否则后续渲染会永久卡死
    console.error('[renderCanvas] render failed:', error);
  });
  return renderTask;
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
  zoomPct.value = 100
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

  canvas.initZoom = initZoom;
  canvas.zoom = canvas.zoom !== 1 ? canvas.zoom : zoom;
  canvas.width = imageWidth;
  canvas.height = imageHeight;
  canvas.borderOptions = _.cloneDeep(border.meta)
  background.zoom = canvas.zoom
  foreground.zoom = canvas.zoom
  canvas.background = JSON.stringify(background)
  canvas.foreground = JSON.stringify(foreground)

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
  reflowWorkspace,
  refreshZoom,
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

// 处理 canvas 缩放：滚轮事件可能 1 帧内触发多次（高刷鼠标尤其明显），
// 而每次缩放都要双画布重排 backing store + 全量重绘，代价很高。
// 这里只记录最新的滚轮事件，合并到每帧最多应用一次（rAF 节流），避免渲染风暴。
let pendingWheelZoom = null
let wheelZoomScheduled = false

const handleCanvasResize = (event) => {
  event.preventDefault();
  pendingWheelZoom = event
  if (wheelZoomScheduled) return
  wheelZoomScheduled = true
  requestAnimationFrame(applyWheelZoom)
}

// 实际执行缩放（以鼠标位置为锚点，带平滑动画且全程钉住光标）
const applyWheelZoom = () => {
  wheelZoomScheduled = false
  const event = pendingWheelZoom
  pendingWheelZoom = null
  if (!event) return
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
  // 焦点缩放关闭时以画布中心(0.5)为锚点（中心点缩放），开启时使用鼠标所在位置
  const rect = canvasElement.value.getBoundingClientRect();
  const focalZoom = settingsStore.projectSettings.others.focalZoom;
  zoomPin = {
    sx: workspace.scrollLeft,
    sy: workspace.scrollTop,
    w0: rect.width,
    h0: rect.height,
    fx: focalZoom ? (event.clientX - rect.left) / rect.width : 0.5,
    fy: focalZoom ? (event.clientY - rect.top) / rect.height : 0.5
  }
  zoomLastEvent = Date.now()

  // 启用缩放动画（0.1s 过渡）
  canvasElement.value.classList.add('scale-animation')
  backgroundElement.value.classList.add('scale-animation')
  // 应用缩放：内部变换瞬时跳到 newZoom，CSS 盒子走 0.1s 过渡，rAF 同步滚动条钉住光标
  canvas.zoom = newZoom
  canvas.background.zoom = newZoom
  canvas.foreground.zoom = newZoom
  canvasEditor.setZoom(newZoom)
  backgroundCanvasEditor.setZoom(newZoom)

  refreshZoom()

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
  background: var(--ui-workspace);
}

/* ---------- 空状态：虚线圆角容器，内容居中（底部加宽避开右下角缩放胶囊） ---------- */
.empty-state {
  position: absolute;
  inset: 32px 32px 64px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--ui-border);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color var(--app-transition), background-color var(--app-transition);

  &:hover {
    border-color: var(--ui-border-strong);
  }

  .empty-icon {
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ui-text-secondary);
    margin-bottom: 18px;

    svg {
      width: 46px;
      height: 46px;
    }
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--ui-text);
    margin-bottom: 8px;
  }

  .empty-hint {
    font-size: 13px;
    color: var(--ui-text-secondary);
    margin-bottom: 26px;
  }

  .empty-button {
    height: 40px;
    padding: 0 22px;
    border: none;
    border-radius: 8px;
    background: var(--ui-accent);
    color: var(--ui-accent-contrast);
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 14px var(--ui-accent-glow);
    transition: background-color var(--app-transition);

    &:hover {
      background: var(--ui-accent-hover);
    }
  }

  .empty-shortcut {
    margin-top: 16px;
    font-size: 11.5px;
    color: var(--ui-text-faint);
  }
}
/* ---------- 浮动缩放胶囊 ---------- */
.zoom-pill {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 6px;
  border-radius: var(--app-radius-md);
  background: var(--ui-elevated);
  border: 1px solid var(--ui-border);
  box-shadow: var(--app-card-shadow);

  .zoom-button {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--app-radius-xs);
    background: transparent;
    color: var(--ui-text-secondary);
    cursor: pointer;
    transition: background-color var(--app-transition), color var(--app-transition);

    svg {
      width: 13px;
      height: 13px;
    }

    &:hover {
      background: var(--ui-control);
      color: var(--ui-text);
    }
  }

  .zoom-value {
    min-width: 42px;
    text-align: center;
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: var(--ui-text);
    user-select: none;
  }

  .zoom-divider {
    width: 1px;
    height: 16px;
    margin: 0 2px;
    background: var(--ui-border);
  }
}

.canvas-workspace {
  background-color: var(--ui-workspace);
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

</style>
