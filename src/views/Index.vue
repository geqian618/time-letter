<template>
  <div>
    <div class="page-layout" ref="page">
      <div class="page-main" ref="pageMainRef">
        <div class="page-left" ref="leftPanelRef" :class="{collapsed: leftCollapsed}">
          <div class="left-resize" v-show="!leftCollapsed" ref="leftResizeRef"
               @mousedown="handleLeftSidebarResize"></div>
          <LeftPanel v-show="!leftCollapsed"/>
          <el-tooltip :content="leftCollapsed ? '展开左侧面板' : '收起左侧面板'" placement="right" effect="light">
            <button class="panel-toggle toggle-left" @click="toggleLeft">
              <svg v-if="!leftCollapsed" viewBox="0 0 24 24" width="12" height="12">
                <path d="M14 6 L7 12 L14 18 Z" fill="currentColor"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="12" height="12">
                <path d="M10 6 L17 12 L10 18 Z" fill="currentColor"/>
              </svg>
            </button>
          </el-tooltip>
        </div>

        <WorkspacePanel/>

        <div class="page-right" ref="rightPanelRef" :class="{collapsed: rightCollapsed}">
          <div class="right-resize" v-show="!rightCollapsed" ref="rightResizeRef"
               @mousedown="handleRightSidebarResize"></div>
          <RightPanel v-show="!rightCollapsed"/>
          <el-tooltip :content="rightCollapsed ? '展开右侧面板' : '收起右侧面板'" placement="left" effect="light">
            <button class="panel-toggle toggle-right" @click="toggleRight">
              <svg v-if="!rightCollapsed" viewBox="0 0 24 24" width="12" height="12">
                <path d="M10 6 L17 12 L10 18 Z" fill="currentColor"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="12" height="12">
                <path d="M14 6 L7 12 L14 18 Z" fill="currentColor"/>
              </svg>
            </button>
          </el-tooltip>
        </div>
      </div>

      <div class="page-bottom" ref="bottomPanelRef" :class="{collapsed: bottomCollapsed}">
        <div class="bottom-resize" v-show="!bottomCollapsed" ref="bottomResizeRef"
             @mousedown="handleBottomSidebarResize"></div>
        <PreviewPanel v-show="!bottomCollapsed"/>
        <el-tooltip :content="bottomCollapsed ? '展开底部面板' : '收起底部面板'" placement="top" effect="light">
          <button class="panel-toggle toggle-bottom" @click="toggleBottom">
            <svg v-if="!bottomCollapsed" viewBox="0 0 24 24" width="12" height="12">
              <path d="M6 10 L12 17 L18 10 Z" fill="currentColor"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="12" height="12">
              <path d="M6 14 L12 7 L18 14 Z" fill="currentColor"/>
            </svg>
          </button>
        </el-tooltip>
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

import {ref, watch, onMounted} from "vue";

import StorageManager from "@/object/StorageManager";

import {TextResource} from "@/object/Configuration";

import CanvasManager from "@/object/CanvasManager";

import {canvasActions} from "@/object/CanvasActions";

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

import {useProjectSettingsStore} from '@/stores/project-settings'
import {useTemplatesStore} from '@/stores/templates'
import {useTextResourcesStore} from '@/stores/text-resources'
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

// ---------- 面板收起 / 展开 ----------
const leftPanelRef = ref(null);
const rightPanelRef = ref(null);
const bottomPanelRef = ref(null);

const leftCollapsed = ref(false);
const rightCollapsed = ref(false);
const bottomCollapsed = ref(false);

// 收起时暂存面板尺寸，展开时按此恢复
const savedLeftWidth = ref(18);
const savedRightWidth = ref(22);
const savedBottomHeight = ref(25);

const COLLAPSE_DURATION = 220;

// 单一 rAF 循环：同时插值一组 CSS 百分比变量并逐帧重排居中画布。
// 宽度变化与画布位置在同一帧、同一缓动推进，画布由起始位置平滑移至最终居中，
// 避免宽度(CSS 过渡)与居中(rAF)分属两条时间线而产生的 “先漂左、再回正” 抖动。
let resizeRafId = null;
let resizeAnim = null;

// 读取根元素上的百分比变量
const readPct = (name) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

// 缓动函数
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const runResizeAnim = () => {
  resizeRafId = null;
  const t = Math.min(1, (performance.now() - resizeAnim.start) / resizeAnim.duration);
  const e = easeInOut(t);
  const rootStyle = document.documentElement.style;
  for (const v of resizeAnim.vars) {
    rootStyle.setProperty(v.name, `${v.from + (v.to - v.from) * e}%`);
  }
  if (settingsStore.projectSettings.others.autoCenterOnToggle) {
    canvasActions.reflowWorkspace?.();
  }
  if (t < 1) {
    resizeRafId = requestAnimationFrame(runResizeAnim);
  } else {
    resizeAnim.onDone?.();
    resizeAnim = null;
  }
};

const animateResize = (vars, onDone) => {
  if (resizeRafId != null) {
    cancelAnimationFrame(resizeRafId);
    resizeRafId = null;
  }
  resizeAnim = {vars, duration: COLLAPSE_DURATION, start: performance.now(), onDone};
  resizeRafId = requestAnimationFrame(runResizeAnim);
};

// 收放后将画布工作区理想尺寸同步为目标值，供后续画布渲染计算缩放
const syncWorkspaceIdealSize = (wsWidthPct, mainHeightPct) => {
  const ws = canvasesStore.getWorkspace();
  if (!ws || !page.value) return;
  ws.idealWidth = wsWidthPct / 100 * page.value.clientWidth;
  ws.idealHeight = mainHeightPct / 100 * page.value.clientHeight;
};

// 左侧面板：收起时宽度归零并等量归还给工作区，展开时反向
const toggleLeft = () => {
  const el = leftPanelRef.value;
  const leftFrom = readPct('--page-left-width');
  const wsFrom = readPct('--canvas-workspace-width');
  const mainHeight = readPct('--page-main-height');
  el.style.minWidth = '0';
  if (!leftCollapsed.value) {
    savedLeftWidth.value = leftFrom;
    leftCollapsed.value = true;
    const wsTo = wsFrom + leftFrom;
    syncWorkspaceIdealSize(wsTo, mainHeight);
    animateResize([
      {name: '--page-left-width', from: leftFrom, to: 0},
      {name: '--canvas-workspace-width', from: wsFrom, to: wsTo},
    ]);
  } else {
    leftCollapsed.value = false;
    const wsTo = Math.max(wsFrom - savedLeftWidth.value, 5);
    syncWorkspaceIdealSize(wsTo, mainHeight);
    animateResize([
      {name: '--page-left-width', from: leftFrom, to: savedLeftWidth.value},
      {name: '--canvas-workspace-width', from: wsFrom, to: wsTo},
    ], () => {
      el.style.minWidth = '';
    });
  }
};

// 右侧面板
const toggleRight = () => {
  const el = rightPanelRef.value;
  const rightFrom = readPct('--page-right-width');
  const wsFrom = readPct('--canvas-workspace-width');
  const mainHeight = readPct('--page-main-height');
  el.style.minWidth = '0';
  if (!rightCollapsed.value) {
    savedRightWidth.value = rightFrom;
    rightCollapsed.value = true;
    const wsTo = wsFrom + rightFrom;
    syncWorkspaceIdealSize(wsTo, mainHeight);
    animateResize([
      {name: '--page-right-width', from: rightFrom, to: 0},
      {name: '--canvas-workspace-width', from: wsFrom, to: wsTo},
    ]);
  } else {
    rightCollapsed.value = false;
    const wsTo = Math.max(wsFrom - savedRightWidth.value, 5);
    syncWorkspaceIdealSize(wsTo, mainHeight);
    animateResize([
      {name: '--page-right-width', from: rightFrom, to: savedRightWidth.value},
      {name: '--canvas-workspace-width', from: wsFrom, to: wsTo},
    ], () => {
      el.style.minWidth = '';
    });
  }
};

// 底部面板：高度归零并等量归还给主区域
const toggleBottom = () => {
  const el = bottomPanelRef.value;
  const bottomFrom = readPct('--page-bottom-height');
  const mainFrom = readPct('--page-main-height');
  const wsWidth = readPct('--canvas-workspace-width');
  el.style.minHeight = '0';
  if (!bottomCollapsed.value) {
    savedBottomHeight.value = bottomFrom;
    bottomCollapsed.value = true;
    const mainTo = mainFrom + bottomFrom;
    syncWorkspaceIdealSize(wsWidth, mainTo);
    animateResize([
      {name: '--page-bottom-height', from: bottomFrom, to: 0},
      {name: '--page-main-height', from: mainFrom, to: mainTo},
    ]);
  } else {
    bottomCollapsed.value = false;
    const mainTo = Math.max(mainFrom - savedBottomHeight.value, 20);
    syncWorkspaceIdealSize(wsWidth, mainTo);
    animateResize([
      {name: '--page-bottom-height', from: bottomFrom, to: savedBottomHeight.value},
      {name: '--page-main-height', from: mainFrom, to: mainTo},
    ], () => {
      el.style.minHeight = '';
    });
  }
};

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
      settingsStore.projectSettings.resize.leftSidebar.width = `${sidebarPercent}%`;
      settingsStore.projectSettings.resize.canvasWorkspace.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.projectSettings);
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
      settingsStore.projectSettings.resize.rightSidebar.width = `${sidebarPercent}%`;
      settingsStore.projectSettings.resize.canvasWorkspace.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.projectSettings);
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
      settingsStore.projectSettings.resize.bottomSidebar.height = `${sidebarPercent}%`;
      settingsStore.projectSettings.resize.canvasWorkspace.height = `${previewPercent}%`;
      settingsStore.projectSettings.resize.leftSidebar.height = `${previewPercent}`;
      settingsStore.projectSettings.resize.rightSidebar.height = `${previewPercent}%`;
      StorageManager.saveProjectSettings(settingsStore.projectSettings);
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


// ---------- 图片管理器（独立窗口）数据同步 ----------

// 推送画布快照（仅包含管理器展示所需字段）
const pushImageManagerSnapshot = () => {
  const snapshot = [...CanvasManager.getCanvases()].map(([path, canvas]) => ({
    path,
    filename: canvas.filename || canvas.metadata?.filename,
    extname: canvas.extname,
    thumbUrl: canvas.thumbUrl
  }))
  window.electronAPI.imageManagerSync(snapshot)
}

// 画布增删 / 换 key 时自动同步快照
watch(() => [...CanvasManager.getCanvases()].map(([key]) => key).join('\n'), pushImageManagerSnapshot)

// 图片管理器打开时推送初始快照
const watchImageManagerCollect = () => {
  window.electronAPI.watchImageManagerCollect(pushImageManagerSnapshot)
}

// 图片管理器移除画布，命中当前选中时清空编辑区
const watchImageManagerRemoveApply = () => {
  window.electronAPI.watchImageManagerRemoveApply((event, paths) => {
    for (let path of paths) {
      CanvasManager.deleteCanvas(path)
      if (path === CanvasManager.getSelectedPath()) {
        canvasActions.clearCanvas()
      }
    }
  })
}

// 图片管理器移动文件后以新路径重新登记画布
const watchImageManagerMoved = () => {
  window.electronAPI.watchImageManagerMoved((event, movedList) => {
    for (let {oldPath, newPath, url, thumbUrl} of movedList) {
      const canvas = CanvasManager.getCanvas(oldPath)
      if (!canvas) continue
      CanvasManager.deleteCanvas(oldPath)
      Object.assign(canvas, {path: newPath, url, thumbUrl})
      CanvasManager.setCanvas(newPath, canvas)
      if (oldPath === CanvasManager.getSelectedPath()) {
        CanvasManager.setSelectedObject({path: newPath})
      }
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

  // 注册图片管理器联动
  watchImageManagerCollect()
  watchImageManagerRemoveApply()
  watchImageManagerMoved()
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

  /* 收起态：解除最小尺寸约束（内容已通过 v-show 隐藏） */
  .page-left.collapsed, .page-right.collapsed {
    min-width: 0;
  }

  .page-bottom.collapsed {
    min-height: 0;
  }


  /* 面板收起 / 展开标记 */
  .panel-toggle {
    position: absolute;
    z-index: 10;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--app-secondary-text);
    cursor: pointer;
    border-radius: 3px;
    transition: background-color var(--app-transition), color var(--app-transition);
  }

  .panel-toggle:hover {
    background: var(--app-hover-bg);
    color: var(--app-accent);
  }

  /* 贴边线、向工作区一侧延伸；收起态(宽/高 0)也能完整落入工作区，不被屏边裁切 */
  .toggle-left {
    top: 4px;
    left: 100%;
  }

  .toggle-right {
    top: 4px;
    right: 100%;
  }

  .toggle-bottom {
    left: 50%;
    bottom: 100%;
    transform: translateX(-50%);
  }
}

</style>
