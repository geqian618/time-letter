<template>
  <div class="image-manager">
    <div class="toolbar">
      <div class="toolbar-left">
        <el-checkbox :model-value="isAllSelected" :indeterminate="isIndeterminate"
                     @change="toggleSelectAll"/>
        <div class="filter">
          <span class="filter-label">筛选：</span>
          <el-select v-model="filterExtnameList" class="ext-filter" multiple collapse-tags clearable
                     size="small" placeholder="按扩展名筛选">
            <el-option v-for="item in extnameOptions" :key="item" :label="item" :value="item"/>
          </el-select>
        </div>
        <el-button size="small" :disabled="!selectedPaths.size" @click="clearSelected">清除选中</el-button>
        <span class="counter">已选 {{ selectedPaths.size }} / 共 {{ filteredImages.length }} 张</span>
      </div>
      <div class="toolbar-right">
        <el-button size="small" :disabled="!selectedPaths.size" @click="removeSelected">移除</el-button>
        <el-button size="small" type="danger" :disabled="!selectedPaths.size" @click="deleteSelected">删除</el-button>
        <el-button size="small" type="primary" :disabled="!selectedPaths.size" @click="moveSelected">移动到</el-button>
      </div>
    </div>

    <div class="grid-wrapper">
      <div v-if="filteredImages.length" class="image-grid">
        <div v-for="image in filteredImages" :key="image.path" class="image-cell"
             :class="{selected: selectedPaths.has(image.path)}" @click="handleCellClick($event, image)">
          <span class="check" :class="{checked: selectedPaths.has(image.path)}"></span>
          <div class="thumb">
            <img :src="image.thumbUrl" :alt="image.filename">
          </div>
          <el-tooltip effect="light" :content="image.filename" placement="bottom" :show-after="500">
            <div class="filename">{{ image.filename }}</div>
          </el-tooltip>
        </div>
      </div>
      <el-empty v-else description="暂无图片，请先在主界面导入图片"/>
    </div>
  </div>
</template>

<script setup lang="js">

import {ref, computed, onMounted, onBeforeUnmount} from 'vue'
import {ElMessage} from 'element-plus'

import StorageManager from '@/object/StorageManager'

// 主窗口推送的画布快照
const images = ref([])

const selectedPaths = ref(new Set())

const filterExtnameList = ref([])

// 后缀名筛选项（从当前图片数据动态提取）
const extnameOptions = computed(() => [...new Set(images.value.map(image => image.extname).filter(Boolean))])

// 筛选后的图片列表
const filteredImages = computed(() => {
  if (!filterExtnameList.value.length) return images.value
  return images.value.filter(image => filterExtnameList.value.includes(image.extname))
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
    const parts = [`成功移动 ${movedCount} 张`]
    if (skippedCount) parts.push(`跳过 ${skippedCount} 张（同名或同目录）`)
    if (failedCount) parts.push(`失败 ${failedCount} 张`)
    ElMessage({message: parts.join('，'), type: failedCount ? 'warning' : 'success'})
  })
}


// ---------- 主题（独立窗口自行应用亮 / 暗主题） ----------

let systemThemeMedia = null

const applyTheme = () => {
  const theme = StorageManager.getProjectSettings()?.appearance?.theme || 'system'
  const isDark = theme === 'dark' || (theme === 'system' && systemThemeMedia?.matches)
  isDark ? document.documentElement.setAttribute('dark-theme', '')
         : document.documentElement.removeAttribute('dark-theme')
}

const setupTheme = () => {
  systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)')
  // 跟随系统主题变化
  systemThemeMedia.addEventListener('change', applyTheme)
  applyTheme()
  // 跟随主窗口的主题切换广播
  window.electronAPI.watchThemeChanged(applyTheme)
}


onMounted(() => {
  document.title = '图片管理器'
  setupTheme()
  window.addEventListener('keydown', handleKeydown)
  // 先注册监听，再拉取初始快照
  watchImageData()
  watchMoveResult()
  window.electronAPI.imageManagerRequestData()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  systemThemeMedia?.removeEventListener('change', applyTheme)
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
      color: var(--app-secondary-text);
    }

    .ext-filter {
      width: 180px;

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
  }

  .grid-wrapper {
    flex: 1;
    overflow: auto;
    padding: 12px;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  // 未选中时单元格为白色（暗色主题用对应深色），相邻单元格以网格线分隔
  .image-cell {
    position: relative;
    background: var(--el-bg-color);
    border-right: 1px solid var(--app-border);
    border-bottom: 1px solid var(--app-border);
    padding: 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;

    // 复选框：选中时填充主题色并打勾
    .check {
      position: absolute;
      top: 6px;
      left: 6px;
      width: 16px;
      height: 16px;
      border: 1px solid var(--app-border-strong);
      border-radius: 3px;
      background: var(--el-bg-color);
      z-index: 1;

      &.checked {
        border-color: var(--app-accent);
        background: var(--app-accent);

        &::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid #fff;
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
      }
    }

    &:hover {
      outline: 1px solid var(--app-border-strong);
      outline-offset: -1px;
    }

    // 选中：深灰底（亮色主题）/ 亮灰底（暗色主题），与白色底反差明显
    &.selected {
      background: var(--app-thumb-active-bg);
    }

    .thumb {
      height: 110px;
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
