<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="textResourcesStore.textResourceManagerDialogVisible" :title="$t('textResource.editTitle')" width="60%" draggable>
      <el-table size="small" max-height="400" :data="textResourcesStore.textResources" border>
        <el-table-column prop="type" :label="$t('textResource.columnType')" show-overflow-tooltip/>
        <el-table-column prop="tips" :label="$t('textResource.columnTips')" show-overflow-tooltip/>
        <el-table-column :label="$t('textResource.columnContent')" min-width="150" show-overflow-tooltip>
          <template #default="{row}">
            {{ row.type === 'text' ? row.content : row.script }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('textResource.columnAction')" min-width="100">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openTextResourceEditorDialog(scope.row)">{{ $t('textResource.edit') }}
            </el-button>
            <el-button link type="primary" size="small" @click="deleteTextResource(scope.row)">{{ $t('textResource.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import _ from 'lodash'

import {useTextResourcesStore} from '@/stores/text-resources'

const textResourcesStore = useTextResourcesStore()

// 编辑：克隆当前行到编辑表单并切换弹窗为编辑模式
const openTextResourceEditorDialog = (row) => {
  textResourcesStore.textResource = _.cloneDeep(row)
  textResourcesStore.handleTextResourceType = 1
  textResourcesStore.textResourceDialogVisible = true
}

// 删除文本资源
const deleteTextResource = (row) => {
  const textResources = textResourcesStore.textResources
  for (let i = 0; i < textResources.length; i++) {
    if (textResources[i].id === row.id) {
      textResources.splice(i, 1)
      return
    }
  }
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
