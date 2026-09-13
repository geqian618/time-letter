<template>
  <el-config-provider :locale="elementLocale">
    <RouterView/>
  </el-config-provider>
</template>

<script setup lang="ts">
import {RouterView} from 'vue-router'

import {useLanguage} from '@/locales'

// 语言组合式函数：语言应用 / 主进程同步 / 跟随系统与广播跟随（含 Element Plus 组件库 locale）；
const {elementLocale} = useLanguage()

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
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background-color: var(--app-scrollbar-track);
}

::-webkit-scrollbar-thumb {
  background-color: var(--app-scrollbar-thumb);
  border: 2px solid var(--app-scrollbar-track);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--app-scrollbar-thumb-hover);
}

#canvas-workspace::-webkit-scrollbar-track {
  background-color: var(--app-preview-scrollbar-track);
}

#canvas-workspace::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

#canvas-workspace::-webkit-scrollbar-thumb {
  background-color: var(--app-preview-scrollbar-thumb);
  border: 1px solid var(--app-preview-scrollbar-track);
  border-radius: 2px;
}

#app ::-webkit-scrollbar-corner,
#canvas-workspace::-webkit-scrollbar-corner {
  background-color: var(--app-preview-scrollbar-track);
}

body .el-dialog {
  background-color: var(--app-dialog-body-bg);
  border: 1px solid var(--app-border-strong);
  border-radius: 6px;
  box-shadow: var(--app-dialog-shadow);
}

body .el-dialog__header {
  background-color: var(--app-dialog-header);
}

body .el-dialog__title {
  color: var(--app-dialog-title);
}

body .el-overlay {
  background-color: var(--app-overlay);
}

body .el-popper.is-light, body .el-popover.el-popper {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-regular);
  box-shadow: var(--app-popper-shadow);
}

body .el-popper.is-dark {
  background: var(--app-tooltip-bg);
  color: var(--app-tooltip-text);
  border: 1px solid var(--app-tooltip-border);
  box-shadow: var(--app-tooltip-shadow);
}

body .el-popper.is-dark > .el-popper__arrow::before {
  background: var(--app-tooltip-bg);
  border: 1px solid var(--app-tooltip-border);
  right: 0;
}

body .el-input__wrapper, body .el-select__wrapper {
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

body .el-input__wrapper:hover, body .el-select__wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
}

body .el-input__wrapper.is-focus, body .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

body .el-dropdown-menu__item.active {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

</style>
