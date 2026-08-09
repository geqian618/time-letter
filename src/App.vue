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

  --page-main-height: 75%;
  --page-bottom-height: 25%;
  --page-left-width: 18%;
  --preview-container-width: 60%;
  --page-right-width: 22%;
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
  --app-thumb-active-bg: #b7b7b7;
  --app-thumb-active-line: #888888;
  --app-dialog-header: #f5f5f5;
  --app-dialog-icon: #555555;
  --app-dialog-title: #2e2e2e;
  --app-dialog-body-bg: #ffffff;
  --app-tabs-active-bg: #ffffff;
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

  color-scheme: dark;

  --border-color: #3d3d3d;
  --expand-area-background-color: #2e2e2e;
  --menu-background-color: #272727;
  --menu-icon-color: #c9c9c9;
  --main-font-color: #d6d6d6;
  --preview-background-color: #242424;
  --dialog-main-background-color: #2e2e2e;

  --app-page-bg: #262626;
  --app-page-text: #ececec;
  --app-accent: #4d9fff;
  --app-accent-light: #7fb8ff;
  --app-hover-accent: #f0f0f0;
  --app-active-bg: #505050;
  --app-active-color: #ffffff;
  --app-hover-bg: #484848;
  --app-hover-color: #f2f2f2;
  --app-border: #414141;
  --app-border-strong: #4d4d4d;
  --app-menu-border: #3d3d3d;
  --app-toolbar-border: #4a4a4a;
  --app-placeholder-bg: #d6d6d6;
  --app-control-bg: #3f3f3f;
  --app-regular-text: #d6d6d6;
  --app-secondary-text: #a3a3a3;
  --app-text-mark-hover-bg: #d6d6d6;
  --app-thumb-bg: #3d3d3d;
  --app-thumb-border: #4d4d4d;
  --app-thumb-active-bg: #5a5a5a;
  --app-thumb-active-line: #9a9a9a;
  --app-dialog-header: #2e2e2e;
  --app-dialog-icon: #c9c9c9;
  --app-dialog-title: #ececec;
  --app-dialog-body-bg: #2e2e2e;
  --app-tabs-active-bg: #3f3f3f;
  --app-scrollbar-track: #2a2a2a;
  --app-scrollbar-thumb: #484848;
  --app-scrollbar-thumb-hover: #5a5a5a;
  --app-preview-scrollbar-track: #242424;
  --app-preview-scrollbar-thumb: #3f3f3f;
  --app-dialog-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
  --app-overlay: rgba(0, 0, 0, 0.6);
  --app-popper-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);

  --el-color-primary: #4d9fff;
  --el-color-primary-light-3: #3f84e0;
  --el-color-primary-light-5: #356fb8;
  --el-color-primary-light-7: #2b5a94;
  --el-color-primary-light-8: #265083;
  --el-color-primary-light-9: #224671;
  --el-color-primary-dark-2: #79bbff;

  --el-bg-color: #2e2e2e;
  --el-bg-color-page: #262626;
  --el-bg-color-overlay: #2e2e2e;
  --el-fill-color-blank: #3f3f3f;
  --el-fill-color: #464646;
  --el-fill-color-light: #4a4a4a;
  --el-fill-color-lighter: #434343;
  --el-fill-color-extra-light: #3b3b3b;
  --el-fill-color-dark: #505050;
  --el-fill-color-darker: #5a5a5a;

  --el-text-color-primary: #ececec;
  --el-text-color-regular: #d6d6d6;
  --el-text-color-secondary: #a3a3a3;
  --el-text-color-placeholder: #7a7a7a;

  --el-border-color: #414141;
  --el-border-color-light: #4a4a4a;
  --el-border-color-lighter: #434343;
  --el-border-color-extra-light: #3b3b3b;
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

/* 暗色模式下 el-dialog 作用域内变量覆盖：容器以 #3A3A3A 为基准，内部控件略浅、边框减淡，
   变量仅覆盖在 .el-dialog 作用域内，不影响全局其他区域 */
:root[dark-theme] body .el-dialog {
  --app-border-strong: #484848;
  --app-border: #3f3f3f;
  --el-bg-color: #2e2e2e;
  --el-bg-color-overlay: #2e2e2e;
  --el-fill-color-blank: #343434;
  --el-fill-color: #383838;
  --el-fill-color-light: #3e3e3e;
  --el-fill-color-lighter: #434343;
  --el-fill-color-extra-light: #484848;
  --el-fill-color-dark: #2b2b2b;
  --el-fill-color-darker: #272727;
  --el-text-color-primary: #f0f0f0;
  --el-text-color-regular: #d9d9d9;
  --el-text-color-secondary: #ababab;
  --el-text-color-placeholder: #808080;
  --el-border-color: #494949;
  --el-border-color-light: #454545;
  --el-border-color-lighter: #3e3e3e;
  --el-border-color-extra-light: #373737;
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
