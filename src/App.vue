<template>
  <RouterView/>
</template>

<script setup lang="ts">
import {RouterView} from 'vue-router'
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


:root {

  color-scheme: light;

  --border-color: #d4d4d4;
  --expand-area-background-color: #fafafa;
  --menu-background-color: #ececec;
  --menu-icon-color: #555555;
  --main-font-color: #333333;
  --preview-background-color: #e8e8e8;
  --dialog-main-background-color: #ffffff;

  --app-page-bg: #f5f5f5;
  --app-page-text: #2e2e2e;
  --app-accent: #1473e6;
  --app-accent-light: #5c9cef;
  --app-hover-accent: #0d66d0;
  --app-active-bg: #e3e3e3;
  --app-active-color: #1473e6;
  --app-hover-bg: #e8e8e8;
  --app-hover-color: #222222;
  --app-border: #e2e2e2;
  --app-border-strong: #d6d6d6;
  --app-menu-border: #d0d0d0;
  --app-toolbar-border: #d4d4d4;
  --app-placeholder-bg: #ffffff;
  --app-control-bg: #ffffff;
  --app-regular-text: #333333;
  --app-secondary-text: #6f6f6f;
  --app-text-mark-hover-bg: #e8f1fe;
  --app-thumb-bg: #ececec;
  --app-thumb-border: #e2e2e2;
  --app-thumb-active-bg: #b0b0b0;
  --app-thumb-active-line: #888888;
  --app-dialog-header: #f5f5f5;
  --app-dialog-icon: #555555;
  --app-dialog-title: #2e2e2e;
  --app-dialog-body-bg: #ffffff;
  --app-scrollbar-track: #f0f0f0;
  --app-scrollbar-thumb: #c9c9c9;
  --app-scrollbar-thumb-hover: #a9a9a9;
  --app-preview-scrollbar-track: #e3e3e3;
  --app-preview-scrollbar-thumb: #aaaaaa;
  --app-dialog-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  --app-overlay: rgba(35, 35, 35, 0.35);
  --app-popper-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  --el-color-primary: #1473e6;
  --el-color-primary-light-3: #5c9cef;
  --el-color-primary-light-5: #8bb9f4;
  --el-color-primary-light-7: #b9d6fa;
  --el-color-primary-light-8: #d1e4fc;
  --el-color-primary-light-9: #e8f1fe;
  --el-color-primary-dark-2: #0f5fc2;

  --el-bg-color: #ffffff;
  --el-bg-color-page: #f5f5f5;
  --el-bg-color-overlay: #ffffff;
  --el-fill-color-blank: #ffffff;
  --el-fill-color: #e9e9e9;
  --el-fill-color-light: #f2f2f2;
  --el-fill-color-lighter: #f7f7f7;
  --el-fill-color-extra-light: #fafafa;
  --el-fill-color-dark: #dcdcdc;
  --el-fill-color-darker: #c9c9c9;

  --el-text-color-primary: #2e2e2e;
  --el-text-color-regular: #4b4b4b;
  --el-text-color-secondary: #707070;
  --el-text-color-placeholder: #9a9a9a;

  --el-border-color: #d6d6d6;
  --el-border-color-light: #dedede;
  --el-border-color-lighter: #e7e7e7;
  --el-border-color-extra-light: #f0f0f0;
}

:root[dark-theme] {

  color-scheme: drak;

  --border-color: #3f3f3f;
  --page-main-height: 75%;
  --page-bottom-height: 25%;
  --page-left-width: 18%;
  --preview-container-width: 60%;
  --page-right-width: 22%;
  --expand-area-background-color: #3a3a3a;
  --menu-background-color: #242424;
  --menu-icon-color: #c8c8c8;
  --main-font-color: #d9d9d9;
  --preview-background-color: #323232;
  --dialog-main-background-color: #2f2f2f;

  --app-page-bg: #323232;
  --app-page-text: #f5f5f5;
  --app-accent: #2f7df6;
  --app-accent-light: #8ec0f7;
  --app-hover-accent: #e6e6e6;
  --app-active-bg: #4a4a4a;
  --app-active-color: #f2f2f2;
  --app-hover-bg: #414141;
  --app-hover-color: #f2f2f2;
  --app-border: #3f3f3f;
  --app-border-strong: #4a4a4a;
  --app-menu-border: #3a3a3a;
  --app-toolbar-border: #5f5f5f;
  --app-placeholder-bg: #d9d9d9;
  --app-control-bg: #383838;
  --app-regular-text: #d5d5d5;
  --app-secondary-text: #a0a0a0;
  --app-text-mark-hover-bg: #d9d9d9;
  --app-thumb-bg: #3a3a3a;
  --app-thumb-border: #4a4a4a;
  --app-thumb-active-bg: #6a6a6a;
  --app-thumb-active-line: #8a8a8a;
  --app-dialog-header: #323232;
  --app-dialog-icon: #c8c8c8;
  --app-dialog-title: #f5f5f5;
  --app-dialog-body-bg: #2f2f2f;
  --app-scrollbar-track: #323232;
  --app-scrollbar-thumb: #5a5a5a;
  --app-scrollbar-thumb-hover: #6f6f6f;
  --app-preview-scrollbar-track: #3a3a3a;
  --app-preview-scrollbar-thumb: #555555;
  --app-dialog-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  --app-overlay: rgba(0, 0, 0, 0.65);
  --app-popper-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);

  --el-color-primary: #2f7df6;
  --el-color-primary-light-3: #3677d6;
  --el-color-primary-light-5: #2e62ae;
  --el-color-primary-light-7: #333333;
  --el-color-primary-light-8: #303030;
  --el-color-primary-light-9: #2d2d2d;
  --el-color-primary-dark-2: #4d91f8;

  --el-bg-color: #2f2f2f;
  --el-bg-color-page: #323232;
  --el-bg-color-overlay: #3a3a3a;
  --el-fill-color-blank: #383838;
  --el-fill-color: #414141;
  --el-fill-color-light: #3b3b3b;
  --el-fill-color-lighter: #363636;
  --el-fill-color-extra-light: #333333;
  --el-fill-color-dark: #474747;
  --el-fill-color-darker: #525252;

  --el-text-color-primary: #f5f5f5;
  --el-text-color-regular: #d5d5d5;
  --el-text-color-secondary: #a8a8a8;
  --el-text-color-placeholder: #7c7c7c;

  --el-border-color: #4a4a4a;
  --el-border-color-light: #414141;
  --el-border-color-lighter: #383838;
  --el-border-color-extra-light: #333333;
}

html,
body,
#app {
  background-color: var(--app-page-bg);
  color: var(--app-page-text);
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

#preview-container::-webkit-scrollbar-track {
  background-color: var(--app-preview-scrollbar-track);
}

#preview-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

#preview-container::-webkit-scrollbar-thumb {
  background-color: var(--app-preview-scrollbar-thumb);
  border: 1px solid var(--app-preview-scrollbar-track);
  border-radius: 2px;
}

#app ::-webkit-scrollbar-corner,
#preview-container::-webkit-scrollbar-corner {
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
  border-bottom: 1px solid var(--app-border);
}

body .el-dialog__title {
  color: var(--app-dialog-title);
}

body .el-overlay {
  background-color: var(--app-overlay);
}

body .el-popper.is-light,
body .el-popover.el-popper {
  background-color: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-regular);
  box-shadow: var(--app-popper-shadow);
}

body .el-input__wrapper,
body .el-select__wrapper {
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

body .el-input__wrapper:hover,
body .el-select__wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
}

body .el-input__wrapper.is-focus,
body .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
</style>
