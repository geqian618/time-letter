<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="templatesStore.enableTemplateDialogVisible" title="应用模版" width="400" align-center draggable>
      <el-radio-group v-model="templatesStore.synchronousMode">
        <el-radio :value="0" size="large">按固定值定位位置</el-radio>
        <el-radio :value="1" size="large">按比例定位位置</el-radio>
      </el-radio-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templatesStore.enableTemplateDialogVisible = false">取消</el-button>
          <el-button type="info" @click="enableTemplate">
            应用
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import _ from 'lodash'

import {canvasActions} from '@/object/canvas-actions'

import {useTemplatesStore} from '@/stores/templates'
import {useCanvasesStore} from '@/stores/canvases'

const templatesStore = useTemplatesStore()

const canvasesStore = useCanvasesStore()

// 将模版设置应用到所有已选中的画布
const enableTemplate = () => {
  for (let path of canvasesStore.selectedPreviewList.keys()) {
    canvasActions.useTemplate(_.cloneDeep(templatesStore.templateSettings), path)
  }
  templatesStore.enableTemplateDialogVisible = false
  templatesStore.synchronousMode = 0
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
