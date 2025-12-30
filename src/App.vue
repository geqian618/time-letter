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
}

:root {
  --border-color: #6c6c6c;
  --page-main-height: 75%;
  --page-bootom-height: 25%;
  --page-left-width: 18%;
  --preview-container-width: 60%;
  --page-right-width: 22%;
  --expand-area-background-color: #474747;
  --menu-background-color: #343434;
  --menu-icon-color: #c2c1c1;
  --main-font-color: #A9A9A9;
  --preview-background-color: #737373;
  --dialog-main-background-color: #FFFFFF;
}


/* 拖拽预览添加特定样式 */
[draggable="true"] {
  -webkit-user-drag: element;
  /* 防止拖拽时出现边框 */
  outline: none !important;
  border: none !important;
  /* 改善渲染性能 */
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
  /* 强制 GPU 加速 */
  transform: translateZ(0);
}


/* 只在支持标准属性但不支持WebKit伪元素的浏览器中应用 */
@supports (scrollbar-width: thin) and (not selector(::-webkit-scrollbar)) {
  * {
    scrollbar-width: thin;
    scrollbar-color: #888 #f1f1f1;
  }
}

/* 设置滚动条宽度与高度 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

/* 设置轨道背景颜色、圆角等 */
::-webkit-scrollbar-track {
  background-color: #b4b3b3;
}

/* 设置滑块样式 */
::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: #efefef;
}

/* 设置滚动条角落（右下角）的样式 */
::-webkit-scrollbar-corner {
  background-color: #b4b3b3;
}

/* 鼠标经过滑块 */
::-webkit-scrollbar-thumb:hover {

}

</style>
