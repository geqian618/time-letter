<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="templatesStore.saveExistsDialogVisible" :title="$t('template.existsTitle')" width="350" align-center
               :close-on-click-modal="false">
      <div style="margin: 5px 0">{{ $t('template.existsMessage', {name: templatesStore.pendingTemplate?.templateName}) }}</div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templatesStore.saveExistsDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button @click="templatesStore.commitTemplateSave()">{{ $t('template.addNewSave') }}</el-button>
          <el-button type="primary" @click="templatesStore.commitTemplateSave(true)">{{ $t('template.overwriteSave') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {useTemplatesStore} from '@/stores/templates'

const templatesStore = useTemplatesStore()

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
