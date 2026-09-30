<template>
  <aside class="left-panel">

    <!-- 搜索 -->
    <label class="panel-search">
      <SvgIcon name="search" class="search-icon"/>
      <input class="search-input" type="text" v-model="presetKeyword" :placeholder="$t('left.searchPlaceholder')" spellcheck="false">
    </label>

    <!-- 覆盖式滚动条：不占布局宽度，展开 / 收起都不会把卡片挤窄 -->
    <el-scrollbar class="panel-scroll">

      <!-- 全部预设 -->
      <section class="panel-section">
        <div class="section-card" :class="{'is-collapsed': !opened.templates}">
          <header class="section-header" @click="toggleSection('templates')">
            <span class="section-title">{{ $t('left.allPresets') }}</span>
            <span class="section-meta">{{ $t('left.countUnit', {count: filteredPresetList.length}) }}</span>
            <SvgIcon name="chevron-up" class="section-chevron" :class="{collapsed: !opened.templates}"/>
          </header>

          <Transition name="collapse" v-bind="collapseTransition">
            <div class="section-body" v-show="opened.templates">
            <div class="preset-list" ref="templateListRef" v-drag-sort="handleTemplateSorting">
              <div
                    v-for="preset in filteredPresetList"
                  :key="preset.templateId"
                  class="template preset-card"
                  :class="{'is-active': preset.templateId === activeTemplateId}"
                  :data-id="preset.templateId"
                  draggable="false"
                  @contextmenu="triggerTemplateContextMenu(preset)"
                  @click="openEnableTemplateDialog(preset)">
                <span class="preset-info">
                  <span class="preset-name">{{ preset.templateName }}</span>
                </span>
              </div>
            </div>

            <p v-if="!filteredPresetList.length" class="section-empty">
              {{ presetKeyword ? $t('left.noMatchPresets') : $t('left.emptyPresets') }}
            </p>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 图片库 -->
      <section class="panel-section">
        <div class="section-card" :class="{'is-collapsed': !opened.images}">
          <header class="section-header" @click="toggleSection('images')">
            <span class="section-title">{{ $t('left.imageLibrary') }}</span>
            <span class="section-meta">{{ $t('left.imageUnit', {count: canvasesStore.imageResources.size}) }}</span>
            <SvgIcon name="chevron-up" class="section-chevron" :class="{collapsed: !opened.images}"/>
          </header>

          <Transition name="collapse" v-bind="collapseTransition">
            <div class="section-body" v-show="opened.images">
              <div class="brand-grid" ref="imageResourceRef">
                <div class="brand-chip image-wrapper" :key="key" v-for="([key, image]) in canvasesStore.imageResources">
                  <img class="image-resource"
                       :src="image.url"
                       :path="image.path"
                       draggable="true"
                       alt="">
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </section>

      <!-- 文本库 -->
      <section class="panel-section">
        <div class="section-card" :class="{'is-collapsed': !opened.texts}">
          <header class="section-header" @click="toggleSection('texts')">
            <span class="section-title">{{ $t('left.textLibrary') }}</span>
            <span class="section-meta">{{ $t('left.groupUnit', {count: 3 + textResourcesStore.textResources.length}) }}</span>
            <SvgIcon name="chevron-up" class="section-chevron" :class="{collapsed: !opened.texts}"/>
          </header>

          <Transition name="collapse" v-bind="collapseTransition">
            <div class="section-body" v-show="opened.texts">
              <div class="text-grid" ref="textResourceRef">
                <el-tooltip :content="$t('left.text')" placement="top">
                  <div class="text-chip text-resource" draggable="true" text="文本" type="text">
                    <span class="chip-icon"><SvgIcon name="text"/></span>
                  </div>
                </el-tooltip>
                <el-tooltip :content="$t('left.date')" placement="top">
                  <div class="text-chip text-resource" draggable="true" type="date">
                    <span class="chip-icon"><SvgIcon name="date"/></span>
                  </div>
                </el-tooltip>
                <el-tooltip :content="$t('left.datetime')" placement="top">
                  <div class="text-chip text-resource" draggable="true" type="datetime">
                    <span class="chip-icon"><SvgIcon name="datetime"/></span>
                  </div>
                </el-tooltip>
                <el-tooltip v-for="text in textResourcesStore.textResources" :key="text.id"
                            :content="text.tips" placement="top">
                  <div
                      class="text-chip text-resource"
                      :id="text.id"
                      draggable="true"
                      :text="text.content"
                      :expression="text.script"
                      :type="text.type === 'text' ? 'text' : 'script'">
                    <span class="chip-icon"><SvgIcon name="custom"/></span>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </Transition>
        </div>
      </section>

    </el-scrollbar>

    <!-- 新建预设 -->
    <button type="button" class="new-preset-button" @click="handleCreatePreset">
      <SvgIcon name="plus"/>
      <span>{{ $t('left.newPreset') }}</span>
    </button>

  </aside>
</template>

<script setup lang="js">

import {Plus, Notification} from '@element-plus/icons-vue'

import useEventListener from '@/composables/common/useEventListener'

import CanvasManager from '@/object/canvas-manager'

import {useCanvasesStore} from '@/stores/canvases'
import {useTemplatesStore} from '@/stores/templates'
import {useTextResourcesStore} from '@/stores/text-resources'

const canvasesStore = useCanvasesStore()

const templatesStore = useTemplatesStore()

const textResourcesStore = useTextResourcesStore()

const imageResourceRef = ref(null)

const textResourceRef = ref(null)

const templateListRef = ref(null)

// 分节折叠状态：默认全部展开
const opened = reactive({templates: true, images: true, texts: true})

const toggleSection = (key) => {
  opened[key] = !opened[key]
}

// 折叠 / 展开的高度过渡（与 Element Plus 的 el-collapse-transition 同思路，时长自控）
const collapseTransition = {
  onBeforeEnter(el) {
    el.dataset.oldPaddingTop = el.style.paddingTop
    el.dataset.oldPaddingBottom = el.style.paddingBottom
    el.style.maxHeight = '0'
    el.style.paddingTop = '0'
    el.style.paddingBottom = '0'
  },
  onEnter(el) {
    requestAnimationFrame(() => {
      el.dataset.oldOverflow = el.style.overflow
      el.style.maxHeight = el.scrollHeight ? `${el.scrollHeight}px` : '0'
      el.style.paddingTop = el.dataset.oldPaddingTop
      el.style.paddingBottom = el.dataset.oldPaddingBottom
      el.style.overflow = 'hidden'
    })
  },
  onAfterEnter(el) {
    el.style.maxHeight = ''
    el.style.overflow = el.dataset.oldOverflow
  },
  onBeforeLeave(el) {
    el.dataset.oldPaddingTop = el.style.paddingTop
    el.dataset.oldPaddingBottom = el.style.paddingBottom
    el.dataset.oldOverflow = el.style.overflow
    el.style.maxHeight = `${el.scrollHeight}px`
    el.style.overflow = 'hidden'
  },
  onLeave(el) {
    if (el.scrollHeight !== 0) {
      el.style.maxHeight = '0'
      el.style.paddingTop = '0'
      el.style.paddingBottom = '0'
    }
  },
  onAfterLeave(el) {
    el.style.maxHeight = ''
    el.style.overflow = el.dataset.oldOverflow
    el.style.paddingTop = el.dataset.oldPaddingTop
    el.style.paddingBottom = el.dataset.oldPaddingBottom
  },
}

// 最后点击的预设（仅用于绘制选中态）
const activeTemplateId = ref(null)

// 预设缩略图渐变：按顺序循环取色，呼应设计稿中的彩色缩略图
const PRESET_GRADIENTS = [
  'linear-gradient(140deg, #f6c47a 0%, #e88b2f 55%, #c9681a 100%)',
  'linear-gradient(140deg, #7fb9a6 0%, #3f7f6b 60%, #24574a 100%)',
  'linear-gradient(140deg, #d9a08c 0%, #a9679a 55%, #6d5b9c 100%)',
  'linear-gradient(140deg, #8fa9d4 0%, #5b7bb0 60%, #3d5486 100%)',
  'linear-gradient(140deg, #e8b4a0 0%, #c97f6b 60%, #8f5346 100%)',
]

// 统计预设图层数（前景元素 + 背景画框 / 照片两张）
const countLayers = (template) => {
  const count = (data) => {
    if (!data) return 0
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(parsed?.elements) ? parsed.elements.length : 0
  }
  try {
    const {background, foreground} = template?.settings ?? {}
    return count(foreground) + count(background)
  } catch (e) {
    return 0
  }
}

const presetList = computed(() => templatesStore.templates.map((template, index) => ({
  templateId: template.templateId,
  templateName: template.templateName,
  settings: template.settings,
  order: String(index + 1).padStart(2, '0'),
  layers: countLayers(template),
  gradient: PRESET_GRADIENTS[index % PRESET_GRADIENTS.length],
})))

// 顶部搜索框：按预设名称筛选
const presetKeyword = ref('')

const filteredPresetList = computed(() => {
  const keyword = presetKeyword.value.trim().toLowerCase()
  if (!keyword) return presetList.value
  return presetList.value.filter(preset => preset.templateName.toLowerCase().includes(keyword))
})

// 模板右键菜单：记录目标模板并打开主进程菜单
const triggerTemplateContextMenu = ({templateId, templateName}) => {
  if (templatesStore.templates.length) {
    templatesStore.oldTemplate.templateId = templateId
    templatesStore.oldTemplate.templateName = templateName
    window.electronAPI.openTemplateContextMenu()
  }
}

// 点击模板：存在选中画布时打开应用模版弹窗
const openEnableTemplateDialog = ({templateId, settings}) => {
  activeTemplateId.value = templateId
  if (CanvasManager.isNotEmpty() && CanvasManager.getSelectedPath()) {
    templatesStore.templateSettings = settings
    templatesStore.enableTemplateDialogVisible = true
  }
}

// 新建预设：以当前选中画布保存为预设
const handleCreatePreset = () => {
  templatesStore.saveTemplateDialogVisible = true
}

// 拖拽排序结束后按 DOM 顺序重排模板
const handleTemplateSorting = (el, dragaElement, targetElement) => {
  let newTemplates = []
  const elements = el.querySelectorAll('.template');
  for (let element of elements) {
    const dataId = element.getAttribute('data-id');
    for (let template of templatesStore.templates) {
      if (String(template.templateId) === dataId) {
        newTemplates.push(template)
        break
      }
    }
  }
  templatesStore.templates = newTemplates
}

// 图片库 / 文本库条目拖拽开始时打包数据
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

  // 拖拽预览：文本类芯片只拖「图标本体」，不带外面的方框；图片缩略图仍用整块图片。
  // 落点锚点必须与预览保持同一基准，否则放置位置会偏移一个「芯片内边距 + 居中差」。
  const icon = component.querySelector?.('.chip-icon')
  let dragImage = component
  let anchorX = offsetX
  let anchorY = offsetY
  if (icon) {
    const iconRect = icon.getBoundingClientRect()
    dragImage = icon
    anchorX = event.clientX - iconRect.left
    anchorY = event.clientY - iconRect.top
  }

  // 关键：设置拖拽数据传输（mouse 为落点锚点，drop 端按它反推元素左上角）
  event.dataTransfer.setData('text/plain', JSON.stringify({settings, mouse: {offsetX: anchorX, offsetY: anchorY}}));

  event.dataTransfer.setDragImage(dragImage, anchorX, anchorY);

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move';
}

useEventListener(imageResourceRef, 'dragstart', handleDragStart)
useEventListener(textResourceRef, 'dragstart', handleDragStart)

</script>

<style scoped lang="scss">

.left-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ui-panel);
  color: var(--ui-text);
  overflow: hidden;
}

/* ---------- 搜索框 ---------- */
.panel-search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  margin: 12px 12px 6px;
  padding: 0 10px;
  border-radius: var(--app-radius-sm);
  background: var(--ui-control);
  border: 1px solid transparent;
  cursor: text;
  flex-shrink: 0;
  transition: border-color var(--app-transition), box-shadow var(--app-transition);

  &:hover {
    border-color: var(--ui-border);
  }

  &:focus-within {
    background: var(--ui-elevated);
    border-color: var(--ui-accent);
    box-shadow: 0 0 0 3px var(--ui-accent-ring);
  }

  .search-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    color: var(--ui-text-muted);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 12.5px;
    color: var(--ui-text);

    &::placeholder {
      color: var(--ui-text-faint);
    }
  }
}

/* ---------- 滚动区 ---------- */
.panel-scroll {
  flex: 1;
  min-height: 0;

  /* 内边距放在内容层上，左右各 12px 对称；滚动条是覆盖式的不占宽度 */
  :deep(.el-scrollbar__view) {
    padding: 6px 12px 12px;
  }
}

.panel-section {
  margin-bottom: 10px;
}

.panel-section:last-child {
  margin-bottom: 0;
}

/* ---------- 分节卡片：容器 + 整行可点标题 + 内容 ---------- */
.section-card {
  background: var(--ui-card);
  border: 1px solid var(--ui-border);
  border-radius: var(--app-radius-lg);
  /* 标题行与卡片边框齐平：无内边距，用 overflow 裁出顶部圆角 */
  padding: 0;
  overflow: hidden;
  transition: background-color var(--app-transition), border-color var(--app-transition);
}

/* 收起后去掉卡片外壳，只留下整行可点的标题行，避免双层圆角叠在一起显得笨重 */
.section-card.is-collapsed {
  background: transparent;
  border-color: transparent;
}

/* 标题行顶部与卡片边框重合，左右也撑满，圆角交给卡片裁切 */
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 8px 0 10px;
  border-radius: 0;
  background: var(--ui-row);
  cursor: pointer;
  user-select: none;
  transition: background-color var(--app-transition);

  &:hover {
    background: var(--ui-row-hover);
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--ui-text);
    letter-spacing: 0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .section-meta {
    margin-left: auto;
    font-size: 11.5px;
    color: var(--ui-text-muted);
    flex-shrink: 0;
  }

  /* 展开时箭头取琥珀色，收起后回到灰色 */
  .section-chevron {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    color: var(--ui-accent);
    transition: transform var(--app-transition), color var(--app-transition);
  }

  .section-chevron.collapsed {
    transform: rotate(180deg);
    color: var(--ui-text-muted);
  }
}

.section-body {
  padding: 8px;
}

/* 折叠 / 展开过渡：max-height + 上下内边距一起补间，收起时高度平滑归零 */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.2s ease-in-out, padding-top 0.2s ease-in-out, padding-bottom 0.2s ease-in-out;
}

.section-empty {
  font-size: 11.5px;
  color: var(--ui-text-faint);
  padding: 2px 2px 2px 2px;
}

/* ---------- 预设卡片 ---------- */
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preset-card {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--app-radius-md);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: background-color var(--app-transition), border-color var(--app-transition);

  &:hover {
    background: var(--ui-control-hover);
  }

  &.over {
    border-color: var(--ui-accent);
  }

  &.dragging {
    opacity: 0.5;
  }

  &.is-active {
    background: var(--ui-accent-soft);
    border-color: var(--ui-accent);

    .preset-name {
      color: var(--ui-accent-soft-text);
    }

    .preset-meta {
      color: var(--ui-accent-soft-text);
      opacity: 0.75;
    }
  }

  .preset-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .preset-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--ui-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preset-meta {
    font-size: 11px;
    color: var(--ui-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* ---------- 图片库芯片 ---------- */
.brand-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  .brand-chip {
    /* 宽高比 5:4：宽度由三列栅格决定，高度随之而来 */
    aspect-ratio: 5 / 4;
    display: flex;
    align-items: center;
    justify-content: center;
    /* 内边距收窄，把空间让给 logo 本身，卡片尺寸不变 */
    padding: 4px 5px;
    border-radius: var(--app-radius-sm);
    /* 品牌标多为彩色 logo，底色固定用白，暗色下也能看清 */
    background: #ffffff;
    border: 1px solid transparent;
    transition: box-shadow var(--app-transition);

    &:hover {
      border-color: var(--ui-border-strong);
      box-shadow: var(--app-card-shadow);
    }

    .image-resource {
      /* 强制填满内容区，小图等比放大，logo 占比更高 */
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      cursor: move;
      user-select: none;
    }
  }
}

/* ---------- 文本库芯片 ---------- */
.text-grid {
  display: grid;
  /* 方形小格子：列宽固定 38px，列数随容器宽度自适应，放不下才换行 */
  grid-template-columns: repeat(auto-fill, 38px);
  justify-content: start;
  gap: 8px;

  .text-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* 去掉文字后芯片只放图标，尺寸收到刚好包住图标 */
    height: 38px;
    padding: 4px;
    border-radius: var(--app-radius-sm);
    background: var(--ui-elevated);
    border: 1px solid var(--ui-border);
    cursor: move;
    user-select: none;
    transition: background-color var(--app-transition), border-color var(--app-transition), color var(--app-transition);

    /* 图标颜色跟随主题：暗色浅、亮色深 */
    color: var(--ui-text-secondary);

    .chip-icon {
      display: inline-flex;
      opacity: 0.85;

      /* v-html 注入的 SVG 不带 scoped 属性，必须用 :deep 才能命中 */
      :deep(svg) {
        width: 20px;
        height: 20px;
      }
    }

    /* 悬浮只做中性加深，不用琥珀蒙版 */
    &:hover {
      background: var(--ui-control);
      border-color: var(--ui-border-strong);
      color: var(--ui-text);
    }
  }
}

/* ---------- 新建预设 ---------- */
.new-preset-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  margin: 8px 12px 12px;
  border-radius: var(--app-radius-sm);
  border: 1px solid var(--ui-accent-soft-border);
  background: transparent;
  color: var(--ui-accent-soft-text);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--app-transition), border-color var(--app-transition);

  svg {
    width: 13px;
    height: 13px;
  }

  &:hover {
    background: var(--ui-accent-soft);
    border-color: var(--ui-accent);
  }
}

</style>
