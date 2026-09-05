<template>
  <div class="settings-details">
    <el-aside>
      <el-scrollbar>
        <el-menu :default-openeds="['1']" ref="menuRef" @open="handleOpenMenu" @close="handleCloseMenu">
          <el-sub-menu index="1">
            <template #title>
              <span>{{ $t('right.metadata') }}</span>
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
          <el-sub-menu index="5">
            <template #title>
              <span>{{ $t('right.photo') }}</span>
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
          <el-sub-menu index="2">
            <template #title>
              <span>{{ $t('right.border') }}</span>
            </template>
            <ul class="options">
              <li class="option">
                <div class="label">{{ $t('right.borderType') }}</div>
                <div class="value">
                  <el-select
                      @change="handleCreateBorders()"
                      v-model="canvasesStore.borderOptions.borderType"
                      :options="[{value: 0,label: $t('right.borderTypeOptions.general')}, {value: 1,label: $t('right.borderTypeOptions.blur')},{value: 2, label: $t('right.borderTypeOptions.custom')}]"
                      size="small"
                      placeholder="Select"/>
                </div>
              </li>
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
          <el-sub-menu index="3" id="text-options">
            <template #title>
              <span>{{ $t('right.text') }}</span>
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
          <el-sub-menu index="4" id="image-options">
            <template #title>
              <span>{{ $t('right.image') }}</span>
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

import useEventListener from '@/composables/useEventListener'

import {predefineColors} from '@/config/color-configuration'

import {Rect, Image} from '@/canvas/CanvasEditor'

import CanvasManager from '@/object/canvas-manager'

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
  openSubMenu('3')
  nextTick(() => {
    document.getElementById('text-options').scrollIntoView({behavior: 'smooth'});
  })
})

watch(imageOptions, (newVal, oldValue) => {
  if (newVal === oldValue || !settingsStore.projectSettings.others.optionAnchorPoint) return
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
    color: var(--el-text-color-primary);
    background: var(--expand-area-background-color);
    width: 100%;
    height: 100%;

    .el-menu {
      border-right: none;
      background-color: var(--expand-area-background-color);

      :deep(.el-sub-menu) {

        .el-sub-menu__title {
          height: 40px;
        }

        span, svg {
          color: var(--menu-icon-color);
        }
      }

      .el-sub-menu {
        background-color: var(--menu-background-color);
        border-bottom: 1px solid var(--app-menu-border);

        .control-option {
          background-color: var(--app-control-bg);
          display: flex;
          align-items: center;
          height: 50px;
          padding-left: 20px;
        }

        .group-title {
          color: var(--main-font-color);
          width: 100%;
          height: 30px;
          font-size: 14px;
          font-weight: 600;
          background-color: var(--expand-area-background-color);
          display: flex;
          justify-content: center;
          align-items: end;
          border-top: 1px solid var(--app-menu-border);
        }

        .group-title:first-child {
          border-top: none;
        }

        .options {
          width: 100%;
          list-style: none;
          padding: 10px 0 10px 10px;
          background-color: var(--expand-area-background-color);
          // 标签列宽度取组内最长标签（max-content）并右对齐，控件列左缘对齐；
          // 行通过 subgrid 对齐到同一标签列，行高与上下内边距保持原值
          display: grid;
          grid-template-columns: max-content 1fr;
          column-gap: 6px;

          .option {
            height: 35px;
            display: grid;
            grid-template-columns: subgrid;
            grid-column: 1 / -1;
            justify-content: start;
            align-items: center;

            .label {
              display: flex;
              align-items: center;
              justify-content: end;
              font-size: 11px;
              color: var(--main-font-color);

              .text-resource {
                background-color: var(--expand-area-background-color);
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
              // 左侧 4px 与滑块左端对齐，下拉框 / 颜色选择器 / 按钮等组件共用同一起点
              padding-left: 4px;

              .number-input {
                width: 40px;
                margin-left: 3px;
                font-size: 11px;
                outline: none;
                transition: border-color 0.3s;
                border: none;
                background: transparent;
                color: var(--main-font-color);
              }

              .el-icon {
                margin-left: 5px;
              }

              :deep(.el-input) {
                width: calc(100% - 5px);
                margin-right: 16px;
                font-size: 10px;

                .el-input__wrapper {
                  background: var(--app-control-bg);
                }
              }

              :deep(.el-color-picker) {
                .el-icon {
                  font-size: 12px;
                  margin: 0;
                }
              }

              :deep(.el-select) {
                width: calc(100% - 38px);

                span {
                  color: var(--app-regular-text);
                }
              }

              :deep(.el-button) {
                span {
                  color: white;
                }
              }

              :deep(.el-slider) {
                width: 100%;
                margin: 0 4px 0 0;
                --el-slider-button-size: 10px;
                --el-slider-height: 5px;

                .el-slider__button {
                  margin-bottom: 1px;
                }
              }
            }
          }

          .option:first-child {
            margin-top: 0;
          }
        }
      }

      .el-sub-menu:first-child {
        border-top: none;
      }

      .el-sub-menu:last-child {
        border-bottom: none;
      }

      :deep(.el-sub-menu) {

        span, svg {
          color: var(--menu-icon-color);
        }

        .el-sub-menu__title:hover {
          background-color: var(--menu-background-color);

          span {
            color: var(--app-hover-accent);
          }
        }
      }
    }
  }
}

</style>
