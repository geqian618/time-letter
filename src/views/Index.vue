<template>
  <div>
    <div class="page-layout" ref="page">
      <div class="page-main" ref="pageMainRef">
        <div class="page-left">
          <div class="left-resize" ref="leftResizeRef" @mousedown="handleLeftSidebarResize"></div>
          <LeftPanel/>
        </div>

        <WorkspacePanel/>

        <div class="page-right">
          <div class="right-resize" ref="rightResizeRef" @mousedown="handleRightSidebarResize"></div>
          <RightPanel/>
        </div>
      </div>

      <div class="page-bottom">
        <div class="bottom-resize" ref="bottomResizeRef" @mousedown="handleBottomSidebarResize"></div>
        <PreviewPanel/>
      </div>

    </div>

    <TextResourceDialog/>
    <SaveTemplateDialog/>
    <RenameTemplateDialog/>
    <TextResourceManagerDialog/>
    <DownloadProgressDialog/>
    <SettingsDialog/>
    <EnableTemplateDialog/>
    <AboutDialog/>
    <DeleteConfirmDialog/>

  </div>
</template>

<script setup lang="js">

import {ref, onMounted} from "vue";

import StorageManager from "@/object/StorageManager";

import {TextResource} from "@/object/Configuration";

import LeftPanel from '@/components/index/LeftPanel.vue'
import WorkspacePanel from '@/components/index/WorkspacePanel.vue'
import RightPanel from '@/components/index/RightPanel.vue'
import PreviewPanel from '@/components/index/PreviewPanel.vue'

import TextResourceDialog from '@/components/index/dialogs/TextResourceDialog.vue'
import SaveTemplateDialog from '@/components/index/dialogs/SaveTemplateDialog.vue'
import RenameTemplateDialog from '@/components/index/dialogs/RenameTemplateDialog.vue'
import TextResourceManagerDialog from '@/components/index/dialogs/TextResourceManagerDialog.vue'
import DownloadProgressDialog from '@/components/index/dialogs/DownloadProgressDialog.vue'
import SettingsDialog from '@/components/index/dialogs/SettingsDialog.vue'
import EnableTemplateDialog from '@/components/index/dialogs/EnableTemplateDialog.vue'
import AboutDialog from '@/components/index/dialogs/AboutDialog.vue'
import DeleteConfirmDialog from '@/components/index/dialogs/DeleteConfirmDialog.vue'

import {useProjectSettingsStore} from '@/stores/projectSettings'
import {useTemplatesStore} from '@/stores/templates'
import {useTextResourcesStore} from '@/stores/textResources'
import {useCanvasesStore} from '@/stores/canvases'

const settingsStore = useProjectSettingsStore()

const templatesStore = useTemplatesStore()

const textResourcesStore = useTextResourcesStore()

const canvasesStore = useCanvasesStore()

const page = ref(null)

const pageMainRef = ref(null)

const leftResizeRef = ref(null);

const rightResizeRef = ref(null);

const bottomResizeRef = ref(null);

// 尽早加载本地项目设置，供各模块初始化时读取
settingsStore.loadProjectSettings()

const handleLeftSidebarResize = (e) => {

  let lastMoveX = e.clientX;
  const {clientWidth, clientHeight} = page.value;
  const leftSidebar = leftResizeRef.value.parentNode;

  // 获取当前百分比值
  const rootStyle = getComputedStyle(document.documentElement);
  let sidebarPercent = parseFloat(rootStyle.getPropertyValue('--page-left-width'))
  let previewPercent = parseFloat(rootStyle.getPropertyValue('--canvas-workspace-width'));

  const handleMove = (event) => {

    const moveX = event.clientX;
    const offsetX = moveX - lastMoveX;
    lastMoveX = moveX;

    // 计算偏移量对应的百分比变化
    const offsetPercent = (offsetX / clientWidth) * 100;

    const newSidebarPercent = sidebarPercent + offsetPercent;
    const newPreviewPercent = previewPercent - offsetPercent;

    const workspace = canvasesStore.getWorkspace();
    const {minWidth: previewMinWidth = 0} = window.getComputedStyle(workspace);
    const {minWidth: sidebarMinWidth = 0} = window.getComputedStyle(leftSidebar);

    const previewMinWidthPercent = (parseFloat(previewMinWidth) / clientWidth) * 100;
    const sidebarMinWidthPercent = (parseFloat(sidebarMinWidth) / clientWidth) * 100;

    // 验证两个约束条件
    if (newPreviewPercent >= previewMinWidthPercent && newSidebarPercent >= sidebarMinWidthPercent) {

      sidebarPercent = newSidebarPercent;
      previewPercent = newPreviewPercent;

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--page-left-width', `${sidebarPercent}%`);
      rootStyle.setProperty('--canvas-workspace-width', `${previewPercent}%`);

      workspace.idealWidth = newPreviewPercent / 100 * clientWidth;

      // 存储到项目设置
      settingsStore.settings.resize.leftSidebar.width = `${sidebarPercent}%`;
      settingsStore.settings.resize.canvasWorkspace.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.settings);
    }
  };

  const handleUp = (event) => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}


const handleRightSidebarResize = (e) => {

  let lastMoveX = e.clientX;
  const {clientWidth, clientHeight} = page.value;
  const rightSidebar = rightResizeRef.value.parentNode;

  // 获取当前百分比值
  const rootStyle = getComputedStyle(document.documentElement);
  let sidebarPercent = parseFloat(rootStyle.getPropertyValue('--page-right-width'));
  let previewPercent = parseFloat(rootStyle.getPropertyValue('--canvas-workspace-width'));

  const handleMove = (event) => {

    const moveX = event.clientX;
    const offsetX = moveX - lastMoveX;
    lastMoveX = moveX;

    // 计算偏移量对应的百分比变化
    const offsetPercent = (offsetX / clientWidth) * 100;

    const newSidebarPercent = sidebarPercent - offsetPercent;
    const newPreviewPercent = previewPercent + offsetPercent;

    const workspace = canvasesStore.getWorkspace();
    const {minWidth: previewMinWidth = 0} = window.getComputedStyle(workspace);
    const {minWidth: sidebarMinWidth = 0} = window.getComputedStyle(rightSidebar);

    const previewMinWidthPercent = (parseFloat(previewMinWidth) / clientWidth) * 100;
    const sidebarMinWidthPercent = (parseFloat(sidebarMinWidth) / clientWidth) * 100;

    // 验证两个约束条件
    if (newPreviewPercent >= previewMinWidthPercent && newSidebarPercent >= sidebarMinWidthPercent) {

      sidebarPercent = newSidebarPercent;

      previewPercent = newPreviewPercent;

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--page-right-width', `${sidebarPercent}%`);
      rootStyle.setProperty('--canvas-workspace-width', `${previewPercent}%`);

      workspace.idealWidth = newPreviewPercent / 100 * clientWidth;

      // 存储到项目设置
      settingsStore.settings.resize.rightSidebar.width = `${sidebarPercent}%`;
      settingsStore.settings.resize.canvasWorkspace.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.settings);
    }
  };

  const handleUp = (event) => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}


const handleBottomSidebarResize = (e) => {
  let lastMoveY = e.clientY;
  const {clientWidth, clientHeight} = page.value;
  const bottomSidebar = bottomResizeRef.value.parentNode;

  // 获取当前百分比值
  const rootStyle = getComputedStyle(document.documentElement);
  let sidebarPercent = parseFloat(rootStyle.getPropertyValue('--page-bottom-height'));
  let previewPercent = parseFloat(rootStyle.getPropertyValue('--page-main-height'));

  const handleMove = (event) => {

    const moveY = event.clientY;
    const offsetY = moveY - lastMoveY;
    lastMoveY = moveY;

    // 计算偏移量对应的百分比变化
    const offsetPercent = (offsetY / clientHeight) * 100;

    const newSidebarPercent = sidebarPercent - offsetPercent;
    const newPreviewPercent = previewPercent + offsetPercent;

    const workspace = canvasesStore.getWorkspace();
    const {minHeight: previewMinHeight = 0} = window.getComputedStyle(workspace);
    const {minHeight: sidebarMinHeight = 0} = window.getComputedStyle(bottomSidebar);

    const previewMinHeightPercent = (parseFloat(previewMinHeight) / clientHeight) * 100;
    const sidebarMinHeightPercent = (parseFloat(sidebarMinHeight) / clientHeight) * 100;

    // 验证两个约束条件
    if (newPreviewPercent >= previewMinHeightPercent && newSidebarPercent >= sidebarMinHeightPercent) {

      sidebarPercent = newSidebarPercent;
      previewPercent = newPreviewPercent;

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--page-bottom-height', `${sidebarPercent}%`);
      rootStyle.setProperty('--page-main-height', `${previewPercent}%`);

      workspace.idealHeight = newPreviewPercent / 100 * clientHeight;

      // 存储到项目设置
      settingsStore.settings.resize.bottomSidebar.height = `${sidebarPercent}%`;
      settingsStore.settings.resize.canvasWorkspace.height = `${previewPercent}%`;
      settingsStore.settings.resize.leftSidebar.height = `${previewPercent}`;
      settingsStore.settings.resize.rightSidebar.height = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.settings);
    }
  };

  const handleUp = (event) => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}


// ---------- 业务 IPC 监听 ----------

// 模板导出（type1）/ 导入（type2）监听
const watchTemplates = () => {
  window.electronAPI.watchTemplates(async (event, {type, data}) => {
    if (type === 1) {
      // 获取模版数据
      window.electronAPI.exportTemplates({outputPath: data, templates: StorageManager.getTemplates()});
    } else if (type === 2) {
      // 接收模板数据
      data.forEach(template => templatesStore.templates.push(template))
      StorageManager.saveTemplates(templatesStore.templates)
    }
  })
}

// 删除当前右键目标模板
const deleteTemplate = () => {
  const templates = templatesStore.templates
  if (templates && templates.length) {
    for (let i = 0; i < templates.length; i++) {
      if (templates[i].templateId === templatesStore.oldTemplate.templateId) {
        templates.splice(i, 1)
        StorageManager.saveTemplates(templates)
        return
      }
    }
  }
}

// 模板右键菜单命令监听：删除（type0）/ 重命名（type1）
const watchTemplateContextMenu = () => {
  window.electronAPI.watchTemplateContextMenu((event, {type}) => {
    if (type === 0) {
      deleteTemplate()
    } else if (type === 1) {
      templatesStore.renameTemplateDialogVisible = true
    }
  })
}

// 文本资源 / 图片库 IPC 监听：图片库数据（type0）/ 新增文本（type1）/ 图片标签（type2）/ 文本管理（type3）
const watchResources = () => {
  window.electronAPI.watchResources(async (event, result) => {
    const {data, type} = result
    if (type === 0) {
      // 图片库数据合并（event0）/ 移除（event1）
      if (result.event === 0) {
        if (!canvasesStore.imageResources.size) {
          canvasesStore.imageResources = data;
        } else {
          for (let [key, item] of data) {
            if (!canvasesStore.imageResources.has(key)) {
              canvasesStore.imageResources.set(key, item)
            }
          }
        }
      } else if (result.event === 1) {
        canvasesStore.imageResources.delete(data.filePath)
      }
    } else if (type === 1) {
      textResourcesStore.textResource = new TextResource()
      textResourcesStore.handleTextResourceType = 0
      textResourcesStore.textResourceDialogVisible = true
    } else if (type === 2) {
      textResourcesStore.editorImageLabelDialogVisible = true
    } else if (type === 3) {
      textResourcesStore.textResourceManagerDialogVisible = true
    }
  })
}

// 文件导出进度监听
const watchDownloadProgress = () => {
  window.electronAPI.watchDownloadProgress((event, data) => {
    canvasesStore.downloadProgressPercentage = data.percentage
    if (canvasesStore.downloadProgressPercentage === 100) {
      setTimeout(() => {
        canvasesStore.downloadProgressVisible = false
      }, 1000)
      setTimeout(() => {
        canvasesStore.downloadProgressPercentage = 0;
      }, 1500)
    }
  })
}


onMounted(() => {
  // 注册页面根元素引用，供画布初始化与布局计算使用
  canvasesStore.registerCanvasRefs({page: page.value})

  // 加载本地模板与文本资源
  templatesStore.templates = StorageManager.getTemplates()
  textResourcesStore.textResources = StorageManager.getTextResources()

  // 注册业务监听
  watchTemplates()
  watchTemplateContextMenu()
  watchResources()
  watchDownloadProgress()
})

</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .page-main {
    width: 100%;
    height: var(--page-main-height);
    display: flex;
    box-sizing: border-box;
    border-top: 1px solid var(--app-toolbar-border);

    .page-left {
      width: var(--page-left-width);
      height: 100%;
      background: var(--expand-area-background-color);
      box-sizing: border-box;
      flex-shrink: 0;
      position: relative;
      min-width: 100px;
      border-right: 1px solid var(--border-color);

      .left-resize {
        position: absolute;
        height: 100%;
        width: 6px;
        right: -3px;
        top: 0;
        z-index: 1;
      }

      .left-resize:hover {
        cursor: ew-resize; /* 左右箭头 */
      }
    }

    .page-right {
      width: var(--page-right-width);
      height: 100%;
      background: var(--expand-area-background-color);
      position: relative;
      min-width: 100px;
      border-left: 1px solid var(--border-color);

      .right-resize {
        position: absolute;
        height: 100%;
        width: 6px;
        left: -3px;
        top: 0;
        z-index: 1;
      }

      .right-resize:hover {
        cursor: ew-resize; /* 左右箭头 */
      }
    }
  }


  .page-bottom {
    width: 100%;
    height: var(--page-bottom-height);
    border-top: 1px solid var(--app-toolbar-border);
    position: relative;
    min-height: 100px;

    .bottom-resize {
      position: absolute;
      width: 100%;
      height: 6px;
      top: -3px;
      left: 0;
      z-index: 1;
    }

    .bottom-resize:hover {
      cursor: ns-resize; /* 左右箭头 */
    }
  }
}

</style>
