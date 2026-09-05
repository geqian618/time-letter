<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="visible" :title="title" width="400" align-center
               :close-on-click-modal="false" @close="handleClose">
      <div class="confirm-message">{{ message }}</div>
      <template #footer>
        <div class="confirm-footer">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button :type="confirmType" @click="handleConfirm">{{ confirmText }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref} from 'vue'

import i18n from '@/locales'

const t = i18n.global.t

const visible = ref(false)
const title = ref(t('common.tip'))
const message = ref('')
const confirmText = ref(t('common.confirm'))
const cancelText = ref(t('common.cancel'))
const confirmType = ref('primary')

let resolver = null

// 弹出确认框，返回 Promise：true=确认，false=取消 / 关闭
const confirm = (options = {}) => {
  title.value = options.title || t('common.tip')
  message.value = options.message || ''
  confirmText.value = options.confirmText || t('common.confirm')
  cancelText.value = options.cancelText || t('common.cancel')
  confirmType.value = options.confirmType || 'primary'
  visible.value = true
  return new Promise((resolve) => {
    resolver = resolve
  })
}

const finish = (result) => {
  visible.value = false
  resolver?.(result)
  resolver = null
}

const handleConfirm = () => finish(true)
const handleCancel = () => finish(false)

// 点 X / Esc 等关闭按取消处理（仅在 resolver 仍存在时，避免与按钮重复 resolve）
const handleClose = () => {
  if (resolver) finish(false)
}

defineExpose({confirm})

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.confirm-message {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-regular-text);
}

.confirm-footer {
  display: flex;
  justify-content: end;
  gap: 10px;
}
</style>
