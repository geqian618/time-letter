<template>
  <el-dialog v-model="textResourcesStore.textResourceManagerDialogVisible" title="编辑文本" width="60%" draggable>
    <el-table size="small" max-height="400" :data="textResourcesStore.textResources" border>
      <el-table-column prop="type" label="标签类型" show-overflow-tooltip/>
      <el-table-column prop="tips" label="提示信息" show-overflow-tooltip/>
      <el-table-column label="文本内容" min-width="150" show-overflow-tooltip>
        <template #default="{row}">
          {{ row.type === 'text' ? row.content : row.script }}
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" min-width="100">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="openTextResourceEditorDialog(scope.row)">编辑
          </el-button>
          <el-button link type="primary" size="small" @click="deleteTextResource(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="js">

import _ from 'lodash'

import StorageManager from '@/object/StorageManager'

import {useTextResourcesStore} from '@/stores/text-resources'

const textResourcesStore = useTextResourcesStore()

// 编辑：克隆当前行到编辑表单并切换弹窗为编辑模式
const openTextResourceEditorDialog = (row) => {
  textResourcesStore.textResource = _.cloneDeep(row)
  textResourcesStore.handleTextResourceType = 1
  textResourcesStore.textResourceDialogVisible = true
}

// 删除文本资源并持久化
const deleteTextResource = (row) => {
  const textResources = textResourcesStore.textResources
  for (let i = 0; i < textResources.length; i++) {
    if (textResources[i].id === row.id) {
      textResources.splice(i, 1)
      StorageManager.saveTextResources(textResources)
      return
    }
  }
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
