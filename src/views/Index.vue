<template>
  <div class="page-layout">
    <div class="page-top"></div>
    <div class="page-main">
      <div class="page-left">
        <div class="metadata">
          元信息
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
        <img :src="previewUrl" ref="picture">
      </div>
      <div class="page-right">
        <div class="settings">
          配置项
        </div>
        <div class="settings-details">
          <el-aside>
            <el-scrollbar>
              <el-menu :default-openeds="['1', '3']">
                <el-sub-menu index="1">
                  <template #title>
                    <span>基本</span>
                  </template>
                  <div class="options">
                    <div class="option">
                      <div class="items-title">图片信息</div>
                      <ul class="items">
                        <li class="item">
                          <div class="label">相机品牌</div>
                          <div class="value">
                            <el-input v-model="param.base.cameraBrand" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">镜头型号</div>
                          <div class="value">
                            <el-input v-model="param.base.lensModel" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">焦段</div>
                          <div class="value">
                            <el-input v-model="param.base.focalLength" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">IOS</div>
                          <div class="value">
                            <el-input v-model="param.base.iso" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">快门</div>
                          <div class="value">
                            <el-input v-model="param.base.shutter" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">光圈</div>
                          <div class="value">
                            <el-input v-model="param.base.aperture" size="small"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">拍摄日期</div>
                          <div class="value">
                            <el-input v-model="param.base.shootingTime" size="small"/>
                          </div>
                        </li>
                      </ul>
                    </div>
                    <div class="option">
                      <div class="items-title">边框</div>
                      <ul class="items">
                        <li class="item">
                          <div class="label">边框颜色</div>
                          <div class="value">
                            <el-color-picker
                                @change="handleBorders"
                                v-model="param.border.borderColor"
                                show-alpha
                                :predefine="predefineColors"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">上边框</div>
                          <div class="value">
                            <el-slider @change="handleBorders" size="small" v-model="param.border.borderTop"
                                       placement="top"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">左边框</div>
                          <div class="value">
                            <el-slider @change="handleBorders" size="small" v-model="param.border.borderLeft"
                                       placement="top"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">右边框</div>
                          <div class="value">
                            <el-slider @change="handleBorders" size="small" v-model="param.border.borderRight"
                                       placement="top"/>
                          </div>
                        </li>
                        <li class="item">
                          <div class="label">下边框</div>
                          <div class="value">
                            <el-slider @change="handleBorders" size="small" v-model="param.border.borderBottom"
                                       placement="top"/>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </el-sub-menu>
                <el-sub-menu index="2">
                  <template #title>
                    <span>自定义标签</span>
                  </template>
                  <div class="options">
                    <div class="option">
                      <div class="items">
                        <div class="item" v-for="tag in param.tags" :key="tag.id">
                          <div class="label">{{ tag.label }}</div>
                          <div class="value">
                            <el-input v-model="tag.value" size="small"/>
                            <el-icon @click="removeTag(tag)">
                              <Delete/>
                            </el-icon>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="control-option">
                    <el-button type="info" @click="dialogVisible = true">添加标签</el-button>
                  </div>
                </el-sub-menu>
              </el-menu>
            </el-scrollbar>
          </el-aside>
        </div>
        <div class="control">
          同步
        </div>
      </div>
    </div>

    <div class="page-images" ref="imageList" @wheel="handleWheel" @contextmenu="imageListContextmenu">
      <img v-lazy="value.url" v-for="([key, value]) in images" :key="key" @click="handlePreview($event, value)">
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

import {onMounted, ref, watch} from "vue";

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

const selectedElement = ref(null);

const metadata = ref([]);

const picture = ref(null);

const param = ref({
  base: {
    cameraBrand: '',
    lensModel: '',
    focalLength: '',
    iso: '',
    shutter: '',
    aperture: '',
    shootingTime: ''
  },
  border: {
    borderLeft: 0,
    borderRight: 0,
    borderTop: 0,
    borderBottom: 0,
    borderColor: 'rgba(255, 255, 255, 1)'
  },
  tags: []
})

const tags = ref([]);

const customTag = ref({
  label: '',
  value: ''
});

const dialogVisible = ref(false);


onMounted(async () => {
  window.electronAPI.inputImages((event: object, result: object) => {
    if (result) {
      const {data, type} = result;
      switch (type) {
        case 0:
          images.value = data;
          break;
        case 1:
          data.forEach((value: object, key: string) => images.value.set(key, value));
          console.log(images.value)
          break;
      }
    }
  });
})


const handleBorders = () => {
  const img = picture.value;
  if (img.complete && img.naturalWidth > 0) {
    const {borderLeft, borderRight, borderTop, borderBottom, borderColor} = param.value.border;
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

const handleNewTag = () => {
  if (customTag.value.label && customTag.value.value) {
    customTag.value.id = Date.now()
    param.value.tags.push(customTag.value)
    dialogVisible.value = false
    customTag.value = {}
  }
}

async function handlePreview(event: object, image: object) {
  previewUrl.value = image.url
  selectedElement.value && selectedElement.value.classList.remove('active')
  selectedElement.value = event.target;
  selectedElement.value && selectedElement.value.classList.add('active')
  metadata.value = await window.electronAPI.parsePhotoMetadata(image.path);
  handleBorders()
}


const imageListContextmenu = () => {
  // window.electronAPI.triggerImageListContextmenu([])
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
    font-size: 20px;
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
    font-size: 20px;
    display: flex;
    justify-content: start;
    align-items: center;
  }

  .settings-details {
    width: 100%;
    height: calc(100% - 80px);
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

      .el-sub-menu {
        border-top: 1px solid #a2a4a6;
        background-color: #a2a0a0;

        span {
          color: white;
        }

        .control-option {
          background-color: #a2a0a0;
          display: flex;
          align-items: center;
          height: 50px;
          padding-left: 20px;
        }

        .options {
          background-color: #a2a0a0;
          font-size: 13px;

          .option {
            border-bottom: 1px solid black;
            padding: 10px 0;

            .items-title {
              height: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
            }

            .items {
              width: 100%;
              list-style: none;
              padding-left: 20px;

              .item {
                height: 35px;
                width: 100%;
                display: flex;
                justify-content: start;
                align-items: center;

                .label {
                  display: flex;
                  align-items: center;
                  justify-content: end;
                  width: 55px;
                }

                .value {
                  display: flex;
                  align-items: center;
                  width: calc(100% - 55px);
                  padding: 0 20px;

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

      .el-sub-menu:last-child {
        border-bottom: 1px solid #a2a4a6;
      }
    }
  }

  .control {
    height: 40px;
    border-bottom: 2px solid #484949;
    border-top: 2px solid #484949;
    padding-left: 10px;
    font-size: 20px;
    display: flex;
    justify-content: start;
    align-items: center;
  }

}

</style>
