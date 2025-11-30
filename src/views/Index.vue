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
                        :index="template.templateId"
                        @click="openEnableTemplateDialog(template)">
                      {{ template.templateName }}
                    </el-menu-item>
                  </div>
                </el-sub-menu>
                <el-sub-menu index="2" class="image-mark-options">
                  <template #title>
                    <span>图片标签</span>
                  </template>
                  <div class="image-marks" ref="imageMarks">
                    <img class="image-mark" v-for="([key, label]) in imageLabels"
                         :path="label.path"
                         :key="label.path" draggable="true"
                         :src="label.url">
                  </div>
                </el-sub-menu>
                <el-sub-menu index="3" class="text-marks-options">
                  <template #title>
                    <span>文本标签</span>
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
                      <el-tooltip v-for="(textLabel) in textLabels" :key="textLabel.id" class="box-item" effect="dark"
                                  :content="textLabel.tips" placement="top">
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

        <div class="preview-container" id="preview-container" ref="previewContainer">
          <template v-for="([key, canvas]) in CanvasManager.getCanvases()" :key="canvas.path">
            <div class="canvas" :path="canvas.path" v-show="canvas.visible" @contextmenu="triggerContextMenu">
              <div class="image-background"></div>
              <img :src="canvas.url" :id="canvas.path">
            </div>
          </template>
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
                          <el-input v-model="metadataOptions.cameraBrand" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="cameraModel">相机型号
                          </div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.cameraModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="lensModel">镜头型号</div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.lensModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="focalLength">焦段</div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.focalLength" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="iso">IOS</div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.iso" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="shutter">快门</div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.shutter" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="aperture">光圈</div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.aperture" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">
                          <div class="text-mark" draggable="true" type="metadata" expression="shootingTime">拍摄日期
                          </div>
                        </div>
                        <div class="value">
                          <el-input v-model="metadataOptions.shootingTime" size="small"/>
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
                          <el-slider @change="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderTop"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderTop" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">左边框</div>
                        <div class="value">
                          <el-slider @change="handleUpdateBorders"
                                     :show-tooltip="false"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderLeft"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderLeft" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">右边框</div>
                        <div class="value">
                          <el-slider @change="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderRight"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRight" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">下边框</div>
                        <div class="value">
                          <el-slider @change="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="borderOptions.borderBottom"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderBottom" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">圆角</div>
                        <div class="value">
                          <el-slider @change="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="0"
                                     :max="50"
                                     v-model="borderOptions.borderRadius"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderRadius" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊值</div>
                        <div class="value">
                          <el-slider @change="handleUpdateBorders"
                                     size="small"
                                     :show-tooltip="false"
                                     :min="0"
                                     :max="50"
                                     v-model="borderOptions.borderBlur"
                                     placement="top"/>
                          <input type="number" class="number-input" @input="handleUpdateBorders"
                                 v-model="borderOptions.borderBlur" step="1">
                        </div>
                      </li>
                      <li class="option">
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
                    <div class="group-title">基本</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">排列方向</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.textDirection"
                              :options="[{label:'水平', value:0}, {label:'垂直', value:1}]"
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
                              step="100"
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
                              @change=""
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
                          <el-slider @change=""
                                     size="small"
                                     :min="-50"
                                     :max="50"
                                     v-model="textOptions.textShadow.offsetX"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="textOptions.textShadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              v-model="textOptions.textShadow.offsetY"
                              :min="-50"
                              :max="50"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.textShadow.offsetY" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              v-model="textOptions.textShadow.blur"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="textOptions.textShadow.blur" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              @change=""
                              v-model="textOptions.textShadow.shadowColor"
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
                    <div class="group-title">基本</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">缩放</div>
                        <div class="value">
                          <el-slider :min="1"
                                     :max="100"
                                     size="small"
                                     v-model="imageOptions.scale"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.scale" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">不透明度</div>
                        <div class="value">
                          <el-slider :min="0"
                                     :max="10"
                                     size="small"
                                     v-model="imageOptions.alpha"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.alpha" step="1">
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

                    <div class="group-title">图片阴影</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">X轴偏移</div>
                        <div class="value">
                          <el-slider size="small"
                                     :min="-50"
                                     :max="50"
                                     v-model="imageOptions.boxShadow.offsetX"
                                     placement="top"/>
                          <input type="number" class="number-input" v-model="imageOptions.boxShadow.offsetX" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">Y轴偏移</div>
                        <div class="value">
                          <el-slider
                              v-model="imageOptions.boxShadow.offsetY"
                              :min="-50"
                              :max="50"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="imageOptions.boxShadow.offsetY" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">模糊程度</div>
                        <div class="value">
                          <el-slider
                              v-model="imageOptions.boxShadow.blur"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
                          <input type="number" class="number-input" v-model="imageOptions.boxShadow.blur" step="1">
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">阴影颜色</div>
                        <div class="value">
                          <el-color-picker
                              @change=""
                              v-model="imageOptions.boxShadow.shadowColor"
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
        <div class="preview-list" id="preview-list" tabindex="0" ref="previewList" @wheel="handleMovePreviewList"
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
          <el-button type="info" @click="saveTextLabel">
            确认
          </el-button>
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
          <el-button type="info" @click="saveTemplates">
            确认
          </el-button>
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
          <el-button type="info" @click="renameTemplate">
            确认
          </el-button>
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
            <el-button link type="primary" size="small" @click="openTextLabelEditorDialog(scope.row)">
              编辑
            </el-button>
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
               width="800">
      <el-tabs type="border-card" class="demo-tabs">
        <el-tab-pane label="导出">
          <div class="border-box">
            <span class="border-label">图片尺寸</span>
            <div class="options">
              <div class="option">
                <span>调整方式：</span>
                <el-select v-model="projectSettings.outputSettings.outputSize.type"
                           placeholder="Select"
                           size="small">
                  <el-option
                      v-for="item in outputSizeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="[2,3].includes(projectSettings.outputSettings.outputSize.type)">
                <span>长边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.longSide"
                          size="small"
                          placeholder="长边"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[4,5].includes(projectSettings.outputSettings.outputSize.type)">
                <span>短边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.shortSide"
                          size="small"
                          placeholder="短边"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[6,7].includes(projectSettings.outputSettings.outputSize.type)">
                <span>宽尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.width"
                          size="small"
                          placeholder="宽尺寸"/>
                <span>&nbsp;px</span>
              </div>
              <div class="option" v-show="[8,9].includes(projectSettings.outputSettings.outputSize.type)">
                <span>高尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.height"
                          size="small"
                          placeholder="高尺寸"/>
                <span>&nbsp;px</span>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">图片设置</span>
            <div class="options">
              <div class="option">
                <span>输出格式：</span>
                <el-select v-model="projectSettings.outputSettings.extname" size="small">
                  <el-option
                      v-for="item in [{label:'原格式', value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}, {label:'WEBP', value: 3}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="[1,3].includes(projectSettings.outputSettings.extname) ">
                <span>图片品质：</span>
                <div class="slider-demo-block">
                  <el-slider v-model="projectSettings.outputSettings.quality"
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
                    class="ml-2"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="元数据">
          <div class="border-box">
            <span class="border-label">格式化</span>
            <div class="items">
              <div class="item">
                <span class="label">相机品牌：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.cameraBrand"></el-input>
              </div>
              <div class="item">
                <span class="label">相机型号：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.cameraModel"></el-input>
              </div>
              <div class="item">
                <span class="label">镜头型号：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.lensModel"></el-input>
              </div>
              <div class="item">
                <span class="label">焦段：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.focalLength"></el-input>
              </div>
              <div class="item">
                <span class="label">ISO：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.iso"></el-input>
              </div>
              <div class="item">
                <span class="label">快门：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.shutter"></el-input>
              </div>
              <div class="item">
                <span class="label">光圈：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.aperture"></el-input>
              </div>
              <div class="item">
                <span class="label">拍摄日期：</span>
                <el-input class="value" v-model="projectSettings.metadata.formats.shootingTime"></el-input>
              </div>
            </div>
          </div>

          <div class="border-box">
            <span class="border-label">焦距转换</span>
            <div class="items">
              <div class="item">
                <span class="label">等效焦距：</span>
                <el-switch
                    @change="handleFocalLength(0)"
                    v-model="projectSettings.metadata.other.enableEquivalentFocalSegment"
                    class="ml-2"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="item">
                <span class="label">转换倍数：</span>
                <el-input class="value" style="width: 100px" @change="handleFocalLength(1)"
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
                <span>线程数：</span>
                <el-select @change="createThreadPool" v-model="projectSettings.performance.downloadThreads"
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
                       step="0.01">
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
                       step="0.01">
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
                <span>选项锚点：</span>
                <el-switch
                    v-model="projectSettings.others.optionAnchorPoint"
                    class="ml-2"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"/>
              </div>
              <div class="option">
                <span>移到步长：</span>
                <div class="slider-demo-block">
                  <el-slider v-model="projectSettings.others.movingStepSize"
                             :min="1"
                             :max="100"
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

import FontLoader from '@/utils/FontLoader'

import _ from 'lodash';

import MapHelper from "@/utils/map-helper";

import Notification from '@/utils/Notification'

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
  FontSettings
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

const scaleOptions = {
  minScale: 0.5,
  maxScale: 5,
  scaleStep: 0.1
}

let clickTimeout = null;

let scrollTimeout = null;

const selectedPreviewList = ref(new Map())

const newTemplate = ref({
  templateName: '',
})

const oldTemplate = ref({
  templateId: 0,
  templateName: ''
})

const templates = ref([])

const textOptions = ref(new TextOptions())

const imageOptions = ref(new ImageOptions())

const borderOptions = ref(new BorderOptions())

const metadataOptions = ref(new Metadata())

const sliderRange = ref({
  min: 0,
  max: 300
})

const previewContainer = ref(null)

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


const stopWatchAvailableCanvas = watch(filterType, async () => {
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
        const fontFamily = data.fontFamily;
        projectSettings.value.availableFonts.delete(fontFamily)
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

const triggerContextMenu = () => {
  if (CanvasManager.isNotEmpty()) {
    window.electronAPI.openContextMenu()
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

        const newSettings = []

        const paths = Array.from(selectedPreviewList.value.keys());

        const selectedCanvas = CanvasManager.getCanvas(CanvasManager.getSelectedPath());

        let beforeCanvas = selectedCanvas;

        for (let i = 0; i < paths.length; i++) {

          const nextCanvas = CanvasManager.getCanvas(paths[i]);

          if (!nextCanvas.completed || nextCanvas.isUpdate) {

            beforeCanvas.hide()
            await nextTick()
            nextCanvas.show()
            await nextTick()

            if (!nextCanvas.completed) {
              await initializeCanvasLayout(nextCanvas)
            }

            if (nextCanvas.isUpdate) {
              await refreshTemplate(nextCanvas.path)
            }

          }

          const {settings: {border, texts, images}} = CanvasManager.getCanvas(paths[i]);

          newSettings.push({
            imagePath: paths[i],
            settings: {
              border,
              images: [...images.values()],
              texts: [...texts.values()],
            }
          })

          if (i === paths.length - 1) {
            nextCanvas.hide()
            await nextTick();
          } else {
            beforeCanvas = nextCanvas;
          }
        }

        selectedCanvas.show()

        await nextTick()

        window.electronAPI.requestExportFiles(_.cloneDeep({
          projectSettings: projectSettings.value,
          outputDirectory: data.outputDirectory,
          settings: newSettings
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
  renderBorders(path)
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


const stopProjectSettingsWatch = watch(projectSettings, (newVal, oldVal) => {
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


const stopTextSettingsWatch = watch(textOptions, async (newVal, oldVal) => {
  //停止监听 stopWatch();
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const imageElement = canvas.getImageElement();
  const backgroundElement = imageElement.parentNode.querySelector('.image-background');
  const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
  const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
  for (let [element, settings] of canvas.settings.texts) {
    if (element.getAttribute('selected') === 'true') {
      let computedStyle = window.getComputedStyle(element);
      const elementWidth = parseFloat(element.style.width) || parseFloat(computedStyle.width);
      const elementHeight = parseFloat(element.style.height) || parseFloat(computedStyle.height);
      let elementLeft = parseFloat(element.style.left) || parseFloat(computedStyle.left)
      let elementTop = parseFloat(element.style.top) || parseFloat(computedStyle.top)
      let elementRight = parseFloat(element.style.right) || parseFloat(computedStyle.right)
      let elementBottom = parseFloat(element.style.bottom) || parseFloat(computedStyle.bottom)
      element.style.zIndex = newVal.zIndex
      element.style.fontStyle = newVal.fontStyle
      element.style.fontWeight = newVal.fontWeight
      element.style.fontFamily = newVal.fontFamily
      element.style.fontSize = newVal.fontSize + 'px'
      element.style.color = newVal.fontColor
      element.style.background = newVal.tagBackground
      element.style.transform = `rotate(${newVal.angle}deg)`
      const {textShadow: {offsetX, offsetY, blur, shadowColor}} = newVal;
      element.style.textShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

      if (newVal.textDirection === 0) {
        element.style.writingMode = 'horizontal-tb'
      } else if (newVal.textDirection === 1) {
        element.style.writingMode = 'vertical-lr'
        element.style.textOrientation = 'upright'
      }

      await nextTick()

      const newElementWidth = element.offsetWidth;
      const newElementHeight = element.offsetHeight;

      const increaseWidth = newElementWidth - elementWidth;
      const increaseHeight = newElementHeight - elementHeight;

      element.style.left = elementLeft - increaseWidth / 2 + 'px'
      element.style.top = elementTop - increaseHeight / 2 + 'px'
      element.style.right = elementRight - increaseWidth / 2 + 'px'
      element.style.bottom = elementBottom - increaseHeight / 2 + 'px'

      await nextTick()

      settings.options = _.cloneDeep(newVal)
      settings.width = newElementWidth
      settings.height = newElementHeight
      settings.options.fontSizeRatio = newVal.fontSize / backgroundWidth
      settings.options.textShadow.offsetXRatio = newVal.textShadow.offsetX / newVal.fontSize
      settings.options.textShadow.offsetYRatio = newVal.textShadow.offsetY / newVal.fontSize
      settings.options.textShadow.blurRatio = newVal.textShadow.blur / newVal.fontSize

      updateElementPosition(canvas, element, settings)
    }
  }
}, {
  //深度监视（监视属性变化）
  deep: true,
  //immediate 立即触发一次监视
  //immediate: true
});

const stopImageAngleWatch = watch(() => imageOptions.value.angle, (newVal, oldVal) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const elements = canvas.settings.images;
  for (let [element, settings] of elements) {
    if (element.getAttribute('selected') === 'true') {
      element.style.transformOrigin = 'center center'
      element.style.transform = `rotate(${newVal}deg)`;
      settings.options.angle = newVal
    }
  }
});

const stopImageAlphaWatch = watch(() => imageOptions.value.alpha, (newVal, oldVal) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const elements = canvas.settings.images;
  for (let [element, settings] of elements) {
    if (element.getAttribute('selected') === 'true') {
      element.style.opacity = newVal / 10
      settings.options.alpha = newVal
    }
  }
});

const stopImageBoxShadowWatch = watch(() => imageOptions.value.boxShadow, (newVal, oldVal) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const elements = canvas.settings.images;
  for (let [element, settings] of elements) {
    if (element.getAttribute('selected') === 'true') {

      const {offsetX, offsetY, blur, shadowColor} = newVal;
      element.style.boxShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

      const {offsetWidth, offsetHeight} = element;
      settings.options.boxShadow = _.cloneDeep(newVal)
      settings.options.boxShadow.offsetXRatio = offsetX / offsetWidth
      settings.options.boxShadow.offsetYRatio = offsetY / offsetHeight
      settings.options.boxShadow.blurRatio = blur / offsetWidth
    }
  }
}, {
  //深度监视（监视属性变化）
  deep: true,
})


const stopImageScaleWatch = watch(() => imageOptions.value.scale, async (newVal, oldVal) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const backgroundElement = canvas.getImageElement().parentNode.querySelector('.image-background');
  const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
  const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
  const elements = canvas.settings.images;
  for (let [element, settings] of elements) {
    if (element.getAttribute('selected') === 'true') {

      const {originalWidth, originalHeight} = settings;

      const computedStyle = window.getComputedStyle(element);
      let elementWidth = Number.parseFloat(computedStyle.width);
      let elementHeight = Number.parseFloat(computedStyle.height);
      let elementLeft = Number.parseFloat(computedStyle.left);
      let elementRight = Number.parseFloat(computedStyle.right);
      let elementTop = Number.parseFloat(computedStyle.top);
      let elementBottom = Number.parseFloat(computedStyle.bottom);

      let scale = (newVal - elementWidth / originalWidth * 10) / 10;

      const increaseWidth = originalWidth * scale;
      const increaseHeight = originalHeight * scale;

      elementWidth = elementWidth + increaseWidth
      elementHeight = elementHeight + increaseHeight

      elementLeft = elementLeft - increaseWidth / 2
      elementRight = elementRight - increaseWidth / 2
      elementTop = elementTop - increaseHeight / 2
      elementBottom = elementBottom - increaseHeight / 2

      element.style.width = elementWidth + 'px'
      element.style.height = elementHeight + 'px'
      element.style.left = elementLeft + 'px'
      element.style.top = elementTop + 'px'
      element.style.right = elementRight + 'px'
      element.style.bottom = elementBottom + 'px'

      await nextTick();

      settings.width = elementWidth
      settings.height = elementHeight
      settings.options.scale = newVal
      settings.options.imageWidthRatio = elementWidth / backgroundWidth
      settings.options.imageHeightRatio = elementHeight / backgroundHeight

      updateElementPosition(canvas, element, settings)
    }
  }
});


const stopWatchImageZIndex = watch(() => imageOptions.value.zIndex, (newVal, oldVal) => {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const elements = canvas.settings.images;
  for (let [element, settings] of elements) {
    if (element.getAttribute('selected') === 'true') {
      element.style.zIndex = newVal
      settings.options.zIndex = newVal;
    }
  }
})

const renameTemplate = () => {
  if (!renameTemplateForm) return
  renameTemplateForm.value.validate(async (valid, fields) => {
    if (valid) {
      if (templates.value && templates.value.length) {
        for (let i = 0; i < templates.value.length; i++) {
          if (templates.value[i].id === oldTemplate.value.templateId) {
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

  if (!CanvasManager.getSelectedPath()) {
    const {settings: templateSettings} = CanvasManager.getCurrentCanvas();
    const targetSettings = {
      border: templateSettings.border,
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
      const {border, images, texts} = _.cloneDeep(canvas.settings)
      const newTemplates = [...templates.value];
      // 清空模版列表，重新生成列表
      templates.value = []
      await nextTick()

      newTemplates.push({
        templateId: Date.now(),
        templateName: newTemplate.value.templateName,
        settings: {
          border: border,
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
    offsetLeft,
    offsetLeftRatio,
    offsetRight,
    offsetRightRatio,
    offsetTop,
    offsetTopRatio,
    offsetBottom,
    offsetBottomRatio,
    synchronousMode
  } = settings

  let newOffsetLeft = synchronousMode === 1 ? offsetLeftRatio * backgroundWidth : offsetLeft;
  let newOffsetRight = synchronousMode === 1 ? offsetRightRatio * backgroundWidth : offsetRight;
  let newOffsetTop = synchronousMode === 1 ? offsetTopRatio * backgroundHeight : offsetTop;
  let newOffsetBottom = synchronousMode === 1 ? offsetBottomRatio * backgroundHeight : offsetBottom;

  let left = backgroundLeft + newOffsetLeft;
  let right = backgroundRight + newOffsetRight;
  let top = backgroundTop + newOffsetTop;
  let bottom = backgroundBottom + newOffsetBottom;

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

  if (element.src) {
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
  canvas.isUpdate = true

  if (path === CanvasManager.getSelectedPath()) {
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

  const elementWidth = canvas.width;
  const elementHeight = canvas.height;

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

  let offsetLeft = elementLeft - backgroundLeft
  let offsetLeftRatio = offsetLeft / backgroundWidth

  let offsetRight = elementRight - backgroundRight
  let offsetRightRatio = offsetRight / backgroundWidth

  let offsetTop = elementTop - backgroundTop
  let offsetTopRatio = offsetTop / backgroundHeight

  let offsetBottom = elementBottom - backgroundBottom
  let offsetBottomRatio = offsetBottom / backgroundHeight

  elementLeft > elementRight ? references.push('right') : references.push('left')

  elementTop > elementBottom ? references.push('bottom') : references.push('top')

  settings.references = references
  settings.offsetLeft = offsetLeft
  settings.offsetLeftRatio = offsetLeftRatio
  settings.offsetRight = offsetRight
  settings.offsetRightRatio = offsetRightRatio
  settings.offsetTop = offsetTop
  settings.offsetTopRatio = offsetTopRatio
  settings.offsetBottom = offsetBottom
  settings.offsetBottomRatio = offsetBottomRatio
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
      const beforePath = CanvasManager.getSelectedPath();
      const beforeCanvas = CanvasManager.getCanvas(beforePath);
      beforeCanvas.hide()
      await nextTick()
    }

    // 没有预览元素或前一次预览元素与当前预览元素不同时显示，多次点击预览同一元素不重复渲染
    if (!beforePath || beforePath !== canvas.path) {
      canvas.show();
      await nextTick()
      await renderCanvas(canvas)
    }


    CanvasManager.setSelectedObject({path: event.target.getAttribute('path'), previewElement: event.target})

    // 添加当前选中元素到选中列表中
    selectedPreviewList.value.set(canvas.path, event.target)
    event.target.classList.add('active')
  }
}

const setScrollBarPosition = (canvas) => {
  // 设置滚动位置
  previewContainer.value.scrollLeft = canvas.scrollLeft;
  previewContainer.value.scrollTop = canvas.scrollTop;
}

const initCanvasSize = () => {
  setTimeout(() => {
    // 获取窗口宽高
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // 设置CSS自定义属性
    previewContainer.value.style.setProperty('--canvas-width', `${windowWidth}px`);
    previewContainer.value.style.setProperty('--canvas-height', `${windowHeight}px`);
    previewContainer.value.idealWidth = Number.parseFloat(previewContainer.value.offsetWidth)
    previewContainer.value.idealHeight = Number.parseFloat(previewContainer.value.offsetHeight)
  }, 1000)
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

  const idealImageScale = Math.min(containerIdealWidth / imageWidth, containerIdealHeight / imageHeight) * 0.8

  const newImageWidth = imageWidth * idealImageScale;
  const newImageHeight = imageHeight * idealImageScale;

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

  setScale(canvas, canvasScale)
}

// 设置缩放比例
function setScale(canvas, scale) {

  if (!canvas || !scale) return

  const imageElement = canvas.getImageElement();

  const canvasElement = imageElement.parentNode;

  const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement

  const {minScale, maxScale} = scaleOptions;

  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  // 限制缩放范围
  const canvasScale = Math.min(Math.max(minScale, scale), maxScale);

  // 应用缩放变换
  canvasElement.style.transform = `scale(${canvasScale})`;
  // 设置变换原点为中心点
  canvasElement.style.transformOrigin = `${centerX}px ${centerY}px`;

  canvas.scale = canvasScale

}

// 缩放函数
function zoom(direction) {
  const canvas = CanvasManager.getCurrentCanvas();
  if (!canvas) return
  const {scaleStep} = scaleOptions;
  const newScale = direction === 'in' ? canvas.scale + scaleStep : canvas.scale - scaleStep;
  setScale(canvas, newScale);
}


const renderCanvas = async (canvas) => {

  if (!canvas.completed) {
    await initializeCanvasLayout(canvas)
  }

  setScrollBarPosition(canvas)
  metadataOptions.value = canvas.metadata
  borderOptions.value = canvas.settings.border.options

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
  const imageElement = canvas.getImageElement();
  const canvasElement = imageElement.parentNode;
  const previewContainer = canvasElement.parentNode;
  const {offsetWidth: canvasWidth, offsetHeight: canvasHeight} = canvasElement
  const {offsetWidth: previewContainerWidth, offsetHeight: previewContainerHeight} = previewContainer
  // 计算滚动位置，使图形内容居中
  const scrollLeft = (canvasWidth - previewContainerWidth) / 2;
  const scrollTop = (canvasHeight - previewContainerHeight) / 2;
  // 设置滚动位置
  previewContainer.scrollLeft = Math.max(0, scrollLeft);
  previewContainer.scrollTop = Math.max(0, scrollTop);
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


const handleUpdateBorders = async () => {

  const canvas = CanvasManager.getCurrentCanvas()
  if (!canvas) return

  const imageElement = canvas.getImageElement();

  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    const backgroundElement = imageElement.parentNode.querySelector('.image-background');
    let {
      borderLeft,
      borderRight,
      borderTop,
      borderBottom,
      borderColor,
      borderType,
      borderBlur,
      borderRadius
    } = borderOptions.value;

    const oldBorder = backgroundElement.border || {};

    if (borderType !== oldBorder.borderType) {
      if (borderType === 0) {
        backgroundElement.removeAttribute('blur-border')
        backgroundElement.style.background = borderColor
        backgroundElement.style.boxShadow = ''
      } else if (borderType === 1) {
        backgroundElement.setAttribute('blur-border', '')
        backgroundElement.style.background = `url('${canvas.url}') center / cover`
        backgroundElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)'
        imageElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)'
      }
    }

    if (oldBorder.borderLeft !== borderLeft) {
      const increaseWidth = borderLeft - (oldBorder.borderLeft || 0);
      const oldWidth = Number.parseFloat(backgroundElement.style.width);
      const left = Number.parseFloat(backgroundElement.style.left);
      backgroundElement.style.width = (oldWidth + increaseWidth) + 'px'
      backgroundElement.style.left = (left - increaseWidth) + 'px'
    }

    if (oldBorder.borderRight !== borderRight) {
      const increaseWidth = borderRight - (oldBorder.borderRight || 0);
      const oldWidth = Number.parseFloat(backgroundElement.style.width);
      const right = Number.parseFloat(backgroundElement.style.right);
      backgroundElement.style.width = (oldWidth + increaseWidth) + 'px'
      backgroundElement.style.right = (right - increaseWidth) + 'px'
    }

    if (oldBorder.borderTop !== borderTop) {
      const increaseHeight = borderTop - (oldBorder.borderTop || 0);
      const oldHeight = Number.parseFloat(backgroundElement.style.height);
      const top = Number.parseFloat(backgroundElement.style.top);
      backgroundElement.style.height = (oldHeight + increaseHeight) + 'px'
      backgroundElement.style.top = (top - increaseHeight) + 'px'
    }

    if (oldBorder.borderBottom !== borderBottom) {
      const increaseHeight = borderBottom - (oldBorder.borderBottom || 0);
      const oldHeight = Number.parseFloat(backgroundElement.style.height);
      const bottom = Number.parseFloat(backgroundElement.style.bottom);
      backgroundElement.style.height = (oldHeight + increaseHeight) + 'px'
      backgroundElement.style.bottom = (bottom - increaseHeight) + 'px'
    }


    if (borderRadius !== oldBorder.borderRadius) {
      imageElement.style.borderRadius = borderRadius + 'px'
      backgroundElement.style.borderRadius = borderRadius + 'px'
    }

    if (borderType === 0 && borderColor !== oldBorder.borderColor) {
      backgroundElement.style.background = borderColor
    }


    if (borderType === 1 && borderBlur !== oldBorder.borderBlur) {
      backgroundElement.style.setProperty('--blur-intensity', borderBlur + 'px');
    }

    backgroundElement.border = _.cloneDeep(borderOptions.value)
    const {clientWidth, clientHeight} = imageElement;

    const border = canvas.settings.border;
    border.borderLeftRatio = borderLeft / clientWidth
    border.borderRightRatio = borderRight / clientWidth
    border.borderTopRatio = borderTop / clientHeight
    border.borderBottomRatio = borderBottom / clientHeight
    border.borderBlurRatio = borderBlur / clientWidth
    border.borderRadiusRatio = borderRadius / clientWidth

    await nextTick()

    refreshCanvasElementPosition(CanvasManager.getSelectedPath())

  }
}


const renderBorders = async (path) => {

  const canvas = CanvasManager.getCanvas(path)
  const imageElement = canvas.getImageElement();
  if (canvas.path === CanvasManager.getSelectedPath()) {
    borderOptions.value = canvas.settings.border.options
  }

  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    const backgroundElement = imageElement.parentNode.querySelector('.image-background');
    let {
      borderLeft,
      borderRight,
      borderTop,
      borderBottom,
      borderColor,
      borderType,
      borderBlur,
      borderRadius
    } = canvas.settings.border.options;

    if (borderType === 0) {
      backgroundElement.style.background = borderColor
      backgroundElement.removeAttribute('blur-border')
      backgroundElement.style.boxShadow = ''
      imageElement.style.boxShadow = ''
    } else if (borderType === 1) {
      backgroundElement.setAttribute('blur-border', '')
      backgroundElement.style.background = `url('${canvas.url}') center / cover`
      backgroundElement.style.setProperty('--blur-intensity', borderBlur + 'px');
      backgroundElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)'
      imageElement.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.4)'
    }

    imageElement.style.borderRadius = borderRadius + 'px'
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

    backgroundElement.border = _.cloneDeep(borderOptions.value)

    const border = canvas.settings.border;
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
    currentCanvas.hide()
    if (currentElement) {
      currentElement.setAttribute('selected', 'false')
      currentElement.classList.remove('active')
      selectedPreviewList.value.delete(currentPath)
    }

    await nextTick()
    beforeCanvas.show()
    await nextTick()
    await renderCanvas(beforeCanvas)

    const beforeElement = currentElement.previousElementSibling || currentElement.parentNode.lastElementChild;
    if (beforeElement) {
      metadataOptions.value = beforeCanvas.metadata
      beforeElement.classList.add('active')
      beforeElement.setAttribute('selected', 'true')

      CanvasManager.setSelectedObject({path: beforeCanvas.path, previewElement: beforeElement})
      selectedPreviewList.value.set(beforeCanvas.path, beforeElement)
      // 方式一，较为卡顿，过渡不流畅
      // selectedElement.value.previewElement.scrollIntoView({
      //   behavior: 'smooth',
      //   block: 'center', // 垂直方向居中
      //   inline: 'center' // 水平方向居中
      // })

      // 方式二，过渡比较流畅
      scrollBarMoveToHorizontalCenter(previewList.value, beforeElement)
    }
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
    }

    currentCanvas.hide()
    await nextTick()
    nextCanvas.show()
    await nextTick()
    await renderCanvas(nextCanvas)

    const nextElement = currentElement.nextElementSibling || currentElement.parentNode.firstElementChild;
    if (nextElement) {
      metadataOptions.value = nextCanvas.metadata
      nextElement.classList.add('active')
      nextElement.setAttribute('selected', 'true')
      CanvasManager.setSelectedObject({path: nextCanvas.path, previewElement: nextElement})
      selectedPreviewList.value.set(nextCanvas.path, nextElement)
      // 方式一，较为卡顿，过渡不流畅
      // selectedElement.value.previewElement.scrollIntoView({
      //   behavior: 'smooth',
      //   block: 'center', // 垂直方向居中
      //   inline: 'center' // 水平方向居中
      // })

      // 方式二，过渡比较流畅
      scrollBarMoveToHorizontalCenter(previewList.value, nextElement)
    }
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


const handleMovePreviewList = (e) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 1.8; // 调整滚动速度
  // 4. 应用滚动
  if (previewList.value) {
    previewList.value.scrollBy({
      left: scrollAmount,
      behavior: 'auto' // 平滑滚动效果
    });
  }
}

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
  const dragElement = CanvasManager.getSelectedObject().draggableElement;
  if (dragElement === null || dragElement.getAttribute('selected') !== 'true') return;
  // 检测 Delete (46) 或 Backspace (8) 键
  if (event.key === 'Delete' || event.key === 'Backspace' || event.keyCode === 46 || event.keyCode === 8) {
    // event.preventDefault();
    if (dragElement.getAttribute('selected') === 'true') {
      if ((dragElement instanceof HTMLDivElement) && !dragElement.querySelector('input')) {
        CanvasManager.deleteElement(CanvasManager.getSelectedPath(), dragElement)
        dragElement.remove()
      }
      if (dragElement instanceof HTMLImageElement) {
        CanvasManager.deleteElement(CanvasManager.getSelectedPath(), dragElement)
        dragElement.remove()
      }
    }
  }
}

// 编辑文本
const handleEditorElement = (event) => {
  // 双击时清除单击的定时器
  clearTimeout(clickTimeout);

  event.preventDefault();

  // 检查元素是否可拖动、不是图片，并且没有在编辑中
  if (event.target.getAttribute('draggable') !== 'true' || event.target instanceof HTMLImageElement || event.target.contentEditable === 'true') {
    return;
  }

  const dragElement = event.target;

  // 清除选中状态
  dragElement.setAttribute('selected', 'false');
  dragElement.style.outline = 'none';

  // 保存原始文本
  const originalText = dragElement.textContent;

  // 直接让div变为可编辑状态
  dragElement.contentEditable = 'true';

  dragElement.style.outline = '1px solid #3F4141FF';
  dragElement.style.outlineOffset = '3px';
  // 添加过渡动画
  dragElement.style.transition = 'all 0.1s ease-in-out';
  dragElement.style.overflow = 'hidden';

  // 聚焦但不全选
  dragElement.focus();

  // 将光标移动到文本末尾
  setTimeout(() => {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(dragElement);
    // false 表示移动到末尾
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }, 0);

  // 定义事件处理函数（使用命名函数以便移除）
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

  };

  const handleBlur = function () {
    const newValue = dragElement.textContent.trim();
    // 移除编辑状态
    dragElement.contentEditable = 'false';
    dragElement.style.outline = 'none';
    dragElement.style.outlineOffset = '';
    dragElement.style.borderRadius = '';
    dragElement.style.transition = '';
    dragElement.style.overflow = '';

    // 移除事件监听器
    dragElement.removeEventListener('keydown', handleKeydown);
    dragElement.removeEventListener('blur', handleBlur);
    dragElement.removeEventListener('input', handleInput);
    document.removeEventListener('click', handleClick);

    if (!newValue) {
      CanvasManager.deleteElement(CanvasManager.getSelectedPath(), dragElement);
      dragElement.remove();
    } else {
      const settings = CanvasManager.getSettingsFromCurrentCanvas(dragElement);
      settings.content = newValue;
    }
  };

  const handleClick = (e) => {
    if (!dragElement.contains(e.target)) {
      dragElement.blur();
    }
  };

  // 添加事件监听器
  dragElement.addEventListener('keydown', handleKeydown);
  dragElement.addEventListener('blur', handleBlur);
  dragElement.addEventListener('input', handleInput);

  // 添加全局点击监听
  setTimeout(() => {
    document.addEventListener('click', handleClick);
  }, 0);
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

    let offsetLeft = elementLeft - backgroundLeft
    let offsetLeftRatio = offsetLeft / backgroundWidth

    let offsetRight = elementRight - backgroundRight
    let offsetRightRatio = offsetRight / backgroundWidth

    let offsetTop = elementTop - backgroundTop
    let offsetTopRatio = offsetTop / backgroundHeight

    let offsetBottom = elementBottom - backgroundBottom
    let offsetBottomRatio = offsetBottom / backgroundHeight

    elementLeft > elementRight ? references.push('right') : references.push('left')

    elementTop > elementBottom ? references.push('bottom') : references.push('top')

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
  }
  document.onmouseup = function closeDragElement(event) {
    document.onmouseup = null;
    document.onmousemove = null;
    dragElement.style.cursor = 'default';
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

  // 对于图片元素，手动设置拖拽预览
  if (component instanceof HTMLImageElement) {
    // 方法1：使用原图片作为拖拽预览
    event.dataTransfer.setDragImage(component, offsetX, offsetY);
    // 或者方法2：设置图片URL数据，让浏览器生成预览
    //event.dataTransfer.setData('text/uri-list', src);
    //event.dataTransfer.setData('text/html', `<img src="${src}" width="${width}" height="${height}">`);
  }

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move';
}

const handleDropElement = async function (event) {

  event.preventDefault();

  const data = JSON.parse(event.dataTransfer.getData('text/plain'))

  const {settings: elementSettings, mouse: {offsetX, offsetY}} = data

  const factory = new DraggableElementFactory(elementSettings, metadataOptions.value);

  const dragElement = await factory.getElement();

  if (!dragElement) return;

  const canvas = CanvasManager.getCurrentCanvas();

  const imageElement = canvas.getImageElement();

  const canvasElement = imageElement.parentNode;

  const backgroundElement = canvasElement.querySelector('.image-background');

  const canvasRect = canvasElement.getBoundingClientRect();

  const mouseX = event.clientX;

  const mouseY = event.clientY;

  // 关键：将元素添加到容器
  canvasElement.appendChild(dragElement);

  const computedStyle = window.getComputedStyle(dragElement);
  let elementWidth = Number.parseFloat(computedStyle.width)
  let elementHeight = Number.parseFloat(computedStyle.height)

  const elementLeft = (mouseX - canvasRect.left - offsetX) / canvas.scale;
  const elementTop = (mouseY - canvasRect.top - offsetY) / canvas.scale;
  const elementRight = canvasElement.offsetWidth - elementLeft - elementWidth;
  const elementBottom = canvasElement.offsetHeight - elementTop - elementHeight

  // 设置元素定位
  dragElement.style.left = `${elementLeft}px`;
  dragElement.style.right = `${elementRight}px`;
  dragElement.style.top = `${elementTop}px`;
  dragElement.style.bottom = `${elementBottom}px`;

  const backgroundWidth = Number.parseFloat(backgroundElement.style.width);
  const backgroundHeight = Number.parseFloat(backgroundElement.style.height);
  const backgroundLeft = Number.parseFloat(backgroundElement.style.left);
  const backgroundRight = Number.parseFloat(backgroundElement.style.right);
  const backgroundTop = Number.parseFloat(backgroundElement.style.top);
  const backgroundBottom = Number.parseFloat(backgroundElement.style.bottom);

  let references = []

  let offsetLeft = elementLeft - backgroundLeft
  let offsetLeftRatio = offsetLeft / backgroundWidth

  let offsetRight = elementRight - backgroundRight
  let offsetRightRatio = offsetRight / backgroundWidth

  let offsetTop = elementTop - backgroundTop
  let offsetTopRatio = offsetTop / backgroundHeight

  let offsetBottom = elementBottom - backgroundBottom
  let offsetBottomRatio = offsetBottom / backgroundHeight

  elementLeft > elementRight ? references.push('right') : references.push('left')

  elementTop > elementBottom ? references.push('bottom') : references.push('top')

  const settings = elementSettings

  settings.references = references
  settings.offsetLeft = offsetLeft
  settings.offsetLeftRatio = offsetLeftRatio
  settings.offsetRight = offsetRight
  settings.offsetRightRatio = offsetRightRatio
  settings.offsetTop = offsetTop
  settings.offsetTopRatio = offsetTopRatio
  settings.offsetBottom = offsetBottom
  settings.offsetBottomRatio = offsetBottomRatio
  settings.tagName = dragElement.tagName.toLowerCase()
  settings.width = elementWidth
  settings.height = elementHeight

  if (dragElement instanceof HTMLImageElement) {
    settings.originalWidth = elementWidth
    settings.originalHeight = elementHeight
    settings.options.imageHeightRatio = elementHeight / backgroundHeight
    settings.options.imageWidthRatio = elementWidth / backgroundWidth
  } else {
    const fontSize = Number.parseInt(computedStyle.fontSize);
    settings.options.fontSizeRatio = fontSize / backgroundWidth
  }

  const elementMapping = (dragElement instanceof HTMLDivElement) ? canvas.settings.texts : canvas.settings.images;

  elementMapping.set(dragElement, settings)
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
  const target = event.target;
  if (target.getAttribute('id') !== 'preview-container') {
    // 阻止默认滚动行为
    event.preventDefault();
    // 根据滚轮方向确定缩放方向
    const direction = event.deltaY < 0 ? 'in' : 'out';
    zoom(direction);
  }
}

const bindEventListener = () => {

  document.querySelectorAll('.image-marks, .text-marks, .metadata').forEach(element => {
    element.addEventListener('dragstart', handleDragStart);
  });
  previewContainer.value.addEventListener('drop', handleDropElement);
  previewContainer.value.addEventListener('dragover', handleDragover);
  previewContainer.value.addEventListener('dragleave', handleDragleave);

  previewContainer.value.addEventListener('scroll', handleMoveScrollbar);
  previewList.value.addEventListener('keydown', handleSelectAllPreviewElements);

  previewContainer.value.addEventListener('mousedown', handleDragMoveElement);
  previewContainer.value.addEventListener('keydown', handleKeyDownMoveElement);
  previewContainer.value.addEventListener('keyup', handleKeyUpStopMoveElement);
  previewContainer.value.addEventListener('keydown', handleRemoveElement);
  previewContainer.value.addEventListener('click', handleCancelSelectedElement);
  previewContainer.value.addEventListener('dblclick', handleEditorElement);
  previewContainer.value.addEventListener('wheel', handleCanvasResize, {passive: false});
}

const unbindEventListener = () => {

  document.querySelectorAll('.image-marks, .text-marks, .metadata').forEach(element => {
    element.removeEventListener('dragstart', handleDragStart)
  });
  previewContainer.value.removeEventListener('drop', handleDropElement);
  previewContainer.value.removeEventListener('dragover', handleDragover);
  previewContainer.value.removeEventListener('dragleave', handleDragleave);

  previewContainer.value.removeEventListener('scroll', handleMoveScrollbar);
  previewList.value.removeEventListener('keydown', handleSelectAllPreviewElements);

  previewContainer.value.removeEventListener('mousedown', handleDragMoveElement);
  previewContainer.value.removeEventListener('keydown', handleKeyDownMoveElement);
  previewContainer.value.removeEventListener('keyup', handleKeyUpStopMoveElement);
  previewContainer.value.removeEventListener('keydown', handleRemoveElement);
  previewContainer.value.removeEventListener('click', handleCancelSelectedElement);
  previewContainer.value.removeEventListener('dblclick', handleEditorElement);
  previewContainer.value.removeEventListener('wheel', handleCanvasResize, {passive: false});
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
  bindEventListener()
  initCanvasSize()
})


onBeforeUnmount(() => {
  stopWatchAvailableCanvas()
  stopTextSettingsWatch()
  stopProjectSettingsWatch()
  stopImageBoxShadowWatch()
  stopWatchImageZIndex()
  stopImageAlphaWatch()
  stopImageScaleWatch()
  stopImageAngleWatch()
  unbindEventListener()
})


</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;
  border: 1px solid var(--border-color);

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
              height: 45px;
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
      box-sizing: border-box;
      overflow: auto;
      --canvas-width: 100vw;
      --canvas-height: 100vh;

      .canvas {
        width: var(--canvas-width);
        height: var(--canvas-height);
        position: relative;

        .image-background {
          overflow: hidden;
          position: absolute;
        }

        .image-background[blur-border]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backdrop-filter: blur(var(--blur-intensity, 10px));
        }

        img {
          position: absolute;
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
                height: 45px;
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
                border-top: 1px dashed #a2a4a6;
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
                  margin-top: 5px;

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
          margin-left: 15px;
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
        padding: 15px 20px 20px;
        margin: 30px 0;

        .border-label {
          position: absolute;
          top: -7px;
          left: 15px;
          background-color: var(--dialog-main-background-color);
          padding: 0 12px;
          font-size: 13px;
          color: #7c7b7b;
        }


        .items {
          width: 100%;

          .item {
            display: flex;
            align-items: center;
            margin: 8px;

            .label {
              width: 80px;
              text-align: right;
            }

            .value {
              width: 80%;
            }
          }
        }

        .options {
          width: 100%;

          .option {
            font-size: 13px;
            width: 100%;
            display: flex;
            align-items: center;
            height: 40px;

            .el-select {
              width: 155px !important;
            }

            .el-input {
              width: 155px;
            }

            .el-slider {
              --el-slider-button-size: 13px;
              --el-slider-height: 6px;
              width: 200px;

              .show-input {
                margin-right: 10px;
              }

              .el-slider__input {
                width: 85px;
              }
            }
          }
        }

      }
    }


  }
}


</style>
