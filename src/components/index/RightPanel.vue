<template>
  <div class="settings-details">
    <el-aside>
      <el-scrollbar>
        <el-menu :default-openeds="['1', '5', '2', '3', '4']" ref="menuRef" @open="handleOpenMenu" @close="handleCloseMenu">
          <el-sub-menu index="1" class="sub-menu sub-menu-metadata" :class="{'is-active': activeSection === '1'}">
            <template #title>
              <span class="title-text" @click="setActiveSection('1')">{{ $t('right.metadata') }}</span>
            </template>
            <ul class="options metadata" ref="metadataRef">
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="cameraBrand">{{ $t('right.cameraBrand') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.cameraBrand" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="cameraModel">{{ $t('right.cameraModel') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.cameraModel" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="lensModel">{{ $t('right.lensModel') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.lensModel" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="focalLength">{{ $t('right.focalLength') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.focalLength" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="iso">{{ $t('right.iso') }}</div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.iso" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="shutter">{{ $t('right.shutter') }}</div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.shutter" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="aperture">{{ $t('right.aperture') }}</div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.aperture" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="shootingTime">{{ $t('right.shootingDate') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.shootingTime" size="small"/>
                </div>
              </li>
              <li class="option">
                <div class="label">
                  <div class="text-resource" draggable="true" type="metadata" expression="filename">{{ $t('right.filename') }}
                  </div>
                </div>
                <div class="value">
                  <el-input spellcheck="false" v-model="canvasesStore.metadataOptions.filename" size="small"/>
                </div>
              </li>
            </ul>
          </el-sub-menu>
          <el-sub-menu index="5" class="sub-menu" :class="{'is-active': activeSection === '5'}">
            <template #title>
              <span class="title-text" @click="setActiveSection('5')">{{ $t('right.photo') }}</span>
            </template>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.rounded') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdatePhotograph"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.photographOptions.borderRadius"
                      size="small"
                      :min="0"
                      :max="100"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdatePhotograph"
                         v-model="canvasesStore.photographOptions.borderRadius"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.offsetX') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdatePhotograph"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.photographOptions.shadow.offsetX"
                      size="small"
                      :min="-200"
                      :max="200"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdatePhotograph"
                         v-model="canvasesStore.photographOptions.shadow.offsetX"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.offsetY') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdatePhotograph"
                      v-model="canvasesStore.photographOptions.shadow.offsetY"
                      :min="-200"
                      :max="200"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdatePhotograph"
                         v-model="canvasesStore.photographOptions.shadow.offsetY"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.blurAmount') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      @input="handleUpdatePhotograph"
                      v-model="canvasesStore.photographOptions.shadow.blur"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdatePhotograph"
                         v-model="canvasesStore.photographOptions.shadow.blur"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.shadowColor') }}</div>
                <div class="value">
                  <el-color-picker
                      @change="handleUpdatePhotograph"
                      v-model="canvasesStore.photographOptions.shadow.color"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                </div>
              </li>
            </ul>
          </el-sub-menu>
          <el-sub-menu index="2" class="sub-menu" :class="{'is-active': activeSection === '2'}">
            <template #title>
              <span class="title-text" @click="setActiveSection('2')">{{ $t('right.border') }}</span>
            </template>

            <!-- 边框类型：分段控件（绑定同一 borderType 字段，替换原下拉框） -->
            <div class="segmented-control">
              <button
                  v-for="item in [
                    {value: 0, label: $t('right.borderTypeOptions.general')},
                    {value: 1, label: $t('right.borderTypeOptions.blur')},
                    {value: 2, label: $t('right.borderTypeOptions.custom')}
                  ]"
                  :key="item.value"
                  type="button"
                  class="segment"
                  :class="{'is-active': canvasesStore.borderOptions.borderType === item.value}"
                  @click="handleBorderTypeChange(item.value)">
                {{ item.label }}
              </button>
            </div>

            <ul class="options">
              <li class="option" v-show="canvasesStore.borderOptions.borderType === 2">
                <div class="label">{{ $t('right.borderImage') }}</div>
                <div class="value">
                  <el-button @click="requestImportBorderImage" size="small" type="primary">{{ $t('right.choose') }}</el-button>
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.borderTop') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderTop"
                      size="small"
                      :min="sliderRange.min"
                      :max="sliderRange.max"
                      placement="top"/>
                  <input type="number" class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderTop"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.borderBottom') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderBottom"
                      size="small"
                      :min="sliderRange.min"
                      :max="sliderRange.max"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderBottom"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.borderLeft') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderLeft"
                      size="small"
                      :min="sliderRange.min"
                      :max="sliderRange.max"
                      placement="top"/>
                  <input type="number" class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderLeft"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.borderRight') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderRight"
                      size="small"
                      :min="sliderRange.min"
                      :max="sliderRange.max"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderRight"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.rounded') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderRadius"
                      size="small"
                      :min="0"
                      :max="100"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderRadius"
                         step="1">
                </div>
              </li>
              <li class="option" v-show="[1,2].includes(canvasesStore.borderOptions.borderType)">
                <div class="label">{{ $t('right.borderBlur') }}</div>
                <div class="value">
                  <el-slider
                      @input="handleUpdateBorders"
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.borderOptions.borderBlur"
                      size="small"
                      :min="0"
                      :max="50"
                      placement="top"/>
                  <input type="number"
                         class="number-input"
                         @input="handleUpdateBorders"
                         v-model="canvasesStore.borderOptions.borderBlur"
                         step="1">
                </div>
              </li>
              <li class="option" v-show="canvasesStore.borderOptions.borderType === 0">
                <div class="label">{{ $t('right.borderColor') }}</div>
                <div class="value">
                  <el-color-picker
                      size="small"
                      @change="handleUpdateBorders"
                      v-model="canvasesStore.borderOptions.borderColor"
                      show-alpha
                      :predefine="predefineColors"/>
                </div>
              </li>
            </ul>
          </el-sub-menu>
          <el-sub-menu index="3" id="text-options" class="sub-menu" :class="{'is-active': activeSection === '3'}">
            <template #title>
              <span class="title-text" @click="setActiveSection('3')">{{ $t('right.text') }}</span>
            </template>
            <div class="group-title">{{ $t('right.basicProps') }}</div>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.direction') }}</div>
                <div class="value">
                  <el-select
                      v-model="canvasesStore.textOptions.direction"
                      :options="[{label: $t('right.directionOptions.horizontal'), value: 'horizontal'}, {label: $t('right.directionOptions.vertical'), value: 'vertical'}]"
                      size="small"
                      placeholder="Select"/>
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.fontType') }}</div>
                <div class="value">
                  <el-select
                      v-model="canvasesStore.textOptions.fontFamily"
                      filterable
                      size="small"
                      :filter-method="handleFilterFonts"
                      placeholder="Select">
                    <el-option
                        v-for="font in matchFonts"
                        :key="font.family"
                        :label="font.familyAlias"
                        :value="font.family"/>
                  </el-select>
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.fontStyle') }}</div>
                <div class="value">
                  <el-select
                      v-model="canvasesStore.textOptions.fontStyle"
                      :options="[ {label: $t('right.fontStyleOptions.normal'), value:'normal'}, {label: $t('right.fontStyleOptions.italic'), value:'italic'}, {label: $t('right.fontStyleOptions.oblique'), value:'oblique'} ]"
                      size="small"
                      placeholder="Select"/>
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.fontSize') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.fontSize"
                      :min="1"
                      :max="100"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.fontSize" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.fontWeight') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.fontWeight"
                      :min="100"
                      :max="600"
                      show-alpha
                      :step="100"
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.fontWeight" step="100">
                </div>
              </li>
              <li class="option" v-show="canvasesStore.textOptions.direction === 'horizontal'">
                <div class="label">{{ $t('right.lineHeight') }}</div>
                <div class="value">
                  <el-slider
                      v-model="canvasesStore.textOptions.lineHeight"
                      :min="1"
                      :max="10"
                      show-alpha
                      :step="0.1"
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.lineHeight" step="0.1">
                </div>
              </li>
              <li class="option" v-show="canvasesStore.textOptions.direction === 'vertical'">
                <div class="label">{{ $t('right.columnWidth') }}</div>
                <div class="value">
                  <el-slider
                      v-model="canvasesStore.textOptions.columnWidth"
                      :min="1"
                      :max="10"
                      show-alpha
                      :step="0.1"
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.columnWidth" step="0.1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.charSpacing') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.spacing"
                      :min="0"
                      :max="100"
                      show-alpha
                      :step="1"
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.spacing" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.angle') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.angle"
                      size="small"
                      :min="-180"
                      :max="180"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.angle" step="1">
                </div>
              </li>

              <li class="option">
                <div class="label">{{ $t('right.layer') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.zIndex"
                      :min="0"
                      :max="100"
                      size="small"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.zIndex" step="1">
                </div>
              </li>

              <li class="option">
                <div class="label">{{ $t('right.fontColor') }}</div>
                <div class="value">
                  <el-color-picker
                      v-model="canvasesStore.textOptions.fontColor"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                </div>
              </li>
            </ul>
            <div class="group-title">{{ $t('right.textShadow') }}</div>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.offsetX') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.shadow.offsetX"
                      size="small"
                      :min="-200"
                      :max="200"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.shadow.offsetX" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.offsetY') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.shadow.offsetY"
                      size="small"
                      :min="-200"
                      :max="200"
                      show-alpha
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.shadow.offsetY" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.blurAmount') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.textOptions.shadow.blur"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.textOptions.shadow.blur" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.shadowColor') }}</div>
                <div class="value">
                  <el-color-picker
                      v-model="canvasesStore.textOptions.shadow.color"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                </div>
              </li>
            </ul>
          </el-sub-menu>
          <el-sub-menu index="4" id="image-options" class="sub-menu" :class="{'is-active': activeSection === '4'}">
            <template #title>
              <span class="title-text" @click="setActiveSection('4')">{{ $t('right.image') }}</span>
            </template>
            <div class="group-title">{{ $t('right.basicProps') }}</div>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.scale') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.scale"
                      :min="0.1"
                      :max="20"
                      :step="0.1"
                      size="small"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.scale" step="0.1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.opacity') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.alpha"
                      :min="0.01"
                      :max="1"
                      :step="0.01"
                      size="small"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.alpha" step="0.01">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.angle') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.angle"
                      size="small"
                      :min="-180"
                      :max="180"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.angle" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.layer') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.zIndex"
                      :min="0"
                      :max="100"
                      size="small"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.zIndex" step="1">
                </div>
              </li>
            </ul>

            <div class="group-title">{{ $t('right.shadow') }}</div>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.offsetX') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.shadow.offsetX"
                      size="small"
                      :min="-200"
                      :max="200"
                      placement="top"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.shadow.offsetX"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.offsetY') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.shadow.offsetY"
                      size="small"
                      :min="-200"
                      :max="200"
                      show-alpha
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.shadow.offsetY"
                         step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.blurAmount') }}</div>
                <div class="value">
                  <el-slider
                      :format-tooltip="formatSliderTooltip"
                      v-model="canvasesStore.imageOptions.shadow.blur"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                  <input type="number" class="number-input" v-model="canvasesStore.imageOptions.shadow.blur" step="1">
                </div>
              </li>
              <li class="option">
                <div class="label">{{ $t('right.shadowColor') }}</div>
                <div class="value">
                  <el-color-picker
                      v-model="canvasesStore.imageOptions.shadow.color"
                      show-alpha
                      size="small"
                      :predefine="predefineColors"/>
                </div>
              </li>
            </ul>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>
  </div>
</template>

<script setup lang="js">

import {ref, watch, nextTick} from 'vue'

import {storeToRefs} from 'pinia'

import _ from 'lodash'

import useEventListener from '@/composables/common/useEventListener'

import {predefineColors} from '@/config/color-configuration'

import {Rect, Image} from '@/canvas/CanvasEditor'

import CanvasManager from '@/object/canvas-manager'

import {canvasActions} from '@/object/canvas-actions'

import {useCanvasesStore} from '@/stores/canvases'

import {useProjectSettingsStore} from '@/stores/project-settings'

const canvasesStore = useCanvasesStore()

const settingsStore = useProjectSettingsStore()

const {textOptions, imageOptions, photographOptions, borderOptions} = storeToRefs(canvasesStore)

const menuRef = ref(null)

const metadataRef = ref(null)

const sliderRange = {
  min: 0,
  max: 1000
}

// 维护已展开子菜单索引的数组
const openedMenus = ref([])

// 当前高亮的属性分组（点击分组标题或自动展开时更新，用于绘制卡片激活态）
// 当前高亮的属性分组：点击分组标题或选中画布元素时更新，
// 默认「照片」——刚载入图片时最常用的画布级分组
const activeSection = ref('5')

const setActiveSection = (index) => {
  activeSection.value = index
}

// 分段控件切换边框类型：与原生下拉框行为一致
const handleBorderTypeChange = (value) => {
  canvasesStore.borderOptions.borderType = value
  handleCreateBorders()
}

// 处理子菜单展开事件
const handleOpenMenu = (index) => {
  // 如果索引不在已展开数组中，则添加
  if (!openedMenus.value.includes(index)) {
    openedMenus.value.push(index)
  }
}

// 处理子菜单收起事件
const handleCloseMenu = (index) => {
  // 从已展开数组中移除对应索引
  const idx = openedMenus.value.indexOf(index)
  if (idx !== -1) {
    openedMenus.value.splice(idx, 1)
  }
}

// 展开指定索引的子菜单（未展开时才展开）
const openSubMenu = (index) => {
  if (menuRef.value && !openedMenus.value.includes(index)) {
    menuRef.value.open(index)
  }
}

// 字体下拉框搜索过滤结果
const matchFonts = ref([])

const handleFilterFonts = (search) => {
  matchFonts.value = settingsStore.availableFonts.filter(font => font.familyAlias.toLowerCase().startsWith(search.toLowerCase()))
}

const formatSliderTooltip = (val) => {
  return Math.floor(val);
};

const requestImportBorderImage = () => {
  window.electronAPI.requestImportBackgroundImage();
}


// ---------- 选中元素时同步属性面板 ----------

// 选中画布元素时（选项对象被整体替换）自动展开对应的属性子菜单
watch(textOptions, (newVal, oldValue) => {
  if (newVal === oldValue || !settingsStore.projectSettings.others.optionAnchorPoint) return
  activeSection.value = '3'
  openSubMenu('3')
  nextTick(() => {
    document.getElementById('text-options').scrollIntoView({behavior: 'smooth'});
  })
})

watch(imageOptions, (newVal, oldValue) => {
  if (newVal === oldValue || !settingsStore.projectSettings.others.optionAnchorPoint) return
  activeSection.value = '4'
  openSubMenu('4')
  nextTick(() => {
    document.getElementById('image-options').scrollIntoView({behavior: 'smooth'});
  })
})


// ---------- 文本 / 图片属性写回画布 ----------

// 文本属性变化时写回画布上选中的文本元素
watch(textOptions, async (newVal, oldValue) => {
  const canvasEditor = canvasesStore.getCanvasEditor()
  if (!canvasEditor || newVal !== oldValue) return
  const canvas = CanvasManager.getCurrentCanvas();
  const activeElements = canvasEditor.getActiveElements();
  if (!canvas || !activeElements.length) return
  const initZoom = canvas.initZoom;
  const {
    direction,
    fontFamily,
    fontSize,
    fontStyle,
    fontWeight,
    fontColor,
    angle,
    shadow,
    spacing,
    lineHeight,
    columnWidth,
    zIndex
  } = newVal;
  for (const activeElement of activeElements) {
    if (activeElement.type === 'text') {
      activeElement.direction = direction;
      activeElement.fontFamily = fontFamily;
      activeElement.fontStyle = fontStyle;
      activeElement.fontWeight = fontWeight;
      activeElement.fontColor = fontColor;
      activeElement.angle = angle;
      activeElement.order = zIndex;
      activeElement.lineHeight = lineHeight
      activeElement.columnWidth = columnWidth
      activeElement.fontSize = fontSize / initZoom
      activeElement.spacing = spacing / initZoom
      activeElement.shadow.offsetX = shadow.offsetX / initZoom
      activeElement.shadow.offsetY = shadow.offsetY / initZoom
      activeElement.shadow.blur = shadow.blur / initZoom
      activeElement.shadow.color = shadow.color
    }
  }
  canvasEditor.renderAll()
  canvas.foreground = canvasEditor.exportToObject()
}, {
  deep: true,
});


// 图片属性变化时写回画布上选中的图片元素
watch(imageOptions, async (newVal, oldValue) => {
  const canvasEditor = canvasesStore.getCanvasEditor()
  if (newVal !== oldValue) return
  const canvas = CanvasManager.getCurrentCanvas();
  const activeElements = canvasEditor.getActiveElements();
  if (!canvas || !activeElements.length) return
  const initZoom = canvas.initZoom;
  const {scale, angle, zIndex, alpha, shadow} = newVal;
  for (const activeElement of activeElements) {
    if (activeElement.type === 'image') {
      activeElement.scale = scale;
      activeElement.angle = angle;
      activeElement.order = zIndex;
      activeElement.alpha = alpha;
      activeElement.shadow.offsetX = shadow.offsetX / initZoom
      activeElement.shadow.offsetY = shadow.offsetY / initZoom
      activeElement.shadow.blur = shadow.blur / initZoom
      activeElement.shadow.color = shadow.color;
    }
  }
  canvasEditor.renderAll()
  canvas.foreground = canvasEditor.exportToObject()
}, {
  //深度监视（监视属性变化）
  deep: true,
});


// ---------- 照片 / 边框属性更新 ----------

// 照片圆角 / 阴影变化时写回背景层图片元素
const handleUpdatePhotograph = async () => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
  const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor()
  const {initZoom} = currentCanvas;
  const {borderRadius, shadow} = photographOptions.value
  const elements = backgroundCanvasEditor.getElements();
  const image = elements[1];
  image.radius = borderRadius / initZoom;
  image.shadow = {
    ...shadow,
    blur: shadow.blur / initZoom,
    offsetX: shadow.offsetX / initZoom,
    offsetY: shadow.offsetY / initZoom
  };
  backgroundCanvasEditor.renderAll();
  currentCanvas.photographOptions = _.cloneDeep(photographOptions.value)
  currentCanvas.background = backgroundCanvasEditor.exportToObject()
}


// 边框类型切换 / 导入边框图片时重建背景层
const handleCreateBorders = async (file) => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
  const canvasEditor = canvasesStore.getCanvasEditor()
  const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor()
  const domRefs = canvasesStore.getDomRefs()
  const {
    width,
    height,
    initZoom,
  } = currentCanvas;

  const {
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    borderColor,
    borderRadius,
    borderType,
    borderBlur
  } = borderOptions.value;

  const elements = backgroundCanvasEditor.getElements();
  const background = elements[0];
  const target = elements[1];

  const newBorderLeft = borderLeft / initZoom
  const newBorderRight = borderRight / initZoom
  const newBorderTop = borderTop / initZoom
  const newBorderBottom = borderBottom / initZoom
  const newBorderRadius = borderRadius / initZoom
  const newBorderBlur = borderBlur / initZoom
  target.x = newBorderLeft
  target.y = newBorderTop
  const newWidth = width + newBorderLeft + newBorderRight
  const newHeight = height + newBorderTop + newBorderBottom
  backgroundCanvasEditor.resizeCanvas(newWidth, newHeight)
  canvasEditor.resizeCanvas(newWidth, newHeight)

  canvasActions.centerCanvasScrollBar()

  if (borderType === 0 && background.type !== 'rect') {
    delete background.meta.path
    delete background.meta.url
    elements[0] = new Rect({
      width: newWidth,
      height: newHeight,
      radius: newBorderRadius,
      fill: borderColor,
      meta: {...background.meta, borderBlur: 0}
    });
  } else if (borderType === 1) {
    elements[0] = new Image(target.image, {
      width: newWidth,
      height: newHeight,
      radius: newBorderRadius,
      blur: newBorderBlur || 15 / initZoom,
      meta: {...background.meta, path: target.meta.path, url: target.meta.url, borderBlur: borderBlur || 15}
    })
  } else if (borderType === 2 && file) {
    elements[0] = await Image.fromURL(file.url, {
      width: newWidth,
      height: newHeight,
      radius: 0,
      blur: 0,
      meta: {...background.meta, path: file.path, url: file.url, borderBlur: 0, borderRadius: 0}
    })
  }

  domRefs.canvasElement.classList.remove('scale-animation')
  domRefs.backgroundElement.classList.remove('scale-animation')
  canvasEditor.renderAll();
  backgroundCanvasEditor.renderAll();

  borderOptions.value = elements[0].meta
  currentCanvas.borderOptions = _.cloneDeep(elements[0].meta)
  currentCanvas.foreground = canvasEditor.exportToObject()
  currentCanvas.background = backgroundCanvasEditor.exportToObject();
}

// 边框参数变化时更新背景层边框元素
const handleUpdateBorders = () => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
  const canvasEditor = canvasesStore.getCanvasEditor()
  const backgroundCanvasEditor = canvasesStore.getBackgroundCanvasEditor()
  const domRefs = canvasesStore.getDomRefs()
  const {
    width,
    height,
    initZoom,
    borderOptions: {borderLeft: lastBorderLeft, borderTop: lastBorderTop}
  } = currentCanvas;

  const {
    borderLeft,
    borderRight,
    borderTop,
    borderBottom,
    borderColor,
    borderRadius,
    borderBlur
  } = borderOptions.value;

  const elements = backgroundCanvasEditor.getElements();
  const background = elements[0];
  const target = elements[1];

  const newBorderLeft = borderLeft / initZoom
  const newBorderRight = borderRight / initZoom
  const newBorderTop = borderTop / initZoom
  const newBorderBottom = borderBottom / initZoom
  const newBorderRadius = borderRadius / initZoom
  const newBorderBlur = borderBlur / initZoom
  target.x = newBorderLeft
  target.y = newBorderTop
  const newWidth = width + newBorderLeft + newBorderRight
  const newHeight = height + newBorderTop + newBorderBottom
  backgroundCanvasEditor.resizeCanvas(newWidth, newHeight)
  canvasEditor.resizeCanvas(newWidth, newHeight)

  canvasActions.centerCanvasScrollBar()

  background.width = newWidth;
  background.height = newHeight;
  background.fill = borderColor;
  background.radius = newBorderRadius;
  background.blur = newBorderBlur;

  if (borderLeft !== lastBorderLeft || borderTop !== lastBorderTop) {
    for (let element of canvasEditor.getElements()) {
      element.x += (borderLeft - lastBorderLeft) / initZoom;
      element.y += (borderTop - lastBorderTop) / initZoom;
    }
  }

  domRefs.canvasElement.classList.remove('scale-animation')
  domRefs.backgroundElement.classList.remove('scale-animation')
  canvasEditor.renderAll();
  backgroundCanvasEditor.renderAll();

  currentCanvas.borderOptions = _.cloneDeep(borderOptions.value)
  currentCanvas.foreground = canvasEditor.exportToObject()
  currentCanvas.background = backgroundCanvasEditor.exportToObject();
}


// 边框图片导入监听：导入成功后以该图片重建边框
window.electronAPI.watchImportBackgroundImage(async (event, data) => {
  handleCreateBorders(data)
})


// 元数据 label 拖拽开始时打包数据
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

// 元数据 label 拖拽开始时打包数据
useEventListener(metadataRef, 'dragstart', handleDragStart)

</script>

<style scoped lang="scss">

.settings-details {
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  .el-aside {
    color: var(--ui-text);
    background: var(--ui-panel);
    width: 100%;
    height: 100%;

    .el-menu {
      border-right: none;
      background-color: var(--ui-panel);
      padding: 10px 12px 16px;

      /* ---------- 分组卡片 ---------- */
      .sub-menu {
        background-color: var(--ui-card);
        border: 1px solid var(--ui-border);
        border-radius: var(--app-radius-lg);
        margin-bottom: 10px;
        /* 标题行与卡片边框齐平：无内边距，用 overflow 裁出顶部圆角 */
        padding: 0;
        overflow: hidden;
        transition: border-color var(--app-transition), background-color var(--app-transition);
      }

      /* 收起后去掉卡片外壳，只留整行可点的标题行，避免双层圆角叠在一起 */
      .sub-menu:not(.is-opened) {
        background-color: transparent;
        border-color: transparent;
      }

      /* 元数据分组：与其他分组一样套卡片，只是用开关代替折叠箭头 */
      .sub-menu.sub-menu-metadata :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
        display: none;
      }

      /* 元数据分组：输入框加宽，收回右侧留白 */
      .options.metadata {
        .option .value :deep(.el-input) {
          width: 100%;
          margin-right: 0;
        }
      }

      :deep(.el-sub-menu__title) {
        height: 34px;
        line-height: 34px;
        padding: 0 8px 0 10px;
        /* 顶部与卡片边框重合，左右撑满，圆角交给卡片裁切 */
        border-radius: 0;
        background-color: var(--ui-row);
        font-size: 13.5px;
        font-weight: 600;
        color: var(--ui-text);
        transition: background-color var(--app-transition);

        &:hover {
          background-color: var(--ui-row-hover);
        }

        .title-text {
          flex: 1;
          min-width: 0;
          color: inherit;
          font-weight: inherit;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .el-sub-menu__icon-arrow {
          color: var(--ui-text-muted);
          font-size: 12px;
          transition: color var(--app-transition);
        }
      }

      /* 展开的分组：箭头取琥珀色 */
      .sub-menu.is-opened :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
        color: var(--ui-accent);
      }

      /* 元数据分组：右侧为开关，隐藏折叠箭头 */
      .sub-menu.no-card :deep(.el-sub-menu__title .el-sub-menu__icon-arrow) {
        display: none;
      }

      /* ---------- 内层容器 ---------- */
      :deep(.el-menu--inline) {
        background-color: transparent;
        padding: 4px 4px 8px;
      }

      .sub-menu:last-child {
        margin-bottom: 0;
      }

      .group-title {
        margin: 4px 0 0;
        padding: 6px 0 2px;
        height: auto;
        font-size: 11.5px;
        font-weight: 600;
        color: var(--ui-text-secondary);
        /* 不再用白色子卡片包住分组，只留居中标题，与照片分组保持一致 */
        background-color: transparent;
        border: none;
        border-radius: 0;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .group-title + .options {
        margin: 0 0 4px;
        padding: 4px 6px 4px 0;
        background-color: transparent;
        border: none;
        border-radius: 0;
      }

      .group-title:first-child {
        margin-top: 2px;
      }

      /* ---------- 属性行 ---------- */
      .options {
        width: 100%;
        list-style: none;
        padding: 4px 6px 4px 0;
        background-color: transparent;
        /* 标签列宽度取组内最长标签（max-content）并右对齐，控件列左缘对齐 */
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: 10px;
        /* 各行的 .label 与 .value 直接参与本网格，由这里统一垂直居中 */
        align-items: center;

        .option {
          /* Electron 22（Chromium 108）不支持 subgrid，改用兼容性更好的 display: contents：
             行盒子自身不再生成，.label 与 .value 直接落入父级两列网格，所有行仍共享同一标签列 */
          display: contents;

          > * {
            min-height: 34px;
          }

          .label {
            display: flex;
            align-items: center;
            justify-content: end;
            padding-left: 6px;
            font-size: 11.5px;
            color: var(--ui-text-secondary);
            white-space: nowrap;

            .text-resource {
              background-color: transparent;
              width: fit-content;
              height: fit-content;
              cursor: move;
              user-select: none;
            }
          }

          .value {
            display: flex;
            align-items: center;
            width: 100%;
            min-width: 0;
            padding-left: 4px;

          .number-input {
            /* 缩窄数字框让滑块更宽；右缘贴齐父容器 */
            flex: 0 0 40px;
            width: 40px;
            margin-left: 0;
            margin-right: 0;
              font-size: 11.5px;
              font-variant-numeric: tabular-nums;
              text-align: right;
              outline: none;
              border: none;
              background: transparent;
              color: var(--ui-text-secondary);
            }

            .el-icon {
              margin-left: 5px;
            }

            :deep(.el-input) {
              width: calc(100% - 5px);
              margin-right: 16px;
              font-size: 12px;
              /* 输入框对齐下拉框的高度（28px） */
              height: 28px;

              .el-input__wrapper {
                height: 100%;
                /* 卡片本身是浅灰底，输入框用白底 + 描边才能看清边界 */
                background: var(--ui-elevated);
                box-shadow: 0 0 0 1px var(--ui-border) inset;
                border-radius: var(--app-radius-xs);
                padding: 0 10px;
                transition: box-shadow var(--app-transition), background-color var(--app-transition);
              }

              .el-input__wrapper:hover {
                box-shadow: 0 0 0 1px var(--ui-border-strong) inset;
              }

              .el-input__wrapper.is-focus {
                background: var(--ui-elevated);
                box-shadow: 0 0 0 1px var(--ui-accent) inset;
              }

              .el-input__inner {
                color: var(--ui-text);
              }
            }

            :deep(.el-color-picker) {
              .el-icon {
                font-size: 12px;
                margin: 0;
              }
            }

            :deep(.el-select) {
              /* 宽度与右侧留白都对齐元数据的输入框 */
              width: calc(100% - 5px);
              margin-right: 16px;

              .el-select__wrapper {
                background: var(--ui-elevated);
                box-shadow: 0 0 0 1px var(--ui-border) inset;
                border-radius: var(--app-radius-xs);
                /* 与 .el-input 保持一致 */
                min-height: 28px;
                padding: 0 10px;
              }

              span {
                color: var(--ui-text);
              }
            }

            :deep(.el-button) {
              height: 30px;
              border-radius: var(--app-radius-xs);
              background: var(--ui-card);
              border: 1px solid var(--ui-border);
              color: var(--ui-text);

              span {
                color: inherit;
              }

              &:hover {
                background: var(--ui-accent-soft);
                border-color: var(--ui-accent-soft-border);
                color: var(--ui-accent-soft-text);
              }
            }

            :deep(.el-slider) {
              /* 弹性占据剩余宽度，与右侧数字输入框之间只留 2px */
              flex: 1 1 auto;
              min-width: 0;
              margin: 0 2px 0 0;
              --el-slider-button-size: 12px;
              --el-slider-height: 4px;
              /* 滑块在滑轨上垂直居中：offset = (滑轨高 - 手柄容器高) / 2 = (4 - 36) / 2 */
              --el-slider-button-wrapper-size: 36px;
              --el-slider-button-wrapper-offset: -16px;
              --el-slider-main-bg-color: var(--ui-accent);
              --el-slider-runway-bg-color: var(--ui-track);

              .el-slider__runway {
                border-radius: 2px;
              }

              .el-slider__button {
                margin-bottom: 0;
                border: 2px solid var(--ui-accent);
                background: var(--ui-elevated);
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.16);
              }
            }
          }
        }
      }

      /* ---------- 分段控件 ---------- */
      .segmented-control {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        gap: 6px;
        margin: 4px 0 6px;

        .segment {
          height: 30px;
          padding: 0 8px;
          border-radius: var(--app-radius-xs);
          background: var(--ui-elevated);
          border: 1px solid var(--ui-border);
          color: var(--ui-text-secondary);
          font-family: inherit;
          font-size: 12.5px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: background-color var(--app-transition), border-color var(--app-transition), color var(--app-transition);
        }

        .segment:hover {
          border-color: var(--ui-border-strong);
          color: var(--ui-text);
        }

        .segment.is-active {
          background: var(--ui-accent-soft);
          border-color: var(--ui-accent);
          color: var(--ui-accent-soft-text);
          font-weight: 600;
        }
      }
    }
  }
}

</style>
