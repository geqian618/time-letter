<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="templatesStore.renameTemplateDialogVisible" :title="$t('template.renameTitle')" align-center width="350" draggable>
      <el-form :model="templatesStore.oldTemplate" class="demo-form-inline" :rules="renameTemplateRules" ref="renameTemplateForm"
               @submit.native.prevent>
        <el-form-item :label="$t('template.presetName')" prop="rename">
          <el-input v-focus="templatesStore.renameTemplateDialogVisible" v-model="templatesStore.oldTemplate.templateName" clearable
                    @keyup.enter.native="renameTemplate"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templatesStore.renameTemplateDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="renameTemplate">{{ $t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {computed, ref, watch, nextTick} from 'vue'

import {useI18n} from 'vue-i18n'

import {useTemplatesStore} from '@/stores/templates'

const {t} = useI18n()

const templatesStore = useTemplatesStore()

const renameTemplateForm = ref(null)

// 校验文案经 computed 翻译，语言切换后保持生效
const renameTemplateRules = computed(() => ({
  templateName: [
    {required: true, message: t('template.nameRequired'), trigger: 'blur'},
  ]
}))

// 弹窗打开时清除上一次的表单校验
watch(() => templatesStore.renameTemplateDialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      renameTemplateForm.value?.clearValidate();
    })
  }
})

// 按模板 id 更新名称
const renameTemplate = () => {
  if (!renameTemplateForm?.value) return
  renameTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      const templates = templatesStore.templates
      if (templates && templates.length) {
        for (let i = 0; i < templates.length; i++) {
          if (templates[i].templateId === templatesStore.oldTemplate.templateId) {
            templates[i].templateName = templatesStore.oldTemplate.templateName
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

/* 重命名弹窗：标题栏与内容之间留出间距（仅本弹窗，共用样式约定不动尺寸）
   用 .dialog-wrapper 前缀抬高优先级，确保压过 dialog.scss 的 body padding */
.dialog-wrapper :deep(.el-dialog > .el-dialog__body) {
  padding-top: 20px;
}
</style>
