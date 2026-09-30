<template>
  <div class="search-dropdown" ref="rootRef">
    <label class="search-box">
      <Icon name="search" class="search-icon"/>
      <input ref="inputRef" class="search-input" type="text" v-model="query" :placeholder="$t('toolbar.searchPlaceholder')"
             spellcheck="false" autocomplete="off"
             @focus="open = true"
             @keydown="handleKeydown">
      <span class="search-shortcut">Ctrl K</span>
    </label>

    <div class="search-panel" v-if="open" ref="panelRef">
      <template v-for="group in filteredGroups" :key="group.key">
        <div class="group-label">{{ group.label }}</div>
        <button v-for="item in group.items" :key="item.id" type="button"
                class="command-item"
                :class="{'is-active': item.flatIndex === active}"
                @click="runItem(item)"
                @mousemove="active = item.flatIndex">
          <Icon :name="item.icon" class="command-icon"/>
          <span class="command-label" v-html="highlight(item.label)"></span>
        </button>
      </template>
      <div class="search-empty" v-if="flatItems.length === 0">{{ $t('toolbar.searchNoCommands') }}</div>
    </div>
  </div>
</template>

<script setup lang="js">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'

import {useI18n} from 'vue-i18n'

import {useProjectSettingsStore} from '@/stores/project-settings'
import {useTheme} from '@/composables/shared/useTheme'

const emit = defineEmits(['toggle-left', 'toggle-right', 'toggle-bottom'])

const {t} = useI18n()

const settingsStore = useProjectSettingsStore()
const {applyTheme, renderUiStyle} = useTheme()

// ---------- 命令清单 ----------
// IPC 命令：id 对应原生菜单项（electron/components/application-menu.js），执行时 invokeAppMenu(id)
// 界面命令：渲染层直接处理（主题/配色走 useTheme，面板折叠转发给 Index.vue）
const commandGroups = [
  {
    key: 'file', labelKey: 'menu.file',
    items: [
      {id: 'import-images', icon: 'cmd-import', labelKey: 'searchCommand.importImages', keywords: 'import image 导入 图片'},
      {id: 'export-images', icon: 'cmd-export', labelKey: 'searchCommand.exportImages', keywords: 'export 导出'},
    ],
  },
  {
    key: 'settings', labelKey: 'menu.settings',
    items: [
      {id: 'preferences', icon: 'cmd-sliders', labelKey: 'searchCommand.preferences', keywords: 'settings preference 偏好 设置'},
      {id: 'import-templates', icon: 'cmd-doc-in', labelKey: 'searchCommand.importTemplates', keywords: 'template import 模板 预设 导入'},
      {id: 'export-templates', icon: 'cmd-doc-out', labelKey: 'searchCommand.exportTemplates', keywords: 'template export 模板 预设 导出'},
      {id: 'import-settings', icon: 'cmd-import', labelKey: 'searchCommand.importSettings', keywords: 'settings import 全局 设置 导入'},
      {id: 'export-settings', icon: 'cmd-export', labelKey: 'searchCommand.exportSettings', keywords: 'settings export 全局 设置 导出'},
    ],
  },
  {
    key: 'extensions', labelKey: 'menu.extensions',
    items: [
      {id: 'add-text', icon: 'cmd-text', labelKey: 'searchCommand.addText', keywords: 'text add 文本 添加'},
      {id: 'manage-text', icon: 'cmd-doc-lines', labelKey: 'searchCommand.manageText', keywords: 'text manage 文本库 管理'},
      {id: 'import-image-resources', icon: 'cmd-import', labelKey: 'searchCommand.importImageResources', keywords: 'image resource import 图片 资源 导入'},
      {id: 'open-image-resources', icon: 'cmd-folder', labelKey: 'searchCommand.openImageResources', keywords: 'image folder open 图片 资源 目录 打开'},
      {id: 'import-fonts', icon: 'cmd-import', labelKey: 'searchCommand.importFonts', keywords: 'font import 字体 导入'},
      {id: 'open-font-resources', icon: 'cmd-folder', labelKey: 'searchCommand.openFontResources', keywords: 'font folder open 字体 目录 打开'},
    ],
  },
  {
    key: 'tools', labelKey: 'menu.tools',
    items: [
      {id: 'image-manager', icon: 'cmd-grid', labelKey: 'searchCommand.imageManager', keywords: 'image manager 图片 管理器'},
    ],
  },
  {
    key: 'help', labelKey: 'menu.help',
    items: [
      {id: 'about', icon: 'cmd-info', labelKey: 'searchCommand.about', keywords: 'about 关于'},
    ],
  },
  {
    key: 'interface', labelKey: 'searchGroup.interface',
    items: [
      {id: 'toggle-dark-mode', icon: 'cmd-moon', labelKey: 'searchCommand.toggleDarkMode', keywords: 'theme dark light 主题 亮 暗 模式'},
      {id: 'toggle-accent', icon: 'cmd-droplet', labelKey: 'searchCommand.toggleAccent', keywords: 'accent color 配色 颜色 主题'},
      {id: 'toggle-left-panel', icon: 'cmd-panel-l', labelKey: 'searchCommand.toggleLeftPanel', keywords: 'panel left collapse 面板 左 折叠'},
      {id: 'toggle-right-panel', icon: 'cmd-panel-r', labelKey: 'searchCommand.toggleRightPanel', keywords: 'panel right collapse 面板 右 折叠'},
      {id: 'toggle-bottom-panel', icon: 'cmd-panel-b', labelKey: 'searchCommand.toggleBottomPanel', keywords: 'panel bottom collapse 面板 底 折叠 预览'},
    ],
  },
]

// ---------- 命令图标：统一通过 <Icon name="cmd-*"/> 使用（注册表见 src/components/Icon.vue） ----------

// ---------- 状态 ----------
const rootRef = ref(null)
const inputRef = ref(null)
const panelRef = ref(null)

const query = ref('')
const open = ref(false)
const active = ref(0)

// 解析 i18n 后的完整分组（语言切换时自动重算）
const groups = computed(() => commandGroups.map(group => ({
  key: group.key,
  label: t(`toolbar.${group.labelKey}`),
  items: group.items.map(item => ({...item, label: t(`toolbar.${item.labelKey}`)})),
})))

// 按关键词过滤（label + keywords，大小写不敏感）
const filteredGroups = computed(() => {
  const q = query.value.trim().toLowerCase()
  const match = (item) => !q
      || item.label.toLowerCase().includes(q)
      || item.keywords.toLowerCase().includes(q)
      || item.id.toLowerCase().includes(q)
  let flatIndex = 0
  return groups.value
      .map(group => ({...group, items: group.items.filter(match).map(item => ({...item, flatIndex: flatIndex++}))}))
      .filter(group => group.items.length)
})

const flatItems = computed(() => filteredGroups.value.flatMap(group => group.items))

watch(flatItems, () => {
  active.value = 0
})

// active 项滚动到可视区
watch(active, () => {
  nextTick(() => {
    panelRef.value?.querySelector('.command-item.is-active')?.scrollIntoView({block: 'nearest'})
  })
})

// ---------- 交互 ----------
const close = () => {
  open.value = false
  query.value = ''
}

const highlight = (label) => {
  const q = query.value.trim()
  if (!q) return label
  const idx = label.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return label
  return `${label.slice(0, idx)}<mark>${label.slice(idx, idx + q.length)}</mark>${label.slice(idx + q.length)}`
}

const runItem = (item) => {
  switch (item.id) {
    // 亮/暗切换：解析当前有效态（system 时读系统偏好），在 light/dark 间翻转
    case 'toggle-dark-mode': {
      const appearance = settingsStore.projectSettings.appearance
      const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      const effectiveDark = appearance.theme === 'dark'
          || (appearance.theme === 'system' && !systemPrefersLight)
      const next = effectiveDark ? 'light' : 'dark'
      appearance.theme = next
      applyTheme(next)
      break
    }
    // 强调配色：default → indigo → pine → crimson → wisteria 循环
    case 'toggle-accent': {
      const accents = ['default', 'indigo', 'pine', 'crimson', 'wisteria']
      const appearance = settingsStore.projectSettings.appearance
      const idx = accents.indexOf(appearance.uiTheme || 'default')
      appearance.uiTheme = accents[(idx + 1) % accents.length]
      renderUiStyle()
      break
    }
    case 'toggle-left-panel':
      emit('toggle-left')
      break
    case 'toggle-right-panel':
      emit('toggle-right')
      break
    case 'toggle-bottom-panel':
      emit('toggle-bottom')
      break
    default:
      window.electronAPI?.invokeAppMenu?.(item.id)
  }
  close()
  inputRef.value?.blur()
}

const handleKeydown = (event) => {
  const count = flatItems.value.length
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (count) active.value = (active.value + 1) % count
      break
    case 'ArrowUp':
      event.preventDefault()
      if (count) active.value = (active.value - 1 + count) % count
      break
    case 'Enter':
      event.preventDefault()
      if (flatItems.value[active.value]) runItem(flatItems.value[active.value])
      break
    case 'Escape':
      event.preventDefault()
      close()
      inputRef.value?.blur()
      break
  }
}

// Ctrl+K / Cmd+K 聚焦搜索框
const handleGlobalKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    open.value = true
    inputRef.value?.focus()
  }
}

// 点击组件外部关闭
const handleGlobalMousedown = (event) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
  document.addEventListener('mousedown', handleGlobalMousedown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
  document.removeEventListener('mousedown', handleGlobalMousedown)
})
</script>

<style scoped lang="scss">
.search-dropdown {
  position: relative;
  flex-shrink: 0;
  /* 输入框与下拉面板统一宽度 */
  --search-width: 262px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 7px;
  width: var(--search-width);
  height: 30px;
  padding: 0 8px 0 10px;
  border-radius: var(--app-radius-sm);
  background: var(--ui-control);
  border: 1px solid var(--ui-border);
  cursor: text;
  transition: border-color var(--app-transition), background-color var(--app-transition);

  &:hover {
    border-color: var(--ui-border-strong);
  }

  &:focus-within {
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

  .search-shortcut {
    flex-shrink: 0;
    height: 18px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    border-radius: 3px;
    background: var(--ui-elevated);
    border: 1px solid var(--ui-border);
    font-size: 10px;
    letter-spacing: 0.3px;
    color: var(--ui-text-muted);
  }
}

.search-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: var(--search-width);
  max-height: 340px;
  overflow-y: auto;
  padding: var(--app-radius-sm);
  background: var(--ui-elevated);
  border: 1px solid var(--ui-border-strong);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-hover-shadow);
  z-index: 1000;

  &::-webkit-scrollbar {
    width: var(--app-scrollbar-size);
  }

  &::-webkit-scrollbar-track {
    background: var(--app-scrollbar-track);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--app-scrollbar-thumb);
    border-radius: var(--app-scrollbar-size);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--app-scrollbar-thumb-hover);
  }
}

.group-label {
  padding: 6px 8px 4px;
  font-size: 11px;
  letter-spacing: 0.3px;
  color: var(--ui-text-faint);
  user-select: none;
}

.command-item {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: var(--app-radius-sm);
  background: transparent;
  color: var(--ui-text);
  font-family: inherit;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--app-transition);

  .command-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--ui-text-muted);
  }

  .command-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    :deep(mark) {
      background: transparent;
      color: var(--ui-accent);
      font-weight: 600;
    }
  }

  &:hover,
  &.is-active {
    background: var(--ui-control);
  }
}

.search-empty {
  padding: 12px 8px;
  font-size: 12px;
  color: var(--ui-text-muted);
  text-align: center;
  user-select: none;
}
</style>
