<template>
  <div class="image-manager">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate"
                     @change="toggleSelectAll"/>
        <div class="filter">
          <span class="filter-label">{{ $t('imageManager.filter') }}</span>
          <el-select v-model="filterExtnameList" class="ext-filter" multiple collapse-tags clearable
                     size="small" :placeholder="$t('imageManager.filterByExt')">
            <el-option v-for="item in extnameOptions" :key="item" :label="item" :value="item"/>
          </el-select>
          <el-input v-model="nameFilter" class="name-filter" size="small" clearable
                    prefix-icon="Search" :placeholder="$t('imageManager.filterByName')"/>
        </div>
        <div class="filter">
          <span class="filter-label">{{ $t('imageManager.columns') }}</span>
          <el-select v-model="columnCount" class="column-select" size="small" :placeholder="$t('imageManager.auto')"
                     clearable allow-create filterable>
            <el-option :label="$t('imageManager.auto')" :value="0"/>
            <el-option v-for="n in [1, 2, 3, 4, 5, 6, 8]" :key="n" :label="String(n)" :value="n"/>
          </el-select>
        </div>
        <el-button size="small" :disabled="!selectedPaths.size" @click="clearSelected">
          {{ $t('imageManager.clearSelected') }}
        </el-button>
        <span class="counter">{{
            $t('imageManager.counter', {
              selected: selectedPaths.size,
              total: filteredImages.length
            })
          }}</span>
      </div>
      <div class="toolbar-right">
        <el-button size="small" :disabled="!selectedPaths.size" @click="removeSelected">{{
            $t('imageManager.remove')
          }}
        </el-button>
        <el-button size="small" type="danger" :disabled="!selectedPaths.size" @click="deleteSelected">
          {{ $t('imageManager.delete') }}
        </el-button>
        <el-button size="small" type="primary" :disabled="!selectedPaths.size" @click="moveSelected">
          {{ $t('imageManager.moveTo') }}
        </el-button>
      </div>
    </div>

    <div class="grid-wrapper" ref="gridWrapper" :class="{empty: !filteredImages.length}">
      <div v-if="filteredImages.length" class="image-grid"
           :class="{'single-column': isSingleColumn}" :style="{gridTemplateColumns: gridColumns}">
        <div v-for="image in filteredImages" :key="image.path" class="image-cell"
             :class="{selected: selectedPaths.has(image.path)}" :style="cellStyle"
             @click="handleCellClick($event, image)">
          <div class="check-row">
            <span class="check" :class="{checked: selectedPaths.has(image.path)}"></span>
          </div>
          <div class="thumb" v-loading="!loadedPaths.has(image.path)"
               element-loading-background="var(--app-thumb-bg)">
            <img :src="thumbSrc(image)" loading="lazy" :alt="image.filename"
                 @load="loadedPaths.add(image.path)" @error="loadedPaths.add(image.path)">
          </div>
          <el-tooltip :content="image.filename" placement="bottom" :show-after="500">
            <div class="filename">{{ image.filename }}</div>
          </el-tooltip>
        </div>
      </div>
      <el-empty v-else :description="$t('imageManager.empty')"/>
    </div>
  </div>
</template>

<script setup lang="js">

import {ref, computed, watch, onMounted, onUnmounted} from 'vue'

import {ElMessage} from 'element-plus'

import {useI18n} from 'vue-i18n'

import useEventListener from "@/composables/common/useEventListener";

import {useProjectSettingsStore} from '@/stores/project-settings'

import {useTheme} from '@/composables/shared/useTheme';

const {t, locale} = useI18n()

// 主窗口推送的画布快照
const images = ref([])

const selectedPaths = ref(new Set())

const filterExtnameList = ref([])

// 文件名匹配关键字
const nameFilter = ref('')

// 网格列数：0 或未输入 = 自动按宽度自适应；输入正整数 = 固定列数
const columnCount = ref(0)

const settingsStore = useProjectSettingsStore()

const gridColumns = computed(() => {
  const count = parseInt(columnCount.value)
  // minmax(0, 1fr)：忽略内容固有宽度强制均分，避免大图把轨道撑出窗口
  return count >= 1 ? `repeat(${count}, minmax(0, 1fr))` : 'repeat(auto-fill, minmax(140px, 1fr))'
})

// 按列数估算所需缩略图高度（4:3 格子 × 设备像素比），钳制在 128~2048 并按 64 对齐，保证画质不浪费内存
const thumbHeight = computed(() => {
  const count = parseInt(columnCount.value)
  if (!(count >= 1)) return 128
  const dpr = window.devicePixelRatio || 1
  return Math.min(2048, Math.max(128, Math.round(1200 / count * dpr / 64) * 64))
})

// 以请求高度重写缩略图地址（路径已编码，追加 ?height= 查询参数）
const thumbSrc = (image) => {
  return thumbHeight.value === 128 ? image.thumbUrl : `${image.thumbUrl}?height=${thumbHeight.value}`
}

// 一列模式：缩略图高度按可视区动态计算，使每个单元格刚好占满一屏
const gridWrapper = ref(null)

const wrapperHeight = ref(0)

const measureWrapper = () => {
  wrapperHeight.value = gridWrapper.value?.clientHeight || 0
}

// 一列模式：单元格占满网格可视区高度（扣除容器上下内边距 24），缩略图以 flex 填充剩余空间
const isSingleColumn = computed(() => parseInt(columnCount.value) === 1)

const cellStyle = computed(() => {
  if (!isSingleColumn.value || !wrapperHeight.value) return null
  return {height: `${wrapperHeight.value - 24}px`}
})

// 已完成加载的图片；缩略图尺寸变化后全部重新进入加载态，加载完成前显示动画遮罩
const loadedPaths = ref(new Set())

watch(thumbHeight, () => loadedPaths.value.clear())

// 后缀名筛选项（从当前图片数据动态提取）
const extnameOptions = computed(() => [...new Set(images.value.map(image => image.extname).filter(Boolean))])

// 筛选后的图片列表：扩展名多选 + 文件名关键字匹配（不区分大小写），两者叠加生效
const filteredImages = computed(() => {
  let list = images.value
  if (filterExtnameList.value.length) {
    list = list.filter(image => filterExtnameList.value.includes(image.extname))
  }
  const keyword = nameFilter.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(image => (image.filename || '').toLowerCase().includes(keyword))
  }
  return list
})

const isAllSelected = computed(() => {
  return filteredImages.value.length > 0 && filteredImages.value.every(image => selectedPaths.value.has(image.path))
})

// 部分选中时全选框显示半选态
const isIndeterminate = computed(() => {
  const selectedCount = filteredImages.value.filter(image => selectedPaths.value.has(image.path)).length
  return selectedCount > 0 && selectedCount < filteredImages.value.length
})

// 全选 / 取消全选（未全选中则全选，全选中则取消全选；作用于当前筛选结果）
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedPaths.value.clear()
  } else {
    filteredImages.value.forEach(image => selectedPaths.value.add(image.path))
  }
}

// 单击切换单元格选中态
const toggleSelect = (path) => {
  selectedPaths.value.has(path) ? selectedPaths.value.delete(path) : selectedPaths.value.add(path)
}

// 上一次单击的图片索引，作为 shift 连选的起点
let lastIndex = -1

// 普通单击切换选中并记录起点；shift + 单击选中上次单击到当前单击的区间（替换已有选中）
const handleCellClick = (event, image) => {
  const index = filteredImages.value.findIndex(item => item.path === image.path)
  if (event.shiftKey && lastIndex >= 0) {
    const [start, end] = index < lastIndex ? [index, lastIndex] : [lastIndex, index]
    selectedPaths.value.clear()
    for (let i = start; i <= end; i++) {
      selectedPaths.value.add(filteredImages.value[i].path)
    }
    return
  }
  toggleSelect(image.path)
  lastIndex = index
}

// Ctrl + A 全选当前筛选结果
const handleKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    event.preventDefault()
    filteredImages.value.forEach(image => selectedPaths.value.add(image.path))
  }
}

// 一键清空所有选中
const clearSelected = () => {
  selectedPaths.value.clear()
}

// 移除：仅从主界面画布列表移除，保留磁盘文件
const removeSelected = () => {
  window.electronAPI.imageManagerRemove([...selectedPaths.value])
}

// 删除：移入回收站并从主界面画布列表移除
const deleteSelected = () => {
  window.electronAPI.imageManagerDelete([...selectedPaths.value])
}

// 移动：主进程选目标目录并移动文件，主界面画布自动更新路径
const moveSelected = () => {
  window.electronAPI.imageManagerMove([...selectedPaths.value])
}

// 接收主窗口推送的画布快照，并清理已失效的选中项
const watchImageData = () => {
  window.electronAPI.imageManagerWatchData((event, data) => {
    images.value = data
    const paths = new Set(data.map(image => image.path))
    for (let path of selectedPaths.value) {
      if (!paths.has(path)) {
        selectedPaths.value.delete(path)
      }
    }
  })
}

// 移动结果提示
const watchMoveResult = () => {
  window.electronAPI.watchImageManagerMoveResult((event, {movedCount, skippedCount, failedCount}) => {
    const parts = [t('imageManager.moveResult.moved', {n: movedCount})]
    if (skippedCount) parts.push(t('imageManager.moveResult.skipped', {n: skippedCount}))
    if (failedCount) parts.push(t('imageManager.moveResult.failed', {n: failedCount}))
    ElMessage({message: parts.join(locale.value === 'zh-CN' ? '，' : ', '), type: failedCount ? 'warning' : 'success'})
  })
}


// ---------- 窗口标题（独立窗口，跟随界面语言） ----------

const applyDocumentTitle = () => {
  document.title = t('imageManager.title')
}

// 语言切换（含广播跟随）时同步窗口标题
watch(locale, applyDocumentTitle)


// ---------- 主题（独立窗口自行应用亮 / 暗主题） ----------

const {renderTheme} = useTheme();

// IPC 监听解绑函数集合（onMounted 中注册，卸载时统一解绑，防 HMR 重挂载累积监听器）
const ipcDisposers = []

onMounted(() => {
  applyDocumentTitle()
  measureWrapper()
  // 先注册监听，再拉取初始快照
  ipcDisposers.push(watchImageData(), watchMoveResult())
  window.electronAPI.imageManagerRequestData()

  // 跟随主窗口的主题切换广播
  ipcDisposers.push(window.electronAPI?.watchThemeChanged?.((event, theme) => {
    renderTheme(theme);
  }));

  useEventListener(window, 'keydown', handleKeydown)
  useEventListener(window, 'resize', measureWrapper)
})

onUnmounted(() => {
  ipcDisposers.forEach((dispose) => dispose?.())
})

</script>


<style scoped lang="scss">

.image-manager {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-page-bg);
  color: var(--app-page-text);

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    // 与网格容器（grid-wrapper）左右内边距一致，使全选框与网格左缘对齐
    padding: 10px 12px;
    border-bottom: 1px solid var(--app-border);
    flex-shrink: 0;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
    }

    .counter {
      font-size: 12px;
      color: var(--app-secondary-text);
    }

    // 筛选标签与下拉框紧邻成组，不受工具栏间距影响
    .filter {
      display: flex;
      align-items: center;
    }

    .filter-label {
      font-size: 14px;
      margin-right: 5px;
      color: var(--app-secondary-text);
    }

    .ext-filter {
      width: 150px;

      // 筛选 tag 适配亮暗主题（EP 的 info 标签默认不跟随主题）
      :deep(.el-tag) {
        background: var(--el-fill-color);
        border-color: var(--el-border-color-light);
        color: var(--el-text-color-regular);

        .el-tag__close {
          color: var(--el-text-color-secondary);

          &:hover {
            background: var(--el-fill-color-dark);
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    .column-select {
      width: 96px;
    }

    .name-filter {
      width: 150px;
      margin-left: 8px;
    }
  }

  .grid-wrapper {
    flex: 1;
    overflow: auto;
    padding: 12px;

    // 无图片时空提示在窗口居中
    &.empty {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));

    // 一列模式：单元格固定高度，缩略图 flex 填充剩余空间，自适应复选框行与文件名高度
    &.single-column .image-cell .thumb {
      flex: 1;
      min-height: 0;
      aspect-ratio: auto;
    }
  }

  // 未选中时单元格为白色（暗色主题用对应深色），相邻单元格以网格线分隔
  .image-cell {
    position: relative;
    min-width: 0;
    background: var(--el-bg-color);
    border-right: 1px solid var(--app-border);
    border-bottom: 1px solid var(--app-border);
    padding: 5px 5px 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;

    // 复选框行：独占顶部一行，不遮挡下方图片
    .check-row {
      display: flex;
      margin-bottom: 6px;
    }

    // 复选框：选中时填充主题色并打勾
    .check {
      position: relative;
      width: 16px;
      height: 16px;
      border: 1px solid var(--app-border-strong);
      border-radius: 3px;
      background: var(--el-bg-color);

      &.checked {
        border-color: var(--app-accent);
        background: var(--app-accent);

        &::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 4px;
          height: 8px;
          border: solid #fff;
          border-width: 0 1.5px 1.5px 0;
          transform: translate(-50%, -55%) rotate(45deg);
        }
      }
    }

    &:hover {
      outline: 1px solid var(--app-border-strong);
      outline-offset: -1px;
    }

    // 选中状态由左上角复选框标识，单元格底色保持不变

    .thumb {
      // 高度随单元格宽度按 4:3 缩放，减少列数时图片随之放大
      aspect-ratio: 4 / 3;
      width: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .filename {
      font-size: 11px;
      padding: 4px 6px;
      text-align: center;
      color: var(--app-secondary-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// 亮色主题下文件名加深一点（暗色主题保持原有浅色）
:root:not([dark-theme]) .filename {
  color: var(--el-text-color-regular);
}
</style>
