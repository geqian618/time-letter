<template>
  <div class="preview-panel">

    <!-- 工具条 -->
    <div class="preview-bar">
      <div class="left-preview-bar">
        <!-- 底部面板伸缩 -->
        <el-tooltip :show-after="1500" :content="$t('panel.collapseBottom')" placement="top">
          <button type="button" class="bar-icon" @click="$emit('toggle-bottom')">
            <SvgIcon name="panel-collapse-bottom"/>
          </button>
        </el-tooltip>

        <el-tooltip :show-after="1500" :content="$t('preview.first')" placement="top">
          <button type="button" class="bar-icon" @click="switchFirstPreviewElement">
            <SvgIcon name="step-first"/>
          </button>
        </el-tooltip>
        <el-tooltip :show-after="1500" :content="$t('preview.prev')" placement="top">
          <button type="button" class="bar-icon" @click="switchPrevPreviewElement">
            <SvgIcon name="step-prev"/>
          </button>
        </el-tooltip>
        <el-tooltip :show-after="1500" :content="$t('preview.next')" placement="top">
          <button type="button" class="bar-icon" @click="switchNextPreviewElement">
            <SvgIcon name="step-next"/>
          </button>
        </el-tooltip>
        <el-tooltip :show-after="1500" :content="$t('preview.last')" placement="top">
          <button type="button" class="bar-icon" @click="switchLastPreviewElement">
            <SvgIcon name="step-last"/>
          </button>
        </el-tooltip>

        <el-tooltip :show-after="1500" :content="$t('preview.zoom')" placement="top" :disabled="tooltipDisabled">
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

        <el-tooltip :show-after="1500" :content="$t('preview.selectAll')" placement="top">
          <button type="button" class="bar-icon" @click="handleSelectAllPreviewElements">
            <SvgIcon name="select-all"/>
          </button>
        </el-tooltip>
        <el-tooltip :show-after="1500" :content="$t('preview.center')" placement="top">
          <button type="button" class="bar-icon" @click="canvasActions.centerCanvasScrollBar()">
            <SvgIcon name="center-canvas"/>
          </button>
        </el-tooltip>
      </div>


      <div class="right-preview-bar">
        <!-- 对齐 / 分布：描边图标，分组与元素位置参考 PS 选项栏 -->
        <!-- 分组：[水平对齐族（竖参考线）] │ [垂直对齐族（横参考线）] │ [分布] -->
        <div class="align-group">
          <el-tooltip :show-after="1500" :content="$t('preview.alignLeft')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('left')">
              <SvgIcon name="align-left"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.alignCenterH')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('center-h')">
              <SvgIcon name="align-center-h"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.alignRight')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('right')">
              <SvgIcon name="align-right"/>
            </button>
          </el-tooltip>
          <span class="align-divider"/>
          <el-tooltip :show-after="1500" :content="$t('preview.alignTop')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('top')">
              <SvgIcon name="align-top"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.alignCenterV')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('center-v')">
              <SvgIcon name="align-center-v"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.alignBottom')" placement="top">
            <button type="button" class="bar-icon" @click="handleAlign('bottom')">
              <SvgIcon name="align-bottom"/>
            </button>
          </el-tooltip>
          <span class="align-divider"/>
          <el-tooltip :show-after="1500" :content="$t('preview.distributeH')" placement="top">
            <button type="button" class="bar-icon" @click="handleDistribute('horizontal')">
              <SvgIcon name="distribute-h"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.distributeV')" placement="top">
            <button type="button" class="bar-icon" @click="handleDistribute('vertical')">
              <SvgIcon name="distribute-v"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.distributeCenterH')" placement="top">
            <button type="button" class="bar-icon" @click="handleDistributeCenter('horizontal')">
              <SvgIcon name="distribute-center-h"/>
            </button>
          </el-tooltip>
          <el-tooltip :show-after="1500" :content="$t('preview.distributeCenterV')" placement="top">
            <button type="button" class="bar-icon" @click="handleDistributeCenter('vertical')">
              <SvgIcon name="distribute-center-v"/>
            </button>
          </el-tooltip>
        </div>
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
              <el-option :label="$t('preview.filterNone')" value="all"/>
              <el-option :label="$t('preview.filterLandscape')" value="landscape"/>
              <el-option :label="$t('preview.filterPortrait')" value="portrait"/>
              <!-- 已导入图片的扩展名选项动态追加 -->
              <el-option v-for="item in canvasesStore.extnameOptions" :key="item" :label="item" :value="item"/>
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
            :persistent="false"
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
                <SvgIcon name="check"/>
              </span>
            </div>
          </template>
        </el-popover>
      </template>

      <button type="button" class="import-more" @click="requestImportFiles">
        <SvgIcon name="plus"/>
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
      <div class="status-right">
        <span v-if="systemMetricsText">{{ $t('preview.statusSystemGroup', {value: systemMetricsText}) }}</span>
        <span class="status-divider" v-if="systemMetricsText">|</span>
        <span>{{ $t('preview.statusAppGroup', {value: appMetricsText}) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="js">

import {ref, reactive, watch, nextTick, computed, onUnmounted} from 'vue'

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
  if (metadata.resolution) items.push({text: t('preview.resolution') + metadata.resolution})
  if (metadata.fileSize) items.push({text: t('preview.size') + metadata.fileSize})
  return items
})

// 状态栏右侧：性能指标按「系统 | 应用」分组（系统=整机，应用=本应用全部进程）
// 状态栏性能参数统一刷新间隔：轮询指标与 FPS 结算同频（FPS 为该窗口的平均帧率）
const METRICS_REFRESH_MS = 5000
const perfMetrics = ref(null)
const fps = ref(0)

// 数值固定占位（宽度不足时在数值尾部用「图形空格」U+2007 补齐——宽度与数字完全等宽且不折行，
// 宽度不变的前提下让标签与数值保持紧贴；配合 tabular-nums 使位数变化时指标块总宽度精确恒定）
const padValue = (value, width) => String(value).padEnd(width, '\u2007')

// 系统组：整机内存 / CPU（首帧系统 CPU 无历史快照，用 -- 占位保持宽度稳定）
const systemMetricsText = computed(() => {
  const metrics = perfMetrics.value
  if (!metrics) return ''
  const items = [
    t('preview.statusMemory', {
      value: padValue(metrics.systemMemoryPercent != null ? `${metrics.systemMemoryPercent}%` : '--', 4)
    }),
    t('preview.statusCpu', {
      value: padValue(metrics.systemCpuPercent != null ? `${metrics.systemCpuPercent}%` : '--', 4)
    }),
  ]
  return items.join(' ')
})

// 应用组：本应用全部进程的内存 / CPU，以及 FPS、GPU 加速状态
const appMetricsText = computed(() => {
  const metrics = perfMetrics.value
  if (!metrics) return ''
  // 统一用 MB 显示（不切换 GB）：单位混排时小数点与数字宽度差会造成轻微位移
  // 槽位 8 字符：覆盖 3~5 位数的 MB 值（到 99999 MB），位数在该范围内变化不引起位移
  const memory = `${Math.round(metrics.memoryKB / 1024)} MB`
  const items = [
    t('preview.statusMemory', {value: padValue(memory, 8)}),
    // 槽位 6 字符：按 100.0% 上限预留（覆盖到 999.9%，常规范围内位数变化不位移）
    t('preview.statusCpu', {value: padValue(`${metrics.cpuPercent.toFixed(1)}%`, 6)}),
    t('preview.statusFps', {value: padValue(fps.value > 0 ? fps.value : '--', 3)}),
  ]
  if (metrics.gpuAccelerated != null) {
    items.push(t(metrics.gpuAccelerated ? 'preview.statusGpuOn' : 'preview.statusGpuOff'))
  }
  return items.join(' ')
})

const refreshPerformanceMetrics = async () => {
  // 页面隐藏（窗口被遮挡/最小化）时跳过刷新、保留上一次可见时的值——与下方 FPS 采样
  // 同一策略：隐藏期间不再让主进程周期性 spawn powershell 查询内存（Win32 内存口径
  // 依赖该查询对齐任务管理器，故只门控频率、不改数据来源）
  if (document.visibilityState !== 'visible') return
  perfMetrics.value = await window.electronAPI.getPerformanceMetrics()
}

refreshPerformanceMetrics()
const perfTimer = setInterval(refreshPerformanceMetrics, METRICS_REFRESH_MS)

// 窗口重新露出立即补一次刷新，数值即刻恢复新鲜（隐藏期间停更）
useEventListener(document, 'visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshPerformanceMetrics()
})

// FPS：逐帧计数、每 METRICS_REFRESH_MS 结算一次（与轮询指标同频，显示该窗口的平均帧率）。
// 页面隐藏（窗口被遮挡/最小化）时 Chromium 会把 rAF 节流到低频，
// 此时的帧率不代表渲染性能——不结算、保持上一次可见时的值，窗口重新露出后自动恢复刷新
let fpsFrames = 0
let fpsLastTime = performance.now()
let fpsRafId = requestAnimationFrame(function sampleFps(now) {
  fpsFrames++
  if (now - fpsLastTime >= METRICS_REFRESH_MS) {
    if (document.visibilityState === 'visible') {
      fps.value = Math.round(fpsFrames * 1000 / (now - fpsLastTime))
    }
    fpsFrames = 0
    fpsLastTime = now
  }
  fpsRafId = requestAnimationFrame(sampleFps)
})

onUnmounted(() => {
  clearInterval(perfTimer)
  cancelAnimationFrame(fpsRafId)
  disposeWatchImportImages?.()
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
const watchImportImages = () => {
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
            // metadata 单独保持深响应式：画布 Map 已改 shallowReactive（canvas-manager.js），
            // 而悬浮卡片 / 状态栏等模板在订阅 metadata 字段（filename、shootingTime 等，
            // 且 RightPanel 的 metadataOptions 与此处是同一对象、可就地编辑）
            settings.metadata = reactive(metadata)
          }
          CanvasManager.setCanvas(path, Object.assign(settings, picture))
        }
      }
    }
  });
}

// 图片导入监听（卸载时解绑，防 HMR 重挂载累积监听器）
const disposeWatchImportImages = watchImportImages()


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

// 离开画布时把编辑器内容序列化写回该画布条目：条目从活实例退回 JSON 字符串后，
// 元素实例（含已解码图片引用）才能在编辑器灌入下一张时释放，内存中同一时刻
// 只保留当前画布一份活实例。
// 仅当编辑器当前加载的正是离开的画布时才导出：快速切换时上一张的渲染可能
// 尚未落定，编辑器里仍是更早一张的内容，直接导出会把别的画布元素写进本画布数据。
const serializeLoadedCanvas = (path) => {
  if (!path || canvasActions.getLoadedCanvasPath() !== path) return
  const canvas = CanvasManager.getCanvas(path)
  if (!canvas) return
  canvas.foreground = canvasesStore.getCanvasEditor().exportToJSON()
  canvas.background = canvasesStore.getBackgroundCanvasEditor().exportToJSON()
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
    // 当前画布被新筛选排除：渲染替代画布前先把编辑器内容序列化回它，
    // 否则它的活实例会一直驻留到再次被正常路径访问并离开
    serializeLoadedCanvas(selectedPath)
    nextSelectCanvas = canvasesStore.availableCanvases.get(paths[0]);
    previewElement = nextSelectCanvas.getPreviewElement();
    await canvasActions.renderCanvas(nextSelectCanvas)
  }
  previewElement.classList.add('active')
  previewElement.setAttribute('selected', 'true')

  CanvasManager.setSelectedObject({path: nextSelectCanvas.path, previewElement})
  canvasesStore.selectedPreviewList.set(nextSelectCanvas.path, previewElement)
}

// 筛选条件变化时清空选中并默认选中一张画布
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

    // 前一次预览元素与当前预览元素不同
    if (currentPath && currentPath !== targetPath) {
      serializeLoadedCanvas(currentPath)
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!currentPath || currentPath !== targetPath) {
      // 更改新的选择元素
      CanvasManager.setSelectedObject({
        path: event.currentTarget.getAttribute('path'),
        previewElement: event.currentTarget
      })
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


// 切换到指定画布：更新选中态、按需保存离开画布的编辑器内容、渲染目标画布并滚动胶片条。
// 上一张 / 下一张 / 第一张 / 最后一张 四个按钮共用本路径
const switchToCanvas = async (targetCanvas) => {

  if (!targetCanvas) return

  const {path: selectedPath, previewElement: currentElement} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentCanvas = canvasesStore.availableCanvases.get(selectedPath);

  if (!currentCanvas || currentCanvas.path === targetCanvas.path) return

  currentElement.setAttribute('selected', 'false')
  currentElement.classList.remove('active')
  canvasesStore.selectedPreviewList.delete(selectedPath)

  const targetElement = targetCanvas.getPreviewElement();
  targetElement.classList.add('active')
  targetElement.setAttribute('selected', 'true')

  CanvasManager.setSelectedObject({path: targetCanvas.path, previewElement: targetElement})
  canvasesStore.selectedPreviewList.set(targetCanvas.path, targetElement)

  // 仅当编辑器当前加载的正是离开的画布时才导出（快速切换时编辑器里可能还是更早一张的内容）
  serializeLoadedCanvas(selectedPath)

  await canvasActions.renderCanvas(targetCanvas)

  // 方式二，过渡比较流畅
  scrollBarMoveToHorizontalCenter(previewList.value, targetElement)
}


const switchPrevPreviewElement = useThrottle(async () => {

  const {path: selectedPath} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const prevNode = currentNode.prev ? currentNode.prev : canvasesStore.availableCanvases.getLastNode();

  await switchToCanvas(prevNode.value);
}, 200)


const switchNextPreviewElement = useThrottle(async () => {

  const {path: selectedPath} = CanvasManager.getSelectedObject();

  if (!selectedPath) return

  const currentNode = canvasesStore.availableCanvases.getNode(selectedPath);

  const nextNode = currentNode.next ? currentNode.next : canvasesStore.availableCanvases.getFirstNode();

  await switchToCanvas(nextNode.value);
}, 200)


const switchFirstPreviewElement = useThrottle(async () => {

  const firstNode = canvasesStore.availableCanvases.getFirstNode();

  if (!firstNode) return

  await switchToCanvas(firstNode.value);
}, 200)


const switchLastPreviewElement = useThrottle(async () => {

  const lastNode = canvasesStore.availableCanvases.getLastNode();

  if (!lastNode) return

  await switchToCanvas(lastNode.value);
}, 200)


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


// 对齐选中元素：多选以选区联合包围盒为基准，单选以画布为基准（逻辑在 CanvasEditor.alignElements）
const handleAlign = (mode) => {
  canvasesStore.getCanvasEditor()?.alignElements(mode);
};


// 分布选中元素：以首尾为基准，中间元素边缘间隙等距排布（逻辑在 CanvasEditor.distributeElements）
const handleDistribute = (mode) => {
  canvasesStore.getCanvasEditor()?.distributeElements(mode);
};

// 分布选中元素：以首尾为基准，中间元素中心点等距排布（逻辑在 CanvasEditor.distributeElementsByCenter）
const handleDistributeCenter = (mode) => {
  canvasesStore.getCanvasEditor()?.distributeElementsByCenter(mode);
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
  height: 34px;
  flex: 0 0 34px;
  background: var(--ui-chrome);
  display: flex;
  align-items: center;
  padding: 0 14px 0 10px;
  gap: 12px;

  .bar-icon {
    width: 26px;
    height: 26px;
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
      width: 16px;
      height: 16px;
    }

    &:hover {
      background: var(--ui-control);
      color: var(--ui-text);
    }
  }

  /* 缩放下拉：不加边框，背景宽度与其他图标一致 */
  .bar-icon.is-text {
    width: 28px;
    font-size: 10.5px;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.2px;
  }

  .left-preview-bar {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 2px;

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

    /* 对齐 / 分布按钮组：与左侧工具栏同款图标按钮 + 分隔线 */
    .align-group {
      display: flex;
      align-items: center;
      gap: 2px;

      .align-divider {
        flex: 0 0 auto;
        width: 1px;
        height: 20px;
        margin: 0 7px;
        background: var(--ui-border);
      }
    }

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
        margin-left: 0;

        .el-select {
          width: 84px !important;

          :deep(.el-select__wrapper) {
            background: var(--ui-elevated);
            /* 用全局描边规则，这里不再覆盖 */
            min-height: 22px;
            /* 对齐全局 10px 字号体系（element-overrides 未覆盖新版 select wrapper） */
            font-size: 10px;
          }

          :deep(.el-select__suffix .el-icon) {
            font-size: 10px;
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
  height: calc(100% - 58px);
  min-height: 0;
  width: 100%;
  display: flex;
  /* 子项拉伸填满容器高度（缩略图高度=可用高度，宽度随图片比例自适应） */
  align-items: stretch;
  gap: 8px;
  padding: 0 10px 8px;
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
      left: 3px;
      top: 3px;
      width: 13px;
      height: 13px;
      border-radius: 3px;
      display: none;
      align-items: center;
      justify-content: center;
      background: var(--ui-accent);
      color: var(--ui-accent-contrast);

      svg {
        width: 8px;
        height: 8px;
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
    width: 88px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-radius: var(--app-radius-md);
    border: 1px solid var(--ui-border);
    background: transparent;
    color: var(--ui-text-muted);
    font-family: inherit;
    font-size: 9.5px;
    cursor: pointer;
    transition: background-color var(--app-transition), border-color var(--app-transition), color var(--app-transition);

    svg {
      width: 13px;
      height: 13px;
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
  flex: 0 0 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 左右留白一致：文件路径左侧与性能参数右侧同为 4px */
  padding: 0 4px;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-chrome);
  font-size: 8px;
  /* 等宽数字：配合数值固定占位，刷新时指标块宽度恒定 */
  font-variant-numeric: tabular-nums;
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
    display: flex;
    align-items: center;
    margin-left: 12px;
    color: var(--ui-text-faint);
  }

  /* 系统 / 应用 两组之间的竖线分隔符：两侧留白 + 颜色调浅（不抢指标文字） */
  .status-divider {
    margin: 0 8px;
    opacity: 0.6;
  }
}

</style>
