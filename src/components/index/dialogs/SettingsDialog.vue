<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="settingsDialogVisible" :title="$t('settings.title')" top="10vh" width="750">
      <el-tabs type="border-card" class="demo-tabs">
        <el-tab-pane :label="$t('settings.tabs.export')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.imageSize') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.adjustMode') }}</span>
                <el-select v-model="settingsStore.projectSettings.outputSettings.outputSize.type"
                           :placeholder="$t('common.select')"
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
                <span class="label">{{ $t('settings.width') }}</span>
                <div class="input-unit">
                  <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.width"
                            size="small"
                            class="value"
                            :placeholder="$t('settings.widthPlaceholder')"/>
                  <span>&nbsp;px</span>
                </div>
              </div>
              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type ===2">
                <span class="label">{{ $t('settings.height') }}</span>
                <div class="input-unit">
                  <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.height"
                            size="small"
                            class="value"
                            :placeholder="$t('settings.heightPlaceholder')"/>
                  <span>&nbsp;px</span>
                </div>
              </div>

              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                <span class="label">{{ $t('settings.maxWidth') }}</span>
                <div class="input-unit">
                  <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxWidth"
                            size="small"
                            class="value"
                            :placeholder="$t('settings.maxWidthPlaceholder')"/>
                  <span>&nbsp;px</span>
                </div>
              </div>

              <div class="option" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                <span class="label">{{ $t('settings.maxHeight') }}</span>
                <div class="input-unit">
                  <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxHeight"
                            size="small"
                            class="value"
                            :placeholder="$t('settings.maxHeightPlaceholder')"/>
                  <span>&nbsp;px</span>
                </div>
              </div>

            </div>
          </div>
          <div class="border-box">
            <span class="border-label">{{ $t('settings.imageSettings') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.outputFormat') }}</span>
                <el-select class="value" v-model="settingsStore.projectSettings.outputSettings.extname" size="small">
                  <el-option
                      v-for="item in [{label:$t('settings.formatOriginal'), value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}, {label:'WEBP', value: 3}, {label:'AVIF', value: 4}, {label:'GIF', value: 5}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="[1,3,4].includes(settingsStore.projectSettings.outputSettings.extname) ">
                <span class="label">{{ $t('settings.imageQuality') }}</span>
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
                <span class="label">{{ $t('settings.syncMetadata') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.outputSettings.isSynchronizeMetadata"
                    class="value"/>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">{{ $t('settings.fileNaming') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.namingMode') }}</span>
                <el-select class="value" v-model="settingsStore.projectSettings.outputSettings.fileNaming.basename"
                           size="small">
                  <el-option
                      v-for="item in [{label:$t('settings.nameOriginal'), value: 0}, {label:$t('settings.nameIndex'), value: 1}, {label:$t('settings.nameRandom'), value: 2}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.prefix') }}</span>
                <el-input class="value"
                          spellcheck="false"
                          v-model="settingsStore.projectSettings.outputSettings.fileNaming.prefix"
                          size="small">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.suffix') }}</span>
                <el-input class="value"
                          spellcheck="false"
                          v-model="settingsStore.projectSettings.outputSettings.fileNaming.suffix"
                          size="small">
                </el-input>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('settings.tabs.appearance')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.themeGroup') }}</span>
            <div class="options theme-options">
              <div class="option">
                <span class="label">{{ $t('settings.themeMode') }}</span>
                <el-radio-group
                    v-model="settingsStore.projectSettings.appearance.theme"
                    @change="handleThemeChange">
                  <el-radio-button value="dark">{{ $t('settings.themeDark') }}</el-radio-button>
                  <el-radio-button value="light">{{ $t('settings.themeLight') }}</el-radio-button>
                  <el-radio-button value="system">{{ $t('settings.themeSystem') }}</el-radio-button>
                </el-radio-group>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.uiTheme') }}</span>
                <el-select
                    class="value"
                    :model-value="uiThemePreset"
                    @change="handleUiThemeChange">
                  <el-option-group
                      v-for="group in uiThemeGroups"
                      :key="group.labelKey"
                      :label="$t(`settings.${group.labelKey}`)">
                    <el-option
                        v-for="opt in group.options"
                        :key="opt.value"
                        :value="opt.value"
                        :label="$t(`settings.${opt.accentKey}`)"/>
                  </el-option-group>
                </el-select>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">{{ $t('settings.canvasViewport') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.scrollbar') }}</span>
                <el-switch
                    @change="renderCanvasScrollbar"
                    v-model="settingsStore.projectSettings.appearance.enableScrollbar"
                    class="value"/>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.zoomPill') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.appearance.enableZoomPill"
                    class="value"/>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('settings.tabs.metadata')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.formatting') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.cameraBrand') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.cameraBrand">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.cameraModel') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.cameraModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.lensModel') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.lensModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.focalLength') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.focalLength">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.iso') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.iso">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.shutter') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.shutter">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.aperture') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.aperture">
                </el-input>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.shootingDate') }}</span>
                <div class="date-format-group">
                  <el-input spellcheck="false"
                            class="metadata-input shooting-time"
                            @change="handleUpdateMetadata"
                            v-model="settingsStore.projectSettings.metadata.formats.shootingTime">
                  </el-input>
                  <span class="label shooting-time-label">{{ $t('settings.dateFormat') }}</span>
                  <el-input spellcheck="false"
                            class="metadata-input shooting-time"
                            @change="handleUpdateMetadata"
                            v-model="settingsStore.projectSettings.metadata.others.shootingTimeFormat">
                  </el-input>
                </div>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.filename') }}</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="settingsStore.projectSettings.metadata.formats.filename">
                </el-input>
              </div>
            </div>
          </div>

          <div class="border-box">
            <span class="border-label">{{ $t('settings.focalConversion') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.equivFocal') }}</span>
                <el-switch
                    @change="handleFocalLength(0)"
                    v-model="settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment"
                    class="value"/>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.cropFactor') }}</span>
                <el-input class="value"
                          spellcheck="false"
                          @change="handleFocalLength(1)"
                          v-model="settingsStore.projectSettings.metadata.others.conversionMultiple">
                </el-input>
              </div>
            </div>
          </div>
          <div class="operation">
            <el-button type="info" @click="resetMetadataSettings">{{ $t('settings.resetMetadata') }}</el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('settings.tabs.performance')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.download') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.threads') }}</span>
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
        <el-tab-pane :label="$t('settings.tabs.fonts')">
          <el-table size="small" height="400" highlight-current-row :data="settingsStore.availableFonts" border
                    @cell-dblclick="handleActivateInput">
            <el-table-column fixed prop="family" :label="$t('settings.fontFamilyCol')" show-overflow-tooltip/>
            <el-table-column prop="familyAlias" :label="$t('settings.fontAliasCol')" show-overflow-tooltip>
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
        <el-tab-pane :label="$t('settings.tabs.language')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.languageGroup') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.interfaceLanguage') }}</span>
                <el-select v-model="settingsStore.projectSettings.locale.language" @change="applyLanguage" class="value"
                           size="small">
                  <el-option
                      v-for="item in languageOptions"
                      :key="item.value"
                      :label="item.labelKey ? $t(item.labelKey) : item.label"
                      :value="item.value"/>
                </el-select>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('settings.tabs.others')">
          <div class="border-box">
            <span class="border-label">{{ $t('settings.personalization') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.optionAnchor') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.optionAnchorPoint"
                    class="value"/>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.deleteTips') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.deleteTipVisible"
                    class="value"/>
              </div>
              <div class="option">
                <span class="label">{{ $t('settings.autoCenter') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.autoCenterOnToggle"
                    class="value"/>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">{{ $t('settings.canvasGroup') }}</span>
            <div class="options">
              <div class="option">
                <span class="label">{{ $t('settings.moveStep') }}</span>
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
                <span class="label">{{ $t('settings.defaultScale') }}</span>
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
              <div class="option">
                <span class="label">{{ $t('settings.focalZoom') }}</span>
                <el-switch
                    v-model="settingsStore.projectSettings.others.focalZoom"
                    class="value"/>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <!--        <el-tab-pane label="图片"></el-tab-pane>-->
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="danger" @click="resetAllSettings">{{ $t('settings.resetAll') }}</el-button>
        </div>
      </template>
    </el-dialog>
    <ConfirmDialog ref="confirmRef"/>
  </div>
</template>

<script setup lang="js">

import {ref, nextTick, computed} from 'vue'

import _ from 'lodash'

import {useI18n} from 'vue-i18n'

import FontManager from '@/utils/font-manager'

import Notification from '@/utils/notification'

import {parseDate, formatDate} from '@/utils/datetime'

import CanvasManager from '@/object/canvas-manager'

import {canvasActions} from '@/object/canvas-actions'

import {FontSettings} from '@/object/Configuration'

import {useProjectSettingsStore} from '@/stores/project-settings'
import {useCanvasesStore} from '@/stores/canvases'
import {defaultProjectSettings} from '@/config/default-project-settings'
import {languageOptions, applyLanguage} from '@/locales'

import ConfirmDialog from '@/components/index/dialogs/ConfirmDialog.vue'

import {useTheme} from '@/composables/shared/useTheme'

const {t} = useI18n()

// 偏好设置弹窗的静态下拉选项：经 computed 依赖 locale，切换语言自动更新
const outputSizeOptions = computed(() => [
  {label: t('settings.outputSizeOptions.best'), value: 0},
  {label: t('settings.outputSizeOptions.fixedWidth'), value: 1},
  {label: t('settings.outputSizeOptions.fixedHeight'), value: 2},
  {label: t('settings.outputSizeOptions.adaptive'), value: 3},
])

const downloadThreadsOptions = computed(() => [
  {label: t('settings.downloadThreadsOptions.auto'), value: -1},
  {label: '4', value: 4},
  {label: '8', value: 8},
  {label: '12', value: 12},
  {label: '16', value: 16},
  {label: '32', value: 32}
])

const settingsStore = useProjectSettingsStore()

const canvasesStore = useCanvasesStore()

const settingsDialogVisible = ref(false)

const confirmRef = ref(null)

const {applyTheme, renderUiStyle} = useTheme();

// 主题单选切换后应用主题
const handleThemeChange = () => {
  const theme = ['light', 'dark', 'system'].includes(settingsStore.projectSettings.appearance?.theme)
      ? settingsStore.projectSettings.appearance.theme
      : 'system'
  applyTheme(theme)
}

/* 界面配色预设：5 配色（默认琥珀/靛青/松烟/胭脂/紫藤）× 卡片/扁平，值编码 "<accent>-<card|flat>" */
const uiThemeOptions = ['default', 'indigo', 'pine', 'crimson', 'wisteria'].flatMap(accent => [true, false].map(cards => ({
    value: `${accent}-${cards ? 'card' : 'flat'}`,
    accentKey: accent === 'default' ? 'themeDefault' : `theme${accent.charAt(0).toUpperCase()}${accent.slice(1)}`,
    cards
})));

// 下拉按「扁平 / 卡片」分成两组，选项 label 只显示配色名
const uiThemeGroups = computed(() => ([
    {labelKey: 'themeGroupFlat', options: uiThemeOptions.filter(o => !o.cards)},
    {labelKey: 'themeGroupCards', options: uiThemeOptions.filter(o => o.cards)},
]));

const uiThemePreset = computed(() => {
    const appearance = settingsStore.projectSettings.appearance;
    const accent = appearance.uiTheme || 'default';
    return `${accent}-${appearance.showGroupCards === false ? 'flat' : 'card'}`;
});

const handleUiThemeChange = (val) => {
    const appearance = settingsStore.projectSettings.appearance;
    const idx = val.lastIndexOf('-');
    appearance.uiTheme = val.slice(0, idx);
    appearance.showGroupCards = val.slice(idx + 1) === 'card';
    renderUiStyle();
};

// 应用菜单"偏好设置"的 IPC 监听
window.electronAPI.openSettingsDialog(() => {
  settingsDialogVisible.value = true
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
              FontManager.loadFont(family, font.url).then(() => {
                // 启动恢复（type -1）的字体加载完成后，若画布已用回退字体渲染过，
                // 重绘一次当前画布，消除首帧字体度量偏差（如装饰框切字）
                if (type === -1) {
                  const canvas = CanvasManager.getCurrentCanvas();
                  if (canvas?.completed) {
                    canvasActions.renderCanvas(canvas);
                  }
                }
              })
              if (type === 0) {
                setTimeout(() => {
                  Notification.success(t('settings.fontLoaded', {family}), t('common.notice'))
                }, 100)
              }
            } catch (error) {
              Notification.error(error.message, t('common.notice'))
              continue
            }
          }
          if (!settingsStore.projectSettings.availableFonts.has(family)) {
            const fontSettings = new FontSettings();
            fontSettings.family = family
            fontSettings.familyAlias = family
            settingsStore.projectSettings.availableFonts.set(family, {...fontSettings, ...font});
          }
        }
      } else if (type === 1) {
        const family = data.family;
        settingsStore.projectSettings.availableFonts.delete(family)
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
      applyLanguage(newUserSettings.locale?.language || 'system')
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

// 重置元数据格式并重新格式化画布元数据
const resetMetadataSettings = () => {
  settingsStore.projectSettings.metadata = _.cloneDeep(defaultProjectSettings.metadata)
  handleUpdateMetadata()
}

// 恢复全部设置为工厂默认（保留可用字体），并重新联动生效主题 / 布局 / 画布缩放 / 滚动条 / 元数据 / 焦距
const resetAllSettings = async () => {
  const ok = await confirmRef.value?.confirm({
    title: t('settings.resetConfirm.title'),
    message: t('settings.resetConfirm.message'),
    confirmText: t('settings.resetConfirm.confirm'),
    cancelText: t('common.cancel'),
    confirmType: 'danger'
  });
  if (!ok) return; // 用户取消
  settingsStore.resetProjectSettings();
  // 重新生效（与设置导入联动保持一致）
  handleCanvasScale();
  renderCanvasScrollbar();
  handleUpdateMetadata();
  handleFocalLength(settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment ? 1 : 0);
  initAreaResize();
  canvasActions.centerCanvasScrollBar();
  applyTheme(settingsStore.projectSettings.appearance?.theme || 'system');
  applyLanguage(settingsStore.projectSettings.locale?.language || 'system');
  Notification.success(t('settings.allReset'), t('common.notice'));
};

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

/* 切换设置项的标签条：仅调整 Element Plus 默认高度（40px），其余保持组件默认样式 */
:deep(.el-tabs) {
  --el-tabs-header-height: 36px;
}

/* 弹窗整体限高 65vh：header/footer 不被压缩，标签页区域弹性伸缩、内容区内部滚动
   （原先 .el-tabs 的 max-height: 70vh 由该限高接管） */
.dialog-wrapper :deep(.el-dialog) {
  max-height: 65vh;
  display: flex;
  flex-direction: column;
}

.dialog-wrapper :deep(.el-dialog__header),
.dialog-wrapper :deep(.el-dialog__footer) {
  flex-shrink: 0;
}

.dialog-wrapper :deep(.el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.el-tabs {
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  font-size: 12px;

  .operation {
    height: 40px;
    display: flex;
    justify-content: right;
    align-items: end;
  }

  :deep(.el-tabs__content) {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    background-color: var(--app-dialog-body-bg);
    /* 基础样式 */
    .border-box {
      position: relative;
      border: 1px solid var(--app-dialog-line);
      border-radius: 2px;
      padding: 15px 10px;
      margin: 25px 0;

      .border-label {
        position: absolute;
        top: -7px;
        left: 15px;
        background-color: var(--app-dialog-body-bg);
        padding: 0 12px;
        font-size: 13px;
        color: var(--app-secondary-text);
      }

      .options {
        width: 100%;
        // 标签列宽度取组内最长标签（max-content）并右对齐，控件列左缘对齐：
        // 中英文标签长短不同均可自适应，不换行、也不留大片空白
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: 8px;
        // 各行的 .label 与控件直接参与本网格，由这里统一垂直居中
        align-items: center;

        // 外观-主题框：第二列宽度由主题模式单选组的自然宽度撑起，
        // 界面配色下拉拉伸至同宽，使下拉框右缘与单选组右缘对齐（而非贴到对话框右缘）
        &.theme-options {
          grid-template-columns: max-content max-content;

          .option .el-select.value {
            width: 100%;
          }
        }

        .option {
          font-size: 13px;
          // Electron 22（Chromium 108）不支持 subgrid，改用兼容性更好的 display: contents：
          // 行盒子自身不再生成，.label 与控件直接落入父级两列网格，所有行仍共享同一标签列
          display: contents;

          // 行高保持原值（原先由 .option 的 min-height 提供，现由标签撑起）；
          // 标签内部垂直居中，控件保持自然高度、由 .options 的 align-items 统一居中
          > .label {
            min-height: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .label {
            font-size: 13px;
            text-align: right;
            white-space: nowrap;
          }

          .shooting-time-label {
            // 合并行中与前一输入框拉开间隔，区分“拍摄日期”“日期格式”两项（8px 间隙 + 12px = 20px）
            margin-left: 12px;
          }

          .value {
            width: 150px;
          }

          // 数值输入 + 单位（px）的组合，占满标签右侧剩余宽度
          .input-unit {
            display: flex;
            align-items: center;
            column-gap: 8px;
          }


          .metadata-input {
            width: 100%;
          }

          // 拍摄日期 + 日期格式合并为一行：首个标签仍落在公共标签列，
          // 右侧组合内部用 flex 排布，两个输入框平分剩余宽度
          .date-format-group {
            display: flex;
            align-items: center;
            // 与 .options 的 column-gap 保持一致，保证各处“标签-组件”间距统一
            column-gap: 8px;
            min-width: 0;

            .metadata-input.shooting-time {
              width: auto;
              flex: 1;
              min-width: 0;
            }
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
