<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="settingsDialogVisible" :title="$t('settings.title')" align-center width="920"
               class="settings-dialog">
      <div class="settings-layout">
        <!-- 左侧：导航栏（参考样式：顶部搜索框 + 平铺导航项） -->
        <aside class="settings-nav">
          <div class="nav-search">
            <SvgIcon name="search" class="nav-search-icon"/>
            <input v-model="navQuery" :placeholder="$t('settings.searchPlaceholder')" spellcheck="false"/>
          </div>
          <button v-for="item in filteredNavItems" :key="item.key"
                  type="button"
                  class="nav-item"
                  :class="{ 'is-active': activePage === item.key }"
                  @click="activePage = item.key">
            <SvgIcon :name="item.icon" class="nav-icon"/>
            <span class="nav-label">{{ $t(item.labelKey) }}</span>
          </button>
          <div v-if="!filteredNavItems.length" class="nav-empty">{{ $t('settings.searchNoResults') }}</div>
        </aside>

        <!-- 右侧：设置内容区（大标题 + 分节卡片，每行「标签 + 描述」在左、控件在右） -->
        <section class="settings-page">
          <h2 class="page-title">{{ $t(currentNavItem.labelKey) }}</h2>

          <!-- 导出 -->
          <template v-if="activePage === 'export'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.imageSize') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.adjustMode') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.adjustMode') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-select v-model="settingsStore.projectSettings.outputSettings.outputSize.type"
                               :placeholder="$t('common.select')">
                      <el-option
                          v-for="item in outputSizeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"/>
                    </el-select>
                  </div>
                </div>
                <div class="setting-row" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===1">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.width') }}</div>
                  </div>
                  <div class="row-control w-num">
                    <div class="input-unit">
                      <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.width"
                                :placeholder="$t('settings.widthPlaceholder')"/>
                      <span class="unit">&nbsp;px</span>
                    </div>
                  </div>
                </div>
                <div class="setting-row" v-show="settingsStore.projectSettings.outputSettings.outputSize.type ===2">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.height') }}</div>
                  </div>
                  <div class="row-control w-num">
                    <div class="input-unit">
                      <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.height"
                                :placeholder="$t('settings.heightPlaceholder')"/>
                      <span class="unit">&nbsp;px</span>
                    </div>
                  </div>
                </div>
                <div class="setting-row" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.maxWidth') }}</div>
                  </div>
                  <div class="row-control w-num">
                    <div class="input-unit">
                      <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxWidth"
                                :placeholder="$t('settings.maxWidthPlaceholder')"/>
                      <span class="unit">&nbsp;px</span>
                    </div>
                  </div>
                </div>
                <div class="setting-row" v-show="settingsStore.projectSettings.outputSettings.outputSize.type===3">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.maxHeight') }}</div>
                  </div>
                  <div class="row-control w-num">
                    <div class="input-unit">
                      <el-input v-model.number="settingsStore.projectSettings.outputSettings.outputSize.maxHeight"
                                :placeholder="$t('settings.maxHeightPlaceholder')"/>
                      <span class="unit">&nbsp;px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-title">{{ $t('settings.imageSettings') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.outputFormat') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.outputFormat') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-select v-model="settingsStore.projectSettings.outputSettings.extname">
                      <el-option
                          v-for="item in [{label:$t('settings.formatOriginal'), value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}, {label:'WEBP', value: 3}, {label:'AVIF', value: 4}, {label:'GIF', value: 5}]"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"/>
                    </el-select>
                  </div>
                </div>
                <div class="setting-row" v-show="[1,3,4].includes(settingsStore.projectSettings.outputSettings.extname)">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.imageQuality') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.imageQuality') }}</div>
                  </div>
                  <div class="row-control w-slider">
                    <el-slider
                        v-model="settingsStore.projectSettings.outputSettings.quality"
                        :min="1"
                        :max="100"
                        show-input/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.syncMetadata') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.syncMetadata') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.outputSettings.isSynchronizeMetadata"/>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-title">{{ $t('settings.fileNaming') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.namingMode') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.namingMode') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-select v-model="settingsStore.projectSettings.outputSettings.fileNaming.basename">
                      <el-option
                          v-for="item in [{label:$t('settings.nameOriginal'), value: 0}, {label:$t('settings.nameIndex'), value: 1}, {label:$t('settings.nameRandom'), value: 2}]"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"/>
                    </el-select>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.prefix') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.prefix') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-input spellcheck="false"
                              v-model="settingsStore.projectSettings.outputSettings.fileNaming.prefix"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.suffix') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.suffix') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-input spellcheck="false"
                              v-model="settingsStore.projectSettings.outputSettings.fileNaming.suffix"/>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 外观 -->
          <template v-else-if="activePage === 'appearance'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.themeGroup') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.themeMode') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.themeMode') }}</div>
                  </div>
                  <div class="row-control">
                    <el-radio-group
                        v-model="settingsStore.projectSettings.appearance.theme"
                        @change="handleThemeChange">
                      <el-radio-button value="dark">{{ $t('settings.themeDark') }}</el-radio-button>
                      <el-radio-button value="light">{{ $t('settings.themeLight') }}</el-radio-button>
                      <el-radio-button value="system">{{ $t('settings.themeSystem') }}</el-radio-button>
                    </el-radio-group>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.uiTheme') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.uiTheme') }}</div>
                  </div>
                  <div class="row-control">
                    <el-color-picker
                        v-model="uiAccent"
                        :predefine="uiAccentPresets"
                        @change="handleUiAccentChange"/>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-title">{{ $t('settings.canvasViewport') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.scrollbar') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.scrollbar') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch
                        @change="renderCanvasScrollbar"
                        v-model="settingsStore.projectSettings.appearance.enableScrollbar"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.zoomPill') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.zoomPill') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.appearance.enableZoomPill"/>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 语言 -->
          <template v-else-if="activePage === 'language'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.languageGroup') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.interfaceLanguage') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.interfaceLanguage') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-select v-model="settingsStore.projectSettings.locale.language" @change="applyLanguage">
                      <el-option
                          v-for="item in languageOptions"
                          :key="item.value"
                          :label="$t(item.labelKey)"
                          :value="item.value"/>
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 元数据 -->
          <template v-else-if="activePage === 'metadata'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.formatting') }}</div>
              <div class="settings-card compact-rows">
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.cameraBrand') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.cameraBrand"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.cameraModel') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.cameraModel"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.lensModel') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.lensModel"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.focalLength') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.focalLength"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.iso') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.iso"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.shutter') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.shutter"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.aperture') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.aperture"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.shootingDate') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.shootingTime"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.dateFormat') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.others.shootingTimeFormat"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info"><div class="row-label">{{ $t('settings.filename') }}</div></div>
                  <div class="row-control w-input">
                    <el-input spellcheck="false"
                              @change="handleUpdateMetadata"
                              v-model="settingsStore.projectSettings.metadata.formats.filename"/>
                  </div>
                </div>
              </div>
            </div>

            <!-- 重置：独立于格式化项的恢复操作，避免与设置项混淆 -->
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.resetGroup') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.resetMetadata') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.resetMetadata') }}</div>
                  </div>
                  <div class="row-control">
                    <el-button @click="resetMetadataSettings">{{ $t('settings.resetMetadata') }}</el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-title">{{ $t('settings.focalConversion') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.equivFocal') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.equivFocal') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch
                        @change="handleFocalLength(0)"
                        v-model="settingsStore.projectSettings.metadata.others.enableEquivalentFocalSegment"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.cropFactor') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.cropFactor') }}</div>
                  </div>
                  <div class="row-control w-num">
                    <el-input class="w-num-input"
                              spellcheck="false"
                              @change="handleFocalLength(1)"
                              v-model="settingsStore.projectSettings.metadata.others.conversionMultiple"/>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 性能 -->
          <template v-else-if="activePage === 'performance'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.download') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.threads') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.threads') }}</div>
                  </div>
                  <div class="row-control w-select">
                    <el-select v-model="settingsStore.projectSettings.performance.downloadThreads">
                      <el-option
                          v-for="item in downloadThreadsOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"/>
                    </el-select>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 其他 -->
          <template v-else-if="activePage === 'others'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.personalization') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.optionAnchor') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.optionAnchor') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.others.optionAnchorPoint"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.deleteTips') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.deleteTips') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.others.deleteTipVisible"/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.autoCenter') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.autoCenter') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.others.autoCenterOnToggle"/>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-title">{{ $t('settings.canvasGroup') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.moveStep') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.moveStep') }}</div>
                  </div>
                  <div class="row-control w-slider">
                    <el-slider
                        v-model="settingsStore.projectSettings.others.movingStepSize"
                        :min="1"
                        :max="100"
                        show-input/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.defaultScale') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.defaultScale') }}</div>
                  </div>
                  <div class="row-control w-slider">
                    <el-slider
                        @change="handleCanvasScale"
                        v-model="settingsStore.projectSettings.others.defaultCanvasScale"
                        :min="0.05"
                        :max="1"
                        :step="0.05"
                        show-input/>
                  </div>
                </div>
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.focalZoom') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.focalZoom') }}</div>
                  </div>
                  <div class="row-control">
                    <el-switch v-model="settingsStore.projectSettings.others.focalZoom"/>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <!-- 重置设置 -->
          <template v-else-if="activePage === 'reset'">
            <div class="settings-section">
              <div class="section-title">{{ $t('settings.resetNav') }}</div>
              <div class="settings-card">
                <div class="setting-row">
                  <div class="row-info">
                    <div class="row-label">{{ $t('settings.resetConfirm.title') }}</div>
                    <div class="row-desc">{{ $t('settings.desc.reset') }}</div>
                  </div>
                  <div class="row-control">
                    <el-button type="danger" @click="resetAllSettings">{{ $t('settings.resetConfirm.confirm') }}</el-button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </section>
      </div>
    </el-dialog>
    <ConfirmDialog ref="confirmRef"/>
  </div>
</template>

<script setup lang="js">

import {ref, computed, watch} from 'vue'

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

// 左侧导航项：key 对应右侧内容区页面；search 为该页各设置项的 i18n 键（供搜索匹配）
const navItems = [
  {
    key: 'export', icon: 'cmd-export', labelKey: 'settings.tabs.export',
    search: ['imageSize', 'adjustMode', 'width', 'height', 'maxWidth', 'maxHeight',
      'imageSettings', 'outputFormat', 'formatOriginal', 'imageQuality', 'syncMetadata',
      'fileNaming', 'namingMode', 'nameOriginal', 'nameIndex', 'nameRandom', 'prefix', 'suffix',
      'desc.adjustMode', 'desc.outputFormat', 'desc.imageQuality', 'desc.syncMetadata',
      'desc.namingMode', 'desc.prefix', 'desc.suffix']
  },
  {
    key: 'appearance', icon: 'cmd-moon', labelKey: 'settings.tabs.appearance',
    search: ['themeGroup', 'themeMode', 'themeDark', 'themeLight', 'themeSystem', 'uiTheme',
      'canvasViewport', 'scrollbar', 'zoomPill',
      'desc.themeMode', 'desc.uiTheme', 'desc.scrollbar', 'desc.zoomPill']
  },
  {
    key: 'language', icon: 'set-language', labelKey: 'settings.tabs.language',
    search: ['languageGroup', 'interfaceLanguage', 'languageSystem', 'languageZh', 'languageEn',
      'desc.interfaceLanguage']
  },
  {
    key: 'metadata', icon: 'cmd-doc-lines', labelKey: 'settings.tabs.metadata',
    search: ['formatting', 'cameraBrand', 'cameraModel', 'lensModel', 'focalLength', 'iso',
      'shutter', 'aperture', 'shootingDate', 'dateFormat', 'filename',
      'resetGroup', 'resetMetadata', 'desc.resetMetadata',
      'focalConversion', 'equivFocal', 'cropFactor', 'desc.equivFocal', 'desc.cropFactor']
  },
  {
    key: 'performance', icon: 'cmd-sliders', labelKey: 'settings.tabs.performance',
    search: ['download', 'threads', 'desc.threads']
  },
  {
    key: 'others', icon: 'set-others', labelKey: 'settings.tabs.others',
    search: ['personalization', 'optionAnchor', 'deleteTips', 'autoCenter', 'canvasGroup',
      'moveStep', 'defaultScale', 'focalZoom',
      'desc.optionAnchor', 'desc.deleteTips', 'desc.autoCenter', 'desc.moveStep',
      'desc.defaultScale', 'desc.focalZoom']
  },
  {
    key: 'reset', icon: 'refresh', labelKey: 'settings.resetNav',
    search: ['resetAll', 'resetConfirm.title', 'desc.reset']
  },
]

const activePage = ref('export')

// 侧边栏搜索：按页面名称与各设置项标签 / 描述过滤导航项
const navQuery = ref('')

const filteredNavItems = computed(() => {
  const query = navQuery.value.trim().toLowerCase()
  if (!query) return navItems
  return navItems.filter(item =>
      t(item.labelKey).toLowerCase().includes(query)
      || (item.search || []).some(key => t(`settings.${key}`).toLowerCase().includes(query)))
})

// 搜索后若当前页不在结果中，自动切换到第一个匹配页
watch(filteredNavItems, (list) => {
  if (list.length && !list.some(item => item.key === activePage.value)) {
    activePage.value = list[0].key
  }
})

const currentNavItem = computed(() => navItems.find(item => item.key === activePage.value) || navItems[0])

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

/* 界面配色：颜色选择器自定义强调色，默认靛青（设计稿色值） */
const DEFAULT_UI_ACCENT = '#3E63DD';

// 预置快捷色板（含默认靛青）
const uiAccentPresets = [
  '#3E63DD', '#5B8CFF', '#2E8F66', '#C8515E', '#8B5FC9',
  '#E49421', '#0EA5A5', '#D64545', '#7A756A', '#26231E',
];

const uiAccent = computed({
  get: () => settingsStore.projectSettings.appearance.uiAccent || DEFAULT_UI_ACCENT,
  set: (val) => {
    settingsStore.projectSettings.appearance.uiAccent = val || DEFAULT_UI_ACCENT;
  }
});

// 选色后立即派生并应用配色；清空时回落默认靛青
const handleUiAccentChange = (val) => {
  settingsStore.projectSettings.appearance.uiAccent = val || DEFAULT_UI_ACCENT;
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

// 字体导入 / 移除监听：加载字体并维护运行时字体缓存（不持久化，启动时由主进程推送重建）
const watchImportFonts = () => {
  window.electronAPI.watchImportFonts(async (event, {type, data}) => {
    if (data) {
      if (type === 0 || type === -1) {
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
          if (!settingsStore.availableFontsMap.has(family)) {
            const fontSettings = new FontSettings();
            fontSettings.family = family
            fontSettings.familyAlias = family
            settingsStore.availableFontsMap.set(family, {...fontSettings, ...font});
          }
        }
      } else if (type === 1) {
        const family = data.family;
        settingsStore.availableFontsMap.delete(family)
      }
    }
  })
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

// 恢复元数据格式为默认值（仅「格式化」项：字段模板 + 日期格式，不影响焦距转换），并重新格式化画布元数据
const resetMetadataSettings = () => {
  const metadata = settingsStore.projectSettings.metadata;
  metadata.formats = _.cloneDeep(defaultProjectSettings.metadata.formats);
  metadata.others.shootingTimeFormat = defaultProjectSettings.metadata.others.shootingTimeFormat;
  handleUpdateMetadata();
  // 焦段显示 = 格式模板 × 焦距转换：格式恢复后按当前转换状态重算一次焦段
  handleFocalLength(metadata.others.enableEquivalentFocalSegment ? 1 : 0);
}

// 恢复全部设置为工厂默认，并重新联动生效主题 / 布局 / 画布缩放 / 滚动条 / 元数据 / 焦距
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

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

/* 弹窗固定高度 72vh（原最大高度值）并默认居中：header/footer 不被压缩，
   设置区弹性伸缩、内容不足时右侧留白，内部滚动。
   高度规则用 .settings-dialog 限定：确认框（ConfirmDialog）也嵌套渲染在本组件
   .dialog-wrapper 内，不带限定会被 :deep 命中、被强加 72vh 高度而撑成巨框。
   padding 清零（覆盖 dialog.scss 的 1px 内衬与 10px 底部留白）：标题栏分隔线与
   侧栏分隔线都通到弹窗边缘；圆角与 Electron 默认窗口圆角（Win11 8px）一致 */
.dialog-wrapper :deep(.el-dialog.settings-dialog) {
  height: 72vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-wrapper :deep(.el-dialog.settings-dialog > .el-dialog__header),
.dialog-wrapper :deep(.el-dialog.settings-dialog > .el-dialog__footer) {
  flex-shrink: 0;
}

.dialog-wrapper :deep(.el-dialog.settings-dialog > .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  overflow: hidden;
  /* 内边距清零：侧栏分隔线要通到弹窗上下边缘，间距由布局内部自己控制 */
  padding: 0;
}

/* 关闭按钮的 top 在 dialog.scss 里带 +1px 补偿（弹窗旧 1px 顶部内衬）；
   本弹窗内衬已清零，去掉补偿才是垂直居中 */
.dialog-wrapper :deep(.el-dialog.settings-dialog > .el-dialog__header .el-dialog__headerbtn) {
  top: calc((var(--app-dialog-header-height) - 24px) / 2);
}

/* ---------- 整体布局：左导航 + 右内容 ---------- */
.settings-layout {
  width: 100%;
  display: flex;
  gap: 12px;
  min-height: 0;
}

/* 左侧导航栏 */
.settings-nav {
  width: 188px;
  flex-shrink: 0;
  min-height: 0;
  overflow-y: auto;
  // 左右留白对称：搜索框与导航项同宽、两侧边距一致；上下 10px 与右侧内容区对齐
  padding: 10px;
  // 设计稿：侧栏底色比弹窗主体略深一档（亮 #FBFBFC / 暗 #131316）
  background: var(--app-dialog-nav-bg);
  border-right: 1px solid var(--app-dialog-line);
}

/* 顶部搜索框：浅灰圆角填充 + 内嵌放大镜图标 */
.nav-search {
  position: relative;
  margin: 4px 0 10px;

  .nav-search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    width: 14px;
    height: 14px;
    transform: translateY(-50%);
    color: var(--app-secondary-text);
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 32px;
    box-sizing: border-box;
    border: none;
    outline: none;
    border-radius: var(--app-radius-lg);
    background: var(--app-dialog-subtle-bg);
    padding: 0 10px 0 30px;
    font-size: 12.5px;
    font-family: inherit;
    color: var(--ui-text);
    transition: box-shadow var(--app-transition);

    &::placeholder {
      color: var(--app-secondary-text);
    }

    &:focus {
      box-shadow: 0 0 0 1px var(--ui-accent) inset;
    }
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 38px;
  padding: 0 12px;
  margin-bottom: 2px;
  border: none;
  border-radius: var(--app-radius-lg);
  background: transparent;
  color: var(--ui-text);
  font-size: 13px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--app-transition), color var(--app-transition);

  &:hover {
    background: var(--app-dialog-row-hover-bg);
  }

  &.is-active {
    background: var(--app-dialog-selected-bg);
    font-weight: 600;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: var(--app-secondary-text);
    transition: color var(--app-transition);
  }

  &.is-active .nav-icon {
    color: var(--ui-accent);
  }

  .nav-label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.nav-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--app-secondary-text);
}

/* 右侧内容区 */
.settings-page {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 18px 12px 22px;
}

/* 页面大标题（参考样式中的「常规」一级标题） */
.page-title {
  margin: 4px 0 18px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--app-dialog-title);
  user-select: none;
}

.settings-section {
  margin-bottom: 26px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--app-dialog-title);
  padding: 0 2px 10px;
  user-select: none;
}

/* 卡片类名用专属的 settings-card，避免与其他弹窗 / 全局样式撞名 */
.settings-card {
  background: var(--app-settings-card-bg);
  border: 1px solid var(--app-settings-card-border);
  border-radius: 10px;
  padding: 4px 18px;
}

/* 设置行：左「标签 + 描述」、右控件（参考样式：行间留白分隔，不画分隔线） */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 9px 0;
}

/* 格式化组行数较多，收紧行距让整组更紧凑（仅该卡片生效） */
.settings-card.compact-rows .setting-row {
  padding: 5px 0;
}

.row-info {
  flex: 1 1 auto;
  min-width: 0;
}

.row-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text);
  line-height: 1.4;
}

.row-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-secondary-text);
  line-height: 1.5;
}

.row-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  // 控件宽度档位：下拉 / 输入 / 数值 / 滑块 / 宽输入区
  &.w-select .el-select,
  &.w-select .el-input {
    width: 180px;
  }

  &.w-input .el-input,
  &.w-input .el-select {
    width: 240px;
  }

  &.w-num .el-input {
    width: 150px;
  }

  &.w-slider .el-slider {
    width: 240px;

    --el-slider-button-size: 13px;
    --el-slider-height: 6px;

    /* 滑块与计数器的间距：EP 默认给滑轨留 30px 右边距，收紧到 8px */
    :deep(.el-slider__runway.show-input) {
      margin-right: 8px;
    }

    /* 计数器：EP 默认 130px。收窄的同时同步缩小两侧步进按钮（32px→24px）
       与输入区内边距（42px→26px），否则数字会被裁切 */
    :deep(.el-slider__input) {
      width: 96px;

      .el-input-number__decrease,
      .el-input-number__increase {
        width: 24px;
      }

      .el-input__wrapper {
        padding-left: 26px;
        padding-right: 26px;
      }
    }
  }
}

/* 数值输入 + 单位（px）组合 */
.input-unit {
  display: flex;
  align-items: center;

  .unit {
    color: var(--app-secondary-text);
    font-size: 12px;
  }
}
</style>
