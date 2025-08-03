<template>
  <div class="page-layout">
    <div class="page-top"></div>
    <div class="page-main">
      <div class="page-left">
        <div class="metadata">
          图片元信息
        </div>
        <div class="details">
          <ul ref="metadataContainer" @wheel="handleMetadataWheel">
            <li v-for="(item) in metadata" :key="item.label">
              <span class="label">{{ item.label + '：' }}</span>
              <span class="data">{{ item.value }}</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="page-center">
        <img :src="previewUrl" path="" ref="picture">
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
                        <el-input v-model="param.base.cameraBrand" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">相机型号</div>
                      <div class="value">
                        <el-input v-model="param.base.cameraModel" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">镜头型号</div>
                      <div class="value">
                        <el-input v-model="param.base.lensModel" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">焦段</div>
                      <div class="value">
                        <el-input v-model="param.base.focalLength" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">IOS</div>
                      <div class="value">
                        <el-input v-model="param.base.iso" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">快门</div>
                      <div class="value">
                        <el-input v-model="param.base.shutter" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">光圈</div>
                      <div class="value">
                        <el-input v-model="param.base.aperture" size="small"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">拍摄日期</div>
                      <div class="value">
                        <el-input v-model="param.base.shootingTime" size="small"/>
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
                                   v-model="param.border.borderTop"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">左边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders" size="small"
                                   v-model="param.border.borderLeft"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">右边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   v-model="param.border.borderRight"
                                   placement="top"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">下边框</div>
                      <div class="value">
                        <el-slider @change="handleBorders"
                                   size="small"
                                   v-model="param.border.borderBottom"
                                   placement="top"/>
                      </div>
                    </li>
                  </ul>
                </el-sub-menu>
                <el-sub-menu index="3">
                  <template #title>
                    <span>颜色</span>
                  </template>
                  <ul class="options">
                    <li class="option">
                      <div class="label">边框</div>
                      <div class="value">
                        <el-color-picker
                            size="small"
                            @change="handleBorders"
                            v-model="param.color.borderColor"
                            show-alpha
                            :predefine="predefineColors"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">标签背景</div>
                      <div class="value">
                        <el-color-picker
                            @change="handleBorders"
                            v-model="param.color.tagBackground"
                            show-alpha
                            size="small"
                            :predefine="predefineColors"/>
                      </div>
                    </li>
                    <li class="option">
                      <div class="label">标签字体</div>
                      <div class="value">
                        <el-color-picker
                            @change="handleBorders"
                            v-model="param.color.fontColor"
                            show-alpha
                            size="small"
                            :predefine="predefineColors"/>
                      </div>
                    </li>
                  </ul>
                </el-sub-menu>
                <el-sub-menu index="4">
                  <template #title>
                    <span>自定义标签</span>
                  </template>
                  <ul class="options">
                    <div class="option" v-for="tag in param.tags" :key="tag.id">
                      <div class="label">{{ tag.label }}</div>
                      <div class="value">
                        <el-input v-model="tag.value" size="small"/>
                        <el-icon @click="removeTag(tag)">
                          <Delete/>
                        </el-icon>
                      </div>
                    </div>
                  </ul>
                  <div class="control-option">
                    <el-button type="info" @click="dialogVisible = true">添加标签</el-button>
                  </div>
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

  <el-dialog v-model="dialogVisible" title="自定义标签" width="300">
    <el-form :model="customTag">
      <el-form-item label="说明" :label-width="formLabelWidth">
        <el-input v-model="customTag.label" autocomplete="off"/>
      </el-form-item>
      <el-form-item label="标签" :label-width="formLabelWidth">
        <el-input v-model="customTag.value" autocomplete="off"/>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleNewTag">添加</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">

import {onMounted, onUnmounted, ref, watch} from "vue";

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

const formLabelWidth = '50px'

const images = ref(new Map())

const previewUrl = ref('');

const imageList = ref(null);

const metadataContainer = ref(null);

const beforeSelectedElement = ref(null);

const metadata = ref([]);

const picture = ref(null);

const selectedImages = ref(new Map())

const param = ref({
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
  color: {
    borderColor: 'rgba(255, 255, 255, 1)',
    fontColor: 'rgba(255, 255, 255, 1)',
    tagBackground: 'rgba(255, 255, 255, 1)',
  },
  border: {
    borderLeft: 20,
    borderRight: 20,
    borderTop: 20,
    borderBottom: 50,
  },
  tags: []
})

const customTag = ref({
  label: '',
  value: ''
});

const dialogVisible = ref(false);


const watchInputImages = () => {
  window.electronAPI.watchInputImage((event, data) => {
    if (data) {
      data.forEach((value: object, key: string) => images.value.set(key, value));
    }
  });
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
        if (!images.value.size || !images.value.has(picture.value.getAttribute('path'))) {
          previewUrl.value = ''
        }
      } else if (type === 1) {
        window.electronAPI.requestSaveFiles({
          savePath: data.savePath,
          files: [...selectedImages.value.keys()]
        })
      }
    }
  });
}


const watchCtrlA = () => {
  window.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      if (selectedImages.value.size) {
        const elements = document.documentElement.querySelectorAll('img.imageItem');
        elements.forEach(element => {
          element.classList.add('active');
          selectedImages.value.set(element.getAttribute('path', element))
        })
      }
    }
  });
}

onMounted(() => {
  watchInputImages()
  watchContextMenu()
  watchCtrlA()
})


const handleBorders = () => {
  const img = picture.value;
  if (img && img.complete && img.naturalWidth > 0) {
    const {borderLeft, borderRight, borderTop, borderBottom} = param.value.border;
    const {borderColor} = param.value.color;
    img.style.borderLeft = `${borderLeft}px solid ${borderColor}`
    img.style.borderRight = `${borderRight}px solid ${borderColor}`
    img.style.borderTop = `${borderTop}px solid ${borderColor}`
    img.style.borderBottom = `${borderBottom}px solid ${borderColor}`
  }
}

const removeTag = (tag) => {
  const index = param.value.tags.indexOf(tag);
  if (index !== -1) {
    param.value.tags.splice(index, 1);
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


const handleNewTag = () => {
  if (customTag.value.label && customTag.value.value) {
    customTag.value.id = Date.now()
    param.value.tags.push(customTag.value)
    dialogVisible.value = false
    customTag.value = {}
  }
}

async function handlePreview(event, image) {
  if (!event.ctrlKey) {
    if (selectedImages.value && !selectedImages.value.size) {
      beforeSelectedElement.value = event.target;
    } else if (selectedImages.value && selectedImages.value.size === 1) {
      if (beforeSelectedElement.value) {
        const beforePath = beforeSelectedElement.value.getAttribute('path');
        selectedImages.value.delete(beforePath);
        beforeSelectedElement.value.classList.remove('active')
        beforeSelectedElement.value = event.target;
      }
    } else {
      if (!selectedImages.value.has(image.path)) {
        const selectedElements = selectedImages.value.values();
        for (let element of selectedElements) {
          element.classList.remove('active')
        }
        selectedImages.value.clear()
        beforeSelectedElement.value = event.target;
      }
    }

    if (!selectedImages.value.has(image.path)) {
      selectedImages.value.set(image.path, event.target)
      event.target.classList.add('active')
    }

    picture.value.setAttribute('path', image.path)
    previewUrl.value = image.url
    const data = await window.electronAPI.parsePhotoMetadata(image.path);
    metadata.value = data.details;
    param.value.base = data.base

    // 后续优化，没有选中任何元素，首次选中是执行
    handleBorders()
  }
}


const openContextMenu = () => {
  if (images.value.size) {
    window.electronAPI.openContextMenu()
  }
}

const handleMetadataWheel = (e: Event) => {
  // 1. 阻止默认的垂直滚动行为
  e.preventDefault();
  // 2. 获取滚轮滚动方向（deltaY > 0 向下滚，< 0 向上滚）
  // 3. 转换为水平滚动：向下滚向右移动，向上滚向左移动
  const scrollAmount = e.deltaY * 0.5; // 调整滚动速度
  // 4. 应用滚动
  if (metadataContainer.value) {
    metadataContainer.value.scrollBy({
      left: scrollAmount,
      behavior: 'smooth' // 平滑滚动效果
    });
  }
};

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
  width: 60%;
  height: 100%;
  background: #a2a4a6;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  border-left: 2px solid #484949;
  border-right: 2px solid #484949;

  img {
    max-width: 95%;
    max-height: 95%;
    width: auto; /* 保持原始宽高比 */
    height: auto; /* 保持原始宽高比 */
    transition: background-color 0.3s; /* 可选，添加过渡效果 */
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

    .el-menu {
      border-right: none;
      background-color: #484949;
    }

    .el-aside {
      color: var(--el-text-color-primary);
      background: #817e7e;
      width: 100%;
      height: 100%;

      .el-sub-menu:first-child {
        border-top: none;
      }

      .el-sub-menu:last-child {
        border-bottom: 1px solid #a2a4a6;
      }

      .el-sub-menu {
        border-top: 1px solid #efefef;
        background-color: #838282;

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
          padding-left: 10px;
          background-color: #919090;

          .option {
            height: 35px;
            width: 100%;
            display: flex;
            justify-content: start;
            align-items: center;
            padding: 10px 0;

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
    }
  }

}

</style>
