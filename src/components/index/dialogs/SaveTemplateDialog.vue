<template>
  <el-dialog v-model="templatesStore.saveTemplateDialogVisible" title="保存预设模版" align-center width="350" draggable>
    <el-form :model="templatesStore.newTemplate" class="demo-form-inline" :rules="saveTemplateRules" ref="saveTemplateForm"
             @submit.native.prevent>
      <el-form-item label="模板名称" prop="templateName">
        <el-input v-model="templatesStore.newTemplate.templateName"
                  ref="templateRef"
                  v-focus="templatesStore.saveTemplateDialogVisible"
                  placeholder="请输入模版名称"
                  clearable
                  @keyup.enter.native="saveTemplates"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="templatesStore.saveTemplateDialogVisible = false">取消</el-button>
        <el-button type="info" @click="saveTemplates">确认</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="js">

import {ref, watch, nextTick} from 'vue'

import _ from 'lodash'

import CanvasManager from '@/object/CanvasManager'

import StorageManager from '@/object/StorageManager'

import {useTemplatesStore} from '@/stores/templates'
import {useCanvasesStore} from '@/stores/canvases'

const templatesStore = useTemplatesStore()

const canvasesStore = useCanvasesStore()

const templateRef = ref(null)

const saveTemplateForm = ref({})

const saveTemplateRules = {
  templateName: [
    {required: true, message: '模板名称不能为空', trigger: 'blur'},
  ]
}

// 弹窗打开时清除上一次的表单校验
watch(() => templatesStore.saveTemplateDialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      saveTemplateForm.value?.clearValidate();
    })
  }
})

// 保存当前画布前景元素为模版（相对定位参数按缩放换算）
const saveTemplates = async () => {
  if (!saveTemplateForm?.value) return
  await saveTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      const {initZoom, background, foreground} = CanvasManager.getCurrentCanvas();
      const {width, height, elements, zoom} = foreground;
      const items = []
      for (const element of elements) {
        const centerX = element.x + element.width / 2
        const centerY = element.y + element.height / 2
        const horizontal = centerX < width / 2 ? 'left' : 'right';
        const vertical = centerY < height / 2 ? 'top' : 'bottom';
        const item = {...element}
        item.position = [horizontal, vertical]
        item.centerXRatio = horizontal === 'left' ? centerX / width : (width - centerX) / width
        item.centerYRatio = vertical === 'top' ? centerY / height : (height - centerY) / height
        item.offsetX = horizontal === 'left' ? element.x * initZoom : (width - element.x - element.width) * initZoom
        item.offsetY = vertical === 'top' ? element.y * initZoom : (height - element.y - element.height) * initZoom
        item.width = element.width * initZoom
        item.height = element.height * initZoom
        if (element.type === 'text') {
          item.fontSize = element.fontSize * initZoom
        }
        items.push(item)
      }
      const {idealWidth, idealHeight} = canvasesStore.getWorkspace();
      const newTemplates = [...templatesStore.templates, {
        templateId: Date.now(),
        templateName: templatesStore.newTemplate.templateName,
        settings: _.cloneDeep({
          idealWidth,
          idealHeight,
          background,
          foreground: {width, height, zoom, elements: items}
        })
      }]

      // 重新赋值以触发模版列表重新渲染
      templatesStore.templates = []
      await nextTick();
      templatesStore.templates = newTemplates;
      StorageManager.saveTemplates(newTemplates)
      templatesStore.newTemplate.templateName = ''
      templatesStore.saveTemplateDialogVisible = false
    }
  })
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';
</style>
