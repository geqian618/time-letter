<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="settingsDialogVisible" title="偏好设置" top="10vh" width="750">
      <el-tabs type="border-card" class="demo-tabs">
        <el-tab-pane label="导出">
          <div class="border-box">
            <span class="border-label">图片尺寸</span>
            <div class="options">
              <div class="option">
                <span class="label">调整方式：</span>
                <el-select v-model="settingsStore.projectSettings.outputSettings.outputSize.type"
                           placeholder="Select"
                           class="value"
                           size="small">
                  <el-option
                      v-for="item in outputSizeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===1">
                <span class="label">宽度：</span>
                <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.width"
                          size="small"
                          class="value"
                          placeholder="宽尺寸"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type ===2">
                <span class="label">高度：</span>
                <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.height"
                          size="small"
                          class="value"
                          placeholder="高尺寸"/>
                <span>&nbsp;px</span>
              </div>

              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                <span class="label">最大宽度：</span>
                <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxWidth"
                          size="small"
                          class="value"
                          placeholder="最大宽度"/>
                <span>&nbsp;px</span>
              </div>

              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                <span class="label">最大高度：</span>
                <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxHeight"
                          size="small"
                          class="value"
                          placeholder="最大高度"/>
                <span>&nbsp;px</span>
              </div>

            </div>
          </div>
          <div class="border-box">
            <span class="border-label">图片设置</span>
            <div class="options">
              <div class="option">
                <span class="label">输出格式：</span>
                <el-select class="value" v-model="settingsStore.projectSettings.outputSettings.extname" size="small">
                  <el-option
                      v-for="item in [{label:'原格式', value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}, {label:'WEBP', value: 3}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="[1,3].includes(settingsStore.projectSettings.outputSettings.extname) ">
                <span class="label">图片品质：</span>
                <div class="slider-demo-block">
                  <el-slider
                      v-model="settingsStore.projectSettings.outputSettings.quality"
                      class="value"
                      :min="1"
                      :max="100"
                      size="small"
                      show-input/>
                </div>
              </div>
              <div class="option">
                <span class="label">同步元数据：</span>
                <el-switch
                    v-model="settingsStore.projectSettings.outputSettings.isSynchronizeMetadata"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">文件命名</span>
            <div class="options">
              <div class="option">
                <span class="label">命名方式：</span>
                <el-select class="value" v-model="settingsStore.projectSettings.outputSettings.fileNaming.basename"
                           size="small">
                  <el-option
                      v-for="item in [{label:'原名称', value: 0}, {label:'序号', value: 1}, {label:'随机名称', value: 2}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option">
                <span class="label">前缀：</span>
                <el-input class="value"
                          spellcheck="false"
                          v-model="settingsStore.projectSettings.outputSettings.fileNaming.prefix"
                          size="small">
                </el-input>
              </div>
              <div class="option">
                <span class="label">后缀：</span>
                <el-input class="value"
                          spellcheck="false"
                          v-model="settingsStore.projectSettings.outputSettings.fileNaming.suffix"
                          size="small">
                </el-input>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="外观">
          <div class="border-box">
            <span class="border-label">主题</span>
            <div class="options">
              <div class="option">
                <span class="label">主题模式：</span>
                <el-radio-group
                    v-model="settingsStore.projectSettings.appearance.theme"
                    @change="handleThemeChange">
                  <el-radio-button value="dark">深色</el-radio-button>
                  <el-radio-button value="light">浅色</el-radio-button>
                  <el-radio-button value="system">跟随系统</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">画布视口</span>
            <div class="options">
              <div class="option">
                <span class="label">滚动条：</span>
                <el-switch
                    @change="renderCanvasScrollbar"
                    v-model="settingsStore.projectSettings.appearance.enableScrollbar"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="元数据">
          <div class="border-box">
            <span class="border-label">格式化</span>
            <div class="options">
              <div class="option">
                <span class="label">相机品牌：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.cameraBrand">
                </el-input>
              </div>
              <div class="option">
                <span class="label">相机型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.cameraModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">镜头型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.lensModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">焦段：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.focalLength">
                </el-input>
              </div>
              <div class="option">
                <span class="label">ISO：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.iso">
                </el-input>
              </div>
              <div class="option">
                <span class="label">快门：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.shutter">
                </el-input>
              </div>
              <div class="option">
                <span class="label">光圈：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.aperture">
                </el-input>
              </div>
              <div class="option">
                <span class="label">拍摄日期：</span>
                <el-input spellcheck="false"
                          class="metadata-input shooting-time"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.shootingTime">
                </el-input>
                <span class="label shooting-time-label">日期格式：</span>
                <el-input spellcheck="false"
                          class="metadata-input shooting-time"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.others.shootingTimeFormat">
                </el-input>
              </div>
              <div class="option">
                <span class="label">文件名称：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.filename">
                </el-input>
              </div>
            </div>
          </div>

          <div class="border-box">
            <span class="border-label">焦距转换</span>
            <div class="options">
              <div class="option">
                <span class="label">等效焦距：</span>
                <el-switch
                    @change="handleFocalLength(0)"
                    v-model="settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">转换倍数：</span>
                <el-input class="value"
                          spellcheck="false"
                          @change="handleFocalLength(1)"
                          v-model="settingsStore.projectSettings.metadata.others.conversionMultiple">
                </el-input>
              </div>
            </div>
          </div>
          <div class="operation">
            <el-button type="info" @click="resetMetadataSettings">重置</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="性能">
          <div class="border-box">
            <span class="border-label">下载</span>
            <div class="options">
              <div class="option">
                <span class="label">线程数：</span>
                <el-select class="value" v-model="settingsStore.projectSettings.performance.downloadThreads"
                           size="small">
                  <el-option
                      v-for="item in downloadThreadsOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="字体">
          <el-table size="small" height="400" highlight-current-row :data="settingsStore.availableFonts" border
                    @cell-dblclick="handleActivateInput">
            <el-table-column fixed prop="family" label="字体家族" show-overflow-tooltip/>
            <el-table-column prop="familyAlias" label="字体别名" show-overflow-tooltip>
              <template #default="scope">
                <input type="text"
                       spellcheck="false"
                       @focusout="handleStopActivateInput(scope.row)"
                       v-show="scope.row.editable"
                       style="height: 100%;user-select: none;width: fit-content;background-color: transparent;outline: none;border: none"
                       v-model="scope.row.familyAlias">
                <div v-show="!scope.row.editable">{{ scope.row.familyAlias }}</div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="其他">
          <div class="border-box">
            <span class="border-label">个性化</span>
            <div class="options">
              <div class="option">
                <span class="label">属性锚点：</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.optionAnchorPoint"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">删除提示：</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.deleteTipVisible"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">伸缩居中：</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.autoCenterOnToggle"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">画布</span>
            <div class="options">
              <div class="option">
                <span class="label">移动步长：</span>
                <div class="slider-demo-block">
                  <el-slider
                      v-model="settingsStore.projectSettings.others.movingStepSize"
                      class="value"
                      :min="1"
                      :max="100"
                      size="small"
                      show-input/>
                </div>
              </div>
              <div class="option">
                <span class="label">默认缩放：</span>
                <div class="slider-demo-block">
                  <el-slider
                      @change="handleCanvasScale"
                      v-model="settingsStore.projectSettings.others.defaultCanvasScale"
                      class="value"
                      :min="0.05"
                      :max="1"
                      :step="0.05"
                      size="small"
                      show-input/>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <!--        <el-tab-pane label="图片"></el-tab-pane>-->
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref, nextTick} from 'vue'

import _ from 'lodash'

import useEventListener from '@/composables/useEventListener'

import FontManager from '@/utils/FontManager'

import Notification from '@/utils/Notification'

import {parseDate, formatDate} from '@/utils/datetime'

import CanvasManager from '@/object/CanvasManager'

import {canvasActions} from '@/object/CanvasActions'

import {FontSettings} from '@/object/Configuration'

import StorageManager from '@/object/StorageManager'

import {useProjectSettingsStore} from '@/stores/project-settings'
import {useCanvasesStore} from '@/stores/canvases'
import {outputSizeOptions, downloadThreadsOptions, defaultProjectSettings} from '@/config/default-project-settings'

const settingsStore = useProjectSettingsStore()

const canvasesStore = useCanvasesStore()

const settingsDialogVisible = ref(false)

// 应用菜单"偏好设置"的 IPC 监听
window.electronAPI.openSettingsDialog(() => {
  settingsDialogVisible.value = true
})

const systemTheme = window.matchMedia('(prefers-color-scheme: light)')

// 应用主题：写入根元素属性并同步主进程窗口主题
const applyTheme = (theme) => {
  const resolvedTheme = theme === 'system' ? (systemTheme.matches ? 'light' : 'dark') : theme
  if (resolvedTheme === 'dark') {
    document.documentElement.setAttribute('dark-theme', '')
  } else {
    document.documentElement.removeAttribute('dark-theme')
  }
  if (window.electronAPI?.setTheme) {
    window.electronAPI.setTheme(['light', 'dark', 'system'].includes(theme) ? theme : 'system')
  }
}

// 系统主题变化时，跟随系统模式的设置同步应用
useEventListener(systemTheme, 'change', () => {
  if (settingsStore.projectSettings.appearance?.theme === 'system') {
    applyTheme('system')
  }
})

// 把 resize 各项写入根元素 CSS 变量
const initAreaResize = () => {

  const {
    leftSidebar: leftSidebarResize,
    canvasWorkspace: canvasWorkspaceResize,
    rightSidebar: rightSidebarResize,
    bottomSidebar: bottomSidebarResize
  } = settingsStore.projectSettings.resize;

  const root = document.documentElement;
  const rootStyle = root.style;

  if (leftSidebarResize.width) {
    rootStyle.setProperty('--page-left-width', leftSidebarResize.width)
  }

  if (rightSidebarResize.width) {
    rootStyle.setProperty('--page-right-width', rightSidebarResize.width)
  }

  if (canvasWorkspaceResize.width) {
    rootStyle.setProperty('--canvas-workspace-width', canvasWorkspaceResize.width)
  }

  if (canvasWorkspaceResize.height) {
    rootStyle.setProperty('--page-main-height', canvasWorkspaceResize.height)
  }

  if (bottomSidebarResize.height) {
    rootStyle.setProperty('--page-bottom-height', bottomSidebarResize.height)
  }
}

// 滚动条开关变化后同步画布工作区滚动条
const renderCanvasScrollbar = () => {
  canvasesStore.getWorkspace().style.overflow = settingsStore.projectSettings.appearance.enableScrollbar ? 'auto' : 'hidden'
}

// 元数据格式变化后重新格式化画布元数据
const handleUpdateMetadata = () => {
  const canvases = CanvasManager.getCanvases();
  for (let [path, canvas] of canvases) {
    if (canvas && canvas.originalMetadata) {
      const originalMetadata = canvas.originalMetadata;
      const metadata = canvas.metadata;
      const shootingTimeFormat = settingsStore.projectSettings.metadata.others.shootingTimeFormat;
      for (let key in originalMetadata) {
        const format = settingsStore.projectSettings.metadata.formats[key];
        let value = originalMetadata[key];
        if (key === 'shootingTime' && value && !['yyyy-MM-dd HH:mm:ss', 'YYYY-MM-DD HH:mm:ss'].includes(shootingTimeFormat)) {
          value = formatDate(parseDate(value, 'yyyy-MM-dd HH:mm:ss'), shootingTimeFormat);
        }
        if (value && format) {
          value = format.replace('${' + key + '}', value);
          CanvasManager.getSelectedPath() === path ? canvasesStore.metadataOptions[key] = value : metadata[key] = value
        }
      }
    }
  }
}

// 焦距转换设置变化后重算焦段
const handleFocalLength = (type) => {
  for (let [path, canvas] of CanvasManager.getCanvases()) {
    const originalMetadata = canvas.originalMetadata;
    const metadata = canvas.metadata;
    let newFocalLength;
    if (originalMetadata && originalMetadata.focalLength) {
      if (type === 0) {
        newFocalLength = settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment
            ? Number.parseInt(originalMetadata.focalLength * settingsStore.projectSettings.metadata.others.conversionMultiple)
            : originalMetadata.focalLength
      } else if (type === 1 && settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment) {
        newFocalLength = Number.parseInt(originalMetadata.focalLength * settingsStore.projectSettings.metadata.others.conversionMultiple)
      }
      const format = settingsStore.projectSettings.metadata.formats['focalLength'];
      if (format) {
        newFocalLength = format.replace('${focalLength}', newFocalLength)
        path === CanvasManager.getSelectedPath() ? canvasesStore.metadataOptions.focalLength = newFocalLength : metadata.focalLength = newFocalLength
      }
    }
  }
}

// 默认缩放变化后按比例更新所有已完成画布的缩放
const handleCanvasScale = () => {
  const defaultCanvasScale = settingsStore.projectSettings.others.defaultCanvasScale;
  const canvases = CanvasManager.getCanvases();
  canvases.forEach(canvas => {
    if (canvas.completed) {
      const newZoom = defaultCanvasScale * canvas.initZoom;
      canvas.zoom = newZoom;
      if (canvas.path === CanvasManager.getSelectedPath()) {
        canvasesStore.getCanvasEditor().setZoom(newZoom);
        canvasesStore.getBackgroundCanvasEditor().setZoom(newZoom);
      }
    }
  })
}

// 字体导入 / 移除监听：加载字体并维护可用字体列表
const watchImportFonts = () => {
  window.electronAPI.watchImportFonts(async (event, {type, data}) => {
    if (data) {
      if (type === 0 || type === -1) {
        if (type === -1) {
          removeExpiredFonts(settingsStore.projectSettings.availableFonts, data)
        }
        for (let [family, font] of data) {
          if (!font.isSystem && font.url) {
            try {
              // 加载字体
              FontManager.loadFont(family, font.url)
              if (type === 0) {
                setTimeout(() => {
                  Notification.success(`字体 ${family} 加载成功`, '提示')
                }, 100)
              }
            } catch (error) {
              Notification.error(error.message, '提示')
              continue
            }
          }
          if (!settingsStore.projectSettings.availableFonts.has(family)) {
            const fontSettings = new FontSettings();
            fontSettings.family = family
            fontSettings.familyAlias = family
            settingsStore.projectSettings.availableFonts.set(family, {...fontSettings, ...font});
            StorageManager.saveProjectSettings(settingsStore.projectSettings)
          }
        }
      } else if (type === 1) {
        const family = data.family;
        settingsStore.projectSettings.availableFonts.delete(family)
        StorageManager.saveProjectSettings(settingsStore.projectSettings)
      }
    }
  })
}

const removeExpiredFonts = (cacheFonts, availableFonts) => {
  cacheFonts.forEach((font, family) => {
    if (!availableFonts.has(family)) {
      cacheFonts.delete(family);
    }
  });
}

// 设置导入（type0）：合并设置并按差异联动画布 / 主题 / 布局；设置导出（type1）
const watchProjectSettings = () => {
  window.electronAPI.watchProjectSettings((event, {type, data: {settings: userSettings, filePath}}) => {
    if (type === 0) {

      const {
        resize: oldResize,
        others: oldOthers,
        metadata: {formats: oldFormats, others: oldConversion}
      } = settingsStore.projectSettings;

      const {
        resize: newResize,
        others: newOthers,
        metadata: {formats: newFormats, others: newConversion}
      } = userSettings;

      const newUserSettings = settingsStore.mergeProjectSettings(userSettings)

      if (!_.isEqual(oldOthers, newOthers)) {
        handleCanvasScale()
        renderCanvasScrollbar()
      }
      if (!_.isEqual(oldFormats, newFormats)) {
        handleUpdateMetadata()
      }
      if (!_.isEqual(oldConversion, newConversion)) {
        handleFocalLength(newConversion.enableEquivalentFocalSegment ? 1 : 0)
      }
      if (!_.isEqual(oldResize, newResize)) {
        initAreaResize();
        canvasActions.centerCanvasScrollBar()
      }
      applyTheme(newUserSettings.appearance?.theme || 'system')
    } else if (type === 1) {
      const userSettings = _.cloneDeep(settingsStore.projectSettings);
      delete userSettings.availableFonts;
      window.electronAPI.exportSettings({filePath, settings: userSettings});
    }
  })
}

// 字体导入 / 移除监听
watchImportFonts()

// 设置导入 / 导出监听
watchProjectSettings()

// 初始化布局 CSS 变量（项目设置已在页面 setup 中加载完成）
initAreaResize()

// 主题单选切换后应用主题
const handleThemeChange = () => {
  const theme = ['light', 'dark', 'system'].includes(settingsStore.projectSettings.appearance?.theme)
      ? settingsStore.projectSettings.appearance.theme
      : 'system'
  applyTheme(theme)
}

// 重置元数据格式并重新格式化画布元数据
const resetMetadataSettings = () => {
  settingsStore.projectSettings.metadata = _.cloneDeep(defaultProjectSettings.metadata)
  handleUpdateMetadata()
}

// 双击单元格进入字体别名编辑
const handleActivateInput = async (row, column, cell) => {
  row.editable = true;
  const input = cell.querySelector('input');
  if (input) {
    await nextTick()
    input.focus()
  }
}

// 失焦结束字体别名编辑
const handleStopActivateInput = (row, column) => {
  row.editable = false;
}

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

:deep(.el-tabs) {
  .el-tabs__nav-scroll {
    height: 35px;
    background: var(--app-dialog-header);

    .el-tabs__item {
      font-size: 11px;
    }
  }
}

.el-tabs {
  width: 100%;
  max-height: 70vh;
  font-size: 12px;

  .operation {
    height: 40px;
    display: flex;
    justify-content: right;
    align-items: end;
  }

  :deep(.el-tabs__content) {
    overflow-y: auto;
    background-color: var(--dialog-main-background-color);
    /* 基础样式 */
    .border-box {
      position: relative;
      border: 1px solid var(--app-border-strong);
      border-radius: 2px;
      padding: 15px 10px;
      margin: 25px 0;

      .border-label {
        position: absolute;
        top: -7px;
        left: 15px;
        background-color: var(--dialog-main-background-color);
        padding: 0 12px;
        font-size: 13px;
        color: var(--app-secondary-text);
      }

      .options {
        width: 100%;

        .option {
          font-size: 13px;
          width: 100%;
          display: flex;
          align-items: center;
          height: 40px;

          .label {
            font-size: 13px;
            width: 80px;
            text-align: right;
          }

          .shooting-time-label {
            margin-left: 20px;
          }

          .value {
            width: 150px;
          }


          .metadata-input {
            width: calc(100% - 100px);
          }

          .metadata-input.shooting-time {
            width: calc(50% - 100px);
          }

          .el-select {
            .el-select__wrapper {
              height: 28px;
            }
          }

          .el-input {
            height: 28px;
          }

          .el-slider {
            --el-slider-button-size: 13px;
            --el-slider-height: 6px;
            width: 220px;

            .show-input {
              margin-right: 10px;
            }

            .el-slider__input {
              width: 90px;
            }
          }
        }
      }

    }

    .border-box:first-child {
      margin-top: 10px;
    }

    .border-box:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
