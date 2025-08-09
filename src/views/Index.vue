<template>
  <div class="page-layout">
    <div class="page-top"></div>
    <div class="page-main">
      <div class="page-left">
        <!--        <div class="metadata">-->
        <!--          图片元信息-->
        <!--        </div>-->
        <!--        <div class="details">-->
        <!--          <ul ref="metadataContainer" @wheel="handleMetadataWheel">-->
        <!--            <li v-for="(item) in metadata" :key="item.label">-->
        <!--              <span class="label">{{ item.label + '：' }}</span>-->
        <!--              <span class="data">{{ item.value }}</span>-->
        <!--            </li>-->
        <!--          </ul>-->
        <!--        </div>-->


        <el-aside>
          <el-scrollbar>
            <el-menu :default-openeds="['1', '2']">
              <el-sub-menu index="1" class="templates-options">
                <template #title>
                  <span>模版预设</span>
                </template>
                <div class="templates">
                  <el-menu-item class="template" index="1-1">模板一</el-menu-item>
                  <el-menu-item class="template" index="1-2">模板二</el-menu-item>
                  <el-menu-item class="template" index="1-3">模板三</el-menu-item>
                  <el-menu-item class="template" index="1-4">模板四</el-menu-item>
                </div>
              </el-sub-menu>
              <el-sub-menu index="2" class="image-mark-options">
                <template #title>
                  <span>图片标签</span>
                </template>
                <div class="image-marks" ref="imageMarks">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                  <img class="image-mark" draggable="true" src=" ../assets/icon/visible.svg">
                </div>
              </el-sub-menu>
              <el-sub-menu index="3" class="text-marks-options">
                <template #title>
                  <span>文本标签</span>
                </template>
                <el-scrollbar class="scrollBar">
                  <div class="text-marks" ref="textMarks">
                    <div class="text-mark" draggable="true">文本标签</div>
                    <div class="text-mark" draggable="true">文本标签</div>
                    <div class="text-mark" draggable="true">文本标签</div>
                    <div class="text-mark" draggable="true">文本标签</div>
                    <div class="text-mark" draggable="true">文本标签</div>
                    <div class="text-mark" draggable="true">文本标签</div>
                  </div>
                </el-scrollbar>
              </el-sub-menu>
            </el-menu>
          </el-scrollbar>
        </el-aside>
      </div>

      <div class="page-center">
        <template v-for="([key, image]) in images" :key="image.path">
          <div class="preview-item" :path="image.path" v-show="image.visible">
            <img :src="image.url" :id="image.path">
          </div>
        </template>
      </div>
      <div class="page-right">
        <div class="settings">
          配置选项
        </div>
        <div class="settings-details">
          <el-aside>
            <el-scrollbar>
              <el-menu :default-openeds="['1', '2']">
                <el-sub-menu index="1">
                  <template #title>
                    <span>基本</span>
                  </template>
                  <ul class="options">
                    <li class="option">
                      <div class="label">相机品牌</div>
                      <div class="value">
                        <el-input v-model="settings.base.cameraBrand" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">相机型号</div>
                      <div class="value">
                        <el-input v-model="settings.base.cameraModel" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">镜头型号</div>
                      <div class="value">
                        <el-input v-model="settings.base.lensModel" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">焦段</div>
                      <div class="value">
                        <el-input v-model="settings.base.focalLength" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">IOS</div>
                      <div class="value">
                        <el-input v-model="settings.base.iso" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">快门</div>
                      <div class="value">
                        <el-input v-model="settings.base.shutter" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">光圈</div>
                      <div class="value">
                        <el-input v-model="settings.base.aperture" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">拍摄日期</div>
                      <div class="value">
                        <el-input v-model="settings.base.shootingTime" size="small"/>
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
                      <div class="label">上边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   :min="0"
                                   :max="20"
                                   v-model="settings.border.borderTop"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">左边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   :min="0"
                                   :max="20"
                                   v-model="settings.border.borderLeft"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">右边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   :min="0"
                                   :max="20"
                                   v-model="settings.border.borderRight"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">下边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   :min="0"
                                   :max="20"
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
                    <span>图片</span>
                  </template>
                  <ul class="options">
                    <li class="option">
                      <div class="label">缩放</div>
                      <div class="value">
                        <el-slider @change=""
                                   :min="1"
                                   :max="100"
                                   size="small"
                                   v-model="imageOptions.scale"
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
                  </ul>
                </el-sub-menu>
                <el-sub-menu index="4">
                  <template #title>
                    <span>文本</span>
                  </template>
                  <ul class="options">
                    <li class="option">
                      <div class="label">字体类型</div>
                      <div class="value">
                        <el-select
                            v-model="textOptions.fontFamily"
                            :options="options"
                            size="small"
                            placeholder="Select"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">字体大小</div>
                      <div class="value">
                        <el-slider
                            @change=""
                            v-model="textOptions.fontSize"
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
                      <div class="label">背景颜色</div>
                      <div class="value">
                        <el-color-picker
                            @change=""
                            v-model="textOptions.tagBackground"
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

    <div class="page-images" ref="imageList" @wheel="handleWheel" @contextmenu="openContextMenu">
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

</template>

<script setup lang="ts">

import {nextTick, onBeforeMount, onMounted, ref, watch} from "vue";

import _, {first} from 'lodash';

import {deepClone} from '../utils/deep-clone'

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


const options = [
  {
    value: 'Microsoft YaHei',
    label: '微软雅黑',
  },
  {
    value: 'SimSun',
    label: '宋体',
  },
  {
    value: 'KaiTi',
    label: '楷体',
  },
  {
    value: 'FangSong',
    label: '仿宋',
  },
  {
    value: 'SimHei',
    label: '黑体',
  },
]

const images = ref(new Map<string, object>())

const imageList = ref(null);

const selectedElement = ref({
  element: null,
  path: ''
});

const metadata = ref([]);

const selectedImages = ref(new Map())

const textOptions = ref({
  fontSize: 14,
  fontFamily: 'Microsoft YaHei',
  fontColor: 'rgb(0,0,0,1)',
  tagBackground: 'rgb(255,255,255,0)',
  angle: 0,
})

const imageOptions = ref({
  scale: 10,
  angle: 0,
})

const settings = ref({
  outputDirectory: '',
  files: [],
  base: {
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
    positionX: 0,
    positionY: 0,
    references: [],
    options: {
      scale: 10,
      angle: 0,
    }
  },
  text: {
    content: '',
    positionX: 0,
    positionY: 0,
    references: [],
    options: {
      fontSize: 14,
      fontFamily: '',
      fontColor: 'rgb(0,0,0,1)',
      tagBackground: 'rgb(255,255,255,0)',
      angle: 0,
    }
  },
  border: {
    borderLeft: 3,
    borderRight: 3,
    borderTop: 3,
    borderBottom: 6,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
})

const textMarks = ref([])

const imageMarks = ref([])

const watchInputImages = () => {

  window.electronAPI.watchInputImage((event, data) => {
    if (data) {
      data.forEach((item: object, path: string) => {
        if (!images.value.has(path)) {
          const image = {
            visible: false,
            element: null,
            render: false,
            settings: {
              border: {
                borderLeft: 0,
                borderRight: 0,
                borderTop: 0,
                borderBottom: 0,
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
          images.value.set(path, {...image, ...item})
        }
      });

      nextTick(() => {
        images.value.forEach((image: object, path: string) => {
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

const openContextMenu = () => {
  if (images.value.size) {
    window.electronAPI.openContextMenu()
  }
}

const watchContextMenu = () => {
  window.electronAPI.watchContextMenu((event, data) => {
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
        images.value.forEach((image, key) => {
          const {settings: {border, texts, images}} = image
          newSettings.push({
            path: key,
            outputDirectory: data.outputDirectory,
            settings: {border, texts: Array.from(texts.values()), images: Array.from(images.values())}
          })
        })
        window.electronAPI.requestSaveFiles(JSON.parse(JSON.stringify(newSettings)))
      }
    }
  });
}


const watchCtrlA = () => {
  window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      if (selectedImages.value.size) {
        const elements = document.querySelectorAll('img.imageItem');
        elements.forEach(element => {
          element.classList.add('active');
          selectedImages.value.set(element.getAttribute('path', element))
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
        const {width, left, right, bottom, top, height} = image.getTargetElement().getBoundingClientRect();
        if (imageLabels.size) {
          imageLabels.forEach((items, element) => {

            let {positionX, positionY, references} = items

            let newPositionX, newPositionY

            if (references.includes('left')) {
              newPositionX = left + width * positionX;
              element.style.removeProperty('right')
              element.style.left = newPositionX + 'px'
            }

            if (references.includes('right')) {
              newPositionX = window.innerWidth - right + width * positionX;
              element.style.removeProperty('left')
              element.style.right = newPositionX + 'px'
            }

            if (references.includes('top')) {
              newPositionY = top + height * positionY;
              element.style.removeProperty('bottom')
              element.style.top = newPositionY + 'px'
            }

            if (references.includes('bottom')) {
              newPositionY = window.innerHeight - bottom + height * positionY;
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
              newPositionX = left + width * positionX;
              element.style.removeProperty('right')
              element.style.left = newPositionX + 'px'
            }

            if (references.includes('right')) {
              newPositionX = window.innerWidth - right + width * positionX;
              element.style.removeProperty('left')
              element.style.right = newPositionX + 'px'
            }

            if (references.includes('top')) {
              newPositionY = top + height * positionY;
              element.style.removeProperty('bottom')
              element.style.top = newPositionY + 'px'
            }

            if (references.includes('bottom')) {
              newPositionY = window.innerHeight - bottom + height * positionY;
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


const stopTextSettingsWatch = watch(textOptions, (newVal, oldVal) => {
  //停止监听 stopWatch();
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const parentNode = image.getTargetElement().parentNode;
  const {height, width} = image.getTargetElement().getBoundingClientRect();
  const elements = parentNode.querySelectorAll('.text-mark');
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {
      image.settings.texts.get(element).options = _.cloneDeep(newVal)
      image.settings.texts.get(element).options.fontHeightRatio = newVal.fontSize / height
      image.settings.texts.get(element).options.fontWidthRatio = newVal.fontSize / width
      console.log(newVal)
      element.style.fontFamily = newVal.fontFamily
      element.style.fontSize = newVal.fontSize + 'px'
      element.style.color = newVal.fontColor
      element.style.background = newVal.tagBackground
      element.style.transformOrigin = 'center center'
      element.style.transform = ` rotate(${newVal.angle}deg)`
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
  const parentNode = image.getTargetElement().parentNode;
  const elements = parentNode.querySelectorAll('.image-mark');
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {

      image.settings.images.get(element).options.angle = newVal

      element.style.transformOrigin = 'center center'
      element.style.transform = `rotate(${newVal}deg)`;
    }
  }
});

const stopImageScaleWatch = watch(() => imageOptions.value.scale, (newVal, oldVal) => {
  const {path} = selectedElement.value;
  const image = images.value.get(path);
  const parentNode = image.getTargetElement().parentNode;
  const previewImageHeight = image.getTargetElement().getBoundingClientRect().height;
  const previewImageWidth = image.getTargetElement().getBoundingClientRect().width;
  const elements = parentNode.querySelectorAll('.image-mark');
  for (let element of elements) {
    if (element.getAttribute('selected') === 'true') {

      let width = Number.parseFloat(element.style.width.replace('px', ''))
      let height = Number.parseFloat(element.style.height.replace('px', ''))
      if (isNaN(width) || isNaN(height)) {
        width = Number.parseFloat(window.getComputedStyle(element).width.replace('px', ''))
        height = Number.parseFloat(window.getComputedStyle(element).height.replace('px', ''))
      }
      let left = Number.parseFloat(element.style.left.replace('px', ''))
      let top = Number.parseFloat(element.style.top.replace('px', ''))
      const scale = (newVal - oldVal) / 10;
      element.style.width = width + width * scale + 'px'
      element.style.height = height + height * scale + 'px'
      element.style.left = left - width * scale / 2 + 'px'
      element.style.top = top - height * scale / 2 + 'px'

      image.settings.images.get(element).options.scale = newVal
      image.settings.images.get(element).options.imageHeightRatio = (height + height * scale) / previewImageHeight
      image.settings.images.get(element).options.imageWidthRatio = (width + width * scale) / previewImageWidth
    }
  }
});


onMounted(() => {
  watchInputImages()
  watchContextMenu()
  watchCtrlA()
  handleResize()
})

onBeforeMount(() => {
  // 组件销毁前移除监听，避免内存泄漏
  window.removeEventListener("resize", handleResize);
})

async function handlePreview(event, image) {
  if (!event.ctrlKey) {
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
    settings.value.border = image.settings.border

    const data = await window.electronAPI.parsePhotoMetadata(image.path);
    metadata.value = data.details;
    settings.value.base = data.base

    handleBorders()

  }

}


const handleMultipleSelect = (event: object, image: object) => {
  const element = event.target;
  if (element.classList.contains('active')) {
    element.classList.remove('active');
    selectedImages.value.delete(image.path)
  } else {
    element.classList.add('active');
    selectedImages.value.set(image.path, element)
  }
}


const handleShiftClick = (event: object, image: object) => {
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


const handleBorders = () => {
  const image = images.value.get(selectedElement.value.path)
  const targetElement = image.getTargetElement();
  if (targetElement && targetElement.complete && targetElement.naturalWidth > 0) {

    const {offsetWidth, offsetHeight} = targetElement;

    const baseLength = Math.max(offsetWidth, offsetHeight);

    const {borderLeft, borderRight, borderTop, borderBottom, borderColor} = settings.value.border;

    image.settings.border = settings.value.border

    targetElement.style.borderLeft = `${baseLength * borderLeft / 100}px solid ${borderColor}`
    targetElement.style.borderRight = `${baseLength * borderRight / 100}px solid ${borderColor}`
    targetElement.style.borderTop = `${baseLength * borderTop / 100}px solid ${borderColor}`
    targetElement.style.borderBottom = `${baseLength * borderBottom / 100}px solid ${borderColor}`
  }
}


const handleWheel = (e: Event) => {
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


const bindDragEvent = (previewImage, image) => {
  let dragElement;
  let originalElement;
  let offsetX;
  let offsetY;
  // 设置拖拽事件
  document.querySelectorAll('.image-mark, .text-mark').forEach(component => {
    component.addEventListener('dragstart', function (event) {

      const componentRect = component.getBoundingClientRect();
      offsetX = event.clientX - componentRect.left;
      // 元素与鼠标箭头之间的垂直方向偏移量差
      offsetY = event.clientY - componentRect.top;
      originalElement = component
      dragElement = component.cloneNode(true);

      // 将计算样式复制到克隆元素的内联样式中
      // const computedStyle = window.getComputedStyle(component);
      // for (let i = 0; i < computedStyle.length; i++) {
      //   const property = computedStyle[i];
      //   const value = computedStyle.getPropertyValue(property);
      //   // 设置内联样式
      //   dragElement.style.setProperty(property, value);
      // }


      setDefaultStyle(dragElement);

      // 关键：设置拖拽数据传输
      event.dataTransfer.setData('text/plain', 'drag-element');
    });
  });

  const setDefaultStyle = (dragElement) => {
    if (dragElement.src) {
      dragElement.style.width = '50px'
    } else {
      dragElement.style.width = 'fit-content'
      dragElement.style.height = 'fit-content'
      dragElement.style.fontSize = '12px'
      dragElement.style.lineHeight = '1'
    }
    dragElement.style.outline = 'none';
    dragElement.style.cursor = 'move';
    dragElement.style.userSelect = 'none';
    dragElement.setAttribute('tabindex', '0')
  }


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

    if (!dragElement) return;

    const mouseX = event.clientX;

    const mouseY = event.clientY;

    const containerRect = previewImage.getBoundingClientRect();

    const originalElementRect = dragElement.getBoundingClientRect();

    if (mouseX >= containerRect.left + offsetX && mouseX <= containerRect.right - (originalElementRect.width - offsetX)) {

      if (mouseY >= containerRect.top + offsetY && mouseY <= containerRect.bottom - (originalElementRect.height - offsetY)) {
        // 关键：必须设为绝对定位
        dragElement.style.position = 'absolute';
        // 设置元素定位
        dragElement.style.left = `${mouseX - offsetX}px`;
        dragElement.style.top = `${mouseY - offsetY}px`;

        // 关键：将元素添加到容器
        previewImage.parentNode.appendChild(dragElement);

        const heightCutLine = containerRect.top + containerRect.height / 2;

        const widthCutLine = containerRect.left + containerRect.width / 2;

        let positionX;

        let positionY;

        let references = []

        if (dragElement.offsetLeft > widthCutLine) {
          references.push('right')
          positionX = (containerRect.right - dragElement.offsetLeft - dragElement.offsetWidth) / containerRect.width
        } else {
          references.push('left')
          positionX = (dragElement.offsetLeft - containerRect.left) / containerRect.width;
        }

        if (dragElement.offsetTop > heightCutLine) {
          references.push('bottom')
          positionY = (containerRect.bottom - dragElement.offsetTop - dragElement.offsetHeight) / containerRect.height;
        } else {
          references.push('top')
          positionY = (dragElement.offsetTop - containerRect.top) / containerRect.height;
        }

        if (!dragElement.src) {
          settings.value.text.references = references
          settings.value.text.positionX = positionX
          settings.value.text.positionY = positionY
          settings.value.text.content = dragElement.innerText


          const dragElementStyle = window.getComputedStyle(dragElement);
          const fontSize = Number.parseFloat(dragElementStyle.fontSize.replace('px', ''));
          settings.value.text.options.fontSize = fontSize
          settings.value.text.options.fontFamily = dragElementStyle.fontFamily
          settings.value.text.options.fontColor = dragElementStyle.color

          settings.value.text.options.fontHeightRatio = fontSize / containerRect.height
          settings.value.text.options.fontWidthRatio = fontSize / containerRect.width
          image.settings.texts.set(dragElement, _.cloneDeep(settings.value.text))
        } else {
          settings.value.image.references = references
          settings.value.image.positionX = positionX
          settings.value.image.positionY = positionY
          settings.value.image.path = dragElement.src

          const dragElementStyle = window.getComputedStyle(dragElement);
          const imageHeight = Number.parseFloat(dragElementStyle.height.replace('px', ''));
          const imageWidth = Number.parseFloat(dragElementStyle.width.replace('px', ''));

          settings.value.image.options.imageHeightRatio = imageHeight / containerRect.height
          settings.value.image.options.imageWidthRatio = imageWidth / containerRect.width

          image.settings.images.set(dragElement, _.cloneDeep(settings.value.image))
        }
        makeDraggable(dragElement)
      }
    }

    // 重置拖拽元素引用
    dragElement = null;

    originalElement = null;

  });

  // 使形状可拖动
  function makeDraggable(dragElement) {
    let offsetX, offsetY
    let clickTimeout = null;
    let mouseSetupX, mouseSetupY
    dragElement.onmousedown = function dragMouseDown(event) {

      event.preventDefault();
      const elementRect = dragElement.getBoundingClientRect();

      // 获取鼠标位置
      offsetX = event.clientX - elementRect.left;

      offsetY = event.clientY - elementRect.top

      mouseSetupX = event.clientX

      mouseSetupY = event.clientY

      document.onmousemove = function elementDrag(event) {

        if (dragElement.getAttribute('selected') === 'true') {
          return
        }

        event.preventDefault();

        const mouseX = event.clientX;

        const mouseY = event.clientY;

        // 限制在画布范围内
        const containerRect = previewImage.getBoundingClientRect();

        if (mouseX >= containerRect.left + offsetX && mouseX <= containerRect.right - (elementRect.width - offsetX)) {
          if (mouseY >= containerRect.top + offsetY && mouseY <= containerRect.bottom - (elementRect.height - offsetY)) {

            if (dragElement.src) {
              dragElement.style.left = (mouseX - offsetX) + 'px';
              dragElement.style.top = (mouseY - offsetY) + 'px';
            } else {
              dragElement.style.left = `${mouseX - offsetX}px`;
              dragElement.style.top = `${mouseY - offsetY}px`;
            }


            const heightCutLine = containerRect.top + containerRect.height / 2;

            const widthCutLine = containerRect.left + containerRect.width / 2;

            let positionX;

            let positionY;

            let references = []

            if (elementRect.left > widthCutLine) {
              references.push('right')
              positionX = (containerRect.right - dragElement.offsetLeft - dragElement.offsetWidth) / containerRect.width
            } else {
              references.push('left')
              positionX = (dragElement.offsetLeft - containerRect.left) / containerRect.width;
            }

            if (elementRect.top > heightCutLine) {
              references.push('bottom')
              positionY = (containerRect.bottom - dragElement.offsetTop - dragElement.offsetHeight) / containerRect.height;
              console.log(containerRect.bottom, dragElement.offsetTop, dragElement.offsetHeight, positionY)
            } else {
              references.push('top')
              positionY = (dragElement.offsetTop - containerRect.top) / containerRect.height;
            }

            if (!dragElement.src) {
              const textMark = image.settings.texts.get(dragElement);
              textMark.references = references
              textMark.positionX = positionX
              textMark.positionY = positionY
              console.log(textMark)
            } else {
              const imageMark = image.settings.images.get(dragElement);
              imageMark.references = references
              imageMark.positionX = positionX
              imageMark.positionY = positionY

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
          console.log('单击');
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
            const newValue = input.value;
            input.remove()
            dragElement.innerHTML = newValue ? newValue : ' '
            dragElement.setAttribute('selected', 'false')

            image.settings.texts.get(dragElement).content = newValue
          }
        });

        // 失去焦点时保存
        input.addEventListener('blur', function () {
          const newValue = input.value;
          input.remove()
          dragElement.innerHTML = newValue ? newValue : ' '
          dragElement.setAttribute('selected', 'false')

          image.settings.texts.get(dragElement).content = newValue
        });

      })

    }
  }
};


</script>


<style scoped lang="scss">

.page-layout {
  width: 100vw;
  height: 100vh;

  .page-top {
    height: 1%;
    background: #484949;
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

.page-main {
  width: 100%;
  height: 80%;
  display: flex;
  box-sizing: border-box;
}

.page-main .page-left {
  width: 20%;
  height: 100%;
  background: #817e7e;
  box-sizing: border-box;
  flex-shrink: 0;

  .el-aside {
    color: var(--el-text-color-primary);
    background: #817e7e;
    width: 100%;
    height: 100%;

    .el-menu {
      border-right: none;
      border-bottom: none;
      background-color: #484949;

      .text-marks-options {
        height: 50%;
        width: 100%;
        box-sizing: border-box;
        background-color: #838282;

        .text-marks {
          padding: 20px 10px;
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          font-size: 12px;
          background-color: #919090;
          border-bottom: 1px solid #a2a4a6;

          .text-mark {
            width: fit-content;
            height: fit-content;
            cursor: move;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            user-select: none;
          }

          .text-mark:hover {
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            background: #e3f2fd;
          }
        }

      }

      .image-mark-options {
        height: 50%;
        width: 100%;
        box-sizing: border-box;
        background-color: #838282;
        border-bottom: 1px solid #a2a4a6;

        .image-marks {
          padding: 10px 10px;
          display: grid;
          gap: 5px;
          grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
          background-color: #919090;

          .image-mark {
            padding: 0;
            cursor: move;
            user-select: none;
            max-width: 50px;
          }

          .image-mark:hover {
            background: #e3f2fd;
          }
        }
      }

      .templates-options {
        background-color: #838282;
        border-bottom: 1px solid #a2a4a6;

        .templates {
          background-color: #919090;
        }
      }
    }

  }


  .metadata {
    height: 40px;
    border-bottom: 2px solid #484949;
    padding-left: 10px;
    font-size: 16px;
    display: flex;
    justify-content: start;
    align-items: center;
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

.page-main .page-center {
  background: #a2a4a6;
  width: 60%;
  height: 100%;
  border-left: 2px solid #484949;
  border-right: 2px solid #484949;
  box-sizing: border-box;

  .preview-item {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
      max-width: 95%;
      max-height: 95%;
      width: auto; /* 保持原始宽高比 */
      height: auto; /* 保持原始宽高比 */
      transition: background-color 0.3s; /* 可选，添加过渡效果 */
    }
  }

}

.page-main .page-right {
  width: 20%;
  height: 100%;
  background: #817e7e;

  .settings {
    height: 40px;
    border-bottom: 2px solid #484949;
    padding-left: 10px;
    font-size: 16px;
    display: flex;
    justify-content: start;
    align-items: center;
  }

  .settings-details {
    width: 100%;
    height: calc(100% - 40px);
    box-sizing: border-box;

    .el-aside {
      color: var(--el-text-color-primary);
      background: #817e7e;
      width: 100%;
      height: 100%;

      .el-menu {
        border-right: none;
        background-color: #484949;

        .el-sub-menu {
          background-color: #838282;
          border-bottom: 1px solid #a2a4a6;

          .control-option {
            background-color: #919090;
            display: flex;
            align-items: center;
            height: 50px;
            padding-left: 20px;
          }

          .options {
            width: 100%;
            list-style: none;
            padding: 10px 0 10px 10px;
            background-color: #919090;

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
              }

              .value {
                display: flex;
                align-items: center;
                width: calc(100% - 55px);
                padding: 0 15px;

                .el-icon {
                  margin-left: 5px;
                }

                :deep(.el-color-picker) {
                  .el-icon {
                    font-size: 12px;
                    margin: 0;
                  }
                }

                .el-slider {
                  width: 100%;
                }
              }
            }
          }
        }

        .el-sub-menu:first-child {
          border-top: none;
        }

        .el-sub-menu:last-child {
          border-bottom: 1px solid #a2a4a6;
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

</style>
