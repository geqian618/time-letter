<template>
  <el-dialog align-center v-model="textResourcesStore.textResourceDialogVisible" :title="textResourcesStore.textResourceDialogTitle" width="500" draggable>
    <el-form :model="textResourcesStore.textResource" class="text-label-form" ref="textResourceForm" :rules="textResourceRules"
             label-width="auto"
             @submit.native.prevent>
      <el-form-item label="文本类型" prop="type">
        <el-select v-model="textResourcesStore.textResource.type" placeholder="文本类型">
          <el-option
              v-for="(item,index) in [{label:'普通文本', value:'text'}, {label:'JavaScript脚本', value:'script'}]"
              :key="index"
              :label="item.label"
              :value="item.value"/>
        </el-select>
      </el-form-item>
      <el-form-item label="提示" prop="tips">
        <el-input v-model="textResourcesStore.textResource.tips" v-focus="textResourcesStore.textResourceDialogVisible"/>
      </el-form-item>
      <el-form-item label="文本" prop="content" v-if="textResourcesStore.textResource.type === 'text'">
        <el-input v-model="textResourcesStore.textResource.content" :rows="4" type="textarea"/>
      </el-form-item>
      <el-form-item label="脚本" prop="script" v-if="textResourcesStore.textResource.type === 'script'">
        <el-input v-model="textResourcesStore.textResource.script" :rows="4" type="textarea"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="textResourcesStore.textResourceDialogVisible = false">取消</el-button>
        <el-button type="info" @click="saveTextResource">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="js">

import {ref, watch, nextTick} from 'vue'

import _ from 'lodash'

import {TextResource} from '@/object/Configuration'

import StorageManager from '@/object/StorageManager'

import {useTextResourcesStore} from '@/stores/text-resources'

const textResourcesStore = useTextResourcesStore()

const textResourceForm = ref({})

const textResourceRules = {
  type: [
    {required: true, message: '文本类型不能为空', trigger: 'blur'},
  ],
  tips: [
    {required: true, message: '提示信息不能为空', trigger: 'blur'},
  ],
  content: [
    {required: true, message: '文本内容不能为空', trigger: 'blur'},
  ],
  script: [
    {required: true, message: '脚本不能为空', trigger: 'blur'},
  ]
}

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
  StorageManager.saveTextResources(textResources)
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
