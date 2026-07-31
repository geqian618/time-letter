<template>
  <div>
    <div class="page-layout" ref="page">
      <div class="page-main" ref="pageMain">
        <div class="page-left">
          <div class="left-resize" ref="leftResize"></div>
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
                        class="template" v-for="template in templates"
                        :key="template.templateId"
                        :index="String(template.templateId)"
                        @click="openEnableTemplateDialog(template)">
                      {{ template.templateName }}
                    </el-menu-item>
                  </div>
                </el-sub-menu>
                <el-sub-menu index="2" class="image-mark-options">
                  <template #title>
                    <span>图片库</span>
                  </template>
                  <div class="image-marks" ref="imageMarks">
                    <div class="image-item" :key="key" v-for="([key, label]) in imageLabels" draggable="false">
                      <img class="image-mark" :src="label.url" :path="label.path" draggable="true">
                    </div>
                  </div>
                </el-sub-menu>
                <el-sub-menu index="3" class="text-marks-options">
                  <template #title>
                    <span>文本库</span>
                  </template>
                  <el-scrollbar class="scrollBar">
                    <div class="text-marks" ref="textMarks">
                      <el-tooltip class="box-item" effect="dark" content="文本" placement="top">
                        <div class="text-mark" draggable="true" text="文本" type="text">
                          <img draggable="false" src="/src/assets/icon/text.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期" placement="top">
                        <div class="text-mark" draggable="true" type="date">
                          <img draggable="false" src="/src/assets/icon/date.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期时间" placement="top">
                        <div class="text-mark" draggable="true" type="datetime">
                          <img draggable="false" src="/src/assets/icon/datetime.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip v-for="(textLabel) in textLabels"
                                  :key="textLabel.id"
                                  class="box-item"
                                  effect="dark"
                                  :content="textLabel.tips"
                                  placement="top">
                        <div class="text-mark"
                             :id="textLabel.id"
                             draggable="true"
                             :text="textLabel.content"
                             :expression="textLabel.script"
                             :type="textLabel.type ==='text'?'text':'script'">
                          <img draggable="false" src="/src/assets/icon/custom.svg">
                        </div>
                      </el-tooltip>
                    </div>
                  </el-scrollbar>
                </el-sub-menu>
              </el-menu>
            </el-scrollbar>
          </el-aside>
        </div>

        <div class="preview-view">
          <div class="uploader" ref="uploader" v-show="uploadVisible" @click="requestImportFiles({isDragOver: false})">
            <img src="/src/assets/icon/upload.svg" alt="上传">
            <span>拖拽上传文件</span>
          </div>
          <div class="preview-container" id="preview-container" ref="previewContainer" @mousedown="triggerContextMenu">
            <div class="canvas-wrapper" ref="canvasWrapper">
              <canvas id="background-canvas" ref="backgroundElement"></canvas>
              <canvas id="foreground-canvas" ref="canvasElement"></canvas>
            </div>
          </div>
        </div>

        <div class="page-right">
          <div class="right-resize" ref="rightResize"></div>
          <div class="settings-details">
            <el-aside>
              <el-scrollbar>
                <el-menu :default-openeds="['1']" ref="menuRef" @open="handleOpenMenu" @close="handleCloseMenu">
                  <el-sub-menu index="1">
                    <template #title>
                      <span>元数据</span>
                    </template>
                    <ul class="options metadata">
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="cameraBrand">相机品牌
                          </div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.cameraBrand" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="cameraModel">相机型号
                          </div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.cameraModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="lensModel">镜头型号</div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.lensModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="focalLength">焦段</div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.focalLength" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="iso">IOS</div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.iso" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="shutter">快门</div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.shutter" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="aperture">光圈</div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.aperture" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="shootingTime">拍摄日期
                          </div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.shootingTime" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="filename">文件名称
                          </div>
                        </div>
                        <div class="value">
                          <el-input spellcheck="false" v-model="metadataOptions.filename" size="small"/>
                        </div>
                      </li>
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="5">
                    <template #title>
                      <span>照片</span>
                    </template>
                    <ul class="options">
                      <li class="option">
                        <div class="label">圆角</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdatePhotograph"
                              :format-tooltip="formatSliderTooltip"
                              v-model="photographOptions.borderRadius"
                              size="small"
                              :min="0"
                              :max="100"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.borderRadius"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">X轴偏移</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdatePhotograph"
                              :format-tooltip="formatSliderTooltip"
                              v-model="photographOptions.shadow.offsetX"
                              size="small"
                              :min="-200"
                              :max="200"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.shadow.offsetX"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdatePhotograph"
                              :format-tooltip="formatSliderTooltip"
                              v-model="photographOptions.shadow.offsetY"
                              :min="-200"
                              :max="200"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.shadow.offsetY"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              @input="handleUpdatePhotograph"
                              v-model="photographOptions.shadow.blur"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.shadow.blur"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              @change="handleUpdatePhotograph"
                              v-model="photographOptions.shadow.color"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                        </div>
                      </li>
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="2">
                    <template #title>
                      <span>边框</span>
                    </template>
                    <ul class="options">
                      <li class="option">
                        <div class="label">边框类型</div>
                        <div class="value">
                          <el-select
                              @change="handleCreateBorders()"
                              v-model="borderOptions.borderType"
                              :options="[{value: 0,label: '通用'}, {value: 1,label: '模糊'},{value: 2, label:'自定义'}]"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option" v-show="borderOptions.borderType === 2">
                        <div class="label">边框图片</div>
                        <div class="value">
                          <el-button @click="requestImportBorderImage" size="small" type="primary">选择</el-button>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">上边框</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderTop"
                              size="small"
                              :min="sliderRange.min"
                              :max="sliderRange.max"
                              placement="top"/>
                          <input type="number" class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderTop"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">下边框</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderBottom"
                              size="small"
                              :min="sliderRange.min"
                              :max="sliderRange.max"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderBottom"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">左边框</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderLeft"
                              size="small"
                              :min="sliderRange.min"
                              :max="sliderRange.max"
                              placement="top"/>
                          <input type="number" class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderLeft"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">右边框</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderRight"
                              size="small"
                              :min="sliderRange.min"
                              :max="sliderRange.max"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRight"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">圆角</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderRadius"
                              size="small"
                              :min="0"
                              :max="100"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRadius"
                                 step="1">
                        </div>
                      </li>
                      <li class="option" v-show="[1,2].includes(borderOptions.borderType)">
                        <div class="label">模糊值</div>
                        <div class="value">
                          <el-slider
                              @input="handleUpdateBorders"
                              :format-tooltip="formatSliderTooltip"
                              v-model="borderOptions.borderBlur"
                              size="small"
                              :min="0"
                              :max="50"
                              placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderBlur"
                                 step="1">
                        </div>
                      </li>
                      <li class="option" v-show="borderOptions.borderType === 0">
                        <div class="label">边框颜色</div>
                        <div class="value">
                          <el-color-picker
                              size="small"
                              @change="handleUpdateBorders"
                              v-model="borderOptions.borderColor"
                              show-alpha
                              :predefine="predefineColors"/>
                        </div>
                      </li>
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="3" id="text-options">
                    <template #title>
                      <span>文本</span>
                    </template>
                    <div class="group-title">基本属性</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">排列方向</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.direction"
                              :options="[{label:'水平', value: 'horizontal'}, {label: '垂直', value: 'vertical'}]"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字体类型</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.fontFamily"
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
                        <div class="label">字体样式</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.fontStyle"
                              :options="[ {label:'正常', value:'normal'}, {label:'斜体', value:'italic'}, {label:'倾斜', value:'oblique'} ]"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字体大小</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.fontSize"
                              :min="1"
                              :max="100"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.fontSize" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字体粗细</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.fontWeight"
                              :min="100"
                              :max="600"
                              show-alpha
                              :step="100"
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.fontWeight" step="100">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字符间距</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.spacing"
                              :min="0"
                              :max="100"
                              show-alpha
                              :step="1"
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.spacing" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">旋转角度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.angle"
                              size="small"
                              :min="-180"
                              :max="180"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.angle" step="1">
                        </div>
                      </li>

                      <li class="option">
                        <div class="label">层级</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.zIndex"
                              :min="0"
                              :max="100"
                              size="small"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.zIndex" step="1">
                        </div>
                      </li>

                      <li class="option">
                        <div class="label">字体颜色</div>
                        <div class="value">
                          <el-color-picker
                              v-model="textOptions.fontColor"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                        </div>
                      </li>

                      <!--                    <li class="option">-->
                      <!--                      <div class="label">背景颜色</div>-->
                      <!--                      <div class="value">-->
                      <!--                        <el-color-picker-->
                      <!--                            @change=""-->
                      <!--                            v-model="textOptions.tagBackground"-->
                      <!--                            show-alpha-->
                      <!--                            size="small"-->
                      <!--                            :predefine="predefineColors"/>-->
                      <!--                      </div>-->
                      <!--                    </li>-->
                    </ul>
                    <div class="group-title">文本阴影</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">X轴偏移</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.shadow.offsetX"
                              size="small"
                              :min="-200"
                              :max="200"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.shadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.shadow.offsetY"
                              :min="-200"
                              :max="200"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.shadow.offsetY" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="textOptions.shadow.blur"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.shadow.blur" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              v-model="textOptions.shadow.color"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                        </div>
                      </li>
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="4" id="image-options">
                    <template #title>
                      <span>图片</span>
                    </template>
                    <div class="group-title">基本属性</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">缩放</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.scale"
                              :min="0.1"
                              :max="20"
                              :step="0.1"
                              size="small"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.scale" step="0.1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">不透明度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.alpha"
                              :min="0.01"
                              :max="1"
                              :step="0.01"
                              size="small"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.alpha" step="0.01">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">旋转角度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.angle"
                              size="small"
                              :min="-180"
                              :max="180"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.angle" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">层级</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.zIndex"
                              :min="0"
                              :max="100"
                              size="small"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.zIndex" step="1">
                        </div>
                      </li>
                    </ul>

                    <div class="group-title">阴影</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">X轴偏移</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.shadow.offsetX"
                              size="small"
                              :min="-200"
                              :max="200"
                              placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.shadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.shadow.offsetY"
                              :min="-200"
                              :max="200"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="imageOptions.shadow.offsetY" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              :format-tooltip="formatSliderTooltip"
                              v-model="imageOptions.shadow.blur"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="imageOptions.shadow.blur" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              v-model="imageOptions.shadow.color"
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
        </div>
      </div>


      <div class="page-bottom">
        <div class="bottom-resize" ref="bottomResize"></div>
        <div class="function-tabs">
          <div class="left-tabs">
            <div class="tab-wrapper">
              <el-tooltip effect="dark" content="上一张" placement="top">
                <img src="/src/assets/images/左箭头-未激活.png" class="inactive" alt="上一张">
              </el-tooltip>
              <el-tooltip effect="dark" content="上一张" placement="top">
                <img src="/src/assets/images/左箭头-激活.png" class="active" @click="switchBeforePreviewElement"
                     alt="上一张">
              </el-tooltip>
            </div>

            <div class="tab-wrapper">
              <el-tooltip effect="dark" content="下一张" placement="top">
                <img src="/src/assets/images/右箭头-未激活.png" class="inactive" alt="下一张">
              </el-tooltip>
              <el-tooltip effect="dark" content="下一张" placement="top">
                <img src="/src/assets/images/右箭头-激活.png" class="active" @click="switchNextPreviewElement"
                     alt="下一张">
              </el-tooltip>
            </div>

            <div class="tab-wrapper">
              <el-tooltip effect="dark" content="全选" placement="top">
                <img src="/src/assets/icon/select-all-inactive.svg" class="inactive" alt="全选">
              </el-tooltip>
              <el-tooltip effect="dark" content="全选" placement="top">
                <img src="/src/assets/icon/select-all-active.svg"
                     @click="handleSelectAllPreviewElements"
                     class="active"
                     alt="全选">
              </el-tooltip>
            </div>

            <div class="tab-wrapper">
              <el-tooltip effect="dark" content="居中" placement="top">
                <img src="/src/assets/images/居中显示-未激活.png" class="inactive small-size" alt="居中">
              </el-tooltip>
              <el-tooltip effect="dark" content="居中" placement="top">
                <img src="/src/assets/images/居中显示-激活.png" class="active small-size"
                     @click="handleScrollBarMoveToCenter"
                     alt="居中">
              </el-tooltip>
            </div>
          </div>


          <div class="right-tabs">
            <div class="counter">已选{{ selectedPreviewList.size }}张</div>
            <div class="counter">共{{ availableCanvas.size }}张</div>
            <div class="filter">
              <div class="filter-label">筛选：</div>
              <div class="filter-select">
                <el-select v-model="filterType" size="small" placeholder="Select">
                  <el-option
                      v-for="item in [{label:'无',value:0},{label:'横图',value:1},{label:'竖图',value:2}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
            </div>
          </div>

        </div>
        <div class="preview-list" ref="previewList" @wheel="handleMovePreviewList" @contextmenu="triggerContextMenu">
          <template :key="key" v-for="([key, canvas]) in availableCanvas">
            <el-popover
                v-if="canvas.metadata.filename || canvas.metadata.shootingTime || canvas.metadata.resolution || canvas.metadata.fileSize"
                width="fit-content"
                :show-after="2000"
                :hide-after="0"
                trigger="hover">
              <template #default>
                <div style="font-size: 10px">
                  <p v-if="canvas.metadata.filename">文件名称：{{ canvas.metadata.fullFilename }}</p>
                  <p v-if="canvas.metadata.shootingTime">拍摄时间：{{ canvas.metadata.shootingTime }}</p>
                  <p v-if="canvas.metadata.resolution">分辨率：{{ canvas.metadata.resolution }}</p>
                  <p v-if="canvas.metadata.fileSize">大小：{{ canvas.metadata.fileSize }}</p>
                </div>
              </template>
              <template #reference>
                <img class="previewItem"
                     :path="canvas.path"
                     v-lazy="canvas.url"
                     @click.meta.exact="handleSelectPreviewElement($event,canvas)"
                     @click.ctrl.exact="handleSelectPreviewElement($event, canvas)"
                     @click.shift.exact="handleSelectMultiplePreviewElements($event,canvas)"
                     @click="switchPreviewImage($event, canvas)"
                     @dblclick="handleDbClickPreviewImage($event,canvas)">
              </template>
            </el-popover>
            <img v-else
                 class="previewItem"
                 :path="canvas.path"
                 v-lazy="canvas.url"
                 @click.meta.exact="handleSelectPreviewElement($event,canvas)"
                 @click.ctrl.exact="handleSelectPreviewElement($event, canvas)"
                 @click.shift.exact="handleSelectMultiplePreviewElements($event,canvas)"
                 @click="switchPreviewImage($event, canvas)">
          </template>
        </div>
      </div>

    </div>

    <el-dialog align-center v-model="customTextLabelDialogVisible" :title="textLabelDialogTitle" width="500" draggable>
      <el-form :model="textLabel" class="text-label-form" ref="textLabelForm" :rules="textLabelRules" label-width="auto"
               @submit.native.prevent>
        <el-form-item label="文本类型" prop="type">
          <el-select v-model="textLabel.type" placeholder="文本类型">
            <el-option
                v-for="(item,index) in [{label:'普通文本', value:'text'}, {label:'JavaScript脚本', value:'script'}]"
                :key="index"
                :label="item.label"
                :value="item.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="提示" prop="tips">
          <el-input v-model="textLabel.tips" ref="textLabelRef" v-focus="customTextLabelDialogVisible"/>
        </el-form-item>
        <el-form-item label="文本" prop="content" v-if="textLabel.type === 'text'">
          <el-input v-model="textLabel.content" :rows="4" type="textarea"/>
        </el-form-item>
        <el-form-item label="脚本" prop="script" v-if="textLabel.type === 'script'">
          <el-input v-model="textLabel.script" :rows="4" type="textarea"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customTextLabelDialogVisible = false">取消</el-button>
          <el-button type="info" @click="saveTextLabel">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="saveTemplateDialogVisible" title="保存预设模版" align-center width="300" draggable>
      <el-form :model="newTemplate" class="demo-form-inline" :rules="saveTemplateRules" ref="saveTemplateForm"
               @submit.native.prevent>
        <el-form-item label="模板名称" prop="templateName">
          <el-input v-model="newTemplate.templateName"
                    ref="templateRef"
                    v-focus="saveTemplateDialogVisible"
                    placeholder="请输入模版名称"
                    clearable
                    @keyup.enter.native="saveTemplates"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
          <el-button type="info" @click="saveTemplates">确认</el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="renameDialogVisible" title="重命名" align-center width="300" draggable>
      <el-form :model="oldTemplate" class="demo-form-inline" :rules="renameTemplateRules" ref="renameTemplateForm"
               @submit.native.prevent>
        <el-form-item label="预设名称" prop="rename">
          <el-input v-focus="renameDialogVisible" v-model="oldTemplate.templateName" clearable
                    @keyup.enter.native="renameTemplate"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="info" @click="renameTemplate">确认</el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="editorTextLabelDialogVisible" title="编辑文本" width="60%" draggable>
      <el-table size="small" max-height="400" :data="textLabels" border>
        <el-table-column prop="type" label="标签类型" show-overflow-tooltip/>
        <el-table-column prop="tips" label="提示信息" show-overflow-tooltip/>
        <el-table-column label="文本内容" min-width="150" show-overflow-tooltip>
          <template #default="{row}">
            {{ row.type === 'text' ? row.content : row.script }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" min-width="100">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openTextLabelEditorDialog(scope.row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="deleteTextLabel(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>


    <el-dialog v-model="downloadProgressVisible"
               title="导出进度"
               align-center
               @close="handleDownloadProgressClose"
               @closed="handleDownloadProgressClosed"
               :close-on-click-modal="false"
               width="500">
      <el-progress class="download-progress" :percentage="downloadProgressPercentage"/>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="info" @click="downloadProgressVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="outputSettingsVisible"
               title="偏好设置"
               top="10vh"
               width="750">
      <el-tabs type="border-card" class="demo-tabs">
        <el-tab-pane label="导出">
          <div class="border-box">
            <span class="border-label">图片尺寸</span>
            <div class="options">
              <div class="option">
                <span class="label">调整方式：</span>
                <el-select v-model="projectSettings.outputSettings.outputSize.type"
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
              <div class="option" v-show="projectSettings.outputSettings.outputSize.type===1">
                <span class="label">宽度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.width"
                          size="small"
                          class="value"
                          placeholder="宽尺寸"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="projectSettings.outputSettings.outputSize.type ===2">
                <span class="label">高度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.height"
                          size="small"
                          class="value"
                          placeholder="高尺寸"/>
                <span>&nbsp;px</span>
              </div>

              <div class="option" v-show="projectSettings.outputSettings.outputSize.type===3">
                <span class="label">最大宽度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.maxWidth"
                          size="small"
                          class="value"
                          placeholder="最大宽度"/>
                <span>&nbsp;px</span>
              </div>

              <div class="option" v-show="projectSettings.outputSettings.outputSize.type===3">
                <span class="label">最大高度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.maxHeight"
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
                <el-select class="value" v-model="projectSettings.outputSettings.extname" size="small">
                  <el-option
                      v-for="item in [{label:'原格式', value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}, {label:'WEBP', value: 3}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="[1,3].includes(projectSettings.outputSettings.extname) ">
                <span class="label">图片品质：</span>
                <div class="slider-demo-block">
                  <el-slider
                      v-model="projectSettings.outputSettings.quality"
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
                    v-model="projectSettings.outputSettings.isSynchronizeMetadata"
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
                <el-select class="value" v-model="projectSettings.outputSettings.fileNaming.basename" size="small">
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
                          v-model="projectSettings.outputSettings.fileNaming.prefix"
                          size="small">
                </el-input>
              </div>
              <div class="option">
                <span class="label">后缀：</span>
                <el-input class="value"
                          spellcheck="false"
                          v-model="projectSettings.outputSettings.fileNaming.suffix"
                          size="small">
                </el-input>
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
                          v-model="projectSettings.metadata.formats.cameraBrand">
                </el-input>
              </div>
              <div class="option">
                <span class="label">相机型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.cameraModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">镜头型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.lensModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">焦段：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.focalLength">
                </el-input>
              </div>
              <div class="option">
                <span class="label">ISO：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.iso">
                </el-input>
              </div>
              <div class="option">
                <span class="label">快门：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.shutter">
                </el-input>
              </div>
              <div class="option">
                <span class="label">光圈：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.aperture">
                </el-input>
              </div>
              <div class="option">
                <span class="label">拍摄日期：</span>
                <el-input spellcheck="false"
                          class="metadata-input shooting-time"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.shootingTime">
                </el-input>
                <span class="label shooting-time-label">日期格式：</span>
                <el-input spellcheck="false"
                          class="metadata-input shooting-time"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.others.shootingTimeFormat">
                </el-input>
              </div>
              <div class="option">
                <span class="label">文件名称：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          @change="handleUpdateMetadata"
                          v-model="projectSettings.metadata.formats.filename">
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
                    v-model="projectSettings.metadata.others.enableEquivalentFocalSegment"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">转换倍数：</span>
                <el-input class="value"
                          spellcheck="false"
                          @change="handleFocalLength(1)"
                          v-model="projectSettings.metadata.others.conversionMultiple">
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
                <el-select class="value" v-model="projectSettings.performance.downloadThreads" size="small">
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
          <el-table size="small" height="400" highlight-current-row :data="availableFonts" border
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
                    v-model="projectSettings.others.optionAnchorPoint"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">删除提示：</span>
                <el-switch
                    v-model="projectSettings.others.deleteTipVisible"
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
                      v-model="projectSettings.others.movingStepSize"
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
                      v-model="projectSettings.others.defaultCanvasScale"
                      class="value"
                      :min="0.05"
                      :max="1"
                      :step="0.05"
                      size="small"
                      show-input/>
                </div>
              </div>
              <div class="option">
                <span class="label">显示滚动条：</span>
                <el-switch
                    @change="renderCanvasScrollbar"
                    v-model="projectSettings.others.enableScrollbar"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <!--        <el-tab-pane label="图片"></el-tab-pane>-->
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="enableTemplateDialogVisible" title="应用模版" width="400" align-center draggable>
      <el-radio-group v-model="synchronousMode">
        <el-radio :value="0" size="large">按固定值定位位置</el-radio>
        <el-radio :value="1" size="large">按比例定位位置</el-radio>
      </el-radio-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="enableTemplateDialogVisible = false">取消</el-button>
          <el-button type="info" @click="enableTemplate">
            应用
          </el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="aboutDialogVisible" :close-on-click-modal="false" :close-on-press-escape="false" title="关于"
               width="700" align-center draggable>
      <div class="about">
        <div class="introduction">
          <span class="title">简介：</span>
          <div class="value">“时光信笺”是一款简单易用、扩展性极强、本地运行且无需联网的照片水印与边框工具。</div>
        </div>
        <div class="purpose">
          <span class="title">由来：</span>
          <div class="value">
            灵感源自网络上的“埋信仪式”——“寻一块地，埋一封信，寄给若干年后的自己”。将此刻心绪悉心封存，静待时光开启。
            照片亦是如此。如果说书信是写给未来的文字独白，那么照片便是赠予岁月的无声诗篇。
            愿我们都能将转瞬即逝的心绪，凝成一封封穿越时光的无声信笺。待到未来的某日，被你亲手拆开，与曾经的自己，温柔重逢，再忆彼时。
          </div>
        </div>
        <div class="contact">
          <span class="title">联系与赞赏：</span>
          <div class="value">
            <img src="/src/assets/images/二维码.jpg">
            <img src="/src/assets/images/赞赏码.jpg">
          </div>
        </div>
        <div class="version">
          <span class="title">版本：</span>
          <div class="value">v2.0</div>
        </div>
        <div class="author">
          <span class="title">作者：</span>
          <div class="value">秋风吹落了秋枫</div>
        </div>
      </div>
    </el-dialog>


    <el-dialog v-model="deleteTipsDialogVisible" title="确认删除" width="350" align-center
               :close-on-click-modal="false">
      <div style="margin: 5px 0">文件将从磁盘中删除，是否确认删除文件？</div>
      <template #footer>
        <div class="delete-tips-dialog-footer">
          <div class="left-dialog-footer">
            <el-checkbox v-model="isHideDeleteTips" @change="handleDeleteTipsVisible" label="不再提示"/>
          </div>
          <div class="right-dialog-footer">
            <el-button @click="cancelRemoveSelectedCanvas">取消</el-button>
            <el-button type="danger" @click="permanentlyRemoveSelectedCanvas">确认</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="js">

import {nextTick, onBeforeUnmount, onMounted, shallowRef, ref, toRaw, toRef, watch, computed} from "vue";

import {CanvasEditor, Text, Image, LazyImage, Rect} from '@/canvas/CanvasEditor'

import {useThrottle} from '@/utils/throttle'

import FontManager from '@/utils/FontManager'

import _ from 'lodash';

import MapHelper from "@/utils/map-helper";

import Notification from '@/utils/Notification'

import useEventListener from '@/composables/useEventListener'

import {projectSettings, outputSizeOptions, originalMetadata, downloadThreadsOptions} from '@/config/project-settings'

import {
  TextLabel,
  Metadata,
  TextOptions,
  ImageOptions,
  BorderOptions,
  FontSettings,
  PhotographOptions,
  CanvasSettings
} from '@/object/Configuration'

import CanvasManager from "@/object/CanvasManager";

import StorageManager from "@/object/StorageManager";

import {predefineColors} from '@/config/color-configuration'

import DraggableElementFactory from "@/object/DraggableElementFactory";

import {getCurrentDate, getCurrentDateTime, parseDate, formatDate} from "@/utils/datetime";

import {executeFunctionScript} from "@/utils/script-helper";

const filterType = ref(0)

const matchFonts = ref([])

const templateSettings = ref({})

const availableCanvas = shallowRef(new Map())

const zoomOptions = {
  minZoom: 0.1,
  maxZoom: 5
}

let canvasEditor = null;

let backgroundCanvasEditor = null;

let renderVersion = 0;

let scrollTimeout = null;

let isCanvasDraggingMode = false

const selectedPreviewList = ref(new Map())

const newTemplate = ref({
  templateName: '',
})

const oldTemplate = ref({
  templateId: 0,
  templateName: ''
})

const templates = ref([])

const photographOptions = ref(new PhotographOptions())

const textOptions = ref(new TextOptions())

const imageOptions = ref(new ImageOptions())

const borderOptions = ref(new BorderOptions())

const metadataOptions = ref(new Metadata())

const sliderRange = ref({
  min: 0,
  max: 1000
})

const uploader = ref(null)

const previewContainer = ref(null)

const canvasElement = ref(null)

const canvasWrapper = ref(null)

const backgroundElement = ref(null)

const previewList = ref(null);

const leftResize = ref(null);

const rightResize = ref(null);

const bottomResize = ref(null);

const pageMain = ref(null);

const page = ref(null);

const menuRef = ref(null)

const templateRef = ref(null)

const textLabelRef = ref(null)

const textMarks = ref(null)

const imageMarks = ref(null)

const imageLabels = ref(new Map())

const saveTemplateDialogVisible = ref(false)

const deleteTipsDialogVisible = ref(false)

const renameDialogVisible = ref(false)

const customTextLabelDialogVisible = ref(false)

const editorImageLabelDialogVisible = ref(false)

const editorTextLabelDialogVisible = ref(false)

const downloadProgressVisible = ref(false)

const enableTemplateDialogVisible = ref(false)

const aboutDialogVisible = ref(false)

const outputSettingsVisible = ref(false)

const handleTextLabelType = ref(0)

const downloadProgressPercentage = ref(0)

const synchronousMode = ref(0);

const textLabel = ref(new TextLabel())

// 维护已展开子菜单索引的数组
const openedMenus = ref([])

const textLabels = ref([])

const saveTemplateForm = ref({});

const textLabelForm = ref({});

const renameTemplateForm = ref(null)

const saveTemplateRules = {
  templateName: [
    {required: true, message: '模板名称不能为空', trigger: 'blur'},
  ]
}

const textLabelRules = {
  type: [
    {required: true, message: '文本类型不能为空', trigger: 'blur'},
  ],
  tips: [
    {required: true, message: '提示信息不能为空', trigger: 'blur'},
  ],
  content: [
    {required: true, message: '文本内容不能为空', trigger: 'blur'},
  ],
  script: [
    {required: true, message: '脚本不能为空', trigger: 'blur'},
  ]
}

const renameTemplateRules = {
  templateName: [
    {required: true, message: '模板名称不能为空', trigger: 'blur'},
  ]
}

const textLabelDialogTitle = computed(() => {
  return handleTextLabelType.value === 0 ? '新增文本' : '编辑文本'
})


const availableFonts = computed(() => {
  return Array.from(projectSettings.value.availableFonts.values())
})


const isHideDeleteTips = computed(() => {
  return !projectSettings.value.others.deleteTipVisible
})

const uploadVisible = computed(() => !CanvasManager.getSelectedObject().path)


const handleDeleteTipsVisible = () => {
  projectSettings.value.others.deleteTipVisible = !projectSettings.value.others.deleteTipVisible
}


const handleActivateInput = async (row, column, cell) => {
  row.editable = true;
  const input = cell.querySelector('input');
  if (input) {
    await nextTick()
    input.focus()
  }
}

const handleStopActivateInput = (row, column) => {
  row.editable = false;
}


const handleFilterFonts = (search) => {
  matchFonts.value = Array.from(projectSettings.value.availableFonts.values()).filter(font => font.familyAlias.toLowerCase().startsWith(search.toLowerCase()))
}


watch(filterType, async () => {
  await clearSelectedPreviewList()
  availableCanvas.value = CanvasManager.getAvailableCanvases(filterType.value)
  await nextTick()
  setDefaultSelectedElement()
})


const setDefaultSelectedElement = async () => {
  const selectedPath = CanvasManager.getSelectedPath();
  const paths = Array.from(availableCanvas.value.keys());
  if (!paths.length || !selectedPath) return
  const selectedCanvas = CanvasManager.getCanvas(selectedPath);
  let nextSelectCanvas, previewElement
  if (paths.includes(selectedPath)) {
    nextSelectCanvas = availableCanvas.value.get(selectedPath);
    previewElement = nextSelectCanvas.getPreviewElement(previewList.value);
    await renderCanvas(selectedCanvas)
  } else {
    nextSelectCanvas = availableCanvas.value.get(paths[0]);
    previewElement = nextSelectCanvas.getPreviewElement(previewList.value);
    await renderCanvas(nextSelectCanvas)
  }
  previewElement.classList.add('active')
  previewElement.setAttribute('selected', 'true')

  CanvasManager.setSelectedObject({path: nextSelectCanvas.path, previewElement})
  selectedPreviewList.value.set(nextSelectCanvas.path, previewElement)
}


const clearSelectedPreviewList = async () => {
  selectedPreviewList.value.forEach((element, path) => {
    element.classList.remove('active')
    element.setAttribute('selected', 'false')
  })
  selectedPreviewList.value.clear()
}


const watchTemplates = () => {
  window.electronAPI.watchTemplates(async (event, {type, data}) => {
    if (type === 1) {
      // 获取模版数据
      window.electronAPI.exportTemplates({outputPath: data, templates: StorageManager.getTemplates()});
    } else if (type === 2) {
      data.forEach(template => templates.value.push(template))
      // 接收模板数据
      StorageManager.saveTemplates(templates.value)
    }
  })
}

const watchImportFonts = () => {
  window.electronAPI.watchInputFonts(async (event, {type, data}) => {
    if (data) {
      if (type === 0 || type === -1) {
        if (type === -1) {
          removeExpiredFonts(projectSettings.value.availableFonts, data)
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
          if (!projectSettings.value.availableFonts.has(family)) {
            const fontSettings = new FontSettings();
            fontSettings.family = family
            fontSettings.familyAlias = family
            projectSettings.value.availableFonts.set(family, {...fontSettings, ...font});
            StorageManager.saveProjectSettings(projectSettings.value)
          }
        }
      } else if (type === 1) {
        const family = data.family;
        projectSettings.value.availableFonts.delete(family)
        StorageManager.saveProjectSettings(projectSettings.value)
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

const watchImportImages = () => {
  window.electronAPI.watchInputImage(async (event, data) => {
    if (data) {
      const shootingTimeFormat = projectSettings.value.metadata.others.shootingTimeFormat;
      for (let [path, picture] of data) {
        if (!CanvasManager.hasCanvas(path)) {
          const settings = new CanvasSettings()
          const metadata = await window.electronAPI.parsePhotoMetadata(path);
          if (metadata) {
            settings.originalMetadata = _.cloneDeep(metadata);
            if (metadata.focalLength) {
              if (projectSettings.value.metadata.others.enableEquivalentFocalSegment) {
                metadata.focalLength = Number.parseInt(metadata.focalLength * projectSettings.value.metadata.others.conversionMultiple)
              }
            }
            for (let key in metadata) {
              const format = projectSettings.value.metadata.formats[key];
              let value = metadata[key];
              if (key === 'shootingTime' && value && !['yyyy-MM-dd HH:mm:ss', 'YYYY-MM-DD HH:mm:ss'].includes(shootingTimeFormat)) {
                value = formatDate(parseDate(value, 'yyyy-MM-dd HH:mm:ss'), shootingTimeFormat);
              }
              if (value && format) {
                metadata[key] = format.replace('${' + key + '}', value);
              }
            }
            settings.metadata = metadata
          }
          CanvasManager.setCanvas(path, Object.assign(settings, picture))
          // 检测到图片导入立即触发渲染
          availableCanvas.value = CanvasManager.getAvailableCanvases(filterType.value)
        }
      }
    }
  });
}

const triggerContextMenu = (e) => {
  if (e.button === 2) {
    if (CanvasManager.isNotEmpty()) {
      window.electronAPI.openContextMenu()
    }
  }
}

const triggerTemplateContextMenu = ({templateId, templateName}) => {
  if (templates.value.length) {
    oldTemplate.value.templateId = templateId
    oldTemplate.value.templateName = templateName
    window.electronAPI.openTemplateContextMenu()
  }
}

const watchTemplateContextMenu = () => {
  window.electronAPI.watchTemplateContextMenu((event, {type}) => {
    if (type === 0) {
      deleteTemplate()
    } else if (type === 1) {
      renameDialogVisible.value = true
    }
  })
}


const watchAboutDialog = () => {
  window.electronAPI.watchAboutDialog((event) => {
    aboutDialogVisible.value = true;
  })
}

const editorOutputSettings = () => {
  window.electronAPI.editorOutputSettings((event) => {
    outputSettingsVisible.value = true
  })
}

const watchDownloadProgress = () => {
  window.electronAPI.downloadProgress((event, data) => {
    downloadProgressPercentage.value = data.percentage
    if (downloadProgressPercentage.value === 100) {
      setTimeout(() => {
        downloadProgressVisible.value = false
      }, 1000)
      setTimeout(() => {
        downloadProgressPercentage.value = 0;
      }, 1500)
    }
  })
}

const stopDownloadFiles = () => {
  window.electronAPI.stopExportFiles()
}

const handleDownloadProgressClose = () => {
  if (downloadProgressPercentage.value !== 100) {
    stopDownloadFiles()
  }
}

const handleDownloadProgressClosed = () => {
  downloadProgressPercentage.value = 0
}

const watchLabelResources = () => {
  window.electronAPI.watchLabelResources(async (event, result) => {
    const {data, type} = result
    if (type === 0) {
      if (result.event === 0) {
        if (!imageLabels.value.size) {
          imageLabels.value = data;
        } else {
          for (let [key, item] of data) {
            if (!imageLabels.value.has(key)) {
              imageLabels.value.set(key, item)
            }
          }
        }
      } else if (result.event === 1) {
        imageLabels.value.delete(data.filePath)
      }
    } else if (type === 1) {
      textLabel.value = new TextLabel()
      handleTextLabelType.value = 0
      customTextLabelDialogVisible.value = true
      clearFormValidate(textLabelForm)
    } else if (type === 2) {
      editorImageLabelDialogVisible.value = true
    } else if (type === 3) {
      editorTextLabelDialogVisible.value = true
    }
  })
}


const clearFormValidate = (formRef) => {
  nextTick(() => {
    if (formRef?.value) {
      formRef.value.clearValidate(); // 清除整个表单的校验
      // 如果只需清除特定字段，可传入字段名数组，如：clearValidate(['username', 'email'])
    }
  });
}


const openTextLabelEditorDialog = (row) => {
  textLabel.value = _.cloneDeep(row)
  handleTextLabelType.value = 1
  customTextLabelDialogVisible.value = true
  clearFormValidate(textLabelForm)
}

const deleteTextLabel = (row) => {
  for (let i = 0; i < textLabels.value.length; i++) {
    if (textLabels.value[i].id === row.id) {
      textLabels.value.splice(i, 1)
      StorageManager.saveTextLabels(textLabels.value)
      return
    }
  }
}

const saveTextLabel = async () => {
  if (!textLabelForm?.value) return
  await textLabelForm.value.validate(async (valid, fields) => {
    if (valid) {
      textLabel.value.type === 'script' ? textLabel.value.content = '' : textLabel.value.script = ''
      if (!textLabel.value.id) {
        textLabel.value.id = Date.now() + ''
        textLabels.value.push(_.cloneDeep(textLabel.value))
      } else {
        for (let i = 0; i < textLabels.value.length; i++) {
          if (textLabels.value[i].id === textLabel.value.id) {
            textLabels.value[i] = _.cloneDeep(textLabel.value)
            break
          }
        }
      }
      StorageManager.saveTextLabels(textLabels.value)
      textLabel.value = new TextLabel()
      customTextLabelDialogVisible.value = false;
    }
  })
}


const watchProjectSettings = () => {
  window.electronAPI.watchProjectSettings((event, {type, data: {settings, filePath}}) => {
    if (type === 0) {

      const {
        resize: oldResize,
        others: oldOthers,
        metadata: {formats: oldFormats, others: oldConversion}
      } = projectSettings.value;

      const {
        resize: newResize,
        others: newOthers,
        metadata: {formats: newFormats, others: newConversion}
      } = settings;

      const newUserSettings = _.merge({}, projectSettings.value, settings);
      projectSettings.value = newUserSettings
      StorageManager.saveProjectSettings(newUserSettings)
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
        handleScrollBarMoveToCenter()
      }
    } else if (type === 1) {
      const userSettings = _.cloneDeep(projectSettings.value);
      delete userSettings.availableFonts;
      window.electronAPI.exportSettings({filePath, settings: userSettings});
    }
  })
}


const cancelRemoveSelectedCanvas = () => {
  if (!projectSettings.value.others.deleteTipVisible) {
    projectSettings.value.others.deleteTipVisible = true;
  }
  deleteTipsDialogVisible.value = false;
}

/**
 * 移除已选中 Canvas 列表，删除其对应磁盘文件
 */
const permanentlyRemoveSelectedCanvas = () => {
  const selectedPaths = Array.from(selectedPreviewList.value.keys());
  window.electronAPI.deleteFile(selectedPaths)
  removeSelectedCanvas();
  if (!projectSettings.value.others.deleteTipVisible) {
    projectSettings.value.others.deleteTipVisible = false;
  }
  deleteTipsDialogVisible.value = false
}


/**
 * 移除已选中 Canvas 列表，不删除其对应磁盘文件
 */
const removeSelectedCanvas = () => {
  const selectedPaths = Array.from(selectedPreviewList.value.keys());
  for (let path of selectedPaths) {
    CanvasManager.deleteCanvas(path)
    availableCanvas.value.delete(path)
    if (path === CanvasManager.getSelectedPath()) {
      clearCanvas()
    }
  }
  selectedPreviewList.value.clear();
  availableCanvas.value = CanvasManager.getAvailableCanvases(filterType.value)
}

const watchContextMenu = () => {
  window.electronAPI.watchContextMenu(async (event, data) => {
    if (data) {
      const {type} = data;
      if (type === 1) {
        removeSelectedCanvas()
      } else if (type === 2) {
        if (!selectedPreviewList.value?.size) return
        deleteTipsDialogVisible.value = projectSettings.value.others.deleteTipVisible;
        if (!projectSettings.value.others.deleteTipVisible) {
          permanentlyRemoveSelectedCanvas();
        }
      } else if (type === 3) {
        const paths = Array.from(selectedPreviewList.value.keys());
        const settings = paths.map((path, index) => {
          const canvas = CanvasManager.getCanvas(path);
          const {height: imageHeight, width: imageWidth, filename} = canvas.metadata;
          if (!canvas.completed) {
            const background = {
              width: imageWidth,
              height: imageHeight,
              elements: [
                new Rect({imageWidth, imageHeight, meta: new BorderOptions()}),
                new LazyImage(canvas.url, {
                  selectable: false,
                  cacheable: true,
                  meta: {...new PhotographOptions(), path: canvas.path}
                })
              ]
            };
            return {filePath: path, index, filename, json: JSON.stringify(background)}
          }

          let {background, foreground} = _.cloneDeep(canvas);

          if (typeof background === 'string') {
            background = JSON.parse(background)
          }

          if (typeof foreground === 'string') {
            foreground = JSON.parse(foreground)
          }

          for (let element of foreground.elements) {
            background.elements.push(element);
          }
          return {filePath: path, index, filename, json: JSON.stringify(background)}
        });

        window.electronAPI.requestExportFiles(_.cloneDeep({
          projectSettings: projectSettings.value,
          outputDirectory: data.outputDirectory,
          settings
        }))
        downloadProgressVisible.value = true
      } else if (type === 4) {
        saveTemplateDialogVisible.value = true
        clearFormValidate(saveTemplateForm)
      } else if (type === 5) {
        synchronousMode.value = data.method
        synchronizeTemplate()
      } else if (type === 6) {
        const paths = Array.from(selectedPreviewList.value.keys());
        paths.forEach(path => clearCanvasElements(path))
      } else if (type === 7) {
        const paths = Array.from(selectedPreviewList.value.keys());
        paths.forEach(path => resetCanvas(path))
      }
    }
  });
}

const resetCanvas = (path) => {

  const canvas = CanvasManager.getCanvas(path);

  const {metadata: {width: imageWidth, height: imageHeight}} = canvas;

  const foreground = {
    width: imageWidth,
    height: imageHeight,
    elements: []
  };

  const background = {
    width: imageWidth,
    height: imageHeight,
    elements: [
      new Rect({imageWidth, imageHeight, meta: new BorderOptions()}),
      new LazyImage(canvas.url, {
        selectable: false,
        cacheable: true,
        meta: {...new PhotographOptions(), path: canvas.path}
      })
    ]
  };

  canvas.foreground = JSON.stringify(foreground);

  canvas.background = JSON.stringify(background);

  if (path === CanvasManager.getSelectedPath()) {
    renderCanvas(canvas)
  }
}

const clearCanvasElements = (path) => {

  const canvas = CanvasManager.getCanvas(path);

  let foreground = canvas.foreground;

  if (!foreground) return

  if (typeof foreground === 'string') {
    foreground = JSON.parse(foreground);
  }

  foreground.elements = [];

  canvas.foreground = JSON.stringify(foreground);

  if (path === CanvasManager.getSelectedPath()) {
    canvasEditor.clearCanvas();
    canvasEditor.renderAll()
  }
}


const clearCanvas = () => {
  canvasEditor.clearCanvas();
  backgroundCanvasEditor.clearCanvas()
  canvasEditor.renderAll();
  backgroundCanvasEditor.renderAll();
  CanvasManager.setSelectedObject({path: '', previewElement: null})
}


const resetMetadataSettings = () => {
  projectSettings.value.metadata = _.cloneDeep(originalMetadata)
  handleUpdateMetadata();
  StorageManager.saveProjectSettings(projectSettings.value)
}


const handleFocalLength = (type) => {
  for (let [path, canvas] of CanvasManager.getCanvases()) {
    const originalMetadata = canvas.originalMetadata;
    const metadata = canvas.metadata;
    let newFocalLength;
    if (originalMetadata && originalMetadata.focalLength) {
      if (type === 0) {
        newFocalLength = projectSettings.value.metadata.others.enableEquivalentFocalSegment
            ? Number.parseInt(originalMetadata.focalLength * projectSettings.value.metadata.others.conversionMultiple)
            : originalMetadata.focalLength
      } else if (type === 1 && projectSettings.value.metadata.others.enableEquivalentFocalSegment) {
        newFocalLength = Number.parseInt(originalMetadata.focalLength * projectSettings.value.metadata.others.conversionMultiple)
      }
      const format = projectSettings.value.metadata.formats['focalLength'];
      if (format) {
        newFocalLength = format.replace('${focalLength}', newFocalLength)
        path === CanvasManager.getSelectedPath() ? metadataOptions.value.focalLength = newFocalLength : metadata.focalLength = newFocalLength
      }
    }
  }
}


const handleUpdateMetadata = () => {
  const canvases = CanvasManager.getCanvases();
  for (let [path, canvas] of canvases) {
    if (canvas && canvas.originalMetadata) {
      const originalMetadata = canvas.originalMetadata;
      const metadata = canvas.metadata;
      const shootingTimeFormat = projectSettings.value.metadata.others.shootingTimeFormat;
      for (let key in originalMetadata) {
        const format = projectSettings.value.metadata.formats[key];
        let value = originalMetadata[key];
        if (key === 'shootingTime' && value && !['yyyy-MM-dd HH:mm:ss', 'YYYY-MM-DD HH:mm:ss'].includes(shootingTimeFormat)) {
          value = formatDate(parseDate(value, 'yyyy-MM-dd HH:mm:ss'), shootingTimeFormat);
        }
        if (value && format) {
          value = format.replace('${' + key + '}', value);
          CanvasManager.getSelectedPath() === path ? metadataOptions.value[key] = value : metadata[key] = value
        }
      }
    }
  }
}


watch(projectSettings, (newVal, oldVal) => {
  const settings = _.cloneDeep(newVal);
  settings.availableFonts = Array.from(settings.availableFonts.entries())
  StorageManager.saveProjectSettings(settings)
}, {
  deep: true
});


const loadProjectSettings = () => {
  const userConfig = StorageManager.getProjectSettings();
  if (userConfig) {
    const newUserConfig = _.merge({}, projectSettings.value, userConfig);
    newUserConfig.availableFonts = new Map(newUserConfig.availableFonts)
    projectSettings.value = newUserConfig
    StorageManager.saveProjectSettings(newUserConfig)
  }
}

const loadTemplates = () => {
  templates.value = StorageManager.getTemplates()
}

const loadTextLabels = () => {
  textLabels.value = StorageManager.getTextLabels()
}


watch(textOptions, async (newVal, oldValue) => {
  if (newVal !== oldValue) return
  const canvas = CanvasManager.getCurrentCanvas();
  const activeElements = canvasEditor.getActiveElements();
  if (!canvas || !activeElements.length) return
  const initZoom = canvas.initZoom;
  const {direction, fontFamily, fontSize, fontStyle, fontWeight, fontColor, angle, shadow, spacing, zIndex} = newVal;
  for (const activeElement of activeElements) {
    if (activeElement.type === 'text') {
      activeElement.direction = direction;
      activeElement.fontFamily = fontFamily;
      activeElement.fontStyle = fontStyle;
      activeElement.fontWeight = fontWeight;
      activeElement.fontColor = fontColor;
      activeElement.angle = angle;
      activeElement.order = zIndex;
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


watch(() => imageOptions.value, async (newVal, oldValue) => {
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


const handleCanvasScale = () => {
  const defaultCanvasScale = projectSettings.value.others.defaultCanvasScale;
  const canvases = CanvasManager.getCanvases();
  canvases.forEach(canvas => {
    if (canvas.completed) {
      const newZoom = defaultCanvasScale * canvas.initZoom;
      canvas.zoom = newZoom;
      if (canvas.path === CanvasManager.getSelectedPath()) {
        canvasEditor.setZoom(newZoom);
        backgroundCanvasEditor.setZoom(newZoom);
      }
    }
  })
}

const renameTemplate = () => {
  if (!renameTemplateForm?.value) return
  renameTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      if (templates.value && templates.value.length) {
        for (let i = 0; i < templates.value.length; i++) {
          if (templates.value[i].templateId === oldTemplate.value.templateId) {
            templates.value[i].templateName = oldTemplate.value.templateName
            StorageManager.saveTemplates(templates.value)
            renameDialogVisible.value = false
            return
          }
        }
      }
    }
  })
}

const deleteTemplate = () => {
  if (templates.value && templates.value.length) {
    for (let i = 0; i < templates.value.length; i++) {
      if (templates.value[i].templateId === oldTemplate.value.templateId) {
        templates.value.splice(i, 1)
        StorageManager.saveTemplates(templates.value)
        return
      }
    }
  }
}

const synchronizeTemplate = () => {
  if (CanvasManager.getSelectedPath()) {
    const {background, foreground: {width, height, elements}, initZoom} = CanvasManager.getCurrentCanvas();
    selectedPreviewList.value.forEach((image, path) => {
      if (CanvasManager.getSelectedPath() !== path) {
        const items = []
        for (const element of elements) {
          const centerX = element.x + element.width / 2
          const centerY = element.y + element.height / 2
          const horizontal = centerX < width / 2 ? 'left' : 'right';
          const vertical = centerY < height / 2 ? 'top' : 'bottom';
          const item = {...element}
          item.position = [horizontal, vertical]
          item.offsetX = horizontal === 'left' ? element.x * initZoom : (width - element.x - element.width) * initZoom
          item.offsetY = vertical === 'top' ? element.y * initZoom : (height - element.y - element.height) * initZoom
          item.centerXRatio = horizontal === 'left' ? centerX / width : (width - centerX) / width
          item.centerYRatio = vertical === 'top' ? centerY / height : (height - centerY) / height
          item.width = element.width * initZoom
          item.height = element.height * initZoom
          if (element.type === 'text') {
            item.fontSize = element.fontSize * initZoom
          }
          items.push(item)
        }
        const {idealWidth, idealHeight} = previewContainer.value;
        useTemplate(_.cloneDeep({
          idealWidth,
          idealHeight,
          background,
          foreground: {width, height, elements: items}
        }), path)
      }
    })
  }
}

const saveTemplates = async () => {
  if (!saveTemplateForm.value) return
  saveTemplateForm.value.validate(async (valid, fields) => {
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
      const {idealWidth, idealHeight} = previewContainer.value;
      const newTemplates = [...templates.value, {
        templateId: Date.now(),
        templateName: newTemplate.value.templateName,
        settings: _.cloneDeep({
          idealWidth,
          idealHeight,
          background,
          foreground: {width, height, zoom, elements: items}
        })
      }]

      templates.value = []
      await nextTick();
      templates.value = newTemplates;
      StorageManager.saveTemplates(newTemplates)
      newTemplate.value.templateName = ''
      saveTemplateDialogVisible.value = false
    }
  })
}


const handleTemplateSorting = (el, dragaElement, targetElement) => {
  let newTemplates = []
  const elements = el.querySelectorAll('.template');
  for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    for (let template of templates.value) {
      if (String(template.templateId) === dataId) {
        newTemplates.push(template)
        break
      }
    }
  }
  templates.value = newTemplates
  StorageManager.saveTemplates(templates.value)
}


const openEnableTemplateDialog = ({settings}) => {
  if (CanvasManager.isNotEmpty() && CanvasManager.getSelectedPath()) {
    templateSettings.value = settings
    enableTemplateDialogVisible.value = true
  }
}


const enableTemplate = () => {
  for (let path of selectedPreviewList.value.keys()) {
    useTemplate(_.cloneDeep(templateSettings.value), path)
  }
  enableTemplateDialogVisible.value = false
  synchronousMode.value = 0
}


const useTemplate = async (settings, path) => {
  const canvas = CanvasManager.getCanvas(path);
  const {idealWidth, idealHeight, background, foreground} = settings;
  const {height: imageHeight, width: imageWidth} = canvas.metadata;

  const {idealWidth: containerWidth, idealHeight: containerHeight} = previewContainer.value;
  const initZoom = Math.min(containerHeight / imageHeight, containerWidth / imageWidth);
  const zoom = initZoom * projectSettings.value.others.defaultCanvasScale;
  const idealZoom = Math.min(idealHeight / imageHeight, idealWidth / imageWidth);

  const zoomRatio = initZoom / idealZoom;

  const border = background.elements[0];
  const photo = background.elements[1];
  const borderOptions = border.meta;
  const photoOptions = photo.meta;

  borderOptions.borderLeft = borderOptions.borderLeft * zoomRatio
  borderOptions.borderRight = borderOptions.borderRight * zoomRatio
  borderOptions.borderTop = borderOptions.borderTop * zoomRatio
  borderOptions.borderBottom = borderOptions.borderBottom * zoomRatio
  borderOptions.borderRadius = borderOptions.borderRadius * zoomRatio
  borderOptions.borderBlur = borderOptions.borderBlur * zoomRatio

  photoOptions.borderRadius = photoOptions.borderRadius * zoomRatio

  const borderLeft = borderOptions.borderLeft / initZoom
  const borderRight = borderOptions.borderRight / initZoom
  const borderTop = borderOptions.borderTop / initZoom
  const borderBottom = borderOptions.borderBottom / initZoom

  const newWidth = imageWidth + borderLeft + borderRight
  const newHeight = imageHeight + borderTop + borderBottom

  background.width = foreground.width = newWidth
  background.height = foreground.height = newHeight

  border.radius = borderOptions.borderRadius / initZoom
  border.width = newWidth
  border.height = newHeight

  if (border.type === 'image') {
    border.blur = borderOptions.borderBlur / initZoom
    if (borderOptions.borderType === 1) {
      border.src = canvas.url
      borderOptions.url = canvas.url;
      borderOptions.path = canvas.path;
    }
  }

  photo.src = canvas.url
  photo.width = imageWidth
  photo.height = imageHeight
  photo.x = borderLeft
  photo.y = borderTop
  photo.radius = photoOptions.borderRadius / initZoom

  photoOptions.path = canvas.path

  for (let element of foreground.elements) {

    element.width = (element.width * zoomRatio) / initZoom;
    element.height = (element.height * zoomRatio) / initZoom;
    element.offsetX = (element.offsetX * zoomRatio) / initZoom;
    element.offsetY = (element.offsetY * zoomRatio) / initZoom;

    const {position, centerXRatio, centerYRatio} = element;

    if (element.type === 'text') {
      element.fontSize = (element.fontSize * zoomRatio) / initZoom;
      const newText = getText({path, ...element.meta, content: element.text})
      if (initZoom !== idealZoom || element.text !== newText) {
        const text = new Text(newText, {...element});
        const measureText = text.measureText(canvasEditor.ctx);
        element.width = measureText.width;
        element.height = measureText.height;
        element.text = newText;
      }
    }

    if (synchronousMode.value === 0) {
      element.x = position[0] === 'left' ? element.offsetX : newWidth - (element.offsetX + element.width)
      element.y = position[1] === 'top' ? element.offsetY : newHeight - (element.offsetY + element.height)
    }

    if (synchronousMode.value === 1) {
      element.x = position[0] === 'left' ? centerXRatio * newWidth - element.width / 2 : newWidth - (centerXRatio * newWidth + element.width / 2)
      element.y = position[1] === 'top' ? centerYRatio * newHeight - element.height / 2 : newHeight - (centerYRatio * newHeight + element.height / 2)
    }

  }

  canvas.borderOptions = _.cloneDeep(border.meta)
  canvas.background = JSON.stringify(background)
  canvas.foreground = JSON.stringify(foreground)
  canvas.initZoom = initZoom;
  canvas.zoom = canvas.zoom !== 1 ? canvas.zoom : zoom;
  canvas.width = imageWidth;
  canvas.height = imageHeight;

  if (!canvas.completed) {
    // 计算滚动位置，使图形内容居中
    const scrollLeft = (imageWidth - containerWidth) / 2;
    const scrollTop = (imageHeight - containerHeight) / 2;
    canvas.scrollLeft = Math.max(0, scrollLeft);
    canvas.scrollTop = Math.max(0, scrollTop);
    canvas.completed = true;
  }

  if (CanvasManager.getSelectedPath() === path) {
    await renderCanvas(canvas);
  }

}


const getText = (meta) => {
  const {path, type, content, expression} = meta
  switch (type) {
    case 'date':
      return getCurrentDate();
    case 'datetime':
      return getCurrentDateTime();
    case 'script':
      return executeFunctionScript(expression);
    case 'text':
      return content;
    case 'metadata':
      return (() => {
        const {metadata} = CanvasManager.getCanvas(path);
        return metadata ? metadata[expression] : ''
      })();
  }
}


const renderCanvas = async (canvas) => {
  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  const currentVersion = ++renderVersion;
  if (!canvas.completed) {
    canvasEditor.clearCanvas();
    backgroundCanvasEditor.clearCanvas();
    const image = await Image.fromURL(canvas.url, {
      selectable: false,
      cacheable: true,
      meta: {...new PhotographOptions(), path: canvas.path, url: canvas.url}
    });

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    const width = image.width;
    const height = image.height;
    const background = new Rect({width, height, meta: new BorderOptions()});
    // 设置画布宽高等于缩放后的图片尺寸
    canvasEditor.resizeCanvas(width, height);
    backgroundCanvasEditor.resizeCanvas(width, height);
    const {idealWidth, idealHeight} = previewContainer.value;
    const initZoom = Math.min(idealHeight / height, idealWidth / width);
    const scale = initZoom * projectSettings.value.others.defaultCanvasScale;
    canvasEditor.setZoom(scale)
    backgroundCanvasEditor.setZoom(scale)
    backgroundCanvasEditor.addElement(background);
    backgroundCanvasEditor.addElement(image);
    backgroundCanvasEditor.renderAll()

    // 非最终渲染图片，放弃更新数据
    if (currentVersion !== renderVersion) return;

    canvasWrapper.value.style.width = Math.max(width, idealWidth) + 'px'
    canvasWrapper.value.style.height = Math.max(height, idealHeight) + 'px'
    scrollBarMoveToCenter(canvas)
    borderOptions.value = background.meta
    photographOptions.value = image.meta
    metadataOptions.value = canvas.metadata
    canvas.completed = true
    canvas.width = width;
    canvas.height = height
    canvas.initZoom = initZoom
    canvas.zoom = canvasEditor.getZoom()
    canvas.borderOptions = _.cloneDeep(background.meta)
    canvas.photographOptions = _.cloneDeep(image.meta)
    canvas.foreground = canvasEditor.exportToObject()
    canvas.background = backgroundCanvasEditor.exportToObject()
  } else {
    const {foreground, background, zoom, metadata: {width: imageWidth, height: imageHeight}} = canvas;
    typeof foreground === 'string' ? await canvasEditor.loadFromJSON(foreground) : await canvasEditor.loadFromObject(foreground)

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    typeof background === 'string' ? await backgroundCanvasEditor.loadFromJSON(background) : await backgroundCanvasEditor.loadFromObject(background)

    // 非最终渲染图片，放弃渲染
    if (currentVersion !== renderVersion) return;

    const {idealWidth, idealHeight} = previewContainer.value;
    // 设置缩放
    canvasEditor.setZoom(zoom);
    backgroundCanvasEditor.setZoom(zoom);
    backgroundCanvasEditor.renderAll();
    canvasEditor.renderAll();

    // 非最终渲染图片，放弃更新数据
    if (currentVersion !== renderVersion) return;

    canvasWrapper.value.style.width = Math.max(imageWidth, idealWidth) + 'px'
    canvasWrapper.value.style.height = Math.max(imageHeight, idealHeight) + 'px'
    updateScrollBar(canvas)
    const elements = backgroundCanvasEditor.getElements();
    borderOptions.value = elements[0].meta
    photographOptions.value = elements[1].meta
    metadataOptions.value = canvas.metadata
    if (typeof foreground === 'string') {
      canvas.foreground = canvasEditor.exportToObject();
    }
    if (typeof background === 'string') {
      canvas.background = backgroundCanvasEditor.exportToObject()
    }
  }
}


const handleDbClickPreviewImage = (event, canvas) => {
  if (!event.ctrlKey && !event.shiftKey) {
    if (selectedPreviewList.value.has(canvas.path)) {
      if (CanvasManager.getSelectedPath() !== canvas.path) {
        // 更改新的选择元素
        CanvasManager.setSelectedObject({path: canvas.path, previewElement: event.target})
      }
      // 清空选中元素
      const selectedElements = selectedPreviewList.value;
      for (const [path, element] of selectedElements) {
        if (event.target !== element) {
          element.classList.remove('active')
          selectedPreviewList.value.delete(path)
        }
      }
    }
  }
}


async function switchPreviewImage(event, canvas) {
  if (!event.ctrlKey && !event.shiftKey) {
    if (!selectedPreviewList.value.has(canvas.path)) {
      // 清空选中元素
      const selectedElements = selectedPreviewList.value.values();
      for (let element of selectedElements) {
        element.classList.remove('active')
      }
      selectedPreviewList.value.clear()
    }

    const beforePath = CanvasManager.getSelectedPath();

    // 前一次预览元素与当前预览元素不同，隐藏前一次预览元素
    if (beforePath && beforePath !== canvas.path) {
      canvasEditor.clearCanvas();
      backgroundCanvasEditor.clearCanvas();
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!beforePath || beforePath !== canvas.path) {
      // 更改新的选择元素
      CanvasManager.setSelectedObject({path: event.target.getAttribute('path'), previewElement: event.target})
      // 添加当前选中元素到选中列表中
      selectedPreviewList.value.set(canvas.path, event.target)
      // 设置选择样式
      event.target.classList.add('active')

      await renderCanvas(canvas);
    }
  }
}

const updateScrollBar = (canvas) => {
  // 设置滚动位置
  previewContainer.value.scrollLeft = canvas.scrollLeft;
  previewContainer.value.scrollTop = canvas.scrollTop;
}


const initAreaResize = () => {

  const {
    leftSidebar: leftSidebarResize,
    previewContainer: previewContainerResize,
    rightSidebar: rightSidebarResize,
    bottomSidebar: bottomSidebarResize
  } = projectSettings.value.resize;

  const root = document.documentElement;
  const rootStyle = root.style;

  if (leftSidebarResize.width) {
    rootStyle.setProperty('--page-left-width', leftSidebarResize.width)
  }

  if (rightSidebarResize.width) {
    rootStyle.setProperty('--page-right-width', rightSidebarResize.width)
  }

  if (previewContainerResize.width) {
    rootStyle.setProperty('--preview-container-width', previewContainerResize.width)
  }


  if (previewContainerResize.height) {
    rootStyle.setProperty('--page-main-height', previewContainerResize.height)
  }

  if (bottomSidebarResize.height) {
    rootStyle.setProperty('--page-bottom-height', bottomSidebarResize.height)
  }
}

const initCanvasSize = () => {

  setTimeout(() => {

    const {previewContainer: previewContainerResize} = projectSettings.value.resize;

    const {clientWidth, clientHeight} = page.value;

    previewContainer.value.idealWidth = Number.parseFloat(previewContainerResize.width || 0) / 100 * clientWidth || previewContainer.value.clientWidth

    previewContainer.value.idealHeight = Number.parseFloat(previewContainerResize.height || 0) / 100 * clientHeight || previewContainer.value.clientHeight

    renderCanvasScrollbar()

    canvasEditor = new CanvasEditor(canvasElement.value, {enableCache: true});

    backgroundCanvasEditor = new CanvasEditor(backgroundElement.value, {enableCache: true});

    canvasEditor.on('selection:object', (event) => {
      const {initZoom} = CanvasManager.getCurrentCanvas();
      const target = event.target;
      const {x, y, ...element} = _.cloneDeep(target);
      if (target.type === 'text') {
        const {fontSize, spacing, order, shadow: {offsetX, offsetY, blur}} = element;
        element.fontSize = fontSize * initZoom
        element.spacing = spacing * initZoom
        element.shadow.offsetX = offsetX * initZoom
        element.shadow.offsetY = offsetY * initZoom
        element.shadow.blur = blur * initZoom
        element.zIndex = order
        textOptions.value = element
        if (projectSettings.value.others.optionAnchorPoint) {
          handleOpenSubMenu('3')
          nextTick(() => {
            document.getElementById('text-options').scrollIntoView({behavior: 'smooth'});
          })
        }
      } else if (target.type === 'image') {
        const {order, shadow: {offsetX, offsetY, blur}} = element;
        element.shadow.offsetX = offsetX * initZoom
        element.shadow.offsetY = offsetY * initZoom
        element.shadow.blur = blur * initZoom
        element.zIndex = order
        imageOptions.value = element
        if (projectSettings.value.others.optionAnchorPoint) {
          handleOpenSubMenu('4')
          nextTick(() => {
            document.getElementById('image-options').scrollIntoView({behavior: 'smooth'});
          })
        }
      }
    })

    canvasEditor.on('update:object', (event) => {
      // console.log('修改元素', event)
    })

    canvasEditor.on('move:object', (event) => {
      const canvas = CanvasManager.getCurrentCanvas();
      canvas.foreground = canvasEditor.exportToObject()
      canvas.background = backgroundCanvasEditor.exportToObject()
    })

    canvasEditor.on('add:object', (event) => {
      // console.log('添加元素', event)
    })

  }, 1000)
}

const renderCanvasScrollbar = () => {
  previewContainer.value.style.overflow = projectSettings.value.others.enableScrollbar ? 'auto' : 'hidden'
}


// 设置缩放比例
function setZoom(canvas, zoom) {

  if (!canvas || !zoom) return

  const computedStyle = window.getComputedStyle(canvasElement.value);

  const canvasWidth = Number.parseFloat(computedStyle.width);

  const canvasHeight = Number.parseFloat(computedStyle.height);

  const {minZoom, maxZoom} = zoomOptions;

  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // 限制缩放范围
  const newZoom = Math.min(Math.max(minZoom, zoom), maxZoom);

  // 应用缩放变换
  canvasElement.value.style.transform = `scale(${newZoom})`;
  // 设置变换原点为中心点
  canvasElement.value.style.transformOrigin = `${centerX}px ${centerY}px`;

  canvas.zoom = newZoom
}


const handleScrollBarMoveToCenter = () => {
  if (CanvasManager.getSelectedPath()) {
    const canvas = CanvasManager.getCurrentCanvas();
    scrollBarMoveToCenter(canvas)
  }
}


// 初始化时自动滚动到图形内容区域
function scrollBarMoveToCenter(canvas) {
  if (!canvas) return
  const {offsetWidth: canvasWrapperWidth, offsetHeight: canvasWrapperHeight} = canvasWrapper.value
  const {offsetWidth: previewContainerWidth, offsetHeight: previewContainerHeight} = previewContainer.value
  // 计算滚动位置，使图形内容居中
  const scrollLeft = (canvasWrapperWidth - previewContainerWidth) / 2;
  const scrollTop = (canvasWrapperHeight - previewContainerHeight) / 2;
  // 设置滚动位置
  previewContainer.value.scrollLeft = Math.max(0, scrollLeft);
  previewContainer.value.scrollTop = Math.max(0, scrollTop);
  canvas.scrollLeft = Math.max(0, scrollLeft);
  canvas.scrollTop = Math.max(0, scrollTop);
}


const handleSelectPreviewElement = (event, canvas) => {
  const element = event.target;
  if (element.classList.contains('active')) {
    element.classList.remove('active');
    selectedPreviewList.value.delete(canvas.path)
    if (CanvasManager.getSelectedPath() === canvas.path) {
      clearCanvas()
    }
  } else {
    element.classList.add('active');
    selectedPreviewList.value.set(canvas.path, element)
  }
}


const handleSelectMultiplePreviewElements = (event, canvas) => {
  if (selectedPreviewList.value.size) {
    const elements = document.documentElement.querySelectorAll('img.previewItem');
    let index = -1;
    const beforeElements = [];
    const afterElements = [];
    for (let i = 0; i < elements.length; i++) {
      const originalElement = elements[i];
      const active = originalElement.classList.contains('active');
      if (canvas.path === originalElement.getAttribute('path')) {
        index = i;
        beforeElements.push({active, originalElement})
        afterElements.push({active, originalElement})
        continue
      }
      if (index === -1) {
        beforeElements.push({active, originalElement})
      } else {
        afterElements.push({active, originalElement})
      }
    }

    for (let i = 0; i < beforeElements.length; i++) {
      const beforeElement = beforeElements[i];
      if (beforeElement.active) {
        for (let j = i; j < beforeElements.length; j++) {
          const usefulElement = beforeElements[j];
          const original = usefulElement.originalElement;
          if (!usefulElement.active) {
            original.classList.add('active')
            selectedPreviewList.value.set(original.getAttribute('path'), original)
          }
        }
        for (let afterElement of afterElements) {
          const original = afterElement.originalElement;
          if (afterElement.active) {
            selectedPreviewList.value.delete(original.getAttribute('path'))
            original.classList.remove('active')
          }
        }
        return
      }
    }

    for (let i = 0; i < afterElements.length; i++) {
      const afterElement = afterElements[i];
      if (afterElement.active) {
        for (let j = 0; j < i; j++) {
          const usefulElement = afterElements[j];
          const original = usefulElement.originalElement;
          if (!usefulElement.active) {
            original.classList.add('active')
            selectedPreviewList.value.set(original.getAttribute('path'), original)
          }
        }
        return
      }
    }

  }
}


const formatSliderTooltip = (val) => {
  return Math.floor(val);
};


const requestImportBorderImage = () => {
  window.electronAPI.requestImportBackgroundImage();
}


const watchImportBackgroundImage = () => {
  window.electronAPI.watchImportBackgroundImage(async (event, data) => {
    handleCreateBorders(data)
  })
}

const requestImportFiles = (options) => {
  window.electronAPI.requestImportFiles(options)
}


const handleUpdatePhotograph = async () => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
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


const handleCreateBorders = async (file) => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
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

  scrollBarMoveToCenter(currentCanvas)

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

  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  canvasEditor.renderAll();
  backgroundCanvasEditor.renderAll();

  borderOptions.value = elements[0].meta
  currentCanvas.borderOptions = _.cloneDeep(elements[0].meta)
  currentCanvas.foreground = canvasEditor.exportToObject()
  currentCanvas.background = backgroundCanvasEditor.exportToObject();
}

const handleUpdateBorders = () => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  if (!currentCanvas) return
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

  scrollBarMoveToCenter(currentCanvas)

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

  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  canvasEditor.renderAll();
  backgroundCanvasEditor.renderAll();

  currentCanvas.borderOptions = _.cloneDeep(borderOptions.value)
  currentCanvas.foreground = canvasEditor.exportToObject()
  currentCanvas.background = backgroundCanvasEditor.exportToObject();
}


const switchBeforePreviewElement = useThrottle(async () => {
  const {path: currentPath, previewElement: currentElement} = CanvasManager.getSelectedObject();
  if (!currentPath) return
  const currentCanvas = availableCanvas.value.get(currentPath);
  const beforeCanvas = MapHelper.getBeforeValue(availableCanvas.value, currentPath);
  if (currentCanvas && beforeCanvas) {
    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    selectedPreviewList.value.delete(currentPath)

    const beforeElement = currentElement.previousElementSibling || currentElement.parentNode.lastElementChild;
    beforeElement.classList.add('active')
    beforeElement.setAttribute('selected', 'true')

    CanvasManager.setSelectedObject({path: beforeCanvas.path, previewElement: beforeElement})
    selectedPreviewList.value.set(beforeCanvas.path, beforeElement)

    await renderCanvas(beforeCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, beforeElement)
  }
}, 200)

const switchNextPreviewElement = useThrottle(async () => {
  const {path: currentPath, previewElement: currentElement} = CanvasManager.getSelectedObject();
  if (!currentPath) return
  const currentCanvas = availableCanvas.value.get(currentPath);
  const nextCanvas = MapHelper.getNextValue(availableCanvas.value, currentPath);

  if (currentCanvas && nextCanvas) {
    currentElement.setAttribute('selected', 'false')
    currentElement.classList.remove('active')
    selectedPreviewList.value.delete(currentPath)

    const nextElement = currentElement.nextElementSibling || currentElement.parentNode.firstElementChild;
    nextElement.classList.add('active')
    nextElement.setAttribute('selected', 'true')
    CanvasManager.setSelectedObject({path: nextCanvas.path, previewElement: nextElement})
    selectedPreviewList.value.set(nextCanvas.path, nextElement)

    await renderCanvas(nextCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, nextElement)
  }
}, 200)


function scrollBarMoveToHorizontalCenter(container, element) {
  if (container._timerId) {
    clearTimeout(container._timerId)
  }
  container._timerId = setTimeout(() => {
    const containerWidth = container.offsetWidth;
    const elementWidth = element.offsetWidth;
    const offsetLeft = element.offsetLeft;
    const scrollLeft = offsetLeft - (containerWidth - elementWidth) / 2;
    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  }, 200)
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
const handleOpenSubMenu = (index) => {
  if (menuRef.value && !openedMenus.value.includes(index)) {
    menuRef.value.open(index)
  }
}


const handleMovePreviewList = useThrottle((e) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 2; // 调整滚动速度
  // 4. 应用滚动
  if (previewList.value) {
    previewList.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
}, 200);


const handleSelectAllPreviewElements = (event) => {

  const target = event.target;

  // 检查是否在输入框/下拉框内
  if (target.closest('input, textarea, select')) {
    return;
  }

  // 检查是否在富文本编辑器内（利用 isContentEditable 属性）或者用 closest 检查属性，两者皆可
  if (target.isContentEditable || target.closest('[contenteditable="true"]')) {
    return;
  }

  // 检查是否原生可编辑（比如 Firefox 的 designMode 页面）
  if (target.closest('[designMode="on"]')) {
    return;
  }

  if ((event.ctrlKey && event.key === 'a') || event instanceof PointerEvent) {
    event.preventDefault();
    const previewElements = document.querySelectorAll('img.previewItem');
    if (previewElements.length) {
      previewElements.forEach(element => {
        element.classList.add('active');
        selectedPreviewList.value.set(element.getAttribute('path'), element)
      })
    }
  }
}

const handleMoveScrollbar = (event) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  // 清除之前的定时器
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  // 设置新的定时器（防抖：100ms）
  scrollTimeout = setTimeout(() => {
    const target = event.target;
    // 设置滚动条参数到 image 对象
    canvas.scrollTop = target.scrollTop;
    canvas.scrollLeft = target.scrollLeft;
  }, 100);

}

const handleKeyDownMoveElement = (event) => {

  const activeElement = document.activeElement;

  const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  const canvas = CanvasManager.getCurrentCanvas();

  if (!validKeys.includes(event.key) || !canvas || activeElement !== document.body) return;

  event.preventDefault();

  const step = projectSettings.value.others.movingStepSize / canvas.initZoom;

  const activeElements = canvasEditor.getActiveElements();

  for (const activeElement of activeElements) {
    switch (event.key) {
      case 'ArrowUp':
        activeElement.y -= step;
        activeElement.centerY -= step;
        break;
      case 'ArrowDown':
        activeElement.y += step;
        activeElement.centerY += step;
        break;
      case 'ArrowLeft':
        activeElement.x -= step;
        activeElement.centerX -= step;
        break;
      case 'ArrowRight':
        activeElement.x += step;
        activeElement.centerX += step;
        break;
    }
  }

  canvasEditor.renderAll();

  canvas.foreground = canvasEditor.exportToObject()
}


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
  // 方法1：使用原图片作为拖拽预览
  event.dataTransfer.setDragImage(component, offsetX, offsetY);
  // 或者方法2：设置图片URL数据，让浏览器生成预览
  //event.dataTransfer.setData('text/uri-list', src);
  //event.dataTransfer.setData('text/html', `<img src="${src}" width="${width}" height="${height}">`);

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move';
}

const handleDropElement = async function (event) {

  event.preventDefault();

  if (!CanvasManager.getCurrentCanvas() || !event.dataTransfer.types.includes('text/plain')) return

  const data = JSON.parse(event.dataTransfer.getData('text/plain'))

  const {settings: elementSettings, mouse: {offsetX, offsetY}} = data

  const factory = new DraggableElementFactory(elementSettings, metadataOptions.value);

  const dragElement = await factory.getElement();

  if (!dragElement) return;

  const {x, y} = canvasEditor.getCanvasPosition(event);

  dragElement.x = x - offsetX / canvasEditor.getZoom();

  dragElement.y = y - offsetY / canvasEditor.getZoom();

  canvasEditor.addElement(dragElement)

  canvasEditor.renderAll()

  const currentCanvas = CanvasManager.getCurrentCanvas();
  currentCanvas.zoom = canvasEditor.getZoom()
  currentCanvas.foreground = canvasEditor.exportToObject()
}

const handleDropFiles = (event) => {

  if (event.dataTransfer.types.includes('text/plain')) return

  const files = Array.from(event.dataTransfer.files || []);

  // 允许的文件扩展名（不区分大小写）
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // 过滤文件，只保留指定格式文件
  const paths = files.filter(file => {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }).map(file => file.path);

  // 如果有符合条件的文件，发送请求
  if (paths.length > 0) {
    requestImportFiles({isDragOver: true, paths})
  }

  uploader.value.style.pointerEvents = '';
}


const handleDragenter = (event) => {
  event.preventDefault();
  uploader.value.style.pointerEvents = 'none';
}

const handleDragover = (event) => {
  // 允许放置
  event.preventDefault();
}

const handleDragleave = (event) => {
  event.preventDefault();
}


const handleDragend = (event) => {
  uploader.value.style.pointerEvents = '';
}


// 处理 canvas 缩放
const handleCanvasResize = (event) => {
  // 阻止默认滚动行为
  event.preventDefault();
  // 根据滚轮方向确定缩放方向
  const direction = event.deltaY < 0 ? 'in' : 'out';
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  canvasElement.value.classList.add('scale-animation')
  backgroundElement.value.classList.add('scale-animation')
  const initZoom = canvas.initZoom;
  const zoom = canvasEditor.getZoom();
  const {maxZoom, minZoom} = zoomOptions;
  let newZoom = direction === 'in' ? zoom + zoom * 0.1 : zoom - zoom * 0.1;
  newZoom = Math.min(Math.max(minZoom * initZoom, newZoom), maxZoom * initZoom);
  canvas.zoom = newZoom
  canvasEditor.setZoom(newZoom)
  backgroundCanvasEditor.setZoom(newZoom)
}

const handleDragMoveCanvas = (event) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (canvas && isCanvasDraggingMode) {
    // 拖拽开始时设置光标为正在抓取的状态
    previewContainer.value.style.cursor = 'grabbing';
    const {scrollWidth, scrollHeight, clientWidth, clientHeight} = previewContainer.value
    // 记录初始滚动位置和鼠标位置
    const initialScrollLeft = canvas.scrollLeft;
    const initialScrollTop = canvas.scrollTop;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
    const startX = event.clientX;
    const startY = event.clientY;
    const handleMousemove = function (event) {
      // 取消拖拽模式，不更改滚动条位置
      if (!isCanvasDraggingMode) return
      // 计算鼠标移动的距离
      const offsetX = event.clientX - startX;
      const offsetY = event.clientY - startY;
      // 限制滚动位置在边界内
      const scrollLeft = Math.max(0, Math.min(initialScrollLeft - offsetX, maxScrollLeft));
      const scrollTop = Math.max(0, Math.min(initialScrollTop - offsetY, maxScrollTop));
      // 设置滚动位置
      previewContainer.value.scrollLeft = scrollLeft;
      previewContainer.value.scrollTop = scrollTop;
      // 应用鼠标移动的距离到滚动位置
      canvas.scrollLeft = scrollLeft;
      canvas.scrollTop = scrollTop;
    };

    const handleMouseup = function (event) {
      // 拖拽结束，恢复光标为抓手的准备状态（空格键仍按住）
      previewContainer.value.style.cursor = '';
      previewContainer.value.removeEventListener('mousemove', handleMousemove)
      document.removeEventListener('mouseup', handleMouseup)
    };
    previewContainer.value.addEventListener('mousemove', handleMousemove)
    document.addEventListener('mouseup', handleMouseup)
  }
};


const handleLeftSidebarResize = (e) => {

  let lastMoveX = e.clientX;
  const {clientWidth, clientHeight} = page.value;
  const leftSidebar = leftResize.value.parentNode;

  // 获取当前百分比值
  const rootStyle = getComputedStyle(document.documentElement);
  let sidebarPercent = parseFloat(rootStyle.getPropertyValue('--page-left-width'))
  let previewPercent = parseFloat(rootStyle.getPropertyValue('--preview-container-width'));

  const handleMove = (event) => {

    const moveX = event.clientX;
    const offsetX = moveX - lastMoveX;
    lastMoveX = moveX;

    // 计算偏移量对应的百分比变化
    const offsetPercent = (offsetX / clientWidth) * 100;

    const newSidebarPercent = sidebarPercent + offsetPercent;
    const newPreviewPercent = previewPercent - offsetPercent;

    const {minWidth: previewMinWidth = 0} = window.getComputedStyle(previewContainer.value);
    const {minWidth: sidebarMinWidth = 0} = window.getComputedStyle(leftSidebar);

    const previewMinWidthPercent = (parseFloat(previewMinWidth) / clientWidth) * 100;
    const sidebarMinWidthPercent = (parseFloat(sidebarMinWidth) / clientWidth) * 100;

    // 验证两个约束条件
    if (newPreviewPercent >= previewMinWidthPercent && newSidebarPercent >= sidebarMinWidthPercent) {

      sidebarPercent = newSidebarPercent;
      previewPercent = newPreviewPercent;

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--page-left-width', `${sidebarPercent}%`);
      rootStyle.setProperty('--preview-container-width', `${previewPercent}%`);

      previewContainer.value.idealWidth = newPreviewPercent / 100 * clientWidth;

      // 存储到项目设置
      projectSettings.value.resize.leftSidebar.width = `${sidebarPercent}%`;
      projectSettings.value.resize.previewContainer.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(projectSettings.value);
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
  const rightSidebar = rightResize.value.parentNode;

  // 获取当前百分比值
  const rootStyle = getComputedStyle(document.documentElement);
  let sidebarPercent = parseFloat(rootStyle.getPropertyValue('--page-right-width'));
  let previewPercent = parseFloat(rootStyle.getPropertyValue('--preview-container-width'));

  const handleMove = (event) => {

    const moveX = event.clientX;
    const offsetX = moveX - lastMoveX;
    lastMoveX = moveX;

    // 计算偏移量对应的百分比变化
    const offsetPercent = (offsetX / clientWidth) * 100;

    const newSidebarPercent = sidebarPercent - offsetPercent;
    const newPreviewPercent = previewPercent + offsetPercent;

    const {minWidth: previewMinWidth = 0} = window.getComputedStyle(previewContainer.value);
    const {minWidth: sidebarMinWidth = 0} = window.getComputedStyle(rightSidebar);

    const previewMinWidthPercent = (parseFloat(previewMinWidth) / clientWidth) * 100;
    const sidebarMinWidthPercent = (parseFloat(sidebarMinWidth) / clientWidth) * 100;

    // 验证两个约束条件
    if (newPreviewPercent >= previewMinWidthPercent && newSidebarPercent >= sidebarMinWidthPercent) {

      sidebarPercent = newSidebarPercent;

      previewPercent = newPreviewPercent;

      const rootStyle = document.documentElement.style;
      rootStyle.setProperty('--page-right-width', `${sidebarPercent}%`);
      rootStyle.setProperty('--preview-container-width', `${previewPercent}%`);

      previewContainer.value.idealWidth = newPreviewPercent / 100 * clientWidth;

      // 存储到项目设置
      projectSettings.value.resize.rightSidebar.width = `${sidebarPercent}%`;
      projectSettings.value.resize.previewContainer.width = `${previewPercent}%`;
      StorageManager.saveProjectSettings(projectSettings.value);
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
  const bottomSidebar = bottomResize.value.parentNode;

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

    const {minHeight: previewMinHeight = 0} = window.getComputedStyle(previewContainer.value);
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

      previewContainer.value.idealHeight = newPreviewPercent / 100 * clientHeight;

      // 存储到项目设置
      projectSettings.value.resize.bottomSidebar.height = `${sidebarPercent}%`;
      projectSettings.value.resize.previewContainer.height = `${previewPercent}%`;
      projectSettings.value.resize.leftSidebar.height = `${previewPercent}`;
      projectSettings.value.resize.rightSidebar.height = `${previewPercent}%`;
      StorageManager.saveProjectSettings(projectSettings.value);
    }
  };

  const handleUp = (event) => {
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
  }

  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
}

const triggerDragCanvas = (event) => {
  const activeElement = document.activeElement;
  const isEditableElement = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
  if (event.code === 'Space' && !isEditableElement && !canvasEditor.isEditing) {
    event.preventDefault();
    isCanvasDraggingMode = true;
    // 设置全局样式提示用户
    previewContainer.value.style.cursor = 'grab';
    const handleKeyup = function (event) {
      if (event.code === 'Space') {
        isCanvasDraggingMode = false;
        previewContainer.value.style.cursor = '';
        document.removeEventListener('keyup', handleKeyup)
      }
    }
    document.addEventListener('keyup', handleKeyup)
  }
}


// 删除元素
const handleRemoveElement = (event) => {

  // 检查当前焦点元素是否为可输入元素
  const activeElement = document.activeElement;

  // 判断是否为可输入元素
  const isEditable = activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable ||
      activeElement.getAttribute('contenteditable') === 'true';

  // 如果是可输入元素，则允许默认的删除行为
  if (isEditable) {
    return;
  }

  const canvas = CanvasManager.getCurrentCanvas();
  // 判断是否为删除键（Backspace 或 Delete）
  if (canvas && (event.key === 'Backspace' || event.key === 'Delete')) {
    const activeElements = canvasEditor.getActiveElements();
    const length = activeElements.length;
    canvasEditor.removeElements(activeElements)
    if (length) {
      canvas.foreground = canvasEditor.exportToObject()
    }
    canvasEditor.renderAll()
  }
}


const bindEventListener = () => {

  document.querySelectorAll('.image-marks, .text-marks, .metadata').forEach(element => {
    useEventListener(element, 'dragstart', handleDragStart)
  });

  useEventListener(previewContainer.value, 'drop', handleDropElement);
  useEventListener(previewContainer.value, 'drop', handleDropFiles);
  useEventListener(previewContainer.value, 'dragenter', handleDragenter);
  useEventListener(previewContainer.value, 'dragover', handleDragover);
  useEventListener(previewContainer.value, 'dragleave', handleDragleave);
  useEventListener(previewContainer.value, 'scroll', handleMoveScrollbar);
  useEventListener(previewContainer.value, 'mousedown', handleDragMoveCanvas);
  useEventListener(previewContainer.value, 'wheel', handleCanvasResize, {passive: false});

  useEventListener(leftResize.value, 'mousedown', handleLeftSidebarResize)
  useEventListener(rightResize.value, 'mousedown', handleRightSidebarResize)
  useEventListener(bottomResize.value, 'mousedown', handleBottomSidebarResize)

  useEventListener(document, 'dragend', handleDragend);
  useEventListener(document, 'keydown', handleSelectAllPreviewElements);
  useEventListener(document, 'keydown', handleRemoveElement)
  useEventListener(document, 'keydown', handleKeyDownMoveElement)
  useEventListener(document, 'keydown', triggerDragCanvas)
}

onMounted(() => {
  loadTemplates()
  loadTextLabels()
  watchImportImages()
  watchImportFonts()
  watchTemplates()
  watchContextMenu()
  watchTemplateContextMenu()
  watchAboutDialog()
  watchLabelResources()
  watchDownloadProgress()
  editorOutputSettings()
  watchProjectSettings()
  watchImportBackgroundImage()
  loadProjectSettings()
  initAreaResize()
  initCanvasSize()
  bindEventListener()
})


onBeforeUnmount(() => {

})


</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;
  border: 1px solid var(--border-color);
  border-top: none;
  overflow: hidden;

  .page-main {
    width: 100%;
    height: var(--page-main-height);
    display: flex;
    box-sizing: border-box;

    .page-left {
      width: var(--page-left-width);
      height: 100%;
      background: var(--expand-area-background-color);
      box-sizing: border-box;
      flex-shrink: 0;
      position: relative;
      min-width: 100px;
      border: 1px solid var(--border-color);
      border-left: none;

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
            background-color: #757575 !important;
            color: #faf8f8;
          }

          .text-marks-options {
            height: 50%;
            width: 100%;
            box-sizing: border-box;
            background-color: var(--menu-background-color);

            .text-marks {
              padding: 20px 10px;
              display: grid;
              gap: 20px;
              grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
              font-size: 12px;
              background-color: var(--expand-area-background-color);

              .text-mark {
                width: fit-content;
                height: fit-content;
                cursor: move;
                user-select: none;

                img {
                  width: 25px;
                }
              }

              .text-mark:hover {
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                background: #e3f2fd;
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
                color: white;
              }
            }

            .el-menu-item:hover {
              background-color: #545353;
              color: white !important;
            }

          }

          .image-mark-options {
            height: 50%;
            width: 100%;
            box-sizing: border-box;
            background-color: var(--menu-background-color);
            border-bottom: 1px solid #a2a4a6;

            .image-marks {
              display: grid;
              grid-template-columns: repeat(3, 1fr); /* 三等分列宽 */
              gap: 10px;
              padding: 10px;
              background-color: var(--expand-area-background-color);

              .image-item {
                /* 不需要设置高度，用 aspect-ratio 设置宽高比例 */
                aspect-ratio: 5 / 4; /* 或根据需求设为 4/3、16/9 等 */
                display: flex;
                justify-content: center;
                align-items: center;
                background: #ffffff; /* 可选，占位背景 */
                border-radius: 2px;
                padding: 5%;

                .image-mark {
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
            border-bottom: 1px solid #a2a4a6;

            .templates {
              background-color: var(--expand-area-background-color);

              .el-menu-item {
                color: var(--main-font-color);
                border-bottom: 1px solid #868686;
                height: 40px;
              }

              .el-menu-item:last-child {
                border-bottom: none;
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

    }

    .preview-view {
      width: var(--preview-container-width);
      height: 100%;
      position: relative;

      .uploader {
        font-weight: bold;
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: center;
        position: absolute;
        top: 50%; /* 相对于父容器 .preview-container */
        left: 50%; /* 相对于父容器 .preview-container */
        transform: translate(-50%, -50%); /* 相对于自身偏移，实现完美居中 */
        z-index: 999;

        img {
          width: 60px;
        }

        span {
          font-size: 14px;
          color: #8A8A8A;
        }
      }

      .preview-container {
        background: var(--preview-background-color);
        width: 100%;
        height: 100%;
        position: absolute;
        min-width: 300px;
        min-height: 100px;
        border: 1px solid #919191;

        .canvas-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 0;

          #foreground-canvas {
            position: absolute;
            background-color: transparent;
            z-index: 1;
            will-change: width, height;
          }

          .scale-animation {
            transition: width 0.1s, height 0.1s;
          }

          #background-canvas {
            position: absolute;
            will-change: width, height;
          }
        }
      }
    }

    .page-right {
      width: var(--page-right-width);
      height: 100%;
      background: var(--expand-area-background-color);
      position: relative;
      min-width: 100px;
      border: 1px solid var(--border-color);
      border-right: none;

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
              border-bottom: 1px solid #a2a4a6;

              .control-option {
                background-color: #919090;
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
                background-color: var(--expand-area-background-color);
                display: flex;
                justify-content: center;
                align-items: end;
                border-top: 1px solid #818080;
              }

              .group-title:first-child {
                border-top: none;
              }

              .options {
                width: 100%;
                list-style: none;
                padding: 10px 0 10px 10px;
                background-color: var(--expand-area-background-color);

                .option {
                  height: 35px;
                  width: 100%;
                  display: flex;
                  justify-content: start;
                  align-items: center;
                  padding: 10px 0;
                  margin-top: 2px;

                  .label {
                    display: flex;
                    align-items: center;
                    justify-content: end;
                    width: 50px;
                    font-size: 12px;
                    color: var(--main-font-color);

                    .text-mark {
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
                    width: calc(100% - 55px);
                    padding: 0 5px 0 10px;

                    .number-input {
                      width: 40px;
                      font-size: 11px;
                      outline: none;
                      transition: border-color 0.3s;
                      border: none;
                      background: transparent;
                      color: var(--main-font-color);
                      margin-left: 7px;
                    }

                    .el-icon {
                      margin-left: 5px;
                    }

                    :deep(.el-input) {
                      width: calc(100% - 5px);
                      font-size: 10px;

                      .el-input__wrapper {
                        background: #F0F0F0;
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
                        color: #4d4c4c;
                      }
                    }

                    :deep(.el-button) {
                      span {
                        color: white;
                      }
                    }

                    :deep(.el-slider) {
                      width: 100%;
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
                  color: white;
                }
              }
            }
          }
        }
      }
    }
  }


  .page-bottom {
    width: 100%;
    height: var(--page-bottom-height);
    border-top: 1px solid var(--border-color);
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

    .function-tabs {
      width: 100%;
      height: 40px;
      background: var(--expand-area-background-color);
      display: flex;
      justify-content: left;
      align-items: center;
      border-bottom: 2px solid var(--border-color);
      gap: 15px;
      padding-left: 15px;

      .left-tabs {
        height: 100%;
        display: flex;
        align-items: center;
        gap: 20px;

        .tab-wrapper {
          position: relative;
          height: 70%;
          display: flex;
          align-items: center;

          img {
            height: 100%;
            width: auto;
            transition: opacity 0.4s ease;
          }

          .small-size {
            padding: 5%;
          }

          .inactive {
            opacity: 1;
          }

          .active {
            position: absolute;
            top: 0;
            left: 0;
            opacity: 0;
          }

          .inactive:hover {
            opacity: 0;
          }

          .active:hover {
            opacity: 1;
          }
        }
      }

      .right-tabs {
        display: flex;
        margin-left: auto;
        align-items: center;
        gap: 15px;

        .counter {
          color: #faf8f8;
          font-size: 14px;
          display: flex;
        }

        .filter {
          display: flex;
          align-items: center;

          .filter-label {
            color: #faf8f8;
            font-size: 14px;
          }

          .filter-select {
            margin-right: 20px;

            .el-select {
              width: 100px !important;
            }
          }
        }
      }
    }

    .preview-list {
      box-sizing: border-box;
      width: 100%;
      height: calc(100% - 40px);
      display: flex;
      justify-content: start;
      background: var(--expand-area-background-color);
      overflow-x: auto;
      scroll-behavior: smooth; /* 可选，使滚动更平滑 */
      white-space: nowrap; /* 防止内容换行 */
      outline: none;

      img {
        box-sizing: border-box;
        background: grey;
        padding: 15px;
        height: 100%;
        border-right: 1px solid #a2a4a6;
      }

      img:last-child {
        border: none;
      }

      .active {
        background: #dedcdc;
      }

      image:last-child {
        margin-right: 0;
      }

    }
  }

}


:deep(.el-dialog) {
  background-color: var(--dialog-main-background-color);
  padding: 1px 1px 10px 1px;

  .el-dialog__header {
    height: 26px;
    padding-bottom: 0;
    display: flex;
    align-items: center;
    background-color: #F3F3F3;

    i {
      height: 100%;
      width: 100%;
      color: black;
      border-radius: 0 4px 0 0;
    }

    i:hover {
      color: white;
      background-color: rgba(201, 48, 48, 0.97);
    }
  }

  .el-dialog__body {
    padding: 10px;
    width: 100%;
  }


  .el-dialog__headerbtn {
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: end;
  }

  .el-dialog__title {
    font-size: 12px;
    color: black;
    margin-left: 10px;
  }

  .el-dialog__footer {
    padding-top: 0;

    button:last-child {
      margin-right: 10px;
    }

  }

  .el-tabs, .el-select {
    background: #F0F0F0;
  }

  .el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active {
    color: black;
  }

  .el-tabs--border-card > .el-tabs__header .el-tabs__item:hover {
    color: #817e7e;
  }

  .el-tabs .el-tabs__nav-scroll {
    height: 25px;
    background: #e3e3e3;

    .el-tabs__item {
      height: 25px;
      font-size: 11px;
    }
  }
}


.el-dialog {

  .delete-tips-dialog-footer {
    display: flex;
    justify-content: space-between;
    margin: 0 10px;

    .left-dialog-footer {
      display: flex;
      align-items: center;
    }

    .right-dialog-footer {
      display: flex;
      align-items: center;
    }
  }

  .about {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    gap: 10px;
    font-family: "黑体", "Microsoft YaHei", sans-serif;

    .introduction, .version, .purpose, .contact, .author {
      width: 100%;
      display: flex;
      justify-content: start;

      span {
        font-weight: bold;
        min-width: 43px;
      }

      .value:has(img) {
        padding: 5px;
        border: 1px solid #efefef;
        border-radius: 3px;

        img {
          width: 240px;
          height: 270px;
        }
      }

    }
  }

  .download-progress {
    padding: 10px;

    :deep(.el-progress__text) {
      min-width: 40px;
    }
  }

  .el-form {
    padding: 10px 20px 0 20px;
  }

  .text-label-form {
    width: 100%;
    padding: 20px 40px 0 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 12px;

    .el-form-item {
      width: 100%;
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
        border: 1px solid #e4e4e5;
        border-radius: 2px;
        padding: 15px 10px;
        margin: 20px 0;

        .border-label {
          position: absolute;
          top: -7px;
          left: 15px;
          background-color: var(--dialog-main-background-color);
          padding: 0 12px;
          font-size: 13px;
          color: #7c7b7b;
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

      .border-box:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
