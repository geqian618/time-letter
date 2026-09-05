<template>
  <div class="preview-bar">
    <div class="left-preview-bar">
      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.first')" placement="top">
          <img src="/src/assets/icon/first-inactive.svg" class="inactive small-size" :alt="$t('preview.first')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.first')" placement="top">
          <img src="/src/assets/icon/first-active.svg" class="active small-size"
               @click="switchFirstPreviewElement"
               :alt="$t('preview.first')">
        </el-tooltip>
      </div>

      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.prev')" placement="top">
          <img src="/src/assets/images/left-arrow-inactive.png" class="inactive" :alt="$t('preview.prev')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.prev')" placement="top">
          <img src="/src/assets/images/left-arrow-active.png" class="active" @click="switchBeforePreviewElement"
               :alt="$t('preview.prev')">
        </el-tooltip>
      </div>

      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.next')" placement="top">
          <img src="/src/assets/images/right-arrow-inactive.png" class="inactive" :alt="$t('preview.next')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.next')" placement="top">
          <img src="/src/assets/images/right-arrow-active.png" class="active" @click="switchNextPreviewElement"
               :alt="$t('preview.next')">
        </el-tooltip>
      </div>


      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.last')" placement="top">
          <img src="/src/assets/icon/last-inactive.svg" class="inactive small-size" :alt="$t('preview.center')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.last')" placement="top">
          <img src="/src/assets/icon/last-active.svg" class="active small-size"
               @click="switchLastPreviewElement"
               :alt="$t('preview.last')">
        </el-tooltip>
      </div>


      <el-dropdown trigger="click" placement="top-start"
                   @visible-change="handleVisibleChange"
                   @command="handleZoom"
                   popper-class="zoom-popper"
                   class="zoom-dropdown">
        <div class="tab-wrapper">
          <el-tooltip :content="$t('preview.zoom')" placement="top" :disabled="tooltipDisabled">
            <img src="/src/assets/icon/zoom-inactive.svg" class="inactive medium-size" :alt="$t('preview.zoom')">
          </el-tooltip>
          <el-tooltip :content="$t('preview.zoom')" placement="top" :disabled="tooltipDisabled">
            <img src="/src/assets/icon/zoom-active.svg" class="active medium-size" :alt="$t('preview.zoom')">
          </el-tooltip>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in zoomPresets" :key="item" :command="item"
                              :class="{active: item === getZoomPct()}">
              {{ item }}%
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.selectAll')" placement="top">
          <img src="/src/assets/icon/select-all-inactive.svg" class="inactive medium-size" :alt="$t('preview.selectAll')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.selectAll')" placement="top">
          <img src="/src/assets/icon/select-all-active.svg"
               @click="handleSelectAllPreviewElements"
               class="active medium-size"
               :alt="$t('preview.selectAll')">
        </el-tooltip>
      </div>


      <div class="tab-wrapper">
        <el-tooltip :content="$t('preview.center')" placement="top">
          <img src="/src/assets/images/center-display-inactivate.png" class="inactive medium-size" :alt="$t('preview.center')">
        </el-tooltip>
        <el-tooltip :content="$t('preview.center')" placement="top">
          <img src="/src/assets/images/center-display-activate.png" class="active medium-size"
               @click="canvasActions.centerCanvasScrollBar()"
               :alt="$t('preview.center')">
        </el-tooltip>
      </div>
    </div>


    <div class="right-preview-bar">
      <div class="counter">{{ $t('preview.counter', {selected: canvasesStore.selectedPreviewList.size, total: canvasesStore.availableCanvases.size}) }}</div>
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
            <p v-if="canvas.metadata.shootingTime">{{ $t('preview.shootingTime') }}{{ canvas.metadata.shootingTime }}</p>
            <p v-if="canvas.metadata.resolution">{{ $t('preview.resolution') }}{{ canvas.metadata.resolution }}</p>
            <p v-if="canvas.metadata.fileSize">{{ $t('preview.size') }}{{ canvas.metadata.fileSize }}</p>
          </div>
        </template>
        <template #reference>
          <img class="previewItem"
               :ref="setPreviewElementRef"
               v-show="canvasesStore.thumbnailVisible(canvas)"
               :path="canvas.path"
               v-lazy="canvas.thumbUrl || canvas.url"
               @click.meta.exact="handleSelectPreviewElement($event,canvas)"
               @click.ctrl.exact="handleSelectPreviewElement($event, canvas)"
               @click.shift.exact="handleSelectMultiplePreviewElements($event,canvas)"
               @click="switchPreviewImage($event, canvas)"
               @dblclick="handleDbClickPreviewImage($event,canvas)">
        </template>
      </el-popover>
    </template>
  </div>
</template>

<script setup lang="js">

import {ref, watch, nextTick} from 'vue'

import _ from 'lodash'

import useEventListener from '@/composables/useEventListener'

import {useThrottle} from '@/utils/throttle'

import {parseDate, formatDate} from '@/utils/datetime'

import CanvasManager from '@/object/canvas-manager'

import {canvasActions} from '@/object/canvas-actions'

import {CanvasSettings} from '@/object/Configuration'

import {useCanvasesStore} from '@/stores/canvases'
import {useProjectSettingsStore} from '@/stores/project-settings'

const canvasesStore = useCanvasesStore()

const settingsStore = useProjectSettingsStore()

const previewList = ref(null)

const tooltipDisabled = ref(false)

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

    const beforePath = CanvasManager.getSelectedPath();

    // 前一次预览元素与当前预览元素不同，隐藏前一次预览元素
    if (beforePath && beforePath !== canvas.path) {
      canvasesStore.getCanvasEditor().clearCanvas();
      canvasesStore.getBackgroundCanvasEditor().clearCanvas();
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!beforePath || beforePath !== canvas.path) {
      // 更改新的选择元素
      CanvasManager.setSelectedObject({path: event.target.getAttribute('path'), previewElement: event.target})
      // 添加当前选中元素到选中列表中
      canvasesStore.selectedPreviewList.set(canvas.path, event.target)
      // 设置选择样式
      event.target.classList.add('active')

      await canvasActions.renderCanvas(canvas);
    }
  }
}


const handleDbClickPreviewImage = (event, canvas) => {
  if (!event.ctrlKey && !event.shiftKey) {
    if (canvasesStore.selectedPreviewList.has(canvas.path)) {
      if (CanvasManager.getSelectedPath() !== canvas.path) {
        // 更改新的选择元素
        CanvasManager.setSelectedObject({path: canvas.path, previewElement: event.target})
      }
      // 清空选中元素
      const selectedElements = canvasesStore.selectedPreviewList;
      for (const [path, element] of selectedElements) {
        if (event.target !== element) {
          element.classList.remove('active')
          canvasesStore.selectedPreviewList.delete(path)
        }
      }
    }
  }
}


const handleSelectPreviewElement = (event, canvas) => {
  const element = event.target;
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
    const elements = document.documentElement.querySelectorAll('img.previewItem');
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

  const target = event.target;

  // 检查是否在输入框/下拉框内
  if (target.closest('input, textarea, select')) {
    return;
  }

  // 检查是否在富文本编辑器内（利用 isContentEditable 属性）或者用 closest 检查属性，两者皆可
  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return;
  }

  // 检查是否原生可编辑（比如 Firefox 的 designMode 页面）
  if (target.closest('[designMode="on"]')) {
    return;
  }

  if ((event.ctrlKey && event.key === 'a') || event instanceof PointerEvent) {
    event.preventDefault();
    const previewElements = document.querySelectorAll('img.previewItem');
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


const switchBeforePreviewElement = useThrottle(async () => {

  const {path: selectedPath, previewElement: currentElement} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentCanvas = canvasesStore.availableCanvases.get(selectedPath);

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const prevNode = currentNode.prev ? currentNode.prev : canvasesStore.availableCanvases.getLastNode();

  const beforeCanvas = prevNode.value;

  if (currentCanvas && beforeCanvas) {

    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    canvasesStore.selectedPreviewList.delete(selectedPath)

    const beforeElement = beforeCanvas.getPreviewElement();
    beforeElement.classList.add('active')
    beforeElement.setAttribute('selected', 'true')

    CanvasManager.setSelectedObject({path: beforeCanvas.path, previewElement: beforeElement})
    canvasesStore.selectedPreviewList.set(beforeCanvas.path, beforeElement)

    await canvasActions.renderCanvas(beforeCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, beforeElement)
  }
}, 200)


const switchNextPreviewElement = useThrottle(async () => {

  const {path: selectedPath, previewElement: currentElement} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentCanvas = canvasesStore.availableCanvases.get(selectedPath);

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const prevNode = currentNode.next ? currentNode.next : canvasesStore.availableCanvases.getFirstNode();

  const nextCanvas = prevNode.value;

  if (currentCanvas && nextCanvas) {
    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    canvasesStore.selectedPreviewList.delete(selectedPath)

    const nextElement = nextCanvas.getPreviewElement();
    nextElement.classList.add('active')
    nextElement.setAttribute('selected', 'true')
    CanvasManager.setSelectedObject({path: nextCanvas.path, previewElement: nextElement})
    canvasesStore.selectedPreviewList.set(nextCanvas.path, nextElement)

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
};


const handleVisibleChange = (visible) => {
  tooltipDisabled.value = visible
}


// Ctrl + A 全选预览图
useEventListener(document, 'keydown', handleSelectAllPreviewElements)

</script>

<style scoped lang="scss">

.preview-bar {
  width: 100%;
  height: 40px;
  background: var(--expand-area-background-color);
  display: flex;
  justify-content: left;
  align-items: center;
  border-bottom: 1px solid var(--app-toolbar-border);
  gap: 15px;
  padding-left: 15px;

  .left-preview-bar {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 20px;

    .tab-wrapper {
      position: relative;
      height: 70%;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        height: 100%;
        width: auto;
        transition: opacity 0.4s ease;
      }

      .small-size {
        padding: 20%;
      }

      .medium-size {
        padding: 8%;
      }

      .inactive {
        opacity: 1;
      }

      .active {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
      }

      .inactive:hover {
        opacity: 0;
      }

      .active:hover {
        opacity: 1;
      }
    }

    .zoom-dropdown {
      height: 100%;
      display: flex;
      align-items: center;
    }
  }

  .right-preview-bar {
    display: flex;
    margin-left: auto;
    align-items: center;
    gap: 15px;

    .counter {
      color: var(--app-regular-text);
      font-size: 14px;
      display: flex;
    }

    .filter {
      display: flex;
      align-items: center;

      .filter-label {
        color: var(--app-regular-text);
        font-size: 14px;
      }

      .filter-select {
        margin-left: 6px;
        margin-right: 20px;

        .el-select {
          width: 100px !important;
        }
      }
    }
  }
}

.preview-list {
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - 40px);
  display: flex;
  justify-content: start;
  background: var(--expand-area-background-color);
  overflow-x: auto;
  scroll-behavior: smooth; /* 可选，使滚动更平滑 */
  white-space: nowrap; /* 防止内容换行 */
  outline: none;

  img {
    box-sizing: border-box;
    background: var(--app-thumb-bg);
    padding: 15px;
    height: 100%;
    border-right: 1px solid var(--app-thumb-border);
  }

  img:last-child {
    border: none;
  }

  .active {
    background: var(--app-thumb-active-bg);
    box-shadow: inset 0 -2px 0 var(--app-thumb-active-line);
  }

  image:last-child {
    margin-right: 0;
  }

}

</style>
