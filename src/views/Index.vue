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
          <canvas id="canvas" ref="canvasElement"></canvas>
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
                                     v-model="photographOptions.boxShadow.offsetX"
                                     placement="top"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.boxShadow.offsetX"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              v-model="photographOptions.boxShadow.offsetY"
                              @input="handleUpdatePhotograph"
                              :min="-50"
                              :max="50"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.boxShadow.offsetY"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              v-model="photographOptions.boxShadow.blur"
                              @input="handleUpdatePhotograph"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number"
                                 class="number-input"
                                 @input="handleUpdatePhotograph"
                                 v-model="photographOptions.boxShadow.blur"
                                 step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              @change="handleUpdatePhotograph"
                              v-model="photographOptions.boxShadow.shadowColor"
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
                              :max="900"
                              v-model="textOptions.fontWeight"
                              show-alpha
                              :step="100"
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.fontWeight" step="100">
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

          <div class="tab-wrapper">
            <el-button size="small" @click="canvasEditor.exportPNG('img.png')">导出</el-button>
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
              <div class="option" v-show="[2,3].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">长边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.longSide"
                          size="small"
                          class="value"
                          placeholder="长边"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[4,5].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">短边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.shortSide"
                          size="small"
                          class="value"
                          placeholder="短边"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[6,7].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">宽尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.width"
                          size="small"
                          class="value"
                          placeholder="宽尺寸"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[8,9].includes(projectSettings.outputSettings.outputSize.type)">
                <span class="label">高尺寸：</span>
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
                <el-input class="value" v-model="projectSettings.outputSettings.fileNaming.prefix"
                          size="small"></el-input>
              </div>
              <div class="option">
                <span class="label">后缀：</span>
                <el-input class="value" v-model="projectSettings.outputSettings.fileNaming.suffix"
                          size="small"></el-input>
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
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.cameraBrand"></el-input>
              </div>
              <div class="option">
                <span class="label">相机型号：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.cameraModel"></el-input>
              </div>
              <div class="option">
                <span class="label">镜头型号：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.lensModel"></el-input>
              </div>
              <div class="option">
                <span class="label">焦段：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.focalLength"></el-input>
              </div>
              <div class="option">
                <span class="label">ISO：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.iso"></el-input>
              </div>
              <div class="option">
                <span class="label">快门：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.shutter"></el-input>
              </div>
              <div class="option">
                <span class="label">光圈：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.aperture"></el-input>
              </div>
              <div class="option">
                <span class="label">拍摄日期：</span>
                <el-input class="metadata-input" v-model="projectSettings.metadata.formats.shootingTime"></el-input>
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
                           @change="createThreadPool"
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
                       @focusout="handleStopActivateInput(scope.row)"
                       v-show="scope.row.editable"
                       style="height: 100%;user-select: none;width: fit-content;background-color: transparent;outline: none;border: none"
                       v-model="scope.row.familyAlias">
                <div v-show="!scope.row.editable">{{ scope.row.familyAlias }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="tips" label="X轴偏移量" show-overflow-tooltip>
              <template #default="scope">
                <input type="number"
                       @focusout="handleStopActivateInput(scope.row)"
                       v-show="scope.row.editable"
                       style="height: 100%;width: 60px;background-color: transparent;outline: none;border: none"
                       v-model="scope.row.offsetX"
                       :step="0.01">
                <div v-show="!scope.row.editable">{{ scope.row.offsetX }}</div>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="Y轴偏移量" show-overflow-tooltip>
              <template #default="scope">
                <input type="number"
                       @focusout="handleStopActivateInput(scope.row)"
                       v-show="scope.row.editable"
                       style="height: 100%;width: 60px;background-color: transparent;outline: none;border: none"
                       v-model="scope.row.offsetY"
                       :step="0.01">
                <div v-show="!scope.row.editable">{{ scope.row.offsetY }}</div>
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

import {nextTick, onBeforeUnmount, onMounted, ref, watch, computed} from "vue";

import {CanvasEditor, Image, Text, EditableText} from '@/canvas/CanvasEditor'

import {useThrottle} from '@/utils/throttle'

import FontLoader from '@/utils/FontLoader'

import _ from 'lodash';

import MapHelper from "@/utils/map-helper";

import Notification from '@/utils/Notification'

import useEventListener from '@/composables/useEventListener'

import {projectSettings, outputSizeOptions, originalMetadata, downloadThreadsOptions} from '@/config/project-settings'

import {
  TextLabel,
  BorderSettings,
  Metadata,
  ImageSettings,
  TextSettings,
  TextOptions,
  ImageOptions,
  BorderOptions,
  FontSettings,
  PhotographOptions, PhotographSettings
} from '@/object/Configuration'

import {Canvas} from '@/object/Canvas'

import CanvasManager from "@/object/CanvasManager";

import StorageManager from "@/object/StorageManager";

import {predefineColors} from '@/config/color-configuration'

import DraggableElementFactory from "@/object/DraggableElementFactory";

const filterType = ref(0)

const matchFonts = ref([])

const templateSettings = ref({})

const availableCanvas = ref(new Map())

const zoomOptions = {
  minZoom: 0.01,
  maxZoom: 5,
  zoomStep: 0.01
}

let canvasEditor = null;

let clickTimeout = null;

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

const previewList = ref(null);

const menuRef = ref(null)

const templateRef = ref()

const textLabelRef = ref()

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

const renameTemplateForm = ref()

let pendingAnimationFrame = null;


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
  } else {
    nextSelectCanvas = availableCanvas.value.get(paths[0]);
    previewElement = nextSelectCanvas.getPreviewElement(previewList.value);
    await nextTick()
    selectedCanvas.hide()
    await nextTick()
    nextSelectCanvas.show()
    await nextTick()
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
              FontLoader.loadFont(family, font.url)
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
          }
        }
      } else if (type === 1) {
        const family = data.family;
        projectSettings.value.availableFonts.delete(family)
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
          let canvas = new Canvas()
          const metadata = await window.electronAPI.parsePhotoMetadata(path);
          if (metadata) {
            if (metadata.focalLength) {
              metadata.originalFocalLength = metadata.focalLength
              if (projectSettings.value.metadata.other.enableEquivalentFocalSegment) {
                metadata.focalLength = Number.parseInt(metadata.focalLength * projectSettings.value.metadata.other.conversionMultiple)
              }
            }
            canvas.metadata = metadata
          }
          CanvasManager.setCanvas(path, Object.assign(new Canvas(), canvas, picture))
          availableCanvas.value = CanvasManager.getAvailableCanvases(filterType.value)
        }
      }
    }
  });
}

const createThreadPool = () => {
  const maxThreads = projectSettings.value.performance.downloadThreads;
  window.electronAPI.createThreadPool(maxThreads)
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
            CanvasManager.setSelectedObject({path: '', previewElement: null})
          }
        }
        selectedPreviewList.value.clear();
      } else if (type === 1) {

        const paths = Array.from(selectedPreviewList.value.keys());

        const settings = paths.map((path, index) => {
          const canvas = CanvasManager.getCanvas(path);
          return {filePath: path, index, json: canvas?.json}
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
        paths.forEach(path => clearCanvasLabels(path))
      } else if (type === 5) {
        const paths = Array.from(selectedPreviewList.value.keys());
        paths.forEach(path => clearCanvas(path))
      }
    }
  });
}

const clearCanvas = (path) => {
  const canvas = CanvasManager.getCanvas(path);
  clearCanvasLabels(path);
  canvas.settings.border = new BorderSettings()
  canvas.settings.photograph = new PhotographSettings()
  if (path === CanvasManager.getSelectedPath()) {
    borderOptions.value = canvas.settings.border.options
    photographOptions.value = canvas.settings.photograph.options
  }
  renderBorders(path)
  renderPhotograph(path)
}

const clearCanvasLabels = (path) => {
  const canvas = CanvasManager.getCanvas(path);
  for (let element of canvas.settings.images.keys()) {
    element.remove()
  }
  for (let element of canvas.settings.texts.keys()) {
    element.remove()
  }
  canvas.settings.texts.clear()
  canvas.settings.images.clear()
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
        metadataOptions.value = metadata
      }
    }
  }
}


watch(projectSettings, (newVal, oldVal) => {
  const settings = _.cloneDeep(newVal);
  settings.availableFonts = Array.from(settings.availableFonts.entries())
  StorageManager.saveProjectSettings(settings)
}, {
  //深度监视（监视属性变化）
  deep: true,
  //immediate 立即触发一次监视
  //immediate: true
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
  const element = _.cloneDeep(newVal);
  element.fontSize = element.fontSize / initZoom
  element.shadow.offsetX = element.shadow.offsetX / initZoom
  element.shadow.offsetY = element.shadow.offsetY / initZoom
  element.shadow.blur = element.shadow.blur / initZoom
  canvasEditor.updateElement(element)
  canvasEditor.renderAll()
  canvas.zoom = canvasEditor.getZoom()
  canvas.json = canvasEditor.exportToJSON()
}, {
  deep: true,
});


watch(() => imageOptions.value, async (newVal, oldValue) => {
  if (newVal !== oldValue) return
  const canvas = CanvasManager.getCurrentCanvas();
  const activeElements = canvasEditor.getActiveElements();
  if (!canvas || !activeElements.length) return
  const initZoom = canvas.initZoom;
  const element = _.cloneDeep(newVal);
  element.shadow.offsetX = element.shadow.offsetX / initZoom
  element.shadow.offsetY = element.shadow.offsetY / initZoom
  element.shadow.blur = element.shadow.blur / initZoom
  canvasEditor.updateElement(element)
  canvasEditor.renderAll()
  canvas.zoom = canvasEditor.getZoom()
  canvas.json = canvasEditor.exportToJSON()
}, {
  //深度监视（监视属性变化）
  deep: true,
});


const handleCanvasScale = () => {
  const zoom = projectSettings.value.others.defaultCanvasScale;
  const canvases = CanvasManager.getCanvases();
  canvases.forEach(canvas => {
    if (canvas.completed) {
      setZoom(canvas, zoom)
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
    const {settings: templateSettings} = CanvasManager.getCurrentCanvas();
    const targetSettings = {
      border: templateSettings.border,
      photograph: templateSettings.photograph,
      images: Array.from(templateSettings.images.values()).map(item => {
        item.synchronousMode = synchronousMode.value
        return item
      }),
      texts: Array.from(templateSettings.texts.values()).map(item => {
        item.synchronousMode = synchronousMode.value
        return item
      })
    }

    selectedPreviewList.value.forEach((image, path) => {
      if (CanvasManager.getSelectedPath() !== path) {
        let {settings: originalSettings} = CanvasManager.getCanvas(path);
        for (let element of originalSettings.images.keys()) {
          element.remove()
        }
        for (let element of originalSettings.texts.keys()) {
          element.remove()
        }
        originalSettings.texts.clear()
        originalSettings.images.clear()
        useTemplate(_.cloneDeep(targetSettings), path)
      }
    })
  }
}

const saveTemplates = async () => {

  if (!saveTemplateForm) return

  saveTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      const canvas = CanvasManager.getCurrentCanvas();
      const {border, photograph, images, texts} = _.cloneDeep(canvas.settings)
      const newTemplates = [...templates.value];
      // 清空模版列表，重新生成列表
      templates.value = []
      await nextTick()

      newTemplates.push({
        templateId: Date.now(),
        templateName: newTemplate.value.templateName,
        settings: {
          border: border,
          photograph,
          images: Array.from(images.values()),
          texts: Array.from(texts.values())
        }
      })
      templates.value = newTemplates
      StorageManager.saveTemplates(templates.value)
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
    let {settings: originalSettings} = CanvasManager.getCanvas(path);
    for (let element of originalSettings.images.keys()) {
      element.remove()
    }
    for (let element of originalSettings.texts.keys()) {
      element.remove()
    }
    originalSettings.texts.clear()
    originalSettings.images.clear()
    templateSettings.value.texts.forEach(item => item.synchronousMode = synchronousMode.value)
    templateSettings.value.images.forEach(item => item.synchronousMode = synchronousMode.value)
    useTemplate(_.cloneDeep(templateSettings.value), path)
  }
  enableTemplateDialogVisible.value = false
  synchronousMode.value = 0
}


function renderElementPosition(canvas, settings, element) {

  const imageElement = canvas.getImageElement();

  const canvasElement = imageElement.parentNode;

  const backgroundElement = canvasElement.querySelector('.image-background');

  const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement;

  const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
  const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
  const backgroundLeft = Number.parseFloat(backgroundElement.style.left);
  const backgroundRight = Number.parseFloat(backgroundElement.style.right);
  const backgroundTop = Number.parseFloat(backgroundElement.style.top);
  const backgroundBottom = Number.parseFloat(backgroundElement.style.bottom);

  let {
    width,
    height,
    references,
    centerX,
    centerXRatio,
    centerY,
    centerYRatio,
    synchronousMode
  } = settings

  let offsetX = synchronousMode === 1 ? centerXRatio * backgroundWidth - width / 2 : centerX - width / 2;
  let offsetY = synchronousMode === 1 ? centerYRatio * backgroundHeight - height / 2 : centerY - height / 2;

  let left = backgroundLeft + offsetX;
  let right = backgroundRight + offsetX;
  let top = backgroundTop + offsetY;
  let bottom = backgroundBottom + offsetY;

  if (references.includes('left')) {
    right = canvasWidth - left - width
  }

  if (references.includes('right')) {
    left = canvasWidth - right - width
  }

  if (references.includes('top')) {
    bottom = canvasHeight - top - height
  }

  if (references.includes('bottom')) {
    top = canvasHeight - bottom - height
  }

  element.style.left = left + 'px'
  element.style.top = top + 'px'
  element.style.right = right + 'px'
  element.style.bottom = bottom + 'px'

  if (element instanceof HTMLImageElement) {
    settings.options.imageWidthRatio = settings.width / backgroundWidth
    settings.options.imageHeightRatio = settings.height / backgroundHeight
  } else {
    settings.options.fontSizeRatio = settings.options.fontSize / backgroundWidth
  }
}

const useTemplate = async (targetSettings, path) => {

  const {images, texts} = targetSettings

  const canvas = CanvasManager.getCanvas(path);
  const canvasElement = canvas.getImageElement().parentNode

  canvas.settings.border = targetSettings.border
  canvas.settings.photograph = targetSettings.photograph
  canvas.settings.images = new Map()
  canvas.settings.texts = new Map()
  canvas.isUpdate = true

  if (path === CanvasManager.getSelectedPath()) {
    borderOptions.value = canvas.settings.border.options
    photographOptions.value = canvas.settings.photograph.options
    await renderPhotograph(path)
    await renderBorders(path)
  }

  for (let settings of images) {
    const factory = new DraggableElementFactory(settings, canvas.metadata);
    const element = await factory.getElement()
    if (element) {
      if (path === CanvasManager.getSelectedPath()) {
        renderElementPosition(canvas, settings, element);
      }
      canvasElement.appendChild(element)
      canvas.settings.images.set(element, settings)
    }
  }

  for (let settings of texts) {
    const factory = new DraggableElementFactory(settings, canvas.metadata);
    const element = await factory.getElement();
    if (element) {
      if (path === CanvasManager.getSelectedPath()) {
        renderElementPosition(canvas, settings, element)
      }
      canvasElement.appendChild(element)
      canvas.settings.texts.set(element, settings)
    }
  }
}


function updateElementPosition(canvas, element, settings) {

  const imageElement = canvas.getImageElement();

  const canvasElement = imageElement.parentNode;

  const backgroundElement = canvasElement.querySelector('.image-background');

  const computedStyle = window.getComputedStyle(element);

  const elementWidth = parseFloat(computedStyle.width);
  const elementHeight = parseFloat(computedStyle.height);

  const elementLeft = parseFloat(element.style.left) || parseFloat(computedStyle.left);
  const elementTop = parseFloat(element.style.top) || parseFloat(computedStyle.top);
  const elementRight = parseFloat(element.style.right) || parseFloat(computedStyle.right);
  const elementBottom = parseFloat(element.style.bottom) || parseFloat(computedStyle.bottom);

  const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
  const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
  const backgroundLeft = Number.parseFloat(backgroundElement.style.left);
  const backgroundRight = Number.parseFloat(backgroundElement.style.right);
  const backgroundTop = Number.parseFloat(backgroundElement.style.top);
  const backgroundBottom = Number.parseFloat(backgroundElement.style.bottom);

  let references = []

  let centerX, centerY, centerXRatio, centerYRatio

  let offsetLeft = elementLeft - backgroundLeft
  let offsetLeftRatio = offsetLeft / backgroundWidth

  let offsetRight = elementRight - backgroundRight
  let offsetRightRatio = offsetRight / backgroundWidth

  let offsetTop = elementTop - backgroundTop
  let offsetTopRatio = offsetTop / backgroundHeight

  let offsetBottom = elementBottom - backgroundBottom
  let offsetBottomRatio = offsetBottom / backgroundHeight

  if (offsetLeft > offsetRight) {
    references.push('right')
    centerX = offsetRight + elementWidth / 2
  } else {
    references.push('left')
    centerX = offsetLeft + elementWidth / 2
  }

  if (offsetTop > offsetBottom) {
    references.push('bottom')
    centerY = offsetBottom + elementHeight / 2
  } else {
    references.push('top')
    centerY = offsetTop + elementHeight / 2
  }

  centerXRatio = centerX / backgroundWidth;
  centerYRatio = centerY / backgroundHeight;

  settings.references = references
  settings.offsetLeft = offsetLeft
  settings.offsetLeftRatio = offsetLeftRatio
  settings.offsetRight = offsetRight
  settings.offsetRightRatio = offsetRightRatio
  settings.offsetTop = offsetTop
  settings.offsetTopRatio = offsetTopRatio
  settings.offsetBottom = offsetBottom
  settings.offsetBottomRatio = offsetBottomRatio
  settings.centerX = centerX
  settings.centerY = centerY
  settings.centerXRatio = centerXRatio
  settings.centerYRatio = centerYRatio
}

const refreshCanvasElementPosition = (path) => {
  const canvas = CanvasManager.getCanvas(path);
  canvas.settings.texts.forEach((textLabel, element) => {
    updateElementPosition(canvas, element, textLabel);
  })

  canvas.settings.images.forEach((imageLabel, element) => {
    updateElementPosition(canvas, element, imageLabel);
  })
}


const refreshTemplate = async (path) => {

  const canvas = CanvasManager.getCanvas(path);

  await renderBorders(path)

  await renderPhotograph(path)

  canvas.settings.texts.forEach((settings, element) => {
    renderElementPosition(canvas, settings, element)
  })

  canvas.settings.images.forEach((settings, element) => {
    renderElementPosition(canvas, settings, element)
  })

  await nextTick()
  refreshCanvasElementPosition(path)
  canvas.isUpdate = false
}


const loadTemplates = () => {
  templates.value = StorageManager.getTemplates()
}

const loadTextLabels = () => {
  textLabels.value = StorageManager.getTextLabels()
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
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!beforePath || beforePath !== canvas.path) {
      // 更改新的选择元素
      CanvasManager.setSelectedObject({path: event.target.getAttribute('path'), previewElement: event.target})
      // 添加当前选中元素到选中列表中
      selectedPreviewList.value.set(canvas.path, event.target)
      // 设置选择样式
      event.target.classList.add('active')

      if (!canvas.completed) {
        const image = await Image.fromURL(canvas.url, {selectable: false, cacheable: true, meta: {path: canvas.path}});
        const width = image.width;
        const height = image.height;
        // 设置画布宽高等于缩放后的图片尺寸
        canvasEditor.resizeCanvas(width, height);
        const {idealWidth, idealHeight} = previewContainer.value;
        const initScale = Math.min(idealHeight / height, idealWidth / width);
        const scale = initScale * projectSettings.value.others.defaultCanvasScale;
        canvasEditor.setCenterZoom(scale)
        canvasEditor.addElement(image);
        canvasEditor.renderAll()
        scrollBarMoveToCenter(canvas)
        canvas.completed = true
        canvas.initZoom = initScale
        canvas.zoom = canvasEditor.getZoom()
        canvas.json = canvasEditor.exportToJSON()
      } else {
        const {json, zoom} = canvas;
        await canvasEditor.loadFromJSON(json)
        // 设置缩放
        canvasEditor.setCenterZoom(zoom);
        canvasEditor.renderAll()
        updateScrollBarPosition(canvas)
      }
    }
  }
}

const updateScrollBarPosition = (canvas) => {
  // 设置滚动位置
  previewContainer.value.scrollLeft = canvas.scrollLeft;
  previewContainer.value.scrollTop = canvas.scrollTop;
}

const initCanvasSize = () => {

  setTimeout(() => {

    previewContainer.value.idealWidth = previewContainer.value.clientWidth

    previewContainer.value.idealHeight = previewContainer.value.clientHeight

    renderCanvasScrollbar()

    const canvasElement = document.querySelector('#canvas');

    canvasEditor = new CanvasEditor(canvasElement);

    canvasEditor.on('selection:object', (event) => {
      const {initZoom} = CanvasManager.getCurrentCanvas();
      const target = event.target;
      const element = _.cloneDeep(target);
      if (target.type === 'text') {
        const {fontSize, shadow: {offsetX, offsetY, blur}} = element;
        element.fontSize = Number.parseInt(fontSize * initZoom)
        element.shadow.offsetX = Number.parseInt(offsetX * initZoom)
        element.shadow.offsetY = Number.parseInt(offsetY * initZoom)
        element.shadow.blur = Number.parseInt(blur * initZoom)
        textOptions.value = element
        if (projectSettings.value.others.optionAnchorPoint) {
          handleOpenSubMenu('3')
          nextTick(() => {
            document.getElementById('text-options').scrollIntoView({behavior: 'smooth'});
          })
        }
      } else if (target.type === 'image') {
        const {shadow: {offsetX, offsetY, blur}} = element;
        element.shadow.offsetX = Number.parseInt(offsetX * initZoom)
        element.shadow.offsetY = Number.parseInt(offsetY * initZoom)
        element.shadow.blur = Number.parseInt(blur * initZoom)
        imageOptions.value = element
        if (projectSettings.value.others.optionAnchorPoint) {
          handleOpenSubMenu('4')
          nextTick(() => {
            document.getElementById('image-options').scrollIntoView({behavior: 'smooth'});
          })
        }
      }
    })

    canvasEditor.on('updated:object', (event) => {

    })

    canvasEditor.on('move:object', (event) => {
      const canvas = CanvasManager.getCurrentCanvas();
      canvas.json = canvasEditor.exportToJSON()
      console.log(111111111111111)
    })

    canvasEditor.on('add:object', (event) => {
      console.log('添加元素', event)
    })

  }, 1000)
}

const renderCanvasScrollbar = () => {
  previewContainer.value.style.overflow = projectSettings.value.others.enableScrollbar ? 'auto' : 'hidden'
}


const initializeCanvasLayout = async (canvas) => {
  const imageElement = canvas.getImageElement();
  const canvasElement = imageElement.parentNode;
  const backgroundElement = canvasElement.querySelector('.image-background');
  const previewContainer = canvasElement.parentNode;
  const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement
  const {naturalWidth: imageWidth, naturalHeight: imageHeight} = imageElement

  const {offsetWidth: containerRealWidth, offsetHeight: containerRealHeight} = previewContainer;
  const {idealWidth: containerIdealWidth, idealHeight: containerIdealHeight} = previewContainer;

  const {defaultCanvasScale} = projectSettings.value.others;

  const baseScale = Math.min(containerIdealWidth / imageWidth, containerIdealHeight / imageHeight)

  const newImageWidth = imageWidth * baseScale;
  const newImageHeight = imageHeight * baseScale;

  const offsetLeft = (canvasWidth - newImageWidth) / 2;
  const offsetTop = (canvasHeight - newImageHeight) / 2;
  const offsetRight = canvasWidth - offsetLeft - newImageWidth
  const offsetBottom = canvasHeight - offsetTop - newImageHeight

  imageElement.style.width = newImageWidth + 'px'
  imageElement.style.height = newImageHeight + 'px'

  backgroundElement.style.width = newImageWidth + 'px'
  backgroundElement.style.height = newImageHeight + 'px'

  imageElement.style.left = offsetLeft + 'px'
  imageElement.style.top = offsetTop + 'px'
  imageElement.style.right = offsetRight + 'px'
  imageElement.style.bottom = offsetBottom + 'px'

  backgroundElement.style.left = offsetLeft + 'px'
  backgroundElement.style.top = offsetTop + 'px'
  backgroundElement.style.right = offsetRight + 'px'
  backgroundElement.style.bottom = offsetBottom + 'px'

  scrollBarMoveToCenter(canvas)

  canvas.completed = true

  await nextTick()

  const canvasScale = Math.min(containerRealWidth / containerIdealWidth, containerRealHeight / containerIdealHeight)

  setZoom(canvas, canvasScale * defaultCanvasScale)

  setTimeout(() => {
    canvasElement.style.transition = 'transform 0.1s';
  }, 0)
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

// 缩放函数
function zoom(direction) {

}


const renderCanvas = async (canvas) => {

  if (!canvas.completed) {
    await initializeCanvasLayout(canvas)
  }

  updateScrollBarPosition(canvas)
  metadataOptions.value = canvas.metadata
  borderOptions.value = canvas.settings.border.options
  photographOptions.value = canvas.settings.photograph.options

  if (canvas.isUpdate) {
    await refreshTemplate(canvas.path)
  }

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
  const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement.value
  const {offsetWidth: previewContainerWidth, offsetHeight: previewContainerHeight} = previewContainer.value
  // 计算滚动位置，使图形内容居中
  const scrollLeft = (canvasWidth - previewContainerWidth) / 2;
  const scrollTop = (canvasHeight - previewContainerHeight) / 2;
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
      CanvasManager.setSelectedObject({path: '', previewElement: null})
      canvas.hide()
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
  currentCanvas.settings.photograph.options = _.cloneDeep(photographOptions.value)
  await renderPhotograph(CanvasManager.getSelectedPath())
}

const renderPhotograph = async (path) => {
  //停止监听 stopWatch();
  const canvas = CanvasManager.getCanvas(path);
  if (!canvas) return
  const imageElement = canvas.getImageElement();
  if (imageElement) {
    const photograph = canvas.settings.photograph;
    const {borderRadius, boxShadow: {offsetX, offsetY, blur, shadowColor}} = photograph.options;
    imageElement.style.borderRadius = `${borderRadius}px`
    imageElement.style.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${shadowColor}`

    await nextTick();

    const {offsetWidth, offsetHeight} = imageElement;

    photograph.borderRadiusRatio = borderRadius / offsetWidth
    photograph.offsetXRatio = offsetX / offsetWidth
    photograph.offsetYRatio = offsetY / offsetHeight
    photograph.blurRatio = blur / offsetWidth
  }
}


const handleUpdateBorders = async () => {
  const currentCanvas = CanvasManager.getCurrentCanvas();
  currentCanvas.settings.border.options = _.cloneDeep(borderOptions.value)
  await renderBorders(CanvasManager.getSelectedPath())
  refreshCanvasElementPosition(CanvasManager.getSelectedPath())
}


const renderBorders = async (path) => {
  const canvas = CanvasManager.getCanvas(path)
  if (!canvas) return
  const imageElement = canvas.getImageElement();
  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    const backgroundElement = imageElement.parentNode.querySelector('.image-background');
    const border = canvas.settings.border;
    let {
      borderLeft,
      borderRight,
      borderTop,
      borderBottom,
      borderColor,
      borderType,
      borderBlur,
      borderRadius
    } = border.options;

    if (borderType === 0) {
      backgroundElement.style.background = borderColor
      backgroundElement.removeAttribute('blur-border')
    } else if (borderType === 1) {
      backgroundElement.setAttribute('blur-border', '')
      backgroundElement.style.background = `url('${canvas.url}') center / cover`
      backgroundElement.style.setProperty('--blur-intensity', borderBlur + 'px');
    }

    backgroundElement.style.borderRadius = borderRadius + 'px'

    const imageWidth = Number.parseFloat(imageElement.style.width);
    const imageHeight = Number.parseFloat(imageElement.style.height);
    const imageLeft = Number.parseFloat(imageElement.style.left);
    const imageRight = Number.parseFloat(imageElement.style.right);
    const imageTop = Number.parseFloat(imageElement.style.top);
    const imageBottom = Number.parseFloat(imageElement.style.bottom);

    backgroundElement.style.width = (imageWidth + borderLeft + borderRight) + 'px'
    backgroundElement.style.height = (imageHeight + borderTop + borderBottom) + 'px'
    backgroundElement.style.left = (imageLeft - borderLeft) + 'px'
    backgroundElement.style.top = (imageTop - borderTop) + 'px'
    backgroundElement.style.right = (imageRight - borderRight) + 'px'
    backgroundElement.style.bottom = (imageBottom - borderBottom) + 'px'

    await nextTick()

    const {clientWidth, clientHeight} = imageElement;

    border.borderLeftRatio = borderLeft / clientWidth
    border.borderRightRatio = borderRight / clientWidth
    border.borderTopRatio = borderTop / clientHeight
    border.borderBottomRatio = borderBottom / clientHeight
    border.borderBlurRatio = borderBlur / clientWidth
    border.borderRadiusRatio = borderRadius / clientWidth
  }
}


const switchBeforePreviewElement = async () => {
  const {path: currentPath, previewElement: currentElement} = CanvasManager.getSelectedObject();
  if (!currentPath) return
  const currentCanvas = availableCanvas.value.get(currentPath);
  const beforeCanvas = MapHelper.getBeforeValue(availableCanvas.value, currentPath);
  if (currentCanvas && beforeCanvas) {
    if (currentElement) {
      currentElement.setAttribute('selected', 'false')
      currentElement.classList.remove('active')
      selectedPreviewList.value.delete(currentPath)
      currentCanvas.hide()
      await nextTick()
    }

    const beforeElement = currentElement.previousElementSibling || currentElement.parentNode.lastElementChild;
    metadataOptions.value = beforeCanvas.metadata
    beforeElement.classList.add('active')
    beforeElement.setAttribute('selected', 'true')

    CanvasManager.setSelectedObject({path: beforeCanvas.path, previewElement: beforeElement})
    selectedPreviewList.value.set(beforeCanvas.path, beforeElement)

    beforeCanvas.show()
    await nextTick()
    await renderCanvas(beforeCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, beforeElement)
  }
}

const switchNextPreviewElement = async () => {
  const {path: currentPath, previewElement: currentElement} = CanvasManager.getSelectedObject();
  if (!currentPath) return
  const currentCanvas = availableCanvas.value.get(currentPath);
  const nextCanvas = MapHelper.getNextValue(availableCanvas.value, currentPath);
  if (currentCanvas && nextCanvas) {
    if (currentElement) {
      currentElement.setAttribute('selected', 'false')
      currentElement.classList.remove('active')
      selectedPreviewList.value.delete(currentPath)
      currentCanvas.hide()
      await nextTick()
    }

    const nextElement = currentElement.nextElementSibling || currentElement.parentNode.firstElementChild;
    metadataOptions.value = nextCanvas.metadata
    nextElement.classList.add('active')
    nextElement.setAttribute('selected', 'true')
    CanvasManager.setSelectedObject({path: nextCanvas.path, previewElement: nextElement})
    selectedPreviewList.value.set(nextCanvas.path, nextElement)

    nextCanvas.show()
    await nextTick()
    await renderCanvas(nextCanvas)

    // 方式二，过渡比较流畅
    scrollBarMoveToHorizontalCenter(previewList.value, nextElement)
  }
}


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

  const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  if (!validKeys.includes(event.key)) return;

  event.preventDefault();

  const dragElement = CanvasManager.getSelectedObject().draggableElement;

  if (dragElement?.getAttribute('selected') !== 'true') return;

  const step = projectSettings.value.others.movingStepSize;

  // 获取当前位置
  const left = parseInt(dragElement.style.left) || 0;
  const top = parseInt(dragElement.style.top) || 0;
  const right = parseInt(dragElement.style.right) || 0;
  const bottom = parseInt(dragElement.style.bottom) || 0;

  switch (event.key) {
    case 'ArrowUp':
      dragElement.style.top = `${top - step}px`;
      dragElement.style.bottom = `${bottom + step}px`;
      break;
    case 'ArrowDown':
      dragElement.style.bottom = `${bottom - step}px`;
      dragElement.style.top = `${top + step}px`;
      break;
    case 'ArrowLeft':
      dragElement.style.left = `${left - step}px`;
      dragElement.style.right = `${right + step}px`;
      break;
    case 'ArrowRight':
      dragElement.style.right = `${right - step}px`;
      dragElement.style.left = `${left + step}px`;
      break;
  }
}

const handleKeyUpStopMoveElement = (event) => {

  const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  if (!validKeys.includes(event.key)) return;

  const dragElement = CanvasManager.getSelectedObject().draggableElement;

  if (dragElement?.getAttribute('selected') !== 'true') return;

  // 取消之前未执行的动画帧
  if (pendingAnimationFrame) {
    cancelAnimationFrame(pendingAnimationFrame);
  }

  // 安排新的执行
  pendingAnimationFrame = requestAnimationFrame(() => {
    const updateCanvas = CanvasManager.getCurrentCanvas();
    const updateSettings = CanvasManager.getSettingsFromCurrentCanvas(dragElement);
    updateElementPosition(updateCanvas, dragElement, updateSettings);
    pendingAnimationFrame = null;
  });
}

// 取消选择
const handleCancelSelectedElement = (event) => {
  const dragElement = CanvasManager.getSelectedObject().draggableElement;
  if (dragElement === null) return;
  if (dragElement.getAttribute('selected') === 'true') {
    dragElement.style.outline = 'none'
    dragElement.setAttribute('selected', 'false')
    CanvasManager.setSelectedObject({draggableElement: null})
  }
}

// 删除元素
const handleRemoveElement = (event) => {
  const canvas = CanvasManager.getCurrentCanvas();
  // 判断是否为删除键（Backspace 或 Delete）
  if (canvas && (event.key === 'Backspace' || event.key === 'Delete')) {
    const activeElements = canvasEditor.getActiveElements();
    const length = activeElements.length;
    canvasEditor.removeElements(activeElements)
    if (length) {
      canvas.json = canvasEditor.exportToJSON()
    }
    canvasEditor.renderAll()
  }
}

// 编辑文本
const handleEditorElement = (event) => {

  // 检查元素是否可拖动、不是图片，并且没有在编辑中
  if (event.target.getAttribute('draggable') !== 'true' || event.target instanceof HTMLImageElement || event.target.contentEditable === 'true') {
    return;
  }

  event.preventDefault();
  clearTimeout(clickTimeout);

  const dragElement = event.target;
  dragElement.setAttribute('selected', 'false');
  dragElement.style.outline = 'none';

  const originalText = dragElement.textContent;
  dragElement.contentEditable = 'true';

  dragElement.style.outline = '1px solid #3F4141FF';
  dragElement.style.outlineOffset = '3px';
  dragElement.style.transition = 'all 0.1s ease-in-out';
  dragElement.style.overflow = 'hidden';

  dragElement.focus();

  setTimeout(() => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(dragElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, 0);

  let isSelecting = false;
  let selectionStart = null;
  let mouseDownTime = 0;
  let hasSelectionChanged = false;
  let mousedownX, mousedownY;

  // 强的光标定位函数，处理边界情况
  const setCursorPosition = function (x, y) {

    const bounds = dragElement.getBoundingClientRect();

    // 限制坐标在元素边界内
    const clampedX = Math.max(bounds.left, Math.min(x, bounds.right - 1));
    const clampedY = Math.max(bounds.top, Math.min(y, bounds.bottom - 1));

    let range = null;

    // 优先使用现代浏览器的 API
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(clampedX, clampedY);
    }

    // 兼容旧版 Firefox
    if (!range && document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(clampedX, clampedY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    // 如果无法获取有效范围，尝试手动计算
    if (!range) {
      range = manuallyFindCursorPosition(dragElement, clampedX, clampedY);
    }

    if (range) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return range;
    }

    return null;
  };

  // 手动计算光标位置
  const manuallyFindCursorPosition = function (element, x, y) {

    const textNodes = getTextNodes(element);
    const range = document.createRange();

    for (const node of textNodes) {
      const rect = getTextNodeRect(node);
      if (!rect) {
        continue
      }
      // 检查是否在文本节点范围内
      if (y >= rect.top && y <= rect.bottom && x >= rect.left && x <= rect.right) {
        // 在文本节点内，尝试找到最接近的位置
        const text = node.textContent;
        const estimatedIndex = estimateCursorPosition(text, rect, x);
        range.setStart(node, Math.min(estimatedIndex, text.length));
        range.collapse(true);
        return range;
      }
    }

    // 如果没找到，选择元素末尾
    range.selectNodeContents(element);
    range.collapse(false);
    return range;
  };

  // 新增：获取所有文本节点
  const getTextNodes = function (element) {
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    return textNodes;
  };

  // 新增：获取文本节点的矩形区域
  const getTextNodeRect = function (textNode) {
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rect = range.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
  };

  // 新增：估算光标在文本中的位置
  const estimateCursorPosition = function (text, rect, x) {
    const avgCharWidth = rect.width / text.length;
    const relativeX = x - rect.left;
    return Math.round(relativeX / avgCharWidth);
  };


  // 其他事件处理函数保持不变
  const handleMouseDown = function (e) {

    mousedownX = e.clientX;
    mousedownY = e.clientY;

    e.stopPropagation();
    mouseDownTime = Date.now();
    hasSelectionChanged = false;

    if (e.target === dragElement || dragElement.contains(e.target)) {
      isSelecting = true;
      const range = setCursorPosition(e.clientX, e.clientY);
      if (range) {
        selectionStart = range.cloneRange();
      }
    }
  };


  // 修改：增强的鼠标移动处理
  const handleMouseMove = function (e) {

    if (!isSelecting) return;

    e.stopPropagation();
    e.preventDefault();

    const bounds = dragElement.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    // 检查是否超出右边界
    const isBeyondRight = clientX > bounds.right;
    const isBeyondLeft = clientX < bounds.left;

    if (isBeyondRight || isBeyondLeft) {
      // 超出边界时，使用边界内的位置
      clientX = isBeyondRight ? bounds.right - 1 : bounds.left + 1;
    }

    const currentRange = setCursorPosition(clientX, clientY);

    if (currentRange && selectionStart) {
      const selection = window.getSelection();
      const newRange = document.createRange();

      const startPoint = selectionStart.cloneRange();
      const endPoint = currentRange.cloneRange();

      startPoint.collapse(true);
      endPoint.collapse(true);

      const compareResult = startPoint.compareBoundaryPoints(Range.START_TO_START, endPoint);

      if (compareResult <= 0) {
        newRange.setStart(startPoint.startContainer, startPoint.startOffset);
        newRange.setEnd(endPoint.startContainer, endPoint.startOffset);
      } else {
        newRange.setStart(endPoint.startContainer, endPoint.startOffset);
        newRange.setEnd(startPoint.startContainer, startPoint.startOffset);
      }

      selection.removeAllRanges();
      selection.addRange(newRange);
      hasSelectionChanged = true;
    }
  };

  const handleMouseUp = function (e) {

    if (!isSelecting) {
      dragElement.blur()
    }

    const clickDuration = Date.now() - mouseDownTime;
    if (hasSelectionChanged || clickDuration > 200) {
      e.stopPropagation();
      e.preventDefault();
    }
    isSelecting = false;
  };

  // 处理键盘按键事件
  const handleKeydown = function (e) {

    // 方向键处理：允许默认行为（移动光标）
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'Home' || e.key === 'End') {
      // 停止立即传播，防止其他事件监听器阻止默认行为
      e.stopImmediatePropagation();
      // 不阻止默认行为，让光标移动
      return;
    }

    // Ctrl + 方向键组合（词级移动）
    if (e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.stopImmediatePropagation();
      return;
    }

    // Shift + 方向键（选择文本）
    if (e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.stopImmediatePropagation();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      dragElement.blur();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      dragElement.textContent = originalText;
      dragElement.blur();
      return;
    }

    // 对于其他按键，不需要特别处理，contentEditable会处理光标位置
  };

  const handleInput = function (e) {
    // 输入处理逻辑
  };

  const handleBlur = function () {

    const newValue = dragElement.textContent.trim();

    // 移除编辑状态
    dragElement.contentEditable = 'false';
    dragElement.style.outline = 'none';
    dragElement.style.outlineOffset = '';
    dragElement.style.transition = '';
    dragElement.style.overflow = '';

    // 移除事件监听器
    dragElement.removeEventListener('keydown', handleKeydown);
    dragElement.removeEventListener('blur', handleBlur);
    dragElement.removeEventListener('input', handleInput);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (!newValue) {
      CanvasManager.deleteElement(CanvasManager.getSelectedPath(), dragElement);
      dragElement.remove();
    } else {
      const settings = CanvasManager.getSettingsFromCurrentCanvas(dragElement);
      settings.content = newValue;
    }
  };

  // 添加事件监听器
  dragElement.addEventListener('keydown', handleKeydown);
  dragElement.addEventListener('blur', handleBlur);
  dragElement.addEventListener('input', handleInput);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

// 选择元素
const handleSelectedElement = (dragElement) => {
  if (dragElement.contentEditable === 'true') return
  // 清除之前的定时器（如果有）
  clearTimeout(clickTimeout);
  // 设置新的定时器
  clickTimeout = setTimeout(function () {
    dragElement.focus()
    dragElement.style.outline = '1px dashed #f00'
    dragElement.setAttribute('selected', 'true')
    CanvasManager.setSelectedObject({draggableElement: dragElement})
    const settings = CanvasManager.getSettingsFromCurrentCanvas(dragElement);
    if (dragElement instanceof HTMLImageElement) {
      imageOptions.value = _.cloneDeep(settings.options)
      if (projectSettings.value.others.optionAnchorPoint) {
        handleOpenSubMenu('4')
        nextTick(() => {
          document.getElementById('image-options').scrollIntoView({behavior: 'smooth'});
        })
      }
    } else {
      textOptions.value = _.cloneDeep(settings.options)
      if (projectSettings.value.others.optionAnchorPoint) {
        handleOpenSubMenu('3')
        nextTick(() => {
          document.getElementById('text-options').scrollIntoView({behavior: 'smooth'});
        })
      }
    }
  }, 200); // 200毫秒内没有再次点击，则视为单击
}

const handleDragMoveElement = (event) => {

  event.preventDefault();

  if (event.target.getAttribute('draggable') !== 'true') return

  const dragElement = event.target;

  let isDragging = false;

  const canvas = CanvasManager.getCurrentCanvas();

  const imagesElement = canvas.getImageElement();

  const canvasElement = imagesElement.parentNode;

  // 记录初始鼠标位置和元素位置
  let startX = event.clientX;
  let startY = event.clientY;

  const elementWidth = parseFloat(window.getComputedStyle(dragElement).width);
  const elementHeight = parseFloat(window.getComputedStyle(dragElement).height);
  let initialLeft = parseFloat(dragElement.style.left) || canvasElement.offsetWidth - parseFloat(dragElement.style.right) - elementWidth;
  let initialTop = parseFloat(dragElement.style.top) || canvasElement.offsetHeight - parseFloat(dragElement.style.bottom) - elementHeight;

  document.onmousemove = function elementDrag(event) {

    event.preventDefault();

    if (dragElement.getAttribute('selected') === 'true' || dragElement.contentEditable === 'true') {
      return
    }

    dragElement.style.cursor = 'move';

    isDragging = true

    const targetX = event.clientX;

    const targetY = event.clientY;

    const backgroundElement = canvasElement.querySelector('.image-background');

    const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement

    // 计算移动距离（考虑旋转后的坐标系）
    const dx = (targetX - startX) / canvas.scale;
    const dy = (targetY - startY) / canvas.scale;

    // 计算新位置
    const elementLeft = initialLeft + dx;
    const elementTop = initialTop + dy;
    const elementRight = canvasWidth - elementLeft - elementWidth;
    const elementBottom = canvasHeight - elementTop - elementHeight

    dragElement.style.left = elementLeft + 'px';
    dragElement.style.top = elementTop + 'px';
    dragElement.style.right = elementRight + 'px';
    dragElement.style.bottom = elementBottom + 'px';

    const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
    const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
    const backgroundLeft = Number.parseFloat(backgroundElement.style.left);
    const backgroundRight = Number.parseFloat(backgroundElement.style.right);
    const backgroundTop = Number.parseFloat(backgroundElement.style.top);
    const backgroundBottom = Number.parseFloat(backgroundElement.style.bottom);

    let references = []
    let centerX, centerY, centerXRatio, centerYRatio

    let offsetLeft = elementLeft - backgroundLeft
    let offsetLeftRatio = offsetLeft / backgroundWidth

    let offsetRight = elementRight - backgroundRight
    let offsetRightRatio = offsetRight / backgroundWidth

    let offsetTop = elementTop - backgroundTop
    let offsetTopRatio = offsetTop / backgroundHeight

    let offsetBottom = elementBottom - backgroundBottom
    let offsetBottomRatio = offsetBottom / backgroundHeight

    if (offsetLeft > offsetRight) {
      references.push('right')
      centerX = offsetRight + elementWidth / 2
    } else {
      references.push('left')
      centerX = offsetLeft + elementWidth / 2
    }

    if (offsetTop > offsetBottom) {
      references.push('bottom')
      centerY = offsetBottom + elementHeight / 2
    } else {
      references.push('top')
      centerY = offsetTop + elementHeight / 2
    }

    centerXRatio = centerX / backgroundWidth;
    centerYRatio = centerY / backgroundHeight;

    const settings = (dragElement instanceof HTMLDivElement) ? canvas.settings.texts.get(dragElement) : canvas.settings.images.get(dragElement)

    settings.references = references
    settings.offsetLeft = offsetLeft
    settings.offsetLeftRatio = offsetLeftRatio
    settings.offsetRight = offsetRight
    settings.offsetRightRatio = offsetRightRatio
    settings.offsetTop = offsetTop
    settings.offsetTopRatio = offsetTopRatio
    settings.offsetBottom = offsetBottom
    settings.offsetBottomRatio = offsetBottomRatio
    settings.centerX = centerX
    settings.centerY = centerY
    settings.centerXRatio = centerXRatio
    settings.centerYRatio = centerYRatio
  }
  document.onmouseup = function closeDragElement(event) {
    document.onmouseup = null;
    document.onmousemove = null;
    dragElement.style.cursor = '';
    const target = event.target;
    if (!isDragging && target.getAttribute('draggable') === 'true' && startX === event.clientX && startY === event.clientY) {
      handleSelectedElement(target)
    }
  }
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
    settings = {...new ImageSettings(), url, path, tagName, width, height}
  } else {
    settings = {...new TextSettings(), type, content, expression, tagName}
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

  const {x, y, scaleY, scaleX} = canvasEditor.getCanvasInternalPosition(event);

  dragElement.x = x - offsetX * scaleX

  dragElement.y = y - offsetY * scaleY

  canvasEditor.addElement(dragElement)

  canvasEditor.renderAll()

  const currentCanvas = CanvasManager.getCurrentCanvas();
  currentCanvas.zoom = canvasEditor.getZoom()
  currentCanvas.json = canvasEditor.exportToJSON()
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
  const zoom = canvasEditor.getZoom();
  const {zoomStep, maxZoom, minZoom} = zoomOptions;
  let newZoom = direction === 'in' ? zoom + zoomStep : zoom - zoomStep;
  newZoom = Math.min(Math.max(minZoom, newZoom), maxZoom);
  canvas.zoom = newZoom
  canvasEditor.setCenterZoom(newZoom)
}

const handleDragMoveCanvas = (event) => {
  // 阻止默认滚动行为
  event.preventDefault();
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
  if (event.code === 'Space') {
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
  useEventListener(document, 'keydown', triggerDragCanvas)
}

onMounted(() => {
  createThreadPool()
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
            padding: 0 1px;

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

      .canvas-wrapper {
        width: var(--canvas-width);
        height: var(--canvas-height);
        display: flex;
        justify-content: center;
        align-items: center;

        #canvas {

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
