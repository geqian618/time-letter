<template>
  <el-aside>
    <el-scrollbar>
      <el-menu :default-openeds="['1']">
        <el-sub-menu index="1" class="templates-options">
          <template #title>
            <span>模版预设</span>
          </template>
          <div class="templates" v-drag-sort="handleTemplateSorting">
            <el-menu-item
                :data-id="template.templateId"
                @contextmenu="triggerTemplateContextMenu(template)"
                class="template" v-for="template in templatesStore.templates"
                :key="template.templateId"
                :index="String(template.templateId)"
                @click="openEnableTemplateDialog(template)">
              {{ template.templateName }}
            </el-menu-item>
          </div>
        </el-sub-menu>
        <el-sub-menu index="2" class="image-options">
          <template #title>
            <span>图片库</span>
          </template>
          <div class="image-resources" ref="imageResourceRef">
            <div class="image-wrapper" :key="key" v-for="([key, image]) in canvasesStore.imageResources" draggable="false">
              <img class="image-resource"
                   :src="image.thumbUrl || image.url"
                   :path="image.path"
                   draggable="true"
                   alt="">
            </div>
          </div>
        </el-sub-menu>
        <el-sub-menu index="3" class="text-options">
          <template #title>
            <span>文本库</span>
          </template>
          <el-scrollbar class="scrollBar">
            <div class="text-resources" ref="textResourceRef">
              <el-tooltip effect="dark" content="文本" placement="top">
                <div class="text-resource" draggable="true" text="文本" type="text">
                  <img draggable="false" src="/src/assets/icon/text.svg" alt="文本">
                </div>
              </el-tooltip>
              <el-tooltip effect="dark" content="日期" placement="top">
                <div class="text-resource" draggable="true" type="date">
                  <img draggable="false" src="/src/assets/icon/date.svg" alt="日期">
                </div>
              </el-tooltip>
              <el-tooltip effect="dark" content="日期时间" placement="top">
                <div class="text-resource" draggable="true" type="datetime">
                  <img draggable="false" src="/src/assets/icon/datetime.svg" alt="日期时间">
                </div>
              </el-tooltip>
              <el-tooltip v-for="(text) in textResourcesStore.textResources" :key="text.id" effect="dark" :content="text.tips"
                          placement="top">
                <div class="text-resource"
                     :id="text.id"
                     draggable="true"
                     :text="text.content"
                     :expression="text.script"
                     :type="text.type ==='text'?'text':'script'">
                  <img draggable="false" src="/src/assets/icon/custom.svg" alt="">
                </div>
              </el-tooltip>
            </div>
          </el-scrollbar>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </el-aside>
</template>

<script setup lang="js">

import {ref} from 'vue'

import useEventListener from '@/composables/useEventListener'

import CanvasManager from '@/object/CanvasManager'

import StorageManager from '@/object/StorageManager'

import {useCanvasesStore} from '@/stores/canvases'
import {useTemplatesStore} from '@/stores/templates'
import {useTextResourcesStore} from '@/stores/text-resources'

const canvasesStore = useCanvasesStore()

const templatesStore = useTemplatesStore()

const textResourcesStore = useTextResourcesStore()

const imageResourceRef = ref(null)

const textResourceRef = ref(null)

// 模板右键菜单：记录目标模板并打开主进程菜单
const triggerTemplateContextMenu = ({templateId, templateName}) => {
  if (templatesStore.templates.length) {
    templatesStore.oldTemplate.templateId = templateId
    templatesStore.oldTemplate.templateName = templateName
    window.electronAPI.openTemplateContextMenu()
  }
}

// 点击模板：存在选中画布时打开应用模版弹窗
const openEnableTemplateDialog = ({settings}) => {
  if (CanvasManager.isNotEmpty() && CanvasManager.getSelectedPath()) {
    templatesStore.templateSettings = settings
    templatesStore.enableTemplateDialogVisible = true
  }
}

// 拖拽排序结束后按 DOM 顺序重排模板并持久化
const handleTemplateSorting = (el, dragaElement, targetElement) => {
  let newTemplates = []
  const elements = el.querySelectorAll('.template');
  for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    for (let template of templatesStore.templates) {
      if (String(template.templateId) === dataId) {
        newTemplates.push(template)
        break
      }
    }
  }
  templatesStore.templates = newTemplates
  StorageManager.saveTemplates(newTemplates)
}

// 图片库 / 文本库条目拖拽开始时打包数据
const handleDragStart = function (event) {

  const component = event.target;
  const componentRect = component.getBoundingClientRect();

  const type = component.getAttribute('type');
  const content = component.getAttribute('text')
  const expression = component.getAttribute('expression')

  const url = component.getAttribute('src');
  const path = component.getAttribute('path');
  const tagName = component.tagName.toLowerCase();

  const offsetX = event.clientX - componentRect.left;
  const offsetY = event.clientY - componentRect.top;
  const width = componentRect.width;
  const height = componentRect.height;

  const settings = component instanceof HTMLImageElement
      ? {url, path, tagName, width, height}
      : {type, content, expression, tagName}

  // 关键：设置拖拽数据传输
  event.dataTransfer.setData('text/plain', JSON.stringify({settings, mouse: {offsetX, offsetY}}));

  // 手动设置拖拽预览
  event.dataTransfer.setDragImage(component, offsetX, offsetY);

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move';
}

useEventListener(imageResourceRef, 'dragstart', handleDragStart)
useEventListener(textResourceRef, 'dragstart', handleDragStart)

</script>

<style scoped lang="scss">

.el-aside {
  color: var(--el-text-color-primary);
  background: var(--expand-area-background-color);
  width: 100%;
  height: 100%;

  .el-menu {
    border-right: none;
    border-bottom: none;
    background-color: var(--expand-area-background-color);

    .el-menu-item.is-active {
      background-color: var(--app-active-bg) !important;
      color: var(--app-active-color);
      box-shadow: inset 3px 0 0 var(--app-accent);
    }

    .text-options {
      height: 50%;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--menu-background-color);

      .text-resources {
        padding: 20px 10px;
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
        font-size: 12px;
        background-color: var(--expand-area-background-color);

        .text-resource {
          width: fit-content;
          height: fit-content;
          cursor: move;
          user-select: none;

          img {
            width: 25px;
          }
        }

        .text-resource:hover {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          background: var(--app-text-resource-hover-bg);
        }
      }
    }

    :deep(.el-sub-menu) {

      .el-sub-menu__title {
        height: 40px;
      }

      span, svg {
        color: var(--menu-icon-color);
      }

      .el-sub-menu__title:hover {
        background-color: var(--menu-background-color);

        span {
          color: var(--app-hover-accent);
        }
      }

      .el-menu-item:hover {
        background-color: var(--app-hover-bg);
        color: var(--app-hover-color) !important;
      }

    }

    .image-options {
      height: 50%;
      width: 100%;
      box-sizing: border-box;
      background-color: var(--menu-background-color);
      border-bottom: 1px solid var(--app-menu-border);

      .image-resources {
        display: grid;
        grid-template-columns: repeat(3, 1fr); /* 三等分列宽 */
        gap: 10px;
        padding: 10px;
        background-color: var(--expand-area-background-color);

        .image-wrapper {
          /* 不需要设置高度，用 aspect-ratio 设置宽高比例 */
          aspect-ratio: 5 / 4; /* 或根据需求设为 4/3、16/9 等 */
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--app-placeholder-bg); /* 可选，占位背景 */
          border-radius: 2px;
          padding: 5%;

          .image-resource {
            max-width: 100%;
            max-height: 100%;
            width: auto; /* 由图片实际宽度决定 */
            height: auto; /* 由图片实际高度决定 */
            object-fit: contain; // 此时 contain 或 cover 才能生效
            display: block;
            cursor: move;
            user-select: none;
          }
        }
      }
    }

    .templates-options {
      background-color: var(--menu-background-color);
      border-bottom: 1px solid var(--app-menu-border);

      .templates {
        background-color: var(--expand-area-background-color);

        .el-menu-item {
          color: var(--main-font-color);
          height: 40px;
        }
      }
    }
  }
}

.details {
  height: calc(100% - 40px);
  width: 100%;
  font-size: 10px;

  ul {
    display: block;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: auto;
    margin: 0;
    padding: 15px 20px;
    white-space: nowrap;
    list-style: none;

    li {
      padding: 5px 0;
    }
  }
}

</style>
