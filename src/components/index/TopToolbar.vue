<template>
  <header class="top-toolbar" :class="{'is-mac': isMac}">
    <!-- 品牌区：使用应用自身的图标（与 Electron 窗口图标同源） -->
    <div class="brand">
      <img class="brand-mark" :src="appLogo" :alt="$t('toolbar.brand')" draggable="false">
      <span class="brand-name">{{ $t('toolbar.brand') }}</span>
    </div>

    <span class="brand-divider"></span>

    <!-- 菜单栏 -->
    <nav class="menu-bar">
      <!-- 左侧面板伸缩 -->
      <el-tooltip :content="leftCollapsed ? $t('panel.expandLeft') : $t('panel.collapseLeft')" placement="bottom">
        <button type="button" class="panel-toggle" @click="$emit('toggle-left')">
          <SvgIcon name="panel-collapse-left"/>
        </button>
      </el-tooltip>

      <button
          v-for="item in menus"
          :key="item.key"
          type="button"
          class="menu-item"
          :class="{ 'is-active': activeMenu === item.key }"
          @click="handleMenuClick($event, item)">
        {{ $t(`toolbar.menu.${item.key}`) }}
      </button>
    </nav>

    <!-- 右侧操作区 -->
    <div class="toolbar-actions">
      <SearchDropdown @toggle-left="$emit('toggle-left')" @toggle-right="$emit('toggle-right')"
                      @toggle-bottom="$emit('toggle-bottom')"/>

      <button type="button" class="export-button" @click="handleExport">
        <SvgIcon name="export"/>
        <span>{{ $t('toolbar.export') }}</span>
      </button>

      <!-- 检查更新：完整升级逻辑留待后续接入，当前仅提示 -->
      <el-tooltip :content="$t('toolbar.checkUpdate')" placement="bottom">
        <button type="button" class="check-update-button" @click="handleCheckUpdate">
          <SvgIcon name="refresh"/>
        </button>
      </el-tooltip>

      <div class="window-controls" v-if="!isMac">
        <!-- 右侧面板伸缩 -->
        <el-tooltip :content="rightCollapsed ? $t('panel.expandRight') : $t('panel.collapseRight')" placement="bottom">
          <button type="button" class="panel-toggle" @click="$emit('toggle-right')">
            <SvgIcon name="panel-collapse-right"/>
          </button>
        </el-tooltip>

        <el-tooltip :content="$t('toolbar.minimize')" placement="bottom">
          <button type="button" class="window-button" @click="handleMinimize">
            <SvgIcon name="win-minimize"/>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('toolbar.maximize')" placement="bottom">
          <button type="button" class="window-button" @click="handleToggleMaximize">
            <SvgIcon v-if="isMaximized" name="win-restore"/>
            <SvgIcon v-else name="win-maximize"/>
          </button>
        </el-tooltip>
        <el-tooltip :content="$t('toolbar.close')" placement="bottom">
          <button type="button" class="window-button is-close" @click="handleClose">
            <SvgIcon name="win-close"/>
          </button>
        </el-tooltip>
      </div>
    </div>
  </header>
</template>

<script setup lang="js">
import {ref, onMounted, onUnmounted} from 'vue'

import {useI18n} from 'vue-i18n'

import {ElMessage} from 'element-plus'

import appLogo from '@resources/favicon.png'

import SearchDropdown from '@/components/index/SearchDropdown.vue'

const {t} = useI18n()

// 面板伸缩状态由父组件（Index.vue）持有，这里只转发切换事件并按状态提示文案
const props = defineProps({
  leftCollapsed: {type: Boolean, default: false},
  rightCollapsed: {type: Boolean, default: false},
})

defineEmits(['toggle-left', 'toggle-right', 'toggle-bottom'])

// 顶级菜单：有原生菜单的走主进程弹出原生命令
const menus = [
  {key: 'file', menuId: 'file'},
  {key: 'settings', menuId: 'settings'},
  {key: 'extensions', menuId: 'extensions'},
  {key: 'tools', menuId: 'tools'},
  {key: 'help', menuId: 'help'},
]

// macOS 保留系统红绿灯，隐藏自绘窗口控制并给品牌区让位
const isMac = window.electronAPI?.platform === 'darwin'

const activeMenu = ref('')
const isMaximized = ref(false)

// 菜单点击：弹出对应原生菜单，并高亮当前项
const handleMenuClick = (event, item) => {
  activeMenu.value = item.key
  if (!item.menuId) return
  const rect = event.currentTarget.getBoundingClientRect()
  window.electronAPI?.popupAppMenu?.({
    id: item.menuId,
    x: rect.left,
    y: rect.bottom + 2,
  })
}

// 导出：复用原生「文件 › 导出图片」命令（弹目录 → 走既有导出进度流程）
const handleExport = () => {
  window.electronAPI?.invokeAppMenu?.('export-images')
}

// 检查更新：完整逻辑（请求版本源 → 比对 → 下载安装）后续接入，
// 当前占位实现，仅提示已是最新版本
const handleCheckUpdate = () => {
  ElMessage({
    message: t('toolbar.upToDate'),
    type: 'success',
  })
}

const handleMinimize = () => window.electronAPI?.minimizeWindow?.()
const handleClose = () => window.electronAPI?.closeWindow?.()

const handleToggleMaximize = async () => {
  await window.electronAPI?.toggleMaximizeWindow?.()
  isMaximized.value = (await window.electronAPI?.isWindowMaximized?.()) ?? false
}

// 原生菜单关闭后窗口重新获得焦点，此时取消菜单高亮
const clearActiveMenu = () => {
  activeMenu.value = ''
}

onMounted(async () => {
  isMaximized.value = (await window.electronAPI?.isWindowMaximized?.()) ?? false
  window.addEventListener('focus', clearActiveMenu)
  window.addEventListener('blur', clearActiveMenu)
})

onUnmounted(() => {
  window.removeEventListener('focus', clearActiveMenu)
  window.removeEventListener('blur', clearActiveMenu)
})
</script>

<style scoped lang="scss">

.top-toolbar {
  width: 100%;
  height: var(--app-toolbar-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 10px 0 14px;
  gap: 12px;
  background: var(--ui-chrome);
  border-bottom: 1px solid var(--ui-border);
  /* 无边框窗口：整条工具栏可拖动窗口，内部交互元素需单独排除 */
  -webkit-app-region: drag;
}

.top-toolbar.is-mac {
  padding-left: 82px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .brand-mark {
    width: 13px;
    height: 13px;
    display: block;
    object-fit: contain;
    flex-shrink: 0;
    user-select: none;
    -webkit-user-drag: none;
  }

  .brand-name {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--ui-text);
    white-space: nowrap;
  }
}

.brand-divider {
  width: 1px;
  height: 14px;
  background: var(--ui-border-strong);
  flex-shrink: 0;
}

/* 面板伸缩按钮：与菜单项同风格的无底色图标钮 */
.panel-toggle {
  width: 24px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--app-radius-xs);
  background: transparent;
  color: var(--ui-text-secondary);
  cursor: pointer;
  flex-shrink: 0;
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

.menu-bar {
  display: flex;
  align-items: center;
  gap: 2px;
  -webkit-app-region: no-drag;

  .menu-item {
    height: 22px;
    padding: 0 8px;
    border: none;
    background: transparent;
    border-radius: var(--app-radius-xs);
    font-size: 9.5px;
    font-family: inherit;
    line-height: 22px;
    color: var(--ui-text-secondary);
    cursor: pointer;
    white-space: nowrap;
    transition: background-color var(--app-transition), color var(--app-transition);
  }

  .menu-item:hover {
    background: var(--ui-control);
    color: var(--ui-text);
  }

  .menu-item.is-active {
    background: var(--ui-control);
    color: var(--ui-text);
  }
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
}

.export-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: var(--app-radius-sm);
  background: var(--ui-accent);
  color: var(--ui-accent-contrast);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px var(--ui-accent-glow);
  transition: background-color var(--app-transition), box-shadow var(--app-transition);

  svg {
    width: 11px;
    height: 11px;
  }

  &:hover {
    background: var(--ui-accent-hover);
  }

  &:active {
    background: var(--ui-accent-active);
    box-shadow: none;
  }
}

/* 检查更新：纯图标钮（无底色无描边），仅与窗口控制按钮对齐高度 */
.check-update-button {
  width: 24px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--app-radius-xs);
  background: transparent;
  color: var(--ui-text-secondary);
  cursor: pointer;
  padding: 0;
  transition: background-color var(--app-transition), color var(--app-transition);

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    background: var(--ui-control);
    color: var(--ui-text);
  }
}

.window-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 2px;

  .window-button {
    width: 26px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--app-radius-xs);
    background: var(--ui-control);
    color: var(--ui-text-secondary);
    cursor: pointer;
    transition: background-color var(--app-transition), color var(--app-transition);

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: var(--ui-control-hover);
      color: var(--ui-text);
    }
  }

  .window-button.is-close:hover {
    background: #e5484d;
    color: #ffffff;
  }
}

</style>
