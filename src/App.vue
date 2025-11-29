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
  scrollbar-width: thin; /* 设置滚动条宽度 */
  scrollbar-color: #888 #f1f1f1; /* 设置滑块和轨道的颜色 */
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

</style>
