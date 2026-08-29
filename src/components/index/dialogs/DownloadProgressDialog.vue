<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="canvasesStore.downloadProgressVisible"
               title="导出进度"
               align-center
               @close="handleDownloadProgressClose"
               @closed="handleDownloadProgressClosed"
               :close-on-click-modal="false"
               width="500">
      <el-progress class="download-progress" :percentage="canvasesStore.downloadProgressPercentage"/>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="info" @click="canvasesStore.downloadProgressVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {useCanvasesStore} from '@/stores/canvases'

const canvasesStore = useCanvasesStore()

// 导出未完成时关闭弹窗需要中止导出任务
const handleDownloadProgressClose = () => {
  if (canvasesStore.downloadProgressPercentage !== 100) {
    window.electronAPI.stopExportFiles()
  }
}

// 弹窗完全关闭后重置进度
const handleDownloadProgressClosed = () => {
  canvasesStore.downloadProgressPercentage = 0
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.download-progress {
  padding: 10px;

  :deep(.el-progress__text) {
    min-width: 40px;
  }
}
</style>
