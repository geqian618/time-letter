<template>
  <div class="page-layout">
    <div class="page-top"></div>
    <div class="page-main">
      <div class="page-left">
        <div class="metadata">
          元信息
        </div>
        <div class="details">{{metadata}}</div>
      </div>
      <div class="page-center">
        <img :src="previewUrl">
      </div>
      <div class="page-right">
        <div class="settings">
          配置项
        </div>
      </div>
    </div>

    <div class="page-images" ref="imageContainer" @wheel="handleWheel">
      <img v-lazy="file.url" loading="eager" v-for="file in files" :key="file.path" @click="preview($event, file)">
    </div>

  </div>
</template>

<script setup lang="ts">

import {onMounted, ref} from "vue";

const files = ref([])

const previewUrl = ref('');

const imageContainer = ref(null);

const selectedElement = ref(null);

const metadata = ref({});

onMounted(async () => {
  window.electronAPI.inputImages((event, data) => {
    files.value = data
  });
})

async function preview(event: object, file: object): void {
  previewUrl.value = file.url
  selectedElement.value && selectedElement.value.classList.remove('active')
  selectedElement.value = event.target;
  selectedElement.value && selectedElement.value.classList.add('active')
  metadata.value = await window.electronAPI.parsePhotoMetadata(file.path);
}

const handleWheel = (e: Event) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 1.5; // 调整滚动速度
  // 4. 应用滚动
  if (imageContainer.value) {
    imageContainer.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
};

</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;

  .page-top {
    height: 1%;
    background: #484949;
  }
}


.page-images {
  box-sizing: border-box;
  width: 100%;
  height: 19%;
  display: flex;
  justify-content: start;
  background: #5c5d5e;
  padding: 5px;
  overflow-x: auto;
  border-top: 2px solid #484949;
  scroll-behavior: smooth; /* 可选，使滚动更平滑 */
  white-space: nowrap; /* 防止内容换行 */

  img {
    box-sizing: border-box;
    background: grey;
    padding: 15px;
    height: 100%;
    border-right: 2px solid #a2a4a6;
  }

  .active {
    background: #dedcdc;
  }

  image:last-child {
    margin-right: 0;
  }

}

.page-main {
  width: 100%;
  height: 80%;
  display: flex;
  box-sizing: border-box;
}

.page-main .page-left {
  width: 20%;
  height: 100%;
  background: #817e7e;

  .metadata {
    height: 40px;

    border-bottom: 2px solid #484949;
    padding-left: 10px;
    font-size: 20px;
    display: flex;
    justify-content: start;
    align-items: center;
  }

  .details {
    height: calc(100% - 40px);
    width: 100%;
  }

}

.page-main .page-center {
  width: 60%;
  height: 100%;
  background: #a2a4a6;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 2px solid #484949;
  border-right: 2px solid #484949;

  img {
    max-width: 95%;
    max-height: 95%;
    width: auto; /* 保持原始宽高比 */
    height: auto; /* 保持原始宽高比 */
    transition: background-color 0.3s; /* 可选，添加过渡效果 */
  }

}

.page-main .page-right {
  width: 20%;
  height: 100%;
  background: #817e7e;

  .settings {
    height: 40px;
    border-bottom: 2px solid #484949;
    padding-left: 10px;
    font-size: 20px;
    display: flex;
    justify-content: start;
    align-items: center;
  }

}

</style>
