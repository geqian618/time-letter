<template>
  <div>
    <div class="page-layout">
      <div class="page-top"></div>
      <div class="page-main">
        <div class="page-left">
          <el-aside>
            <el-scrollbar>
              <el-menu :default-openeds="['1']">
                <el-sub-menu index="1" class="templates-options">
                  <template #title>
                    <span>模版预设</span>
                  </template>
                  <div class="templates">
                    <el-menu-item
                        @contextmenu="openTemplateContextMenu(template)"
                        class="template" v-for="template in templates"
                        :key="template.id"
                        :index="template.id"
                        @click="openEnableTemplateDialog(template)">
                      {{ template.name }}
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
                          <img src="../assets/icon/text.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期" placement="top">
                        <div class="text-mark" draggable="true" type="date">
                          <img src="../assets/icon/date.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip class="box-item" effect="dark" content="日期时间" placement="top">
                        <div class="text-mark" draggable="true" type="datetime">
                          <img src="../assets/icon/datetime.svg">
                        </div>
                      </el-tooltip>
                      <el-tooltip v-for="(textLabel) in textLabels" :key="textLabel.id" class="box-item" effect="dark"
                                  :content="textLabel.tips" placement="top">
                        <div class="text-mark"
                             :id="textLabel.id"
                             draggable="true"
                             :text="textLabel.content"
                             :type="textLabel.type ==='text'?'text':'script'">
                          <img src="../assets/icon/custom.svg">
                        </div>
                      </el-tooltip>
                    </div>
                  </el-scrollbar>
                </el-sub-menu>
              </el-menu>
            </el-scrollbar>
          </el-aside>
        </div>

        <div class="page-center">
          <template v-for="([key, image]) in images" :key="image.path">
            <div class="preview-item" :path="image.path" v-show="image.visible" @contextmenu="openContextMenu">
              <img :src="image.url" :id="image.path">
            </div>
          </template>
        </div>
        <div class="page-right">
          <div class="settings-details">
            <el-aside>
              <el-scrollbar>
                <el-menu :default-openeds="['1']">
                  <el-sub-menu index="1">
                    <template #title>
                      <span>基本</span>
                    </template>
                    <ul class="options metadata">
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="cameraBrand">相机品牌</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.cameraBrand" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="cameraModel">相机型号</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.cameraModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="lensModel">镜头型号</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.lensModel" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="focalLength">焦段</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.focalLength" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="iso">IOS</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.iso" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="shutter">快门</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.shutter" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="aperture">光圈</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.aperture" size="small"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label text-mark" draggable="true" type="metadata" text="shootingTime">拍摄日期</div>
                        <div class="value">
                          <el-input v-model="settings.metadata.shootingTime" size="small"/>
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
                        <div class="label">边框数值</div>
                        <div class="value">
                          <el-select
                              @change="switchSliderRange"
                              v-model="settings.border.borderType"
                              :options="borderOptions"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">上边框</div>
                        <div class="value">
                          <el-slider @change="handleBorders"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="settings.border.borderTop"
                                     placement="top"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">左边框</div>
                        <div class="value">
                          <el-slider @change="handleBorders"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="settings.border.borderLeft"
                                     placement="top"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">右边框</div>
                        <div class="value">
                          <el-slider @change="handleBorders"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="settings.border.borderRight"
                                     placement="top"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">下边框</div>
                        <div class="value">
                          <el-slider @change="handleBorders"
                                     size="small"
                                     :min="sliderRange.min"
                                     :max="sliderRange.max"
                                     v-model="settings.border.borderBottom"
                                     placement="top"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">边框颜色</div>
                        <div class="value">
                          <el-color-picker
                              size="small"
                              @change="handleBorders"
                              v-model="settings.border.borderColor"
                              show-alpha
                              :predefine="predefineColors"/>
                        </div>
                      </li>
                    </ul>
                  </el-sub-menu>
                  <el-sub-menu index="3">
                    <template #title>
                      <span>文本</span>
                    </template>
                    <div class="group-title">基本</div>
                    <ul class="options">
                      <li class="option">
                        <div class="label">字体类型</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.fontFamily"
                              :options="fontOptions"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字体样式</div>
                        <div class="value">
                          <el-select
                              v-model="textOptions.fontStyle"
                              :options="[ {label:'正常', value:'normal'}, {label:'斜体', value:'italic'}, {label:'斜体（备用）', value:'oblique'} ]"
                              size="small"
                              placeholder="Select"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">字体大小</div>
                        <div class="value">
                          <el-slider
                              v-model="textOptions.fontSize"
                              show-alpha
                              size="small"
                              :predefine="predefineColors"/>
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
                              size="small"
                              :predefine="predefineColors"/>
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">旋转角度</div>
                        <div class="value">
                          <el-slider @change=""
                                     size="small"
                                     :min="0"
                                     :max="360"
                                     v-model="textOptions.angle"
                                     placement="top"/>
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

                      <li class="option">
                        <div class="label">层级</div>
                        <div class="value">
                          <el-slider :min="0"
                                     :max="100"
                                     size="small"
                                     v-model="textOptions.zIndex"
                                     placement="top"/>
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
                  <el-sub-menu index="4">
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
                        </div>
                      </li>
                      <li class="option">
                        <div class="label">旋转角度</div>
                        <div class="value">
                          <el-slider @change=""
                                     size="small"
                                     :min="0"
                                     :max="360"
                                     v-model="imageOptions.angle"
                                     placement="top"/>
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

      <div class="page-images" id="image-list" ref="imageList" @wheel="handleWheel" @contextmenu="openContextMenu">
        <img class="imageItem"
             :key="key"
             :path="key"
             v-lazy="image.url"
             v-for="([key, image]) in images"
             @click.meta.exact="handleMultipleSelect($event,image)"
             @click.ctrl.exact="handleMultipleSelect($event, image)"
             @click.shift.exact="handleShiftClick($event,image)"
             @click="handlePreview($event, image)">
      </div>
    </div>

    <el-dialog align-center v-model="customTextLabelDialogVisible" title="新增文本标签" width="500" draggable>
      <el-form :model="textLabel" ref="textLabelForm" :rules="textLabelRules" label-width="auto" style="max-width: 90%"
               @submit.native.prevent>
        <el-form-item label="文本类型" prop="type">
          <el-select @change="handleChangeTextType" v-model="textLabel.type" placeholder="文本类型">
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
        <el-form-item label="文本" prop="content">
          <el-input v-model="textLabel.content" :rows="4" type="textarea"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customTextLabelDialogVisible = false">取消</el-button>
          <el-button type="info" @click="saveNewTextLabel">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="saveTemplateDialogVisible" title="保存预设模版" align-center width="300" draggable>
      <el-form :model="newTemplate" class="demo-form-inline" :rules="saveTemplateRules" ref="saveTemplateForm"
               @submit.native.prevent>
        <el-form-item label="预设名称" prop="desc">
          <el-input v-model="newTemplate.desc"
                    ref="templateRef"
                    v-focus="saveTemplateDialogVisible"
                    placeholder="请输入预设名称"
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
      <el-form :model="oldTemplate" class="demo-form-inline">
        <el-form-item label="预设名称">
          <el-input v-model="oldTemplate.rename" placeholder="" clearable/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="renameDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="renameTemplate">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>


    <el-dialog v-model="editorTextLabelDialogVisible" title="编辑文本标签" width="60%" draggable>
      <el-table size="small" :data="textLabels" border style="width: 100%">
        <el-table-column prop="type" label="标签类型" show-overflow-tooltip/>
        <el-table-column prop="tips" label="提示信息" show-overflow-tooltip/>
        <el-table-column prop="content" label="文本内容" min-width="150" show-overflow-tooltip/>
        <el-table-column fixed="right" label="操作" min-width="100">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openEditorTextLabel(scope.row)">
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
      <el-progress :percentage="downloadProgressPercentage"/>
      <div class="fill"></div>
    </el-dialog>

    <el-dialog v-model="outputSettingsVisible"
               title="项目设置"
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
                           size="small"
                           style="width: 240px">
                  <el-option
                      v-for="item in outputSizeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <!--            <div class="option" v-show="[6,7].includes(projectSettings.outputSettings.outputSize.type)">-->
              <!--              <span>宽度：</span>-->
              <!--              <el-input v-model="projectSettings.outputSettings.outputSize.width" size="small"-->
              <!--                        placeholder="宽度"/>-->
              <!--              <span>px</span>-->
              <!--            </div>-->
              <!--            <div class="option" v-show="[6,7].includes(projectSettings.outputSettings.outputSize.type)">-->
              <!--              <span>高度：</span>-->
              <!--              <el-input v-model="projectSettings.outputSettings.outputSize.height" size="small"-->
              <!--                        placeholder="高度"/>-->
              <!--              <span>px</span>-->
              <!--            </div>-->
              <div class="option" v-show="[2,3].includes(projectSettings.outputSettings.outputSize.type)">
                <span>长边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.longSide"
                          size="small"
                          placeholder="长边"/>
                <span>px</span>
              </div>
              <div class="option" v-show="[4,5].includes(projectSettings.outputSettings.outputSize.type)">
                <span>短边尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.shortSide"
                          size="small"
                          placeholder="短边"/>
                <span>px</span>
              </div>
              <div class="option" v-show="[6,7].includes(projectSettings.outputSettings.outputSize.type)">
                <span>宽尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.width"
                          size="small"
                          placeholder="宽尺寸"/>
                <span>px</span>
              </div>
              <div class="option" v-show="[8,9].includes(projectSettings.outputSettings.outputSize.type)">
                <span>高尺寸：</span>
                <el-input v-model.number="projectSettings.outputSettings.outputSize.height"
                          size="small"
                          placeholder="高尺寸"/>
                <span>px</span>
              </div>
            </div>
          </div>
          <div class="border-box">
            <span class="border-label">图片设置</span>
            <div class="options">
              <div class="option">
                <span>输出格式：</span>
                <el-select v-model="projectSettings.outputSettings.extname"
                           size="small"
                           style="width: 240px">
                  <el-option
                      v-for="item in [{label:'原格式', value: 0}, {label:'JPEG', value:1}, {label:'PNG', value: 2}]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"/>
                </el-select>
              </div>
              <div class="option" v-show="projectSettings.outputSettings.extname === 1">
                <span>图片品质：</span>
                <div class="slider-demo-block">
                  <el-slider v-model="projectSettings.outputSettings.quality"
                             :min="1"
                             :max="10"
                             size="small"
                             show-input/>
                </div>
              </div>
            </div>
          </div>

          <!--        <div class="border-box">-->
          <!--          <span class="border-label">输出位置</span>-->
          <!--          <div class="options">-->
          <!--            <div class="option">-->
          <!--              <span>文件夹：{{ projectSettings.outputSettings.outputDirectory }}</span>-->
          <!--              <el-button size="small" type="info" @click="selectDirectory">选择</el-button>-->
          <!--            </div>-->
          <!--          </div>-->
          <!--        </div>-->
        </el-tab-pane>
        <el-tab-pane label="元信息格式">
          <div class="items">
            <div class="item">
              <span class="label">相机品牌：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.cameraBrand"></el-input>
            </div>
            <div class="item">
              <span class="label">相机型号：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.cameraModel"></el-input>
            </div>
            <div class="item">
              <span class="label">镜头型号：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.lensModel"></el-input>
            </div>
            <div class="item">
              <span class="label">焦段：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.focalLength"></el-input>
            </div>
            <div class="item">
              <span class="label">ISO：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.iso"></el-input>
            </div>
            <div class="item">
              <span class="label">快门：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.shutter"></el-input>
            </div>
            <div class="item">
              <span class="label">光圈：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.aperture"></el-input>
            </div>
            <div class="item">
              <span class="label">拍摄日期：</span>
              <el-input class="value" v-model="projectSettings.metadataFormats.shootingTime"></el-input>
            </div>
          </div>
          <div class="operation">
            <el-button type="info" @click="resetMetadataFormats">重置</el-button>
          </div>
        </el-tab-pane>
        <!--        <el-tab-pane label="边框"></el-tab-pane>-->
        <!--        <el-tab-pane label="文本"></el-tab-pane>-->
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

import {nextTick, onBeforeMount, onMounted, ref, watch, reactive} from "vue";

import {getDate, getDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {fontOptions} from '@/hook/font-options'

import _ from 'lodash';

import {projectSettings, outputSizeOptions, originalMetadataFormats} from '@/config/project-settings'


const predefineColors = ref([
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577',
])


const borderOptions = [
  {
    value: 0,
    label: '按固定值增减',
  },
  {
    value: 1,
    label: '按比例增减',
  }
]

const templateSettings = ref({})

const images = ref(new Map())

const imageList = ref(null);

const saveTemplateForm = ref();

const textLabelForm = ref();

const selectedElement = ref({
  element: null,
  path: ''
});

const selectedImages = ref(new Map())

const newTemplate = ref({
  desc: '',
})

const oldTemplate = ref({
  templateId: 0,
  rename: ''
})

const templates = ref([])


const textOptions = ref({
  fontSize: 14,
  fontFamily: 'Microsoft YaHei',
  fontStyle: 'normal',
  fontWeight: 400,
  fontColor: 'rgb(0,0,0,1)',
  tagBackground: 'rgb(255,255,255,0)',
  angle: 0,
  zIndex: 0,
  textShadow: {
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    offsetXRatio: 0,
    offsetYRatio: 0,
    blurRatio: 0,
    shadowColor: 'rgb(0,0,0,1)'
  }
})

const imageOptions = ref({
  scale: 10,
  angle: 0,
  alpha: 10,
  zIndex: 0,
  boxShadow: {
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    offsetXRatio: 0,
    offsetYRatio: 0,
    blurRatio: 0,
    shadowColor: 'rgb(0,0,0,1)',
  }
})

const dragParameters = {
  dragElement: null,
  originalElement: null,
  offsetX: 0,
  offsetY: 0
}

const settings = ref({
  outputDirectory: '',
  files: [],
  metadata: {
    cameraBrand: '',
    cameraModel: '',
    lensModel: '',
    focalLength: '',
    iso: '',
    shutter: '',
    aperture: '',
    shootingTime: ''
  },
  image: {
    path: '',
    url: '',
    positionX: 0,
    positionY: 0,
    offsetX: 0,
    offsetY: 0,
    width: 0,
    height: 0,
    references: [],
    synchronousMode: 0,
    options: {
      scale: 10,
      angle: 0,
      alpha: 10,
      zIndex: 0,
      boxShadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 0,
        offsetXRatio: 0,
        offsetYRatio: 0,
        blurRatio: 0,
        shadowColor: 'rgb(0,0,0,1)'
      }
    }
  },
  text: {
    type: 'text',
    expression: '',
    attribute: '',
    content: '',
    positionX: 0,
    positionY: 0,
    offsetX: 0,
    offsetY: 0,
    references: [],
    synchronousMode: 0,
    options: {
      fontSize: 14,
      fontFamily: '',
      fontColor: 'rgb(0,0,0,1)',
      tagBackground: 'rgb(255,255,255,0)',
      angle: 0,
      zIndex: 0,
      textShadow: {
        offsetX: 0,
        offsetY: 0,
        blur: 0,
        offsetXRatio: 0,
        offsetYRatio: 0,
        blurRatio: 0,
        shadowColor: 'rgb(0,0,0,1)'
      }
    }
  },
  border: {
    borderType: 0,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: 0,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
})

const sliderRange = ref({
  min: 0,
  max: 200
})

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

const downloadProgressPercentage = ref(0)

const switchElement = ref(true)

const synchronousMode = ref(0);

const textLabel = ref({
  id: '',
  tips: '',
  type: 'text',
  content: ''
})

const textLabels = ref([])

const templateRef = ref()

const textLabelRef = ref()

const saveTemplateRules = {
  desc: [
    {required: true, message: '模板名称不能为空', trigger: 'blur'},
  ],
}

const textLabelRules = {
  type: [
    {required: true, message: '文本标签类型不能为空', trigger: 'blur'},
  ],
  tips: [
    {required: true, message: '提示信息不能为空', trigger: 'blur'},
  ],
  content: [
    {required: true, message: '文本标签内容不能为空', trigger: 'blur'},
  ]
}

const watchInputImages = () => {
  window.electronAPI.watchInputImage(async (event, data) => {
    if (data) {
      for (let [path, item] of data) {
        if (!images.value.has(path)) {
          const image = {
            metadata: {
              cameraBrand: '',
              cameraModel: '',
              lensModel: '',
              focalLength: '',
              iso: '',
              shutter: '',
              aperture: '',
              shootingTime: ''
            },
            visible: false,
            element: null,
            render: false,
            isUpdate: false,
            settings: {
              border: {
                borderType: 0,
                borderLeft: 0,
                borderRight: 0,
                borderTop: 0,
                borderBottom: 0,
                borderLeftRatio: 0,
                borderRightRatio: 0,
                borderTopRatio: 0,
                borderBottomRatio: 0,
                borderColor: 'rgba(255, 255, 255, 1)',
              },
              texts: new Map(),
              images: new Map(),
            },
            getTargetElement() {
              if (!this.element) {
                this.element = document.getElementById(this.path)
              }
              return this.element
            }
          }
          const photoMetadata = await window.electronAPI.parsePhotoMetadata(path);
          if (photoMetadata && photoMetadata.base) {
            image.metadata = photoMetadata.base
          }
          images.value.set(path, {...image, ...item})
        }
      }

      nextTick(() => {
        images.value.forEach((image, path) => {
          if (!image.render) {
            const element = image.getTargetElement();
            bindDragEvent(element, image);
            image.render = true
          }
        })
      })
    }
  });
}

const switchSliderRange = () => {
  if (settings.value.border.borderType === 0) {
    sliderRange.value.max = 200
  } else {
    sliderRange.value.max = 25
  }
}

const selectDirectory = async () => {
  projectSettings.value.outputSettings.outputPath = await window.electronAPI.selectDirectory()
}

const openContextMenu = () => {
  if (images.value.size) {
    window.electronAPI.openContextMenu()
  }
}

const openTemplateContextMenu = ({id, name}) => {
  if (templates.value.length) {
    oldTemplate.value.templateId = id
    oldTemplate.value.rename = name
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

const handleDownloadProgressClose = () => {
  downloadProgressPercentage.value = 0
}

const watchEditorLabel = () => {
  window.electronAPI.watchEditorLabel(async (event, result) => {
    const {data, type} = result
    if (type === 0) {
      if (result.event === 0) {
        if (!imageLabels.value.size) {
          imageLabels.value = data;
        } else {
          for (let [key, item] of data) {
            if (!imageLabels.value.has(key)) {
              imageLabels.value.set(key, item)
              await nextTick()
              const element = imageMarks.value.querySelector(`[path="${key.replaceAll('\\', '\\\\')}"]`);
              handleDragStart(element)
            }
          }
        }
      } else if (result.event === 1) {
        imageLabels.value.delete(result.path)
      }
    } else if (type === 1) {
      openTextLabelDialog()
    } else if (type === 2) {
      editorImageLabelDialogVisible.value = true
    } else if (type === 3) {
      editorTextLabelDialogVisible.value = true
    }
  })
}


const openTextLabelDialog = () => {
  customTextLabelDialogVisible.value = true
  clearFormValidate(textLabelForm)
}


const clearFormValidate = (formRef) => {
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate(); // 清除整个表单的校验
      // 如果只需清除特定字段，可传入字段名数组，如：clearValidate(['username', 'email'])
    }
  });
}


const openEditorTextLabel = (row) => {
  textLabel.value = row
  customTextLabelDialogVisible.value = true
}

const deleteTextLabel = (row) => {
  for (let i = 0; i < textLabels.value.length; i++) {
    if (textLabels.value[i].id === row.id) {
      textLabels.value.splice(i, 1)
      window.localStorage.setItem('textLabels', JSON.stringify(textLabels.value))
      return
    }
  }
}

const saveNewTextLabel = async () => {
  if (!textLabelForm) return
  await textLabelForm.value.validate(async (valid, fields) => {
    if (valid) {
      if (!textLabel.value.id) {
        textLabel.value.id = Date.now() + ''
        textLabels.value.push(_.cloneDeep(textLabel.value))
        await nextTick()
        const element = textMarks.value.querySelector(`[id="${textLabel.value.id}"]`);
        handleDragStart(element)
      }
      window.localStorage.setItem('textLabels', JSON.stringify(textLabels.value))
      textLabel.value = {
        id: '',
        type: 'text',
        tips: '',
        content: '',
      }
      customTextLabelDialogVisible.value = false;
    }
  })
}

const watchContextMenu = () => {
  window.electronAPI.watchContextMenu(async (event, data) => {
    if (data) {
      const {type} = data;
      if (type === 0) {
        const selectedPaths = selectedImages.value.keys();
        for (let path of selectedPaths) {
          images.value.delete(path)
        }
        selectedImages.value.clear();
        // const beforePath = selectedElement.value.getAttribute('path');
        // if (!images.value.size || !images.value.has(beforePath)) {
        //   images.value.get(beforePath).visible = false
        // }
      } else if (type === 1) {

        const newSettings = []

        const paths = Array.from(selectedImages.value.keys());

        const currentSelectedElement = images.value.get(selectedElement.value.path);

        let beforeElement = currentSelectedElement;

        for (let i = 0; i < paths.length; i++) {

          const nextElement = images.value.get(paths[i]);

          beforeElement.visible = false

          await nextTick()

          nextElement.visible = true

          await nextTick()

          if (nextElement.isUpdate) {
            refreshTemplate(paths[i])
          } else {
            renderBorders(paths[i])
          }

          await nextTick()

          const image = images.value.get(paths[i]);

          const {settings} = image

          const {height, width} = image.getTargetElement().getBoundingClientRect();

          const textList = Array.from(settings.texts.values()).map(item => {
            item.options.fontSizeRatio = item.options.fontSize / width
            return item
          });

          const imageList = Array.from(settings.images.values()).map(item => {
            item.options.imageWidthRatio = item.width / width
            item.options.imageHeightRatio = item.height / height
            return item
          });

          newSettings.push({
            path: paths[i],
            projectSettings: projectSettings.value,
            outputDirectory: data.outputDirectory,
            settings: {
              border: settings.border,
              texts: textList,
              images: imageList
            }
          })

          if (i === paths.length - 1) {
            nextElement.visible = false
            await nextTick();
          } else {
            beforeElement = nextElement;
          }
        }
        currentSelectedElement.visible = true
        window.electronAPI.requestSaveFiles(JSON.parse(JSON.stringify(newSettings)))
        downloadProgressVisible.value = true
      } else if (type === 2) {
        openSaveTemplateDialog()
      } else if (type === 3) {
        synchronousMode.value = data.method
        synchronizeTemplate()
      } else if (type === 4) {
        const paths = Array.from(selectedImages.value.keys());
        paths.forEach(path => clearAllLabels(path))
      } else if (type === 5) {
        const paths = Array.from(selectedImages.value.keys());
        paths.forEach(path => reset(path))
      }
    }
  });
}

const reset = (path) => {
  const image = clearAllLabels(path);
  image.settings.border = {
    borderType: 0,
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: 0,
    borderColor: 'rgba(255, 255, 255, 1)'
  }
  renderBorders(path)
}

const resetMetadataFormats = () => {
  projectSettings.value.metadataFormats = originalMetadataFormats
  localStorage.setItem('projectSettings', JSON.stringify(projectSettings.value))
}


const clearAllLabels = (path) => {
  const image = images.value.get(path);
  for (let element of image.settings.images.keys()) {
    element.remove()
  }
  for (let element of image.settings.texts.keys()) {
    element.remove()
  }
  image.settings.texts.clear()
  image.settings.images.clear()
  return image
}

const watchCtrlA = () => {
  window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      if (selectedImages.value.size) {
        const elements = document.querySelectorAll('img.imageItem');
        elements.forEach(element => {
          element.classList.add('active');
          selectedImages.value.set(element.getAttribute('path'), element)
        })
      }
    }
  });
}

// 处理 resize 事件（添加防抖优化性能）
const handleResize = () => {
  let resizeTimer;
  // 添加 resize 事件监听
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      images.value.forEach((image, path) => {
        const imageLabels = image.settings.images;
        const textLabels = image.settings.texts;
        const parentRect = image.getTargetElement().parentNode.getBoundingClientRect();
        const {width, left, right, bottom, top, height} = image.getTargetElement().getBoundingClientRect();
        if (imageLabels.size) {
          imageLabels.forEach((items, element) => {

            let {positionX, positionY, references} = items

            let newPositionX, newPositionY

            if (references.includes('left')) {
              newPositionX = left - parentRect.left + width * positionX;
              element.style.removeProperty('right')
              element.style.left = newPositionX + 'px'
            }

            if (references.includes('right')) {
              newPositionX = parentRect.right - right + width * positionX;
              element.style.removeProperty('left')
              element.style.right = newPositionX + 'px'
            }

            if (references.includes('top')) {
              newPositionY = top - parentRect.top + height * positionY;
              element.style.removeProperty('bottom')
              element.style.top = newPositionY + 'px'
            }

            if (references.includes('bottom')) {
              newPositionY = parentRect.bottom - bottom + height * positionY;
              element.style.removeProperty('top')
              element.style.bottom = newPositionY + 'px';
            }
          })
        }
        if (textLabels.size) {
          textLabels.forEach((items, element) => {

            let {positionX, positionY, references} = items

            let newPositionX, newPositionY

            if (references.includes('left')) {
              newPositionX = left - parentRect.left + width * positionX;
              element.style.removeProperty('right')
              element.style.left = newPositionX + 'px'
            }

            if (references.includes('right')) {
              newPositionX = parentRect.right - right + width * positionX;
              element.style.removeProperty('left')
              element.style.right = newPositionX + 'px'
            }

            if (references.includes('top')) {
              newPositionY = top - parentRect.top + height * positionY;
              element.style.removeProperty('bottom')
              element.style.top = newPositionY + 'px'
            }

            if (references.includes('bottom')) {
              newPositionY = parentRect.bottom - bottom + height * positionY;
              element.style.removeProperty('top')
              element.style.bottom = newPositionY + 'px';
            }
          })
        }

        if (textLabels.size || imageLabels.size) {
          handleBorders()
        }
      })
    }, 0); // 200ms 防抖间隔
  });

}


const stopTextProjectSettingsWatch = watch(projectSettings, (newVal, oldVal) => {
  localStorage.setItem('projectSettings', JSON.stringify(newVal))
}, {
  //深度监视（监视属性变化）
  deep: true,
  //immediate 立即触发一次监视
  //immediate: true
});

const loadProjectSettings = () => {
  const jsonStr = localStorage.getItem('projectSettings');
  if (jsonStr) {
    projectSettings.value = JSON.parse(jsonStr)
  }
}


const stopTextSettingsWatch = watch(textOptions, async (newVal, oldVal) => {
  //停止监听 stopWatch();
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const parentNode = image.getTargetElement().parentNode;
  const containerRect = image.getTargetElement().getBoundingClientRect();
  const elements = parentNode.querySelectorAll('.text-mark');
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {

      element.style.fontStyle = newVal.fontStyle
      element.style.fontWeight = newVal.fontWeight
      element.style.fontFamily = newVal.fontFamily
      element.style.fontSize = newVal.fontSize + 'px'
      element.style.color = newVal.fontColor
      element.style.background = newVal.tagBackground
      element.style.transformOrigin = 'center center'
      element.style.transform = `rotate(${newVal.angle}deg)`
      const {textShadow: {offsetX, offsetY, blur, shadowColor}} = newVal;
      element.style.textShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

      await nextTick()

      const dragElementRect = element.getBoundingClientRect();

      const heightCutLine = containerRect.top + containerRect.height / 2;

      const widthCutLine = containerRect.left + containerRect.width / 2;

      let positionX;

      let positionY;

      let positionOffsetX;

      let positionOffsetY;

      let references = []

      if (dragElementRect.left > widthCutLine) {
        references.push('right')
        positionOffsetX = containerRect.right - dragElementRect.left - dragElementRect.width
        positionX = positionOffsetX / containerRect.width
      } else {
        references.push('left')
        positionOffsetX = dragElementRect.left - containerRect.left
        positionX = positionOffsetX / containerRect.width;
      }

      if (dragElementRect.top > heightCutLine) {
        references.push('bottom')
        positionOffsetY = containerRect.bottom - dragElementRect.top - dragElementRect.height
        positionY = positionOffsetY / containerRect.height;
      } else {
        references.push('top')
        positionOffsetY = dragElementRect.top - containerRect.top
        positionY = positionOffsetY / containerRect.height;
      }

      image.settings.texts.get(element).options = _.cloneDeep(newVal)
      image.settings.texts.get(element).references = references
      image.settings.texts.get(element).positionX = positionX
      image.settings.texts.get(element).positionY = positionY
      image.settings.texts.get(element).options.fontSizeRatio = newVal.fontSize / containerRect.width
      image.settings.texts.get(element).options.textShadow.offsetXRatio = newVal.textShadow.offsetX / newVal.fontSize
      image.settings.texts.get(element).options.textShadow.offsetYRatio = newVal.textShadow.offsetY / newVal.fontSize
      image.settings.texts.get(element).options.textShadow.blurRatio = newVal.textShadow.blur / newVal.fontSize
    }
  }
}, {
  //深度监视（监视属性变化）
  deep: true,
  //immediate 立即触发一次监视
  //immediate: true
});

const stopImageAngleWatch = watch(() => imageOptions.value.angle, (newVal, oldVal) => {
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const elements = Array.from(image.settings.images.keys());
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {
      image.settings.images.get(element).options.angle = newVal
      element.style.transformOrigin = 'center center'
      element.style.transform = `rotate(${newVal}deg)`;
    }
  }
});

const stopImageAlphaWatch = watch(() => imageOptions.value.alpha, (newVal, oldVal) => {
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const elements = Array.from(image.settings.images.keys());
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {
      image.settings.images.get(element).options.alpha = newVal
      element.style.opacity = newVal / 10
    }
  }
});

const stopImageBoxShadowWatch = watch(() => imageOptions.value.boxShadow, (newVal, oldVal) => {
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const elements = Array.from(image.settings.images.keys());
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {
      const {offsetX, offsetY, blur, shadowColor} = newVal;
      element.style.boxShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`
      const {width} = element.getBoundingClientRect();
      image.settings.images.get(element).options.boxShadow = _.cloneDeep(newVal)
      image.settings.images.get(element).options.boxShadow.offsetXRatio = offsetX / width
      image.settings.images.get(element).options.boxShadow.offsetYRatio = offsetY / width
      image.settings.images.get(element).options.boxShadow.blurRatio = blur / width
    }
  }
}, {
  //深度监视（监视属性变化）
  deep: true,
  //immediate 立即触发一次监视
  //immediate: true
})


const stopImageScaleWatch = watch(() => imageOptions.value.scale, (newVal, oldVal) => {
  if (switchElement.value) {
    switchElement.value = false;
    return
  }
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const containerRect = image.getTargetElement().getBoundingClientRect();
  const parentRect = image.getTargetElement().parentNode.getBoundingClientRect();
  const elements = Array.from(image.settings.images.keys());
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {

      const {width, height, left, top} = element.getBoundingClientRect();

      const scale = (newVal - oldVal) / 10;

      const newWidth = width + width * scale
      const newHeight = height + height * scale
      const newLeft = left - parentRect.left - width * scale / 2
      const newTop = top - parentRect.top - height * scale / 2

      element.style.width = newWidth + 'px'
      element.style.height = newHeight + 'px'
      element.style.left = newLeft + 'px'
      element.style.top = newTop + 'px'

      const heightCutLine = containerRect.top + containerRect.height / 2;

      const widthCutLine = containerRect.left + containerRect.width / 2;

      let positionX;

      let positionY;

      let positionOffsetX;

      let positionOffsetY;

      let references = []

      const dragElementRect = element.getBoundingClientRect();

      if (dragElementRect.left > widthCutLine) {
        references.push('right')
        positionOffsetX = containerRect.right - dragElementRect.left - dragElementRect.width
        positionX = positionOffsetX / containerRect.width
      } else {
        references.push('left')
        positionOffsetX = dragElementRect.left - containerRect.left
        positionX = positionOffsetX / containerRect.width;
      }

      if (dragElementRect.top > heightCutLine) {
        references.push('bottom')
        positionOffsetY = containerRect.bottom - dragElementRect.top - dragElementRect.height
        positionY = positionOffsetY / containerRect.height;
      } else {
        references.push('top')
        positionOffsetY = dragElementRect.top - containerRect.top
        positionY = positionOffsetY / containerRect.height;
      }


      image.settings.images.get(element).options.scale = newVal
      image.settings.images.get(element).positionX = positionX
      image.settings.images.get(element).positionY = positionY
      image.settings.images.get(element).offsetX = positionOffsetX
      image.settings.images.get(element).offsetY = positionOffsetY
      image.settings.images.get(element).references = references
      image.settings.images.get(element).width = newWidth
      image.settings.images.get(element).height = newHeight
      image.settings.images.get(element).options.imageWidthRatio = newWidth / containerRect.width
      image.settings.images.get(element).options.imageHeightRatio = newHeight / containerRect.height

    }
  }
});


const stopWatchImageZIndex = watch(() => imageOptions.value.zIndex, (newVal, oldVal) => {
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const elements = Array.from(image.settings.images.keys());
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {
      element.style.zIndex = newVal
      image.settings.images.get(element).options.zIndex = newVal;
    }
  }
})

const stopWatchPhotoMetadata = watch(() => settings.value.metadata, (newVal, oldVal) => {
  const path = selectedElement.value.path;
  images.value.get(path).metadata = _.cloneDeep(newVal)
}, {
  //深度监视（监视属性变化）
  deep: true,
})


const openSaveTemplateDialog = () => {
  saveTemplateDialogVisible.value = true
  clearFormValidate(saveTemplateForm)
}


const renameTemplate = () => {
  if (templates.value && templates.value.length) {
    for (let i = 0; i < templates.value.length; i++) {
      if (templates.value[i].id === oldTemplate.value.templateId) {
        templates.value[i].name = oldTemplate.value.rename
        window.localStorage.setItem('templates', JSON.stringify(templates.value))
        renameDialogVisible.value = false
        return
      }
    }
  }
}

const deleteTemplate = () => {
  if (templates.value && templates.value.length) {
    for (let i = 0; i < templates.value.length; i++) {
      if (templates.value[i].id === oldTemplate.value.templateId) {
        templates.value.splice(i, 1)
        window.localStorage.setItem('templates', JSON.stringify(templates.value))
        return
      }
    }
  }
}

const synchronizeTemplate = () => {
  if (selectedElement.value) {
    const targetPath = selectedElement.value.path;
    const targetSettings = images.value.get(targetPath).settings;

    const options = {
      border: targetSettings.border,
      images: Array.from(targetSettings.images.values()).map(item => {
        item.synchronousMode = synchronousMode.value
        return item
      }),
      texts: Array.from(targetSettings.texts.values()).map(item => {
        item.synchronousMode = synchronousMode.value
        return item
      })
    }

    selectedImages.value.forEach((image, path) => {
      if (targetPath !== path) {
        const image = images.value.get(path);
        for (let element of image.settings.images.keys()) {
          element.remove()
        }
        for (let element of image.settings.texts.keys()) {
          element.remove()
        }
        image.settings.border = {}
        image.settings.texts.clear()
        image.settings.images.clear()
        console.log(options)
        useTemplate(_.cloneDeep(options), path)
      }
    })
  }
}

const saveTemplates = async () => {
  if (!saveTemplateForm) return
  await saveTemplateForm.value.validate((valid, fields) => {
    if (valid) {
      const {settings} = images.value.get(selectedElement.value.path);
      const json = window.localStorage.getItem('templates');
      const templateList = json ? JSON.parse(json) : []
      templateList.push({
        id: Date.now(),
        name: newTemplate.value.desc,
        settings: {
          border: settings.border,
          images: Array.from(settings.images.values()),
          texts: Array.from(settings.texts.values())
        }
      })
      templates.value = templateList
      window.localStorage.setItem('templates', JSON.stringify(templateList))

      newTemplate.value.desc = ''
      saveTemplateDialogVisible.value = false
    }
  })
}


const openEnableTemplateDialog = ({settings}) => {
  if (images.value.size && selectedElement.value.path) {
    templateSettings.value = settings
    enableTemplateDialogVisible.value = true
  }
}


const enableTemplate = () => {
  for (let path of selectedImages.value.keys()) {
    const image = images.value.get(path);
    for (let element of image.settings.images.keys()) {
      element.remove()
    }
    for (let element of image.settings.texts.keys()) {
      element.remove()
    }
    image.settings.border = {}
    image.settings.texts.clear()
    image.settings.images.clear()
    templateSettings.value.texts.forEach(item => item.synchronousMode = synchronousMode.value)
    templateSettings.value.images.forEach(item => item.synchronousMode = synchronousMode.value)
    useTemplate(templateSettings.value, path)
  }
  enableTemplateDialogVisible.value = false
  synchronousMode.value = 0
}


const useTemplate = async (options, path) => {

  options = _.cloneDeep(options)

  const imageDetails = images.value.get(path);

  imageDetails.isUpdate = true

  imageDetails.settings.border = options.border

  if (path === selectedElement.value.path) {
    renderBorders(path)
  }

  const previewImage = imageDetails.getTargetElement();

  const parentNode = previewImage.parentNode;

  const parentRect = parentNode.getBoundingClientRect();

  const {left, right, top, bottom, width, height} = previewImage.getBoundingClientRect();

  for (let image of options.images) {
    const img = document.createElement('img');
    img.style.outline = 'none';
    img.style.cursor = 'move';
    img.style.userSelect = 'none';
    img.setAttribute('tabindex', '0')
    img.src = image.url
    img.setAttribute('path', image.path)
    img.className = 'image-mark'
    // 关键：必须设为绝对定位
    img.style.position = 'absolute';
    img.style.width = image.width + 'px';
    img.style.width = image.width + 'px';
    img.style.height = image.height + 'px'
    img.style.opacity = image.alpha / 10
    const {boxShadow: {offsetX, offsetY, blur, shadowColor}} = image.options;
    img.style.boxShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

    if (path === selectedElement.value.path) {
      let {positionX, positionY, offsetX, offsetY, synchronousMode} = image
      let newPositionX, newPositionY, newOffsetX, newOffsetY
      newOffsetX = synchronousMode === 1 ? positionX * width : offsetX;
      newOffsetY = synchronousMode === 1 ? positionY * height : offsetY;

      if (image.references.includes('left')) {
        newPositionX = left - parentRect.left + newOffsetX
        img.style.left = `${newPositionX}px`;
      }

      if (image.references.includes('right')) {
        newPositionX = parentRect.right - right + newOffsetX
        img.style.right = `${newPositionX}px`;
      }

      if (image.references.includes('top')) {
        newPositionY = top - parentRect.top + newOffsetY
        img.style.top = `${newPositionY}px`;
      }

      if (image.references.includes('bottom')) {
        newPositionY = parentRect.bottom - bottom + newOffsetY
        img.style.bottom = `${newPositionY}px`;
      }
    }

    parentNode.appendChild(img)

    imageDetails.settings.images.set(img, image)

    makeDraggable(img, path)
  }

  for (let text of options.texts) {
    const div = document.createElement('div');
    div.style.width = 'fit-content'
    div.style.height = 'fit-content'
    div.style.lineHeight = '1em'
    div.style.whiteSpace = 'nowrap'
    div.style.fontSize = text.options.fontSize + 'px'
    div.style.color = text.options.fontColor
    div.style.fontFamily = text.options.fontFamily
    div.style.fontStyle = text.options.fontStyle
    div.style.fontWeight = text.options.fontWeight
    const {textShadow: {offsetX, offsetY, blur, shadowColor}} = text.options;
    div.style.textShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`
    div.className = 'text-mark'
    const type = text.type;
    if (type === 'date') {
      const content = getDate()
      div.innerHTML = text.content = content
    } else if (type === 'datetime') {
      const content = getDateTime();
      div.innerHTML = text.content = content
    } else if (type === 'script') {
      const content = executeFunctionScript(text.expression)
      div.innerHTML = text.content = content
    } else if (type === 'metadata') {
      const attribute = text.attribute;
      let content = imageDetails.metadata[attribute];
      if (!content) {
        continue
      }
      const format = projectSettings.value.metadataFormats[attribute]
      if (format) {
        content = format.replace('${' + attribute + '}', content)
      }
      div.innerHTML = text.content = content;
    } else {
      div.innerHTML = text.content;
    }
    div.style.outline = 'none';
    div.style.cursor = 'move';
    div.style.userSelect = 'none';
    div.setAttribute('tabindex', '0')

    // 关键：必须设为绝对定位
    div.style.position = 'absolute';

    if (path === selectedElement.value.path) {
      let {positionX, positionY, offsetX, offsetY, synchronousMode} = text
      let newPositionX, newPositionY, newOffsetX, newOffsetY
      newOffsetX = synchronousMode === 1 ? positionX * width : offsetX;
      newOffsetY = synchronousMode === 1 ? positionY * height : offsetY;
      if (text.references.includes('left')) {
        newPositionX = left - parentRect.left + newOffsetX
        div.style.left = `${newPositionX}px`;
      }

      if (text.references.includes('right')) {
        newPositionX = parentRect.right - right + newOffsetX
        div.style.right = `${newPositionX}px`;
      }

      if (text.references.includes('top')) {
        newPositionY = top - parentRect.top + newOffsetY
        div.style.top = `${newPositionY}px`;
      }

      if (text.references.includes('bottom')) {
        newPositionY = parentRect.bottom - bottom + newOffsetY
        div.style.bottom = `${newPositionY}px`;
      }

    }
    parentNode.appendChild(div)

    imageDetails.settings.texts.set(div, text)

    makeDraggable(div, path)

  }

}


const refreshPositionInformation = (path) => {

  const image = images.value.get(path);

  const previewImage = image.getTargetElement();

  const containerRect = previewImage.getBoundingClientRect();

  const heightCutLine = containerRect.top + containerRect.height / 2;

  const widthCutLine = containerRect.left + containerRect.width / 2;

  image.settings.texts.forEach((textLabel, element) => {

    let positionX, positionY

    let positionOffsetX, positionOffsetY

    const elementRect = element.getBoundingClientRect();

    let references = []

    if (elementRect.left > widthCutLine) {
      references.push('right')
      positionOffsetX = containerRect.right - elementRect.left - elementRect.width
      positionX = positionOffsetX / containerRect.width
    } else {
      references.push('left')
      positionOffsetX = elementRect.left - containerRect.left
      positionX = positionOffsetX / containerRect.width;
    }

    if (elementRect.top > heightCutLine) {
      references.push('bottom')
      positionOffsetY = containerRect.bottom - elementRect.top - elementRect.height
      positionY = positionOffsetY / containerRect.height;
    } else {
      references.push('top')
      positionOffsetY = elementRect.top - containerRect.top
      positionY = positionOffsetY / containerRect.height;
    }

    textLabel.references = references
    textLabel.positionX = positionX
    textLabel.positionY = positionY
    textLabel.offsetX = positionOffsetX
    textLabel.offsetY = positionOffsetY

  })

  image.settings.images.forEach((imageLabel, element) => {

    let positionX, positionY

    let positionOffsetX, positionOffsetY

    const elementRect = element.getBoundingClientRect();

    let references = []

    if (elementRect.left > widthCutLine) {
      references.push('right')
      positionOffsetX = containerRect.right - elementRect.left - elementRect.width
      positionX = positionOffsetX / containerRect.width
    } else {
      references.push('left')
      positionOffsetX = elementRect.left - containerRect.left
      positionX = positionOffsetX / containerRect.width;
    }

    if (elementRect.top > heightCutLine) {
      references.push('bottom')
      positionOffsetY = containerRect.bottom - elementRect.top - elementRect.height
      positionY = positionOffsetY / containerRect.height;
    } else {
      references.push('top')
      positionOffsetY = elementRect.top - containerRect.top
      positionY = positionOffsetY / containerRect.height;
    }

    imageLabel.references = references
    imageLabel.positionX = positionX
    imageLabel.positionY = positionY
    imageLabel.offsetX = positionOffsetX
    imageLabel.offsetY = positionOffsetY

  })
}


const refreshTemplate = async (path) => {

  const image = images.value.get(path);

  settings.value.border = image.settings.border

  renderBorders(path)

  await nextTick()

  const previewImage = image.getTargetElement();

  const parentRect = previewImage.parentNode.getBoundingClientRect();

  const {left, right, top, bottom, width, height} = previewImage.getBoundingClientRect();

  image.settings.texts.forEach((text, element) => {

    let {positionX, positionY, offsetX, offsetY, synchronousMode} = text
    let newPositionX, newPositionY, newOffsetX, newOffsetY
    newOffsetX = synchronousMode === 1 ? positionX * width : offsetX;
    newOffsetY = synchronousMode === 1 ? positionY * height : offsetY;

    if (text.references.includes('left')) {
      newPositionX = left - parentRect.left + newOffsetX
      element.style.left = `${newPositionX}px`;
    }

    if (text.references.includes('right')) {
      newPositionX = parentRect.right - right + newOffsetX
      element.style.right = `${newPositionX}px`;
    }

    if (text.references.includes('top')) {
      newPositionY = top - parentRect.top + newOffsetY
      element.style.top = `${newPositionY}px`;
    }

    if (text.references.includes('bottom')) {
      newPositionY = parentRect.bottom - bottom + newOffsetY
      element.style.bottom = `${newPositionY}px`;
    }

  })

  image.settings.images.forEach((image, element) => {
    let {positionX, positionY, offsetX, offsetY, synchronousMode} = image
    let newPositionX, newPositionY, newOffsetX, newOffsetY
    newOffsetX = synchronousMode === 1 ? positionX * width : offsetX;
    newOffsetY = synchronousMode === 1 ? positionY * height : offsetY;

    if (image.references.includes('left')) {
      newPositionX = left - parentRect.left + newOffsetX
      element.style.left = `${newPositionX}px`;
    }

    if (image.references.includes('right')) {
      newPositionX = parentRect.right - right + newOffsetX
      element.style.right = `${newPositionX}px`;
    }

    if (image.references.includes('top')) {
      newPositionY = top - parentRect.top + newOffsetY
      element.style.top = `${newPositionY}px`;
    }

    if (image.references.includes('bottom')) {
      newPositionY = parentRect.bottom - bottom + newOffsetY
      element.style.bottom = `${newPositionY}px`;
    }

  })

  refreshPositionInformation(path)

  image.isUpdate = false
}


const loadTemplates = () => {
  const jsonStr = window.localStorage.getItem('templates');
  templates.value = jsonStr ? JSON.parse(jsonStr) : []
}

const loadTextLabels = () => {
  const jsonStr = window.localStorage.getItem('textLabels');
  textLabels.value = jsonStr ? JSON.parse(jsonStr) : []
}

const handleChangeTextType = () => {
  textLabel.value.content = textLabel.value.type === 'text'
      ? ''
      : 'function extendScript() {\n' +
      '  return Date.now();\n' +
      '}'
}

onMounted(() => {
  loadTemplates()
  loadTextLabels()
  watchInputImages()
  watchContextMenu()
  watchTemplateContextMenu()
  watchEditorLabel()
  watchCtrlA()
  watchDownloadProgress()
  editorOutputSettings()
  handleResize()
  loadProjectSettings()
})

onBeforeMount(() => {
  // 组件销毁前移除监听，避免内存泄漏
  window.removeEventListener("resize", handleResize);
})

async function handlePreview(event, image) {
  if (!event.ctrlKey && !event.shiftKey) {
    if (selectedImages.value && !selectedImages.value.size) {
      selectedElement.value.element = event.target;
      selectedElement.value.path = event.target.getAttribute('path')
    } else if (selectedImages.value && selectedImages.value.size === 1) {
      if (selectedElement.value.path) {
        const beforePath = selectedElement.value.path;
        selectedImages.value.delete(beforePath);
        selectedElement.value.element.classList.remove('active')
        images.value.get(beforePath).visible = false
        selectedElement.value.element = event.target;
        selectedElement.value.path = event.target.getAttribute('path');
      }
    } else {
      if (!selectedImages.value.has(image.path)) {
        const selectedElements = selectedImages.value.values();
        for (let element of selectedElements) {
          element.classList.remove('active')
        }
        selectedImages.value.clear()
      }
      const beforePath = selectedElement.value.path;
      images.value.get(beforePath).visible = false
      selectedElement.value.element = event.target;
      selectedElement.value.path = event.target.getAttribute('path')
      images.value.get(image.path).visible = true
    }

    if (!selectedImages.value.has(image.path)) {
      selectedImages.value.set(image.path, event.target)
      event.target.classList.add('active')
    }

    image.visible = true;

    if (image.isUpdate) {
      await nextTick(() => {
        refreshTemplate(image.path)
      })
    } else {
      settings.value.border = image.settings.border
    }
    settings.value.metadata = image.metadata
  }
}


const handleMultipleSelect = (event, image) => {
  const element = event.target;
  if (element.classList.contains('active')) {
    element.classList.remove('active');
    selectedImages.value.delete(image.path)
  } else {
    element.classList.add('active');
    selectedImages.value.set(image.path, element)
  }
}


const handleShiftClick = (event, image) => {
  if (selectedImages.value.size) {
    const elements = document.documentElement.querySelectorAll('img.imageItem');
    const path = image.path;
    let index = -1;
    const beforeElements = [];
    const afterElements = [];
    for (let i = 0; i < elements.length; i++) {
      const originalElement = elements[i];
      const active = originalElement.classList.contains('active');
      if (path === originalElement.getAttribute('path')) {
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
            selectedImages.value.set(original.getAttribute('path'), original)
          }
        }
        for (let afterElement of afterElements) {
          const original = afterElement.originalElement;
          if (afterElement.active) {
            selectedImages.value.delete(original.getAttribute('path'))
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
            selectedImages.value.set(original.getAttribute('path'), original)
          }
        }
        return
      }
    }

  }
}


const handleBorders = async () => {

  const image = images.value.get(selectedElement.value.path)

  const targetElement = image.getTargetElement();

  if (targetElement && targetElement.complete && targetElement.naturalWidth > 0) {

    const {borderLeft, borderRight, borderTop, borderBottom, borderColor, borderType} = settings.value.border;

    let borderLeftWidth, borderRightWidth, borderTopHeight, borderBottomHeight;

    if (borderType === 0) {
      borderLeftWidth = borderLeft
      borderRightWidth = borderRight
      borderTopHeight = borderTop
      borderBottomHeight = borderBottom
    } else {
      const {offsetWidth, offsetHeight} = targetElement;
      const baseLength = Math.max(offsetWidth, offsetHeight);
      borderLeftWidth = baseLength * borderLeft / 100;
      borderRightWidth = baseLength * borderRight / 100;
      borderTopHeight = baseLength * borderTop / 100;
      borderBottomHeight = baseLength * borderBottom / 100;
    }

    targetElement.style.borderLeft = `${borderLeftWidth}px solid ${borderColor}`
    targetElement.style.borderRight = `${borderRightWidth}px solid ${borderColor}`
    targetElement.style.borderTop = `${borderTopHeight}px solid ${borderColor}`
    targetElement.style.borderBottom = `${borderBottomHeight}px solid ${borderColor}`

    const {clientWidth, clientHeight} = targetElement;

    image.settings.border = _.cloneDeep(settings.value.border)
    image.settings.border.borderLeftRatio = borderLeftWidth / clientWidth
    image.settings.border.borderRightRatio = borderRightWidth / clientWidth
    image.settings.border.borderTopRatio = borderTopHeight / clientHeight
    image.settings.border.borderBottomRatio = borderBottomHeight / clientHeight

    await nextTick()

    refreshPositionInformation(selectedElement.value.path)

  }
}


const renderBorders = (path) => {

  const image = images.value.get(path)

  const targetElement = image.getTargetElement();

  if (image.path === selectedElement.value.path) {
    settings.value.border = image.settings.border
  }

  if (targetElement && targetElement.complete && targetElement.naturalWidth > 0) {

    const {borderLeft, borderRight, borderTop, borderBottom, borderColor, borderType} = image.settings.border;

    let borderLeftWidth, borderRightWidth, borderTopHeight, borderBottomHeight;

    if (borderType === 0) {
      borderLeftWidth = borderLeft
      borderRightWidth = borderRight
      borderTopHeight = borderTop
      borderBottomHeight = borderBottom
    } else {
      const {offsetWidth, offsetHeight} = targetElement;
      const baseLength = Math.max(offsetWidth, offsetHeight);
      borderLeftWidth = baseLength * borderLeft / 100;
      borderRightWidth = baseLength * borderRight / 100;
      borderTopHeight = baseLength * borderTop / 100;
      borderBottomHeight = baseLength * borderBottom / 100;
    }

    targetElement.style.borderLeft = `${borderLeftWidth}px solid ${borderColor}`
    targetElement.style.borderRight = `${borderRightWidth}px solid ${borderColor}`
    targetElement.style.borderTop = `${borderTopHeight}px solid ${borderColor}`
    targetElement.style.borderBottom = `${borderBottomHeight}px solid ${borderColor}`

    const {clientWidth, clientHeight} = targetElement;

    // image.settings.border = _.cloneDeep(settings.value.border)
    image.settings.border.borderLeftRatio = borderLeftWidth / clientWidth
    image.settings.border.borderRightRatio = borderRightWidth / clientWidth
    image.settings.border.borderTopRatio = borderTopHeight / clientHeight
    image.settings.border.borderBottomRatio = borderBottomHeight / clientHeight

  }
}


const handleWheel = (e) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 1.8; // 调整滚动速度
  // 4. 应用滚动
  if (imageList.value) {
    imageList.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
};


const setDefaultStyle = (dragElement) => {
  if (dragElement.src) {
    dragElement.style.width = '50px'
    dragElement.style.height = 'auto'; // 保持宽高比
  } else {
    dragElement.style.width = 'fit-content'
    dragElement.style.height = 'fit-content'
    dragElement.style.fontSize = '14px'
    dragElement.style.lineHeight = '1em'
    dragElement.style.whiteSpace = 'nowrap'
    dragElement.style.fontStyle = 'normal'
    dragElement.style.fontWeight = '400'
    const type = dragElement.getAttribute('type');
    dragElement.firstChild.remove()
    if (type === 'date') {
      dragElement.innerHTML = getDate();
    } else if (type === 'datetime') {
      dragElement.innerHTML = getDateTime();
    } else if (type === 'script') {
      const text = dragElement.getAttribute('text');
      dragElement.innerHTML = executeFunctionScript(text)
    } else if (type === 'text') {
      dragElement.innerHTML = dragElement.getAttribute('text');
    } else if (type === 'metadata') {
      const attribute = dragElement.getAttribute('text');
      let value = settings.value.metadata[attribute];
      const format = projectSettings.value.metadataFormats[attribute];
      if (format) {
        value = format.replace('${' + attribute + '}', value)
      }
      dragElement.innerHTML = value;
    }
  }
  dragElement.style.outline = 'none';
  dragElement.style.cursor = 'move';
  dragElement.style.userSelect = 'none';
  dragElement.setAttribute('tabindex', '0')
  dragElement.setAttribute('copy', '')
}


const handleDragStart = (component) => {
  component.addEventListener('dragstart', function (event) {
    const componentRect = component.getBoundingClientRect();
    const dragElement = component.cloneNode(true);
    // 元素与鼠标箭头之间的垂直方向偏移量差
    const offsetX = event.clientX - componentRect.left;
    const offsetY = event.clientY - componentRect.top;

    dragParameters.offsetX = offsetX;
    dragParameters.offsetY = offsetY;
    dragParameters.originalElement = component
    dragParameters.dragElement = dragElement

    setDefaultStyle(dragElement);

    if (dragElement.src) {
      const dragPreview = dragElement.cloneNode(true);
      dragPreview.style.position = 'fixed';
      document.body.appendChild(dragPreview);
      // 关键：设置自定义拖拽图像
      event.dataTransfer.setDragImage(dragPreview, offsetX, offsetY);
      // 拖拽结束后清理
      const cleanUp = () => {
        document.body.removeChild(dragPreview);
        component.removeEventListener('dragend', cleanUp);
      };
      component.addEventListener('dragend', cleanUp);
    } else {
      // 关键：设置拖拽数据传输
      event.dataTransfer.setData('text/plain', 'drag-element');
    }
  });
}


const bindDragEvent = (previewImage, image) => {
  // 设置拖拽事件
  document.querySelectorAll('.image-marks .image-mark, .text-marks .text-mark, .metadata .text-mark').forEach(component => {
    handleDragStart(component)
  });

  previewImage.addEventListener('dragover', event =>
      event.preventDefault()
  );

  previewImage.addEventListener('dragleave', () => {
        // previewImage.style.borderColor = '#95a5a6'
      }
  );

  // 修复放置逻辑
  previewImage.addEventListener('drop', function (event) {

    event.preventDefault();

    const {offsetX, offsetY, originalElement, dragElement} = dragParameters

    if (!dragElement) return;

    const mouseX = event.clientX;

    const mouseY = event.clientY;

    const parentRect = previewImage.parentNode.getBoundingClientRect();

    const containerRect = previewImage.getBoundingClientRect();

    const originalElementRect = dragElement.getBoundingClientRect();

    if (mouseX >= containerRect.left + offsetX && mouseX <= containerRect.right - (originalElementRect.width - offsetX)) {

      if (mouseY >= containerRect.top + offsetY && mouseY <= containerRect.bottom - (originalElementRect.height - offsetY)) {
        // 关键：必须设为绝对定位
        dragElement.style.position = 'absolute';
        // 设置元素定位
        dragElement.style.left = `${mouseX - parentRect.left - offsetX}px`;
        dragElement.style.top = `${mouseY - parentRect.top - offsetY}px`;

        // 关键：将元素添加到容器
        previewImage.parentNode.appendChild(dragElement);

        const heightCutLine = containerRect.top + containerRect.height / 2;

        const widthCutLine = containerRect.left + containerRect.width / 2;

        let positionX;

        let positionY;

        let positionOffsetX;

        let positionOffsetY;

        let references = []

        const dragElementRect = dragElement.getBoundingClientRect();

        if (dragElementRect.left > widthCutLine) {
          references.push('right')
          positionOffsetX = containerRect.right - dragElementRect.left - dragElementRect.width
          positionX = positionOffsetX / containerRect.width
        } else {
          references.push('left')
          positionOffsetX = dragElementRect.left - containerRect.left
          positionX = positionOffsetX / containerRect.width;
        }

        if (dragElementRect.top > heightCutLine) {
          references.push('bottom')
          positionOffsetY = containerRect.bottom - dragElementRect.top - dragElementRect.height
          positionY = positionOffsetY / containerRect.height;
        } else {
          references.push('top')
          positionOffsetY = dragElementRect.top - containerRect.top
          positionY = positionOffsetY / containerRect.height;
        }

        if (!dragElement.src) {
          settings.value.text.references = references
          settings.value.text.positionX = positionX
          settings.value.text.positionY = positionY
          settings.value.text.offsetX = positionOffsetX
          settings.value.text.offsetY = positionOffsetY
          const type = dragElement.getAttribute('type');
          if (type === 'metadata') {
            settings.value.text.attribute = dragElement.getAttribute('text')
          }
          if (type === 'script') {
            settings.value.text.expression = dragElement.getAttribute('text')
          }
          settings.value.text.content = dragElement.innerText
          settings.value.text.type = dragElement.getAttribute('type')
          const dragElementStyle = window.getComputedStyle(dragElement);
          const fontSize = Number.parseFloat(dragElementStyle.fontSize.replace('px', ''));
          settings.value.text.options.fontSize = fontSize
          settings.value.text.options.fontFamily = dragElementStyle.fontFamily.replace(/"/g, '')
          settings.value.text.options.fontColor = dragElementStyle.color
          settings.value.text.options.fontStyle = dragElementStyle.fontStyle
          settings.value.text.options.fontWeight = dragElementStyle.fontWeight
          settings.value.text.options.fontSizeRatio = fontSize / containerRect.width
          image.settings.texts.set(dragElement, _.cloneDeep(settings.value.text))
        } else {
          settings.value.image.references = references
          settings.value.image.positionX = positionX
          settings.value.image.positionY = positionY
          settings.value.image.offsetX = positionOffsetX
          settings.value.image.offsetY = positionOffsetY
          settings.value.image.path = dragElement.getAttribute('path')
          settings.value.image.url = dragElement.src

          const dragElementStyle = window.getComputedStyle(dragElement);
          const imageHeight = Number.parseFloat(dragElementStyle.height.replace('px', ''));
          const imageWidth = Number.parseFloat(dragElementStyle.width.replace('px', ''));

          settings.value.image.width = imageWidth
          settings.value.image.height = imageHeight
          settings.value.image.options.imageHeightRatio = imageHeight / containerRect.height
          settings.value.image.options.imageWidthRatio = imageWidth / containerRect.width

          image.settings.images.set(dragElement, _.cloneDeep(settings.value.image))
        }

        makeDraggable(dragElement, selectedElement.value.path)

      }
    }

    // 重置拖拽元素引用
    dragParameters.dragElement = null;
    dragParameters.originalElement = null;
    dragParameters.offsetX = 0;
    dragParameters.offsetY = 0;

  });

};


// 使形状可拖动
function makeDraggable(dragElement, path) {

  const image = images.value.get(path);

  const previewImage = image.getTargetElement();

  let offsetX, offsetY

  let clickTimeout = null;

  let mouseSetupX, mouseSetupY

  dragElement.onmousedown = function dragMouseDown(event) {

    const parentRect = previewImage.parentNode.getBoundingClientRect();

    // 限制在画布范围内
    const containerRect = previewImage.getBoundingClientRect();

    const originalDragElementRect = dragElement.getBoundingClientRect();

    event.preventDefault();

    // 获取鼠标位置
    offsetX = event.clientX - originalDragElementRect.left;

    offsetY = event.clientY - originalDragElementRect.top

    mouseSetupX = event.clientX

    mouseSetupY = event.clientY

    document.onmousemove = function elementDrag(event) {

      event.preventDefault();

      if (dragElement.getAttribute('selected') === 'true') {
        return
      }

      const dragElementRect = dragElement.getBoundingClientRect();

      const mouseX = event.clientX;

      const mouseY = event.clientY;

      if (mouseX >= containerRect.left + offsetX && mouseX <= containerRect.right - (dragElementRect.width - offsetX)) {
        if (mouseY >= containerRect.top + offsetY && mouseY <= containerRect.bottom - (dragElementRect.height - offsetY)) {

          dragElement.style.left = `${mouseX - parentRect.left - offsetX}px`;
          dragElement.style.top = `${mouseY - parentRect.top - offsetY}px`;

          const heightCutLine = containerRect.top + containerRect.height / 2;

          const widthCutLine = containerRect.left + containerRect.width / 2;

          let positionX;

          let positionY;

          let positionOffsetX, positionOffsetY

          let references = []

          if (dragElementRect.left > widthCutLine) {
            references.push('right')
            positionOffsetX = containerRect.right - dragElementRect.left - dragElementRect.width
            positionX = positionOffsetX / containerRect.width
          } else {
            references.push('left')
            positionOffsetX = dragElementRect.left - containerRect.left
            positionX = positionOffsetX / containerRect.width;
          }

          if (dragElementRect.top > heightCutLine) {
            references.push('bottom')
            positionOffsetY = containerRect.bottom - dragElementRect.top - dragElementRect.height
            positionY = positionOffsetY / containerRect.height;
          } else {
            references.push('top')
            positionOffsetY = dragElementRect.top - containerRect.top
            positionY = positionOffsetY / containerRect.height;
          }

          if (!dragElement.src) {
            const textMark = image.settings.texts.get(dragElement);
            textMark.references = references
            textMark.positionX = positionX
            textMark.positionY = positionY
            textMark.offsetX = positionOffsetX
            textMark.offsetY = positionOffsetY
          } else {
            const imageMark = image.settings.images.get(dragElement);
            imageMark.references = references
            imageMark.positionX = positionX
            imageMark.positionY = positionY
            imageMark.offsetX = positionOffsetX
            imageMark.offsetY = positionOffsetY
          }
        }
      }
    }
    document.onmouseup = function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  dragElement.addEventListener('keydown', (event) => {
    // 检测 Delete (46) 或 Backspace (8) 键
    if (event.key === 'Delete' || event.key === 'Backspace' || event.keyCode === 46 || event.keyCode === 8) {
      // event.preventDefault();
      if (dragElement.getAttribute('selected') === 'true') {
        if (!dragElement.src && !dragElement.querySelectorAll('input').length) {
          image.settings.texts.delete(dragElement)
          dragElement.remove()
        }
        if (dragElement.src) {
          image.settings.images.delete(dragElement)
          dragElement.remove()
        }
      }
    }
  })

  dragElement.addEventListener('click', (event) => {
    if (event.clientX === mouseSetupX && event.clientY === mouseSetupY) {
      // 清除之前的定时器（如果有）
      clearTimeout(clickTimeout);
      // 设置新的定时器
      clickTimeout = setTimeout(function () {
        dragElement.focus()
        dragElement.style.border = '1px dashed #f00'
        dragElement.setAttribute('selected', 'true')
        const image = images.value.get(selectedElement.value.path);
        if (dragElement.src) {
          const settings = image.settings.images.get(dragElement);
          switchElement.value = true
          imageOptions.value = _.cloneDeep(settings.options)
        } else {
          const settings = image.settings.texts.get(dragElement);
          textOptions.value = _.cloneDeep(settings.options)
        }
      }, 200); // 300毫秒内没有再次点击，则视为单击
    }
  })


  dragElement.parentNode.addEventListener('click', () => {
    if (dragElement.getAttribute('selected') === 'true') {
      dragElement.style.border = ''
      dragElement.setAttribute('selected', 'false')
    }
  })

  if (!dragElement.src) {
    dragElement.addEventListener('dblclick', (event) => {
      // 双击时清除单击的定时器
      clearTimeout(clickTimeout);

      dragElement.setAttribute('selected', 'true')

      // 保存原始文本
      const originalText = dragElement.textContent;
      // 创建输入框
      const input = document.createElement('input');
      input.type = 'text';
      input.value = originalText;
      input.style.width = 'fit-content'
      input.style.height = dragElement.style.height
      input.style.padding = '0 5px'

      // 清空元素内容并添加输入框
      dragElement.innerHTML = '';

      dragElement.appendChild(input);

      // 自动聚焦并全选文本
      input.focus();
      input.select();

      // 绑定保存事件
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          input.blur()
        }
      });

      // 失去焦点时保存
      input.addEventListener('blur', function () {
        const newValue = input.value;
        const dragElement = input.parentNode
        const type = dragElement.getAttribute('type');
        input.remove()
        dragElement.innerHTML = newValue ? newValue : ''
        const image = images.value.get(selectedElement.value.path);
        if (!newValue) {
          dragElement.remove();
          image.settings.texts.delete(dragElement);
          return
        }
        dragElement.setAttribute('selected', 'false')
        const containerRect = image.getTargetElement().getBoundingClientRect();
        const dragElementRect = dragElement.getBoundingClientRect();
        const textLabel = image.settings.texts.get(dragElement);
        textLabel.options.fontWidthRatio = dragElementRect.width / containerRect.width
        textLabel.options.fontHeightRatio = dragElementRect.height / containerRect.height
        textLabel.content = newValue
      });

    })

  }
}


</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;

  .page-top {
    height: 1%;
    background: #484949;
  }

  .page-main {
    width: 100%;
    height: 80%;
    display: flex;
    box-sizing: border-box;

    .page-left {
      width: 20%;
      height: 100%;
      background: #474747;
      box-sizing: border-box;
      flex-shrink: 0;

      .el-aside {
        color: var(--el-text-color-primary);
        background: #474747;
        width: 100%;
        height: 100%;

        .el-menu {
          border-right: none;
          border-bottom: none;
          background-color: #474747;

          .el-menu-item.is-active {
            background-color: #757575 !important;
            color: #faf8f8;
          }

          .text-marks-options {
            height: 50%;
            width: 100%;
            box-sizing: border-box;
            background-color: #343434;

            .text-marks {
              padding: 20px 10px;
              display: grid;
              gap: 20px;
              grid-template-columns: repeat(auto-fill, minmax(30px, 1fr));
              font-size: 12px;
              background-color: #474747;

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
            span, svg {
              color: #c2c1c1;
            }

            .el-sub-menu__title:hover {
              background-color: #343434;

              span {
                color: white;
              }
            }

            .el-menu-item:hover {
              background-color: #6e6e6e;
              color: white !important;
            }

          }

          .image-mark-options {
            height: 50%;
            width: 100%;
            box-sizing: border-box;
            background-color: #343434;
            border-bottom: 1px solid #a2a4a6;

            .image-marks {
              padding: 10px;
              column-count: 3; /* 列数 */
              column-gap: 10px; /* 列间距 */
              background-color: #474747;

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
            background-color: #343434;
            border-bottom: 1px solid #a2a4a6;
            padding: 0 1px;

            .templates {
              background-color: #474747;

              .el-menu-item {
                color: #A9A9A9;
                border-bottom: 1px solid #868686;
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

    .page-center {
      background: #838485;
      width: 60%;
      height: 100%;
      border: 1px solid #8d8d8d;
      border-bottom: none;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;

      .preview-item {
        width: 90%;
        height: 90%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;

        img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }
      }
    }

    .page-right {
      width: 20%;
      height: 100%;
      background: #474747;

      .settings-details {
        width: 100%;
        height: 100%;
        box-sizing: border-box;

        .el-aside {
          color: var(--el-text-color-primary);
          background: #474747;
          width: 100%;
          height: 100%;

          .el-menu {
            border-right: none;
            background-color: #474747;

            :deep(.el-sub-menu) {
              span, svg {
                color: #c2c1c1;
              }
            }

            .el-sub-menu {
              background-color: #343434;
              border-bottom: 1px solid #a2a4a6;

              .control-option {
                background-color: #919090;
                display: flex;
                align-items: center;
                height: 50px;
                padding-left: 20px;
              }

              .group-title {
                color: #A9A9A9;
                width: 100%;
                height: 30px;
                font-size: 14px;
                background-color: #474747;
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
                background-color: #474747;

                .option {
                  height: 35px;
                  width: 100%;
                  display: flex;
                  justify-content: start;
                  align-items: center;
                  padding: 10px 0;
                  margin-top: 5px;

                  .text-mark {
                    width: fit-content;
                    height: fit-content;
                    cursor: move;
                    user-select: none;
                  }

                  .label {
                    display: flex;
                    align-items: center;
                    justify-content: end;
                    width: 50px;
                    font-size: 12px;
                    color: #A9A9A9;
                  }

                  .value {
                    display: flex;
                    align-items: center;
                    width: calc(100% - 55px);
                    padding: 0 15px;

                    .el-icon {
                      margin-left: 5px;
                    }

                    :deep(.el-input .el-input__wrapper) {
                      background: #F0F0F0;
                    }

                    :deep(.el-color-picker) {
                      .el-icon {
                        font-size: 12px;
                        margin: 0;
                      }
                    }

                    :deep(.el-select) {
                      span {
                        color: #4d4c4c;
                      }
                    }

                    .el-slider {
                      width: 100%;
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
                color: #c2c1c1;
              }

              .el-sub-menu__title:hover {
                background-color: #343434;

                span {
                  color: white;
                }
              }
            }
          }
        }
      }

      .element-clone {
        position: absolute;
        z-index: 1000;
        pointer-events: none; /* 防止副本拦截点击事件 */
        opacity: 0.7; /* 添加透明度以示区别 */
      }


      .edit-text {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        border: 1px solid #ccc; /* 边框也不会导致超出 */
        margin: 0; /* 移除默认的margin */
      }

    }
  }

  .page-images {
    box-sizing: border-box;
    width: 100%;
    height: 19%;
    display: flex;
    justify-content: start;
    background: #5c5d5e;
    padding: 5px;
    overflow-x: auto;
    border-top: 2px solid #484949;
    scroll-behavior: smooth; /* 可选，使滚动更平滑 */
    white-space: nowrap; /* 防止内容换行 */

    img {
      box-sizing: border-box;
      background: grey;
      padding: 15px;
      height: 100%;
      border-right: 2px solid #a2a4a6;
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

.el-dialog .fill {
  height: 15px;
  width: 100%;
}


:deep(.el-dialog) {
  background: #F0F0F0;

  .el-dialog__title {
    font-size: 16px;
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
    height: 30px;
    background: #e3e3e3;

    .el-tabs__item {
      height: 30px;
      font-size: 12px;
    }
  }
}


.el-dialog {
  .el-tabs {
    .items {
      width: 100%;

      .item {
        display: flex;
        align-items: center;
        margin: 8px;

        .label {
          width: 10%;
          text-align: right;
        }

        .value {
          width: 90%;
        }
      }
    }

    .operation {
      height: 40px;
      display: flex;
      justify-content: right;
      align-items: end;
    }

    /* 基础样式 */
    .border-box {
      position: relative;
      border: 1px solid #e4e4e5;
      border-radius: 2px;
      padding: 25px 20px 20px;
      margin: 30px 0;
      background: #F0F0F0;

      .border-label {
        position: absolute;
        top: -12px;
        left: 15px;
        background: #F0F0F0;
        padding: 0 12px;
        font-size: 14px;
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

          .el-select {
            width: 160px !important;
          }

          .slider-demo-block {
            width: 250px;
            display: flex;
            align-items: center;

            :deep(.el-slider) {
              margin-top: 0;
              margin-left: 10px;

              .el-slider__input {
                margin-right: 20px;
                width: 85px !important;
              }
            }
          }

          .el-input {
            width: 100px;
          }

          span, .el-button {
            margin-left: 5px;
          }
        }
      }

    }
  }
}


</style>
