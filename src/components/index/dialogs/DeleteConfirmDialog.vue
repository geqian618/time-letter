<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="canvasesStore.deleteTipsDialogVisible" :title="$t('deleteConfirm.title')" width="350" align-center
               :close-on-click-modal="false">
      <div style="margin: 5px 0">{{ $t('deleteConfirm.message') }}</div>
      <template #footer>
        <div class="delete-tips-dialog-footer">
          <div class="left-dialog-footer">
            <el-checkbox v-model="settingsStore.isHideDeleteTips" @change="settingsStore.deleteTipsDialogVisible" :label="$t('deleteConfirm.noMore')"/>
          </div>
          <div class="right-dialog-footer">
            <el-button @click="cancelRemoveSelectedCanvas">{{ $t('common.cancel') }}</el-button>
            <el-button type="danger" @click="permanentlyRemoveSelectedCanvas">{{ $t('common.confirm') }}</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {canvasActions} from '@/object/canvas-actions'

import {useCanvasesStore} from '@/stores/canvases'
import {useProjectSettingsStore} from '@/stores/project-settings'

const canvasesStore = useCanvasesStore()

const settingsStore = useProjectSettingsStore()

// 取消删除：恢复删除提示开关并关闭弹窗
const cancelRemoveSelectedCanvas = () => {
  if (!settingsStore.projectSettings.others.deleteTipVisible) {
    settingsStore.projectSettings.others.deleteTipVisible = true;
  }
  canvasesStore.deleteTipsDialogVisible = false;
}

// 确认删除：移除选中画布并删除对应磁盘文件
const permanentlyRemoveSelectedCanvas = () => {
  canvasActions.permanentlyRemoveSelectedCanvas()
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.delete-tips-dialog-footer {
  display: flex;
  justify-content: space-between;
  margin: 0 10px;

  .left-dialog-footer {
    display: flex;
    align-items: center;
  }

  .right-dialog-footer {
    display: flex;
    align-items: center;
  }
}
</style>
