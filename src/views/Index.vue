<template>
  <div>
    <div class="page-layout">
      <div class="page-main">
        <div class="page-left">
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
                    <img class="image-mark" v-for="([key, label]) in imageLabels"
                         :path="label.path"
                         :key="label.path"
                         draggable="true"
                         :src="label.url">
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
                          <img draggable="false" src="../assets/icon/text.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期" placement="top">
                        <div class="text-mark" draggable="true" type="date">
                          <img draggable="false" src="../assets/icon/date.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期时间" placement="top">
                        <div class="text-mark" draggable="true" type="datetime">
                          <img draggable="false" src="../assets/icon/datetime.svg">
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
                          <img draggable="false" src="../assets/icon/custom.svg">
                        </div>
                      </el-tooltip>
                    </div>
                  </el-scrollbar>
                </el-sub-menu>
              </el-menu>
            </el-scrollbar>
          </el-aside>
        </div>

        <div class="preview-container" id="preview-container" ref="previewContainer" @mousedown="triggerContextMenu">
          <div class="canvas-wrapper" ref="canvasWrapper">
            <canvas id="background-canvas" ref="backgroundElement"></canvas>
            <canvas id="foreground-canvas" ref="canvasElement"></canvas>
          </div>
        </div>

        <div class="page-right">
          <div class="settings-details">
            <el-aside>
              <el-scrollbar>
                <el-menu :default-openeds="['1']" ref="menuRef" @open="handleOpenMenu" @close="handleCloseMenu">
                  <el-sub-menu index="1">
                    <template #title>
                      <span>基本</span>
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
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="5">
                    <template #title>
                      <span>前景</span>
                    </template>
                    <ul class="options">
                      <li class="option">
                        <div class="label">圆角</div>
                        <div class="value">
                          <el-slider size="small"
                                     @input="handleUpdatePhotograph"
                                     :show-tooltip="false"
                                     :min="0"
                                     :max="50"
                                     v-model="photographOptions.borderRadius"
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
                          <el-slider @input="handleUpdatePhotograph"
                                     size="small"
                                     :min="-50"
                                     :max="50"
                                     v-model="photographOptions.shadow.offsetX"
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
                              v-model="photographOptions.shadow.offsetY"
                              @input="handleUpdatePhotograph"
                              :min="-50"
                              :max="50"
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
                              v-model="photographOptions.shadow.blur"
                              @input="handleUpdatePhotograph"
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
                              @change="handleUpdateBorders"
                              v-model="borderOptions.borderType"
                              :options="[{value: 0,label: '通用'}, {value: 1,label: '模糊'}]"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">上边框</div>
                        <div class="value">
                          <el-slider @input="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderTop"
                                     placement="top"/>
                          <input type="number" class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderTop"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">左边框</div>
                        <div class="value">
                          <el-slider @input="handleUpdateBorders"
                                     :show-tooltip="false"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderLeft"
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
                          <el-slider @input="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderRight"
                                     placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRight"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">下边框</div>
                        <div class="value">
                          <el-slider @input="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderBottom"
                                     placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderBottom"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">圆角</div>
                        <div class="value">
                          <el-slider @input="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="0"
                                     :max="50"
                                     v-model="borderOptions.borderRadius"
                                     placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRadius"
                                 step="1">
                        </div>
                      </li>
                      <li class="option" v-show="borderOptions.borderType === 1">
                        <div class="label">模糊值</div>
                        <div class="value">
                          <el-slider @input="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="0"
                                     :max="50"
                                     v-model="borderOptions.borderBlur"
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
                              :min="100"
                              :max="600"
                              v-model="textOptions.fontWeight"
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
                              :min="0"
                              :max="100"
                              v-model="textOptions.spacing"
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
                          <el-slider size="small"
                                     :min="-180"
                                     :max="180"
                                     v-model="textOptions.angle"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.angle" step="1">
                        </div>
                      </li>

                      <li class="option">
                        <div class="label">层级</div>
                        <div class="value">
                          <el-slider :min="0"
                                     :max="100"
                                     size="small"
                                     v-model="textOptions.zIndex"
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
                          <el-slider size="small"
                                     :min="-100"
                                     :max="100"
                                     v-model="textOptions.shadow.offsetX"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.shadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              v-model="textOptions.shadow.offsetY"
                              :min="-100"
                              :max="100"
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
                              @change=""
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
                          <el-slider :min="0.1"
                                     :max="20"
                                     :step="0.1"
                                     size="small"
                                     v-model="imageOptions.scale"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.scale" step="0.1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">不透明度</div>
                        <div class="value">
                          <el-slider :min="0.01"
                                     :max="1"
                                     :step="0.01"
                                     size="small"
                                     v-model="imageOptions.alpha"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.alpha" step="0.01">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">旋转角度</div>
                        <div class="value">
                          <el-slider @change=""
                                     size="small"
                                     :min="-180"
                                     :max="180"
                                     v-model="imageOptions.angle"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.angle" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">层级</div>
                        <div class="value">
                          <el-slider :min="0"
                                     :max="100"
                                     size="small"
                                     v-model="imageOptions.zIndex"
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
                          <el-slider size="small"
                                     :min="-100"
                                     :max="100"
                                     v-model="imageOptions.shadow.offsetX"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.shadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              v-model="imageOptions.shadow.offsetY"
                              :min="-100"
                              :max="100"
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
                              @change=""
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
        <div class="function-tabs">
          <div class="tab-wrapper">
            <el-tooltip effect="dark" content="上一张" placement="top">
              <img src="../assets/images/左箭头-未激活.png" class="inactive" alt="上一张">
            </el-tooltip>
            <el-tooltip effect="dark" content="上一张" placement="top">
              <img src="../assets/images/左箭头-激活.png" class="active" @click="switchBeforePreviewElement"
                   alt="上一张">
            </el-tooltip>
          </div>

          <div class="tab-wrapper">
            <el-tooltip effect="dark" content="下一张" placement="top">
              <img src="../assets/images/右箭头-未激活.png" class="inactive" alt="下一张">
            </el-tooltip>
            <el-tooltip effect="dark" content="下一张" placement="top">
              <img src="../assets/images/右箭头-激活.png" class="active" @click="switchNextPreviewElement" alt="下一张">
            </el-tooltip>
          </div>

          <div class="tab-wrapper">
            <el-tooltip effect="dark" content="居中" placement="top">
              <img src="../assets/images/居中显示-未激活.png" class="inactive small-size" alt="居中">
            </el-tooltip>
            <el-tooltip effect="dark" content="居中" placement="top">
              <img src="../assets/images/居中显示-激活.png" class="active small-size"
                   @click="handleScrollBarMoveToCenter"
                   alt="居中">
            </el-tooltip>
          </div>

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
        <div class="preview-list"
             id="preview-list"
             tabindex="0"
             ref="previewList"
             @wheel="handleMovePreviewList"
             @contextmenu="triggerContextMenu">
          <template :key="key" v-for="([key, canvas]) in availableCanvas">
            <el-popover
                v-if="canvas.metadata.filename || canvas.metadata.shootingTime || canvas.metadata.resolution || canvas.metadata.fileSize"
                width="fit-content"
                :show-after="2000"
                :hide-after="0"
                trigger="hover">
              <template #default>
                <div style="font-size: 10px">
                  <p v-if="canvas.metadata.filename">文件名称：{{ canvas.metadata.filename }}</p>
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
                     @click="switchPreviewImage($event, canvas)">
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


    <el-dialog v-model="editorTextLabelDialogVisible" title="编辑文本标签" width="60%" draggable>
      <el-table size="small" :data="textLabels" border>
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
              <div class="option" v-show="[1,3].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">宽度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.width"
                          size="small"
                          class="value"
                          placeholder="宽尺寸"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[2,3].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">高度：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.height"
                          size="small"
                          class="value"
                          placeholder="高尺寸"/>
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
                  <el-slider v-model="projectSettings.outputSettings.quality"
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
                          v-model="projectSettings.metadata.formats.cameraBrand">
                </el-input>
              </div>
              <div class="option">
                <span class="label">相机型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.cameraModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">镜头型号：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.lensModel">
                </el-input>
              </div>
              <div class="option">
                <span class="label">焦段：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.focalLength">
                </el-input>
              </div>
              <div class="option">
                <span class="label">ISO：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.iso">
                </el-input>
              </div>
              <div class="option">
                <span class="label">快门：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.shutter">
                </el-input>
              </div>
              <div class="option">
                <span class="label">光圈：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.aperture">
                </el-input>
              </div>
              <div class="option">
                <span class="label">拍摄日期：</span>
                <el-input spellcheck="false"
                          class="metadata-input"
                          v-model="projectSettings.metadata.formats.shootingTime">
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
                    v-model="projectSettings.metadata.other.enableEquivalentFocalSegment"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span class="label">转换倍数：</span>
                <el-input class="value"
                          spellcheck="false"
                          @change="handleFocalLength(1)"
                          v-model="projectSettings.metadata.other.conversionMultiple">
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
                <el-select class="value"
                           v-model="projectSettings.performance.downloadThreads"
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
                <span class="label">选项锚点：</span>
                <el-switch
                    v-model="projectSettings.others.optionAnchorPoint"
                    class="value"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">画布</span>
            <div class="options">
              <div class="option">
                <span class="label">移到步长：</span>
                <div class="slider-demo-block">
                  <el-slider v-model="projectSettings.others.movingStepSize"
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
                  <el-slider v-model="projectSettings.others.defaultCanvasScale"
                             @change="handleCanvasScale"
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

  </div>
</template>

<script setup lang="js">

import {nextTick, onBeforeUnmount, onMounted, shallowRef, ref, toRaw, watch, computed} from "vue";

import {CanvasEditor, Image, LazyImage, Rect} from '@/canvas/CanvasEditor'

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

import {getDate, getDateTime} from "@/utils/datetime";

import {executeFunctionScript} from "@/utils/script-helper";

const filterType = ref(0)

const matchFonts = ref([])

const templateSettings = ref({})

const availableCanvas = shallowRef(new Map())

const zoomOptions = {
  minZoom: 0.1,
  maxZoom: 5,
  zoomStep: 0.05
}

let canvasEditor = null;

let backgroundCanvasEditor = null;

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
  max: 300
})

const previewContainer = ref(null)

const canvasElement = ref(null)

const canvasWrapper = ref(null)

const backgroundElement = ref(null)

const previewList = ref(null);

const menuRef = ref(null)

const templateRef = ref(null)

const textLabelRef = ref(null)

const textMarks = ref(null)

const imageMarks = ref(null)

const imageLabels = ref(new Map())

const saveTemplateDialogVisible = ref(false)

const renameDialogVisible = ref(false)

const customTextLabelDialogVisible = ref(false)

const editorImageLabelDialogVisible = ref(false)

const editorTextLabelDialogVisible = ref(false)

const downloadProgressVisible = ref(false)

const enableTemplateDialogVisible = ref(false)

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
    {required: true, message: '文本标签类型不能为空', trigger: 'blur'},
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
  return handleTextLabelType.value === 0 ? '新增文本标签' : '编辑文本标签'
})


const availableFonts = computed(() => {
  return Array.from(projectSettings.value.availableFonts.values())
})


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

const watchImportFonts = () => {
  window.electronAPI.watchInputFonts(async (event, {type, data}) => {
    if (data) {
      if (type === 0 || type === -1) {
        if (type === -1) {
          removeExpiredFonts(projectSettings.value.availableFonts, data)
        }
        for (let [family, font] of data) {
          if (font.url) {
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
      for (let [path, picture] of data) {
        if (!CanvasManager.hasCanvas(path)) {
          const settings = new CanvasSettings()
          const metadata = await window.electronAPI.parsePhotoMetadata(path);
          if (metadata) {
            if (metadata.focalLength) {
              metadata.originalFocalLength = metadata.focalLength
              if (projectSettings.value.metadata.other.enableEquivalentFocalSegment) {
                metadata.focalLength = Number.parseInt(metadata.focalLength * projectSettings.value.metadata.other.conversionMultiple)
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
    }
  })
}

const stopDownloadFiles = () => {
  window.electronAPI.stopExportFiles()
}

const handleDownloadProgressClose = () => {
  setTimeout(() => {
    if (downloadProgressPercentage.value !== 100) {
      stopDownloadFiles()
    } else {
      downloadProgressPercentage.value = 0
    }
  }, 200)
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
    if (formRef.value) {
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
  if (!textLabelForm) return
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

const watchContextMenu = () => {
  window.electronAPI.watchContextMenu(async (event, data) => {
    if (data) {
      const {type} = data;
      if (type === 0) {
        const selectedPaths = selectedPreviewList.value.keys();
        for (let path of selectedPaths) {
          CanvasManager.deleteCanvas(path)
          availableCanvas.value.delete(path)
          if (path === CanvasManager.getSelectedPath()) {
            clearCanvas()
          }
        }
        selectedPreviewList.value.clear();
        availableCanvas.value = CanvasManager.getAvailableCanvases(filterType.value)
      } else if (type === 1) {
        const paths = Array.from(selectedPreviewList.value.keys());
        const settings = paths.map((path, index) => {
          const canvas = CanvasManager.getCanvas(path);
          if (!canvas.completed) {
            const {height: imageHeight, width: imageWidth} = canvas.metadata;
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
            return {filePath: path, index, json: JSON.stringify(background)}
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
          return {filePath: path, index, json: JSON.stringify(background)}
        });
        window.electronAPI.requestExportFiles(_.cloneDeep({
          projectSettings: projectSettings.value,
          outputDirectory: data.outputDirectory,
          settings
        }))
        downloadProgressVisible.value = true
      } else if (type === 2) {
        saveTemplateDialogVisible.value = true
        clearFormValidate(saveTemplateForm)
      } else if (type === 3) {
        synchronousMode.value = data.method
        synchronizeTemplate()
      } else if (type === 4) {
        const paths = Array.from(selectedPreviewList.value.keys());
        paths.forEach(path => clearCanvasElements(path))
      } else if (type === 5) {
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
  StorageManager.saveProjectSettings(projectSettings.value)
}


const handleFocalLength = (type) => {
  for (let [path, canvas] of CanvasManager.getCanvases()) {
    const metadata = canvas.metadata;
    if (metadata && metadata.focalLength) {
      if (type === 0) {
        metadata.focalLength = projectSettings.value.metadata.other.enableEquivalentFocalSegment
            ? Number.parseInt(metadata.focalLength * projectSettings.value.metadata.other.conversionMultiple)
            : metadata.originalFocalLength
      } else if (type === 1 && projectSettings.value.metadata.other.enableEquivalentFocalSegment) {
        metadata.focalLength = Number.parseInt(metadata.originalFocalLength * projectSettings.value.metadata.other.conversionMultiple)
      }
      if (path === CanvasManager.getSelectedPath()) {
        metadataOptions.value = {...metadata}
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
  if (!renameTemplateForm) return
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
          item.centerX = horizontal === 'left' ? centerX * initZoom : (width - centerX) * initZoom
          item.centerY = vertical === 'top' ? centerY * initZoom : (height - centerY) * initZoom
          item.centerXRatio = horizontal === 'left' ? centerX / width : (width - centerX) / width
          item.centerYRatio = vertical === 'top' ? centerY / height : (height - centerY) / height
          item.width = element.width * initZoom
          item.height = element.height * initZoom
          if (element.type === 'text') {
            item.fontSize = element.fontSize * initZoom
          }
          items.push(item)
        }
        useTemplate(_.cloneDeep({background, foreground: {width, height, elements: items}}), path)
      }
    })
  }
}

const saveTemplates = async () => {
  if (!saveTemplateForm) return
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
        item.centerX = horizontal === 'left' ? centerX * initZoom : (width - centerX) * initZoom
        item.centerY = vertical === 'top' ? centerY * initZoom : (height - centerY) * initZoom
        item.centerXRatio = horizontal === 'left' ? centerX / width : (width - centerX) / width
        item.centerYRatio = vertical === 'top' ? centerY / height : (height - centerY) / height
        item.width = element.width * initZoom
        item.height = element.height * initZoom
        if (element.type === 'text') {
          item.fontSize = element.fontSize * initZoom
        }
        items.push(item)
      }

      const newTemplates = [...templates.value, {
        templateId: Date.now(),
        templateName: newTemplate.value.templateName,
        settings: _.cloneDeep({background, foreground: {width, height, zoom, elements: items}})
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
  const {background, foreground} = settings;
  const {height: imageHeight, width: imageWidth} = canvas.metadata;

  const {idealWidth, idealHeight} = previewContainer.value;
  const initZoom = Math.min(idealHeight / imageHeight, idealWidth / imageWidth);
  const zoom = initZoom * projectSettings.value.others.defaultCanvasScale;

  const border = background.elements[0];
  const photo = background.elements[1];
  const borderOptions = border.meta;
  const photoOptions = photo.meta;

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
    border.src = canvas.url
    borderOptions.path = canvas.path
  }

  photo.src = canvas.url
  photo.width = imageWidth
  photo.height = imageHeight
  photo.x = borderLeft
  photo.y = borderTop
  photo.radius = photoOptions.borderRadius / initZoom

  photoOptions.path = canvas.path

  for (let element of foreground.elements) {

    const {position, centerXRatio, centerYRatio} = element;
    const width = element.width / initZoom;
    const height = element.height / initZoom;
    const centerX = element.centerX / initZoom
    const centerY = element.centerY / initZoom

    if (synchronousMode.value === 0) {
      element.x = position[0] === 'left' ? centerX - width / 2 : newWidth - (centerX + width / 2)
      element.y = position[1] === 'top' ? centerY - height / 2 : newHeight - (centerY + height / 2)
    }

    if (synchronousMode.value === 1) {
      element.x = position[0] === 'left' ? centerXRatio * newWidth - width / 2 : newWidth - (centerXRatio * newWidth + width / 2)
      element.y = position[1] === 'top' ? centerYRatio * newHeight - height / 2 : newHeight - (centerYRatio * newHeight + height / 2)
    }

    if (element.type === 'text') {
      element.fontSize = element.fontSize / initZoom;
      element.text = getText({path, ...element.meta, content: element.text})
    }

    if (element.type === 'image') {
      element.width = width;
      element.height = height
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
    const scrollLeft = (imageWidth - idealWidth) / 2;
    const scrollTop = (imageHeight - idealHeight) / 2;
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
      return getDate();
    case 'datetime':
      return getDateTime();
    case 'script':
      return executeFunctionScript(expression);
    case 'text':
      return content;
    case 'metadata':
      return (() => {
        let content = '';
        const {metadata} = CanvasManager.getCanvas(path);
        if (metadata) {
          content = metadata[expression];
          const format = projectSettings.value.metadata.formats[expression];
          if (content && format) {
            content = format.replace('${' + expression + '}', content);
          }
        }
        return content;
      })();
  }
}


const loadTemplates = () => {
  templates.value = StorageManager.getTemplates()
}

const loadTextLabels = () => {
  textLabels.value = StorageManager.getTextLabels()
}

const renderCanvas = async (canvas) => {
  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  if (!canvas.completed) {
    canvasEditor.clearCanvas();
    backgroundCanvasEditor.clearCanvas();
    const image = await Image.fromURL(canvas.url, {
      selectable: false,
      cacheable: true,
      meta: {...new PhotographOptions(), path: canvas.path}
    });
    const width = image.width;
    const height = image.height;
    const background = new Rect({width, height, meta: new BorderOptions()});
    // 设置画布宽高等于缩放后的图片尺寸
    canvasEditor.resizeCanvas(width, height);
    backgroundCanvasEditor.resizeCanvas(width, height);
    const {idealWidth, idealHeight} = previewContainer.value;
    const initScale = Math.min(idealHeight / height, idealWidth / width);
    const scale = initScale * projectSettings.value.others.defaultCanvasScale;
    canvasEditor.setZoom(scale)
    backgroundCanvasEditor.setZoom(scale)
    backgroundCanvasEditor.addElement(background);
    backgroundCanvasEditor.addElement(image);
    backgroundCanvasEditor.renderAll()
    canvasWrapper.value.style.width = Math.max(width, idealWidth) + 'px'
    canvasWrapper.value.style.height = Math.max(height, idealHeight) + 'px'
    scrollBarMoveToCenter(canvas)
    borderOptions.value = background.meta
    photographOptions.value = image.meta
    metadataOptions.value = canvas.metadata
    canvas.completed = true
    canvas.width = width;
    canvas.height = height
    canvas.initZoom = initScale
    canvas.zoom = canvasEditor.getZoom()
    canvas.borderOptions = _.cloneDeep(background.meta)
    canvas.photographOptions = _.cloneDeep(image.meta)
    canvas.foreground = canvasEditor.exportToObject()
    canvas.background = backgroundCanvasEditor.exportToObject()
  } else {
    const {foreground, background, zoom, metadata: {width: imageWidth, height: imageHeight}} = canvas;
    typeof foreground === 'string' ? await canvasEditor.loadFromJSON(foreground) : await canvasEditor.loadFromObject(foreground)
    typeof background === 'string' ? await backgroundCanvasEditor.loadFromJSON(background) : await backgroundCanvasEditor.loadFromObject(background)
    const {idealWidth, idealHeight} = previewContainer.value;
    // 设置缩放
    canvasEditor.setZoom(zoom);
    backgroundCanvasEditor.setZoom(zoom);
    backgroundCanvasEditor.renderAll();
    canvasEditor.renderAll();
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
  canvasElement.value.classList.add('scale-animation')
  backgroundElement.value.classList.add('scale-animation')
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

const initCanvasSize = () => {

  setTimeout(() => {

    previewContainer.value.idealWidth = previewContainer.value.clientWidth

    previewContainer.value.idealHeight = previewContainer.value.clientHeight

    renderCanvasScrollbar()

    canvasEditor = new CanvasEditor(canvasElement.value);

    backgroundCanvasEditor = new CanvasEditor(backgroundElement.value);

    canvasEditor.on('selection:object', (event) => {
      const {initZoom} = CanvasManager.getCurrentCanvas();
      const target = event.target;
      const {x, y, ...element} = _.cloneDeep(target);
      if (target.type === 'text') {
        const {fontSize, spacing, order, shadow: {offsetX, offsetY, blur}} = element;
        element.fontSize = Number.parseInt(fontSize * initZoom)
        element.spacing = Number.parseInt(spacing * initZoom)
        element.shadow.offsetX = Number.parseInt(offsetX * initZoom)
        element.shadow.offsetY = Number.parseInt(offsetY * initZoom)
        element.shadow.blur = Number.parseInt(blur * initZoom)
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
        element.shadow.offsetX = Number.parseInt(offsetX * initZoom)
        element.shadow.offsetY = Number.parseInt(offsetY * initZoom)
        element.shadow.blur = Number.parseInt(blur * initZoom)
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

const handleUpdateBorders = async () => {
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
    elements[0] = new Rect({width: newWidth, height: newHeight, radius: newBorderRadius, fill: borderColor});
  } else if (borderType === 1 && background.type !== 'image') {
    elements[0] = new Image(target.image, {
      width: newWidth,
      height: newHeight,
      radius: newBorderRadius,
      blur: newBorderBlur,
      meta: {path: target.meta.path, ...background.meta}
    })
  } else {
    background.width = newWidth;
    background.height = newHeight;
    background.fill = borderColor;
    background.radius = newBorderRadius;
    background.blur = newBorderBlur;
  }

  if (borderLeft !== lastBorderLeft || borderTop !== lastBorderTop) {
    for (let element of canvasEditor.getElements()) {
      element.x += (borderLeft - lastBorderLeft) / initZoom;
      element.y += (borderTop - lastBorderTop) / initZoom;
    }
  }

  currentCanvas.borderOptions = _.cloneDeep(borderOptions.value)
  currentCanvas.foreground = canvasEditor.exportToObject()
  currentCanvas.background = backgroundCanvasEditor.exportToObject()
  canvasElement.value.classList.remove('scale-animation')
  backgroundElement.value.classList.remove('scale-animation')
  await nextTick();
  backgroundCanvasEditor.renderAll()
  canvasEditor.renderAll()
  canvasElement.value.classList.add('scale-animation')
  backgroundElement.value.classList.add('scale-animation')
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
  const scrollAmount = e.deltaY * 5; // 调整滚动速度
  // 4. 应用滚动
  if (previewList.value) {
    previewList.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
}, 200);


const handleSelectAllPreviewElements = (event) => {
  if (event.ctrlKey && event.key === 'a') {
    event.preventDefault();
    if (selectedPreviewList.value.size) {
      const elements = document.querySelectorAll('img.previewItem');
      elements.forEach(element => {
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

  let settings;

  if (component instanceof HTMLImageElement) {
    settings = {url, path, tagName, width, height}
  } else {
    settings = {type, content, expression, tagName}
  }

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
    window.electronAPI.requestImportFiles(paths);
  }

}


const handleDragover = (event) => {
  // 允许放置
  event.preventDefault();
}

const handleDragleave = (event) => {
  event.preventDefault();
}


// 处理 canvas 缩放
const handleCanvasResize = (event) => {
  // 阻止默认滚动行为
  event.preventDefault();
  // 根据滚轮方向确定缩放方向
  const direction = event.deltaY < 0 ? 'in' : 'out';
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const initZoom = canvas.initZoom;
  const zoom = canvasEditor.getZoom();
  const {zoomStep, maxZoom, minZoom} = zoomOptions;
  let newZoom = direction === 'in' ? zoom + initZoom * zoomStep : zoom - initZoom * zoomStep;
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


const triggerDragCanvas = (event) => {
  if (event.code === 'Space' && !canvasEditor.isEditing) {
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

  useEventListener(previewList.value, 'keydown', handleSelectAllPreviewElements);

  useEventListener(previewContainer.value, 'drop', handleDropElement);
  useEventListener(previewContainer.value, 'drop', handleDropFiles);
  useEventListener(previewContainer.value, 'dragover', handleDragover);
  useEventListener(previewContainer.value, 'dragleave', handleDragleave);
  useEventListener(previewContainer.value, 'scroll', handleMoveScrollbar);
  useEventListener(previewContainer.value, 'mousedown', handleDragMoveCanvas);
  useEventListener(previewContainer.value, 'wheel', handleCanvasResize, {passive: false});

  useEventListener(document, 'keydown', handleRemoveElement)
  useEventListener(document, 'keydown', handleKeyDownMoveElement)
  useEventListener(document, 'keydown', triggerDragCanvas)
}

onMounted(() => {
  loadTemplates()
  loadTextLabels()
  watchImportImages()
  watchImportFonts()
  watchContextMenu()
  watchTemplateContextMenu()
  watchLabelResources()
  watchDownloadProgress()
  editorOutputSettings()
  loadProjectSettings()
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
              padding: 10px;
              column-count: 3; /* 列数 */
              column-gap: 10px; /* 列间距 */
              background-color: var(--expand-area-background-color);

              .image-mark {
                display: block;
                width: 100%;
                cursor: move;
                user-select: none;
                margin-bottom: 10px; /* 项目间距 */
                break-inside: avoid; /* 防止项目被截断 */
              }

              .image-mark:hover {
                background: #e3f2fd;
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

    .preview-container {
      background: var(--preview-background-color);
      width: var(--preview-container-width);
      height: 100%;
      position: relative;
      border: 1px solid #919191;

      .canvas-wrapper {
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;

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

    .page-right {
      width: var(--page-right-width);
      height: 100%;
      background: var(--expand-area-background-color);

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
    height: var(--page-bootom-height);
    border-top: 1px solid var(--border-color);

    .function-tabs {
      width: 100%;
      height: 25%;
      background: var(--expand-area-background-color);
      display: flex;
      justify-content: left;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      gap: 15px;
      padding-left: 15px;

      .filter {
        margin-left: auto;
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

    .preview-list {
      box-sizing: border-box;
      width: 100%;
      height: 75%;
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

            .value {
              width: 150px;
            }

            .metadata-input {
              width: calc(100% - 100px);
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
