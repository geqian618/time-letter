<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="templatesStore.renameTemplateDialogVisible" title="重命名" align-center width="350" draggable>
      <el-form :model="templatesStore.oldTemplate" class="demo-form-inline" :rules="renameTemplateRules" ref="renameTemplateForm"
               @submit.native.prevent>
        <el-form-item label="预设名称" prop="rename">
          <el-input v-focus="templatesStore.renameTemplateDialogVisible" v-model="templatesStore.oldTemplate.templateName" clearable
                    @keyup.enter.native="renameTemplate"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templatesStore.renameTemplateDialogVisible = false">取消</el-button>
          <el-button type="info" @click="renameTemplate">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref, watch, nextTick} from 'vue'

import StorageManager from '@/object/StorageManager'

import {useTemplatesStore} from '@/stores/templates'

const templatesStore = useTemplatesStore()

const renameTemplateForm = ref(null)

const renameTemplateRules = {
  templateName: [
    {required: true, message: '模板名称不能为空', trigger: 'blur'},
  ]
}

// 弹窗打开时清除上一次的表单校验
watch(() => templatesStore.renameTemplateDialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      renameTemplateForm.value?.clearValidate();
    })
  }
})

// 按模板 id 更新名称并持久化
const renameTemplate = () => {
  if (!renameTemplateForm?.value) return
  renameTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      const templates = templatesStore.templates
      if (templates && templates.length) {
        for (let i = 0; i < templates.length; i++) {
          if (templates[i].templateId === templatesStore.oldTemplate.templateId) {
            templates[i].templateName = templatesStore.oldTemplate.templateName
            StorageManager.saveTemplates(templates)
            templatesStore.renameTemplateDialogVisible = false
            return
          }
        }
      }
    }
  })
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
