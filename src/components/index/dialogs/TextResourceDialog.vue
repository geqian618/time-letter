<template>
  <div class="dialog-wrapper">
    <el-dialog align-center v-model="textResourcesStore.textResourceDialogVisible" :title="textResourcesStore.textResourceDialogTitle" width="500" draggable>
      <el-form :model="textResourcesStore.textResource" class="text-label-form" ref="textResourceForm" :rules="textResourceRules"
               label-width="auto"
               @submit.native.prevent>
        <el-form-item :label="$t('textResource.textType')" prop="type">
          <el-select v-model="textResourcesStore.textResource.type" :placeholder="$t('textResource.textType')" popper-class="dialog-popper">
            <el-option
                v-for="(item,index) in [{label:$t('textResource.typePlain'), value:'text'}, {label:$t('textResource.typeScript'), value:'script'}]"
                :key="index"
                :label="item.label"
                :value="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('textResource.tips')" prop="tips">
          <el-input v-model="textResourcesStore.textResource.tips" v-focus="textResourcesStore.textResourceDialogVisible"/>
        </el-form-item>
        <el-form-item :label="$t('textResource.text')" prop="content" v-if="textResourcesStore.textResource.type === 'text'">
          <el-input v-model="textResourcesStore.textResource.content" :rows="4" type="textarea"/>
        </el-form-item>
        <el-form-item :label="$t('textResource.script')" prop="script" v-if="textResourcesStore.textResource.type === 'script'">
          <el-input v-model="textResourcesStore.textResource.script" :rows="4" type="textarea"/>
        </el-form-item>
        <el-form-item :label="$t('textResource.editable')">
          <el-switch v-model="textResourcesStore.textResource.editable"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="textResourcesStore.textResourceDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveTextResource">{{ $t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {computed, ref, watch, nextTick} from 'vue'

import {useI18n} from 'vue-i18n'

import _ from 'lodash'

import {TextResource} from '@/object/Configuration'

import {useTextResourcesStore} from '@/stores/text-resources'

const {t} = useI18n()

const textResourcesStore = useTextResourcesStore()

const textResourceForm = ref({})

// 校验文案经 computed 翻译，语言切换后保持生效
const textResourceRules = computed(() => ({
  type: [
    {required: true, message: t('textResource.rules.type'), trigger: 'blur'},
  ],
  tips: [
    {required: true, message: t('textResource.rules.tips'), trigger: 'blur'},
  ],
  content: [
    {required: true, message: t('textResource.rules.content'), trigger: 'blur'},
  ],
  script: [
    {required: true, message: t('textResource.rules.script'), trigger: 'blur'},
  ]
}))

// 弹窗打开时清除上一次的表单校验
watch(() => textResourcesStore.textResourceDialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      textResourceForm.value?.clearValidate();
    })
  }
})

// 提交文本资源：脚本类型清空文本内容，文本类型清空脚本；无 id 新增、有 id 更新
const submitTextResource = () => {
  const {textResource, textResources} = textResourcesStore
  textResource.type === 'script' ? textResource.content = '' : textResource.script = ''
  if (!textResource.id) {
    textResource.id = Date.now() + ''
    textResources.push(_.cloneDeep(textResource))
  } else {
    for (let i = 0; i < textResources.length; i++) {
      if (textResources[i].id === textResource.id) {
        textResources[i] = _.cloneDeep(textResource)
        break
      }
    }
  }
  textResourcesStore.textResource = new TextResource()
  textResourcesStore.textResourceDialogVisible = false;
}

const saveTextResource = async () => {
  if (!textResourceForm?.value) return
  await textResourceForm.value.validate(async (valid, fields) => {
    if (valid) {
      submitTextResource()
    }
  })
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.text-label-form {
  width: 100%;
  padding: 20px 40px 0 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 12px;

  .el-form-item {
    width: 100%;
  }

}
</style>
