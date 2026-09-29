<template>
  <div class="preview-panel">

    <!-- 工具条 -->
    <div class="preview-bar">
      <div class="left-preview-bar">
        <!-- 底部面板伸缩 -->
        <el-tooltip :content="$t('panel.collapseBottom')" placement="top">
          <button type="button" class="bar-icon" @click="$emit('toggle-bottom')">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="2.6" fill="none" stroke="currentColor"
                    stroke-width="1.4"/>
              <path d="M2.9 10.7 H13.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </el-tooltip>

        <el-tooltip :content="$t('preview.first')" placement="top">
          <button type="button" class="bar-icon" @click="switchFirstPreviewElement">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.4 3.4 V12.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M12.4 3.8 L6.6 8 L12.4 12.2 Z" fill="currentColor"/>
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('preview.prev')" placement="top">
          <button type="button" class="bar-icon" @click="switchPrevPreviewElement">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10.4 3.4 L5.2 8 L10.4 12.6" fill="none" stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('preview.next')" placement="top">
          <button type="button" class="bar-icon" @click="switchNextPreviewElement">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5.6 3.4 L10.8 8 L5.6 12.6" fill="none" stroke="currentColor" stroke-width="1.7"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('preview.last')" placement="top">
          <button type="button" class="bar-icon" @click="switchLastPreviewElement">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M12.6 3.4 V12.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              <path d="M3.6 3.8 L9.4 8 L3.6 12.2 Z" fill="currentColor"/>
            </svg>
          </button>
        </el-tooltip>

        <el-tooltip :content="$t('preview.zoom')" placement="top" :disabled="tooltipDisabled">
          <el-dropdown trigger="click" placement="top-start"
                       @visible-change="handleVisibleChange"
                       @command="handleZoom"
                       popper-class="zoom-popper"
                       class="zoom-dropdown">
            <button type="button" class="bar-icon is-text">{{ zoomRatioLabel }}</button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in zoomPresets" :key="item" :command="item"
                                  :class="{active: item === getZoomPct()}">
                  {{ item }}%
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-tooltip>

        <el-tooltip :content="$t('preview.selectAll')" placement="top">
          <button type="button" class="bar-icon" @click="handleSelectAllPreviewElements">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="2.6" y="2.6" width="10.8" height="10.8" rx="2.6" fill="none" stroke="currentColor"
                    stroke-width="1.5"/>
              <path d="M5.6 8.2 L7.3 9.9 L10.6 6.4" fill="none" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('preview.center')" placement="top">
          <button type="button" class="bar-icon" @click="canvasActions.centerCanvasScrollBar()">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2.4 5.2 V3.4 A1 1 0 0 1 3.4 2.4 H5.2 M10.8 2.4 H12.6 A1 1 0 0 1 13.6 3.4 V5.2
                       M13.6 10.8 V12.6 A1 1 0 0 1 12.6 13.6 H10.8 M5.2 13.6 H3.4 A1 1 0 0 1 2.4 12.6 V10.8"
                    fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="8" cy="8" r="1.7" fill="currentColor"/>
            </svg>
          </button>
        </el-tooltip>
      </div>


      <div class="right-preview-bar">
        <div class="counter">{{
            $t('preview.counter', {
              selected: canvasesStore.selectedPreviewList.size,
              total: canvasesStore.availableCanvases.size
            })
          }}
        </div>
        <div class="filter">
          <div class="filter-label">{{ $t('preview.filter') }}</div>
          <div class="filter-select">
            <el-select v-model="canvasesStore.filterType" size="small" :placeholder="$t('common.select')">
              <el-option
                  v-for="item in [{label:$t('preview.filterNone'),value:0},{label:$t('preview.filterLandscape'),value:1},{label:$t('preview.filterPortrait'),value:2}]"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"/>
            </el-select>
          </div>
        </div>
      </div>

    </div>

    <!-- 胶片列表 -->
    <div class="preview-list" ref="previewList" @wheel="handleMovePreviewList" @contextmenu="triggerContextMenu">
      <template :key="key" v-for="([key, canvas]) in CanvasManager.getCanvases()">
        <el-popover
            width="fit-content"
            :show-after="2000"
            :hide-after="0"
            trigger="hover">
          <template #default>
            <div style="font-size: 10px">
              <p v-if="canvas.metadata.filename">{{ $t('preview.filename') }}{{ canvas.metadata.fullFilename }}</p>
              <p v-if="canvas.metadata.shootingTime">{{ $t('preview.shootingTime') }}{{
                  canvas.metadata.shootingTime
                }}</p>
              <p v-if="canvas.metadata.resolution">{{ $t('preview.resolution') }}{{ canvas.metadata.resolution }}</p>
              <p v-if="canvas.metadata.fileSize">{{ $t('preview.size') }}{{ canvas.metadata.fileSize }}</p>
            </div>
          </template>
          <template #reference>
            <div class="previewItem"
                 :ref="setPreviewElementRef"
                 v-show="canvasesStore.thumbnailVisible(canvas)"
                 :path="canvas.path"
                 @click.meta.exact="handleSelectPreviewElement($event,canvas)"
                 @click.ctrl.exact="handleSelectPreviewElement($event, canvas)"
                 @click.shift.exact="handleSelectMultiplePreviewElements($event,canvas)"
                 @click="switchPreviewImage($event, canvas)"
                 @dblclick="handleDbClickPreviewImage($event,canvas)">
              <img class="preview-thumb" v-lazy="canvas.thumbUrl || canvas.url" draggable="false" alt="">
              <span class="preview-check">
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2.7 6.3 L4.9 8.5 L9.3 4.1" fill="none" stroke="currentColor" stroke-width="1.8"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
          </template>
        </el-popover>
      </template>

      <button type="button" class="import-more" @click="requestImportFiles">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 3.4 V12.6 M3.4 8 H12.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <span>{{ $t('preview.importMore') }}</span>
      </button>
    </div>

    <!-- 状态栏 -->
    <div class="preview-status">
      <!-- 左侧：当前选中照片的元信息（路径 / 拍摄时间 / 分辨率 / 文件大小） -->
      <div class="status-left">
        <template v-if="statusItems.length">
          <template v-for="(item, index) in statusItems" :key="index">
            <span class="status-separator" v-if="index > 0">·</span>
            <span class="status-path" v-if="item.title" :title="item.title">{{ item.text }}</span>
            <span class="status-item" v-else>{{ item.text }}</span>
          </template>
        </template>
      </div>
      <div class="status-right">{{ $t('preview.statusRight') }}</div>
    </div>

  </div>
</template>

<script setup lang="js">

import {ref, watch, nextTick, computed, onUnmounted} from 'vue'

import _ from 'lodash'

import useEventListener from '@/composables/common/useEventListener'

import {useThrottle} from '@/utils/throttle'

// 底部面板伸缩事件转发给 Index.vue（面板状态由父组件持有）
defineEmits(['toggle-bottom'])

import {parseDate, formatDate} from '@/utils/datetime'

import {useI18n} from 'vue-i18n'

import CanvasManager from '@/object/canvas-manager'

import {canvasActions} from '@/object/canvas-actions'

import {CanvasSettings} from '@/object/Configuration'

import {useCanvasesStore} from '@/stores/canvases'
import {useProjectSettingsStore} from '@/stores/project-settings'
import canvasManager from "@/object/canvas-manager";

const canvasesStore = useCanvasesStore()

const settingsStore = useProjectSettingsStore()

const {t} = useI18n()

const previewList = ref(null)

const tooltipDisabled = ref(false)

// 状态栏左侧：当前选中画布的元信息。
// CanvasManager 的 selectedObject 是 reactive，切换照片后这里自动更新
const selectedCanvas = computed(() => {
  const path = CanvasManager.getSelectedPath()
  return path ? CanvasManager.getCanvas(path) : null
})

const statusItems = computed(() => {
  const canvas = selectedCanvas.value
  const metadata = canvas?.metadata
  if (!metadata) return []
  const items = []
  if (canvas.path) items.push({text: t('preview.filePath') + canvas.path, title: canvas.path})
  if (metadata.shootingTime) items.push({text: t('preview.shootingTime') + metadata.shootingTime})
  if (metadata.resolution) items.push({text: t('preview.resolution') + metadata.resolution})
  if (metadata.fileSize) items.push({text: t('preview.size') + metadata.fileSize})
  return items
})

// 导入更多图片：复用工作区的导入流程
const requestImportFiles = () => {
  window.electronAPI.requestImportFiles({isDragOver: false})
}

// 预览列表右键菜单
const triggerContextMenu = (e) => {
  if (e.button === 2) {
    if (CanvasManager.isNotEmpty()) {
      window.electronAPI.openContextMenu()
    }
  }
}

// 导入图片：解析元数据并按格式化设置生成画布数据
const watchImportImagess = () => {
  window.electronAPI.watchImportImages(async (event, data) => {
    if (data) {
      const shootingTimeFormat = settingsStore.projectSettings.metadata.others.shootingTimeFormat;
      for (let [path, picture] of data) {
        if (!CanvasManager.hasCanvas(path)) {
          const settings = new CanvasSettings()
          const metadata = await window.electronAPI.parsePhotoMetadata(path);
          if (metadata) {
            settings.originalMetadata = _.cloneDeep(metadata);
            if (metadata.focalLength) {
              if (settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment) {
                metadata.focalLength = Number.parseInt(metadata.focalLength * settingsStore.projectSettings.metadata.others.conversionMultiple)
              }
            }
            for (let key in metadata) {
              const format = settingsStore.projectSettings.metadata.formats[key];
              let value = metadata[key];
              if (key === 'shootingTime' && value && !['yyyy-MM-dd HH:mm:ss', 'YYYY-MM-DD HH:mm:ss'].includes(shootingTimeFormat)) {
                value = formatDate(parseDate(value, 'yyyy-MM-dd HH:mm:ss'), shootingTimeFormat);
              }
              if (value && format) {
                metadata[key] = format.replace('${' + key + '}', value);
              }
            }
            settings.metadata = metadata
          }
          CanvasManager.setCanvas(path, Object.assign(settings, picture))
        }
      }
    }
  });
}

// 图片导入监听
watchImportImagess()


// ---------- 预览元素选中状态 ----------

// 记录预览元素引用，供切换 / 滚动定位使用
const setPreviewElementRef = (el) => {
  if (!el) return
  const path = el.getAttribute('path')
  const canvas = CanvasManager.getCanvas(path)
  if (canvas && canvas.getPreviewElement?.() !== el) {
    canvas.getPreviewElement = () => el
  }
}

// 清空所有预览元素的选中样式
const clearSelectedPreviewList = () => {
  canvasesStore.selectedPreviewList.forEach((element, path) => {
    element.classList.remove('active')
    element.setAttribute('selected', 'false')
  })
  canvasesStore.selectedPreviewList.clear()
}

// 筛选变化后重新渲染并默认选中一张画布
const setDefaultSelectedElement = async () => {
  const selectedPath = CanvasManager.getSelectedPath();
  const paths = Array.from(canvasesStore.availableCanvases.keys());
  if (!paths.length || !selectedPath) return
  const selectedCanvas = CanvasManager.getCanvas(selectedPath);
  let nextSelectCanvas, previewElement
  if (paths.includes(selectedPath)) {
    nextSelectCanvas = canvasesStore.availableCanvases.get(selectedPath);
    previewElement = nextSelectCanvas.getPreviewElement();
    await canvasActions.renderCanvas(selectedCanvas)
  } else {
    nextSelectCanvas = canvasesStore.availableCanvases.get(paths[0]);
    previewElement = nextSelectCanvas.getPreviewElement();
    await canvasActions.renderCanvas(nextSelectCanvas)
  }
  previewElement.classList.add('active')
  previewElement.setAttribute('selected', 'true')

  CanvasManager.setSelectedObject({path: nextSelectCanvas.path, previewElement})
  canvasesStore.selectedPreviewList.set(nextSelectCanvas.path, previewElement)
}

// 筛选类型变化时清空选中并默认选中一张画布
watch(() => canvasesStore.filterType, async () => {
  clearSelectedPreviewList()
  await nextTick()
  setDefaultSelectedElement()
})


const switchPreviewImage = async (event, canvas) => {
  if (!event.ctrlKey && !event.shiftKey) {
    if (!canvasesStore.selectedPreviewList.has(canvas.path)) {
      // 清空选中元素
      const selectedElements = canvasesStore.selectedPreviewList.values();
      for (let element of selectedElements) {
        element.classList.remove('active')
      }
      canvasesStore.selectedPreviewList.clear()
    }

    const targetPath = canvas.path;
    const currentPath = CanvasManager.getSelectedPath();
    const currentCanvas = canvasManager.getCurrentCanvas();

    // 前一次预览元素与当前预览元素不同
    if (currentPath && currentPath !== targetPath) {
      const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor();
      const canvasEditor = canvasesStore.getCanvasEditor();
      currentCanvas.foreground = canvasEditor.exportToJSON()
      currentCanvas.background = backgroundCanvasEditor.exportToJSON()
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!currentPath || currentPath !== targetPath) {
      // 更改新的选择元素
      CanvasManager.setSelectedObject({path: event.currentTarget.getAttribute('path'), previewElement: event.currentTarget})
      // 添加当前选中元素到选中列表中
      canvasesStore.selectedPreviewList.set(targetPath, event.currentTarget)
      // 设置选择样式
      event.currentTarget.classList.add('active')

      await canvasActions.renderCanvas(canvas);
    }
  }
}


const handleDbClickPreviewImage = (event, canvas) => {
  if (!event.ctrlKey && !event.shiftKey) {
    if (canvasesStore.selectedPreviewList.has(canvas.path)) {
      if (CanvasManager.getSelectedPath() !== canvas.path) {
        // 更改新的选择元素
        CanvasManager.setSelectedObject({path: canvas.path, previewElement: event.currentTarget})
      }
      // 清空选中元素
      const selectedElements = canvasesStore.selectedPreviewList;
      for (const [path, element] of selectedElements) {
        if (event.currentTarget !== element) {
          element.classList.remove('active')
          canvasesStore.selectedPreviewList.delete(path)
        }
      }
    }
  }
}


const handleSelectPreviewElement = (event, canvas) => {
  const element = event.currentTarget;
  if (element.classList.contains('active')) {
    element.classList.remove('active');
    canvasesStore.selectedPreviewList.delete(canvas.path)
    if (CanvasManager.getSelectedPath() === canvas.path) {
      canvasActions.clearCanvas()
    }
  } else {
    element.classList.add('active');
    canvasesStore.selectedPreviewList.set(canvas.path, element)
  }
}


const handleSelectMultiplePreviewElements = (event, canvas) => {
  if (canvasesStore.selectedPreviewList.size) {
    const elements = document.documentElement.querySelectorAll('.previewItem');
    let index = -1;
    const beforeElements = [];
    const afterElements = [];
    for (let i = 0; i < elements.length; i++) {
      const originalElement = elements[i];
      const active = originalElement.classList.contains('active');
      if (canvas.path === originalElement.getAttribute('path')) {
        index = i;
        beforeElements.push({active, originalElement})
        afterElements.push({active, originalElement})
        continue
      }
      if (index === -1) {
        beforeElements.push({active, originalElement})
      } else {
        afterElements.push({active, originalElement})
      }
    }

    for (let i = 0; i < beforeElements.length; i++) {
      const beforeElement = beforeElements[i];
      if (beforeElement.active) {
        for (let j = i; j < beforeElements.length; j++) {
          const usefulElement = beforeElements[j];
          const original = usefulElement.originalElement;
          if (!usefulElement.active) {
            original.classList.add('active')
            canvasesStore.selectedPreviewList.set(original.getAttribute('path'), original)
          }
        }
        for (let afterElement of afterElements) {
          const original = afterElement.originalElement;
          if (afterElement.active) {
            canvasesStore.selectedPreviewList.delete(original.getAttribute('path'))
            original.classList.remove('active')
          }
        }
        return
      }
    }

    for (let i = 0; i < afterElements.length; i++) {
      const afterElement = afterElements[i];
      if (afterElement.active) {
        for (let j = 0; j < i; j++) {
          const usefulElement = afterElements[j];
          const original = usefulElement.originalElement;
          if (!usefulElement.active) {
            original.classList.add('active')
            canvasesStore.selectedPreviewList.set(original.getAttribute('path'), original)
          }
        }
        return
      }
    }
  }
}


const handleSelectAllPreviewElements = (event) => {

  // 按钮点击时 target 为按钮本身，快捷键触发时 target 为当前聚焦元素，
  // 两者都是 Element；仅在两者都不可用时回落到 currentTarget
  const target = event.target instanceof Element ? event.target : event.currentTarget;

  // 检查是否在输入框/下拉框内
  if (target.closest?.('input, textarea, select')) {
    return;
  }

  // 检查是否在富文本编辑器内（利用 isContentEditable 属性）或者用 closest 检查属性，两者皆可
  if (target.isContentEditable || target.closest?.('[contenteditable="true"]')) {
    return;
  }

  // 检查是否原生可编辑（比如 Firefox 的 designMode 页面）
  if (target.closest?.('[designMode="on"]')) {
    return;
  }

  if ((event.ctrlKey && event.key === 'a') || event instanceof PointerEvent) {
    event.preventDefault();
    const previewElements = document.querySelectorAll('.previewItem');
    if (previewElements.length) {
      previewElements.forEach(element => {
        // 跳过被筛选隐藏的图片（v-show 隐藏）
        if (element.style.display === 'none') return
        element.classList.add('active');
        canvasesStore.selectedPreviewList.set(element.getAttribute('path'), element)
      })
    }
  }
}


const switchPrevPreviewElement = useThrottle(async () => {

  const {path: selectedPath, previewElement: currentElement} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentCanvas = canvasesStore.availableCanvases.get(selectedPath);

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const prevNode = currentNode.prev ? currentNode.prev : canvasesStore.availableCanvases.getLastNode();

  const prevCanvas = prevNode.value;

  if (currentCanvas && prevCanvas && currentCanvas.path !== prevCanvas.path) {

    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    canvasesStore.selectedPreviewList.delete(selectedPath)

    const prevElement = prevCanvas.getPreviewElement();
    prevElement.classList.add('active')
    prevElement.setAttribute('selected', 'true')

    CanvasManager.setSelectedObject({path: prevCanvas.path, previewElement: prevElement})
    canvasesStore.selectedPreviewList.set(prevCanvas.path, prevElement)

    const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor();
    const canvasEditor = canvasesStore.getCanvasEditor();
    currentCanvas.foreground = canvasEditor.exportToJSON()
    currentCanvas.background = backgroundCanvasEditor.exportToJSON()

    await canvasActions.renderCanvas(prevCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, prevElement)
  }
}, 200)


const switchNextPreviewElement = useThrottle(async () => {

  const {path: selectedPath, previewElement: currentElement} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentCanvas = canvasesStore.availableCanvases.get(selectedPath);

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const prevNode = currentNode.next ? currentNode.next : canvasesStore.availableCanvases.getFirstNode();

  const nextCanvas = prevNode.value;

  if (currentCanvas && nextCanvas && currentCanvas.path !== nextCanvas.path) {
    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    canvasesStore.selectedPreviewList.delete(selectedPath)

    const nextElement = nextCanvas.getPreviewElement();
    nextElement.classList.add('active')
    nextElement.setAttribute('selected', 'true')
    CanvasManager.setSelectedObject({path: nextCanvas.path, previewElement: nextElement})
    canvasesStore.selectedPreviewList.set(nextCanvas.path, nextElement)

    const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor();
    const canvasEditor = canvasesStore.getCanvasEditor();
    currentCanvas.foreground = canvasEditor.exportToJSON()
    currentCanvas.background = backgroundCanvasEditor.exportToJSON()

    await canvasActions.renderCanvas(nextCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, nextElement)
  }
}, 200)


const switchFirstPreviewElement = () => {

  const firstNode = canvasesStore.availableCanvases.getFirstNode();

  if (!firstNode) return

  const firstCanvas = firstNode.value;

  const firstElement = firstCanvas.getPreviewElement();

  // 方式二，过渡比较流畅
  scrollBarMoveToHorizontalCenter(previewList.value, firstElement)
}


const switchLastPreviewElement = () => {

  const lastNode = canvasesStore.availableCanvases.getLastNode();

  if (!lastNode) return

  const lastCanvas = lastNode.value;

  const lastElement = lastCanvas.getPreviewElement();

  // 方式二，过渡比较流畅
  scrollBarMoveToHorizontalCenter(previewList.value, lastElement)
}


function scrollBarMoveToHorizontalCenter(container, element) {
  if (container._timerId) {
    clearTimeout(container._timerId)
  }
  container._timerId = setTimeout(() => {
    const containerWidth = container.offsetWidth;
    const elementWidth = element.offsetWidth;
    const offsetLeft = element.offsetLeft;
    const scrollLeft = offsetLeft - (containerWidth - elementWidth) / 2;
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }, 200)
}


const handleMovePreviewList = useThrottle((e) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 2; // 调整滚动速度
  // 4. 应用滚动
  if (previewList.value) {
    previewList.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
}, 200);


// 工具栏缩放下拉：点击图标弹出百分比预设，选中即应用（相对 initZoom，100% 即占满工作区的适配尺寸）
const zoomPresets = [10, 25, 50, 75, 100, 150, 200, 300, 500];

// 当前画布缩放百分比（直接从 canvas.zoom 读取，不另存响应式副本）
const getZoomPct = () => {
  const canvas = CanvasManager.getCurrentCanvas();
  return canvas && canvas.initZoom ? Math.round(canvas.zoom / canvas.initZoom * 100) : 100;
};

// 缩放比例标签：100% 显示 1:1，放大显示 n:1，缩小显示 1:n
const zoomRatioLabel = computed(() => {
  const pct = getZoomPct();
  if (!pct || pct === 100) return '1:1';
  if (pct > 100) return `${Math.round(pct / 100)}:1`;
  return `1:${Math.round(100 / pct)}`;
});

const handleZoom = (val) => {
  const canvas = CanvasManager.getCurrentCanvas();
  const editor = canvasesStore.getCanvasEditor();
  const bgEditor = canvasesStore.getBackgroundCanvasEditor();
  if (!canvas || !canvas.initZoom || !editor) return;
  const newZoom = canvas.initZoom * (val / 100);
  canvas.zoom = newZoom;
  editor?.setZoom(newZoom);
  bgEditor?.setZoom(newZoom);
  canvasActions.reflowWorkspace?.();
  // 同步右下角浮动缩放胶囊的百分比显示
  canvasActions.refreshZoom?.();
};


const handleVisibleChange = (visible) => {
  tooltipDisabled.value = visible
}


// Ctrl + A 全选预览图
useEventListener(document, 'keydown', handleSelectAllPreviewElements)

</script>

<style scoped lang="scss">

.preview-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ui-chrome);
  overflow: hidden;
}

/* ---------- 工具条 ---------- */
.preview-bar {
  width: 100%;
  height: 38px;
  flex: 0 0 38px;
  background: var(--ui-chrome);
  display: flex;
  align-items: center;
  padding: 0 14px 0 10px;
  gap: 12px;

  .left-preview-bar {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 2px;

    .bar-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: var(--app-radius-xs);
      background: transparent;
      color: var(--ui-text-secondary);
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      transition: background-color var(--app-transition), color var(--app-transition);

      svg {
        width: 17px;
        height: 17px;
      }

      &:hover {
        background: var(--ui-control);
        color: var(--ui-text);
      }
    }

    /* 缩放下拉：不加边框，背景宽度与其他图标一致 */
    .bar-icon.is-text {
      width: 28px;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.2px;
    }

    .zoom-dropdown {
      display: flex;
      align-items: center;
    }
  }

  .right-preview-bar {
    display: flex;
    margin-left: auto;
    align-items: center;
    gap: 14px;

    .counter {
      color: var(--ui-text-secondary);
      font-size: 12px;
      display: flex;
    }

    .filter {
      display: flex;
      align-items: center;

      .filter-label {
        color: var(--ui-text-secondary);
        font-size: 12px;
      }

      .filter-select {
        margin-left: 6px;

        .el-select {
          width: 84px !important;

          :deep(.el-select__wrapper) {
            background: var(--ui-elevated);
            /* 用全局描边规则，这里不再覆盖 */
            min-height: 26px;
          }
        }
      }
    }
  }
}

/* ---------- 胶片列表 ---------- */
.preview-list {
  box-sizing: border-box;
  flex: 1 1 auto;
  height: calc(100% - 64px);
  min-height: 0;
  width: 100%;
  display: flex;
  /* 子项拉伸填满容器高度（缩略图高度=可用高度，宽度随图片比例自适应） */
  align-items: stretch;
  gap: 10px;
  padding: 0 14px 10px;
  background: var(--ui-chrome);
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth; /* 可选，使滚动更平滑 */
  outline: none;

  .previewItem {
    flex: 0 0 auto;
    position: relative;
    box-sizing: border-box;
    /* 高度由 flex stretch 撑满容器，宽度随图片自身比例自适应（横图更宽、竖图更窄） */
    border-radius: var(--app-radius-xs);
    overflow: hidden;
    background: var(--ui-card);
    border: 1.5px solid transparent;
    cursor: pointer;
    /* 选中描边不做过渡：点击即亮，避免 0.18s 的渐变被感知为延迟 */

    .preview-thumb {
      height: 100%;
      width: auto;
      display: block;
    }

    .preview-check {
      position: absolute;
      /* 对勾放在左上角；矩形圆角样式 */
      left: 4px;
      top: 4px;
      width: 16px;
      height: 16px;
      border-radius: 3px;
      display: none;
      align-items: center;
      justify-content: center;
      background: var(--ui-accent);
      color: var(--ui-accent-contrast);

      svg {
        width: 9px;
        height: 9px;
      }
    }

    /* 悬浮不加边框 / 阴影，只有选中才出现琥珀描边和对勾 */
    &.active {
      border-color: var(--ui-accent);
    }

    &.active .preview-check {
      display: flex;
    }
  }

  .import-more {
    flex: 0 0 auto;
    /* 高度随 stretch 撑满容器，宽度固定 */
    width: 110px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: var(--app-radius-md);
    border: 1px solid var(--ui-border);
    background: transparent;
    color: var(--ui-text-muted);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: background-color var(--app-transition), border-color var(--app-transition), color var(--app-transition);

    svg {
      width: 18px;
      height: 18px;
      color: var(--ui-accent);
    }

    &:hover {
      background: var(--ui-accent-soft);
      border-color: var(--ui-accent-soft-border);
      color: var(--ui-accent-soft-text);
    }
  }
}

/* ---------- 状态栏 ---------- */
.preview-status {
  flex: 0 0 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-chrome);
  font-size: 11.5px;
  color: var(--ui-text-muted);

  .status-left {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* 拍摄时间 / 分辨率 / 文件大小：完整显示不收缩，避免被长路径压成竖排 */
  .status-item {
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* 路径自适应占满左侧剩余宽度：完整显示优先，超长时截断兜底（悬浮 title 看全文） */
  .status-path {
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ui-success);
    flex-shrink: 0;
  }

  .status-separator {
    color: var(--ui-text-faint);
  }

  .status-selector {
    width: 1px;
    height: 11px;
    margin: 0 4px;
    background: var(--ui-border-strong);
  }

  .status-right {
    flex-shrink: 0;
    margin-left: 12px;
    color: var(--ui-text-faint);
  }
}

</style>
