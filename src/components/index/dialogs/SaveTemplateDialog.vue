<template>
  <div class="dialog-wrapper is-roomy">
    <el-dialog v-model="templatesStore.saveTemplateDialogVisible" :title="$t('template.saveTitle')" align-center width="350" draggable>
      <el-form :model="templatesStore.newTemplate" class="demo-form-inline" :rules="saveTemplateRules" ref="saveTemplateForm"
               @submit.native.prevent>
        <el-form-item :label="$t('template.name')" prop="templateName">
          <el-input v-model="templatesStore.newTemplate.templateName"
                    ref="templateRef"
                    v-focus="templatesStore.saveTemplateDialogVisible"
                    :placeholder="$t('template.namePlaceholder')"
                    clearable
                    @keyup.enter.native="saveTemplates"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="templatesStore.saveTemplateDialogVisible = false">{{ $t('common.cancel') }}</el-button>
          <el-button type="primary" @click="saveTemplates">{{ $t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {computed, ref, watch, nextTick} from 'vue'

import {useI18n} from 'vue-i18n'

import _ from 'lodash'

import CanvasManager from '@/object/canvas-manager'

import {useTemplatesStore} from '@/stores/templates'
import {useCanvasesStore} from '@/stores/canvases'

const {t} = useI18n()

const templatesStore = useTemplatesStore()

const canvasesStore = useCanvasesStore()

const templateRef = ref(null)

const saveTemplateForm = ref({})

// 校验文案经 computed 翻译，语言切换后保持生效
const saveTemplateRules = computed(() => ({
  templateName: [
    {required: true, message: t('template.nameRequired'), trigger: 'blur'},
  ]
}))

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
        // 模板只认 src：带上 DOM Image 引用会把整张解码位图钉在常驻 store 里直到退出
        delete item.image
        items.push(item)
      }
      const {idealWidth, idealHeight} = canvasesStore.getWorkspace();
      const settings = _.cloneDeep({
        idealWidth,
        idealHeight,
        background,
        foreground: {width, height, zoom, elements: items}
      })
      // cloneDeep 对 DOM 对象返回原引用，background 图层里的解码位图需单独摘除
      settings.background.elements?.forEach(element => delete element.image)
      const templateName = templatesStore.newTemplate.templateName
      templatesStore.pendingTemplate = {templateName, settings}
      if (templatesStore.templates.some(template => template.templateName === templateName)) {
        // 同名预设已存在：弹出选择弹窗，由用户决定覆盖保存还是新增保存
        templatesStore.saveExistsDialogVisible = true
        return
      }
      // 名称未被占用：直接新增
      await templatesStore.commitTemplateSave()
    }
  })
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

/* 仅本弹窗的宽松留白：正文左/右 27px、上 24px（底部维持全局 10px）；
   footer 左右与正文对齐（末按钮的全局 10px margin-right 在此清零，避免叠加） */
.dialog-wrapper.is-roomy {
  :deep(.el-dialog) {
    $pad-x: 27px;
    $pad-top: 24px;

    .el-dialog__body {
      padding: $pad-top $pad-x 10px;
    }

    .el-dialog__footer {
      padding-right: $pad-x;
      padding-left: $pad-x;

      button:last-child {
        margin-right: 0;
      }
    }
  }
}
</style>
