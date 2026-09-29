<template>
  <el-config-provider :locale="elementLocale">
    <RouterView/>
  </el-config-provider>
</template>

<script setup lang="ts">

import {RouterView} from 'vue-router'

import {useLanguage} from '@/locales'
import {useTheme} from '@/composables/shared/useTheme'
import {useProjectSettingsStore} from '@/stores/project-settings'

// 语言组合式函数：语言应用 / 主进程同步 / 跟随系统与广播跟随（含 Element Plus 组件库 locale）；
const {elementLocale} = useLanguage()

// 主题组合式函数：启动时应用持久化的主题模式与界面配色（renderTheme 内部同步调用 renderUiStyle），
// 补齐启动应用路径——此前仅 ImageManager 广播回调与设置弹窗交互会触发渲染，
// 主窗口重启后 data-ui-theme/data-ui-cards 属性从未设置，界面配色回落默认琥珀
const settingsStore = useProjectSettingsStore()
const {renderTheme} = useTheme()
renderTheme(settingsStore.projectSettings.appearance?.theme || 'system')

</script>

<style>

* {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
}

[draggable="true"] {
  -webkit-user-drag: element;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@supports (scrollbar-width: thin) and (not selector(::-webkit-scrollbar)) {
  * {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
  }
}

::-webkit-scrollbar {
  width: var(--app-scrollbar-size);
  height: var(--app-scrollbar-size);
}

::-webkit-scrollbar-track {
  background-color: var(--app-scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background-color: var(--app-scrollbar-thumb);
  /* 内边 1px：留出可见的滑块主体（滚动条总宽 6px 时仍有 4px 可见） */
  border: 1px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--app-scrollbar-thumb-hover);
  background-clip: padding-box;
}

#canvas-workspace::-webkit-scrollbar-track {
  background-color: var(--app-preview-scrollbar-track);
}

#canvas-workspace::-webkit-scrollbar {
  width: var(--app-scrollbar-size);
  height: var(--app-scrollbar-size);
}

#canvas-workspace::-webkit-scrollbar-thumb {
  background-color: var(--app-preview-scrollbar-thumb);
  border: 1px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
}

#app ::-webkit-scrollbar-corner,
#canvas-workspace::-webkit-scrollbar-corner {
  background-color: var(--app-preview-scrollbar-track);
}

/* ---------- Element Plus 全局覆写：对齐设计稿的中性灰 + 琥珀语言 ---------- */

body .el-dialog {
  background-color: var(--app-dialog-body-bg);
  border: 1px solid var(--app-dialog-border);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-dialog-shadow);
  overflow: hidden;
}

/* 弹窗标题栏 / 标题 / 关闭按钮 / 正文内边距 / 输入控件 / 底部按钮的完整规格
   集中放在 src/assets/styles/dialog.scss（10 个弹窗组件都 @use 它），此处不重复定义，
   避免两处规格不一致。这里只保留弹窗外壳与遮罩。 */

body .el-overlay {
  background-color: var(--app-overlay);
}

body .el-popper.is-light, body .el-popover.el-popper {
  background-color: var(--ui-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--app-radius-md);
  color: var(--ui-text-secondary);
  box-shadow: var(--app-popper-shadow);
}

body .el-popper.is-dark {
  background: var(--app-tooltip-bg);
  color: var(--app-tooltip-text);
  border: 1px solid var(--app-tooltip-border);
  border-radius: var(--app-radius-xs);
  box-shadow: var(--app-tooltip-shadow);
}

body .el-popper.is-dark > .el-popper__arrow::before {
  background: var(--app-tooltip-bg);
  border: 1px solid var(--app-tooltip-border);
  right: 0;
}

/* 输入类控件：浅灰填充 + 常驻描边，聚焦换成琥珀描边 */
body .el-input__wrapper, body .el-select__wrapper {
  background-color: var(--ui-inset);
  box-shadow: 0 0 0 1px var(--ui-border) inset;
  border-radius: var(--app-radius-xs);
  transition: background-color var(--app-transition), box-shadow var(--app-transition);
}

body .el-input__wrapper:hover, body .el-select__wrapper:hover {
  background-color: var(--ui-control);
  box-shadow: 0 0 0 1px var(--ui-border-strong) inset;
}

body .el-input__wrapper.is-focus, body .el-select__wrapper.is-focused {
  background-color: var(--ui-elevated);
  box-shadow: 0 0 0 1px var(--ui-accent) inset;
}

body .el-textarea__inner {
  background-color: var(--ui-inset);
  box-shadow: 0 0 0 1px var(--ui-border) inset;
  border-radius: var(--app-radius-xs);
  color: var(--ui-text);
}

body .el-textarea__inner:hover {
  box-shadow: 0 0 0 1px var(--ui-border-strong) inset;
}

body .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--ui-accent) inset;
}

body .el-dropdown-menu {
  background-color: var(--ui-elevated);
  border: 1px solid var(--ui-border);
  border-radius: var(--app-radius-md);
  padding: 4px;
}

body .el-dropdown-menu__item {
  border-radius: var(--app-radius-xs);
  font-size: 12.5px;
  color: var(--ui-text-secondary);
}

body .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: var(--ui-control);
  color: var(--ui-text);
}

body .el-dropdown-menu__item.active {
  color: var(--ui-accent-soft-text);
  background-color: var(--ui-accent-soft);
}

body .el-slider {
  --el-slider-main-bg-color: var(--ui-accent);
  --el-slider-runway-bg-color: var(--ui-track);
}

body .el-scrollbar__bar.is-horizontal {
  height: var(--app-scrollbar-size);
}

body .el-scrollbar__bar.is-vertical {
  width: var(--app-scrollbar-size);
}

/* el-scrollbar 滑块与原生 ::-webkit-scrollbar 滑块同形：1px 透明内边，
   可见主体同为 4px，左右面板与底部面板的滚动条粗细观感一致 */
body .el-scrollbar__thumb {
  border: 1px solid transparent;
  background-clip: padding-box;
  border-radius: 4px;
}

body .el-collapse-transition-enter-active,
body .el-collapse-transition-leave-active {
  /* 右侧属性面板分组的展开 / 收起更干脆 */
  transition-duration: 0.15s;
}

body .el-switch.is-checked .el-switch__core {
  background-color: var(--ui-accent);
  border-color: var(--ui-accent);
}

</style>
