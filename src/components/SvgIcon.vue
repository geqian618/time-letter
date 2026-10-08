<template>
  <component v-if="icon" :is="icon"/>
</template>

<script setup lang="js">
// 统一图标组件：全部 SVG 由 vite-svg-loader 编译为组件后集中注册，模板中直接 <SvgIcon name="xxx"/>
// - name 为 src/assets/icon/ 下的文件名（不含扩展名）
// - class / style / width 等属性透传到 svg 根元素；尺寸沿用各处已有的 CSS 规则
// - 本文件位于 unplugin-vue-components 扫描目录内，使用处无需 import
import {computed} from 'vue'

import AlignBottomIcon from '@/assets/icon/align-bottom.svg'
import AlignCenterHIcon from '@/assets/icon/align-center-h.svg'
import AlignCenterVIcon from '@/assets/icon/align-center-v.svg'
import AlignLeftIcon from '@/assets/icon/align-left.svg'
import AlignRightIcon from '@/assets/icon/align-right.svg'
import AlignTopIcon from '@/assets/icon/align-top.svg'
import CenterCanvasIcon from '@/assets/icon/center-canvas.svg'
import CheckIcon from '@/assets/icon/check.svg'
import ChevronUpIcon from '@/assets/icon/chevron-up.svg'
import CmdDocInIcon from '@/assets/icon/cmd-doc-in.svg'
import CmdDocLinesIcon from '@/assets/icon/cmd-doc-lines.svg'
import CmdDocOutIcon from '@/assets/icon/cmd-doc-out.svg'
import CmdDropletIcon from '@/assets/icon/cmd-droplet.svg'
import CmdExportIcon from '@/assets/icon/cmd-export.svg'
import CmdFolderIcon from '@/assets/icon/cmd-folder.svg'
import CmdGridIcon from '@/assets/icon/cmd-grid.svg'
import CmdImportIcon from '@/assets/icon/cmd-import.svg'
import CmdInfoIcon from '@/assets/icon/cmd-info.svg'
import CmdMoonIcon from '@/assets/icon/cmd-moon.svg'
import CmdPanelBIcon from '@/assets/icon/cmd-panel-b.svg'
import CmdPanelLIcon from '@/assets/icon/cmd-panel-l.svg'
import CmdPanelRIcon from '@/assets/icon/cmd-panel-r.svg'
import CmdSlidersIcon from '@/assets/icon/cmd-sliders.svg'
import CmdTextIcon from '@/assets/icon/cmd-text.svg'
import CustomIcon from '@/assets/icon/custom.svg'
import DateIcon from '@/assets/icon/date.svg'
import DatetimeIcon from '@/assets/icon/datetime.svg'
import DistributeHIcon from '@/assets/icon/distribute-h.svg'
import DistributeVIcon from '@/assets/icon/distribute-v.svg'
import EmptyUploadIcon from '@/assets/icon/empty-upload.svg'
import ExpandBottomIcon from '@/assets/icon/expand-bottom.svg'
import ExportIcon from '@/assets/icon/export.svg'
import FitViewIcon from '@/assets/icon/fit-view.svg'
import PanelCollapseBottomIcon from '@/assets/icon/panel-collapse-bottom.svg'
import PanelCollapseLeftIcon from '@/assets/icon/panel-collapse-left.svg'
import PanelCollapseRightIcon from '@/assets/icon/panel-collapse-right.svg'
import PlusIcon from '@/assets/icon/plus.svg'
import RefreshIcon from '@/assets/icon/refresh.svg'
import SearchIcon from '@/assets/icon/search.svg'
import SelectAllIcon from '@/assets/icon/select-all.svg'
import SetLanguageIcon from '@/assets/icon/set-language.svg'
import SetOthersIcon from '@/assets/icon/set-others.svg'
import StepFirstIcon from '@/assets/icon/step-first.svg'
import StepLastIcon from '@/assets/icon/step-last.svg'
import StepNextIcon from '@/assets/icon/step-next.svg'
import StepPrevIcon from '@/assets/icon/step-prev.svg'
import TextIcon from '@/assets/icon/text.svg'
import WinCloseIcon from '@/assets/icon/win-close.svg'
import WinMaximizeIcon from '@/assets/icon/win-maximize.svg'
import WinMinimizeIcon from '@/assets/icon/win-minimize.svg'
import WinRestoreIcon from '@/assets/icon/win-restore.svg'
import ZoomMinusIcon from '@/assets/icon/zoom-minus.svg'
import ZoomPlusIcon from '@/assets/icon/zoom-plus.svg'

const registry = {
  'align-bottom': AlignBottomIcon,
  'align-center-h': AlignCenterHIcon,
  'align-center-v': AlignCenterVIcon,
  'align-left': AlignLeftIcon,
  'align-right': AlignRightIcon,
  'align-top': AlignTopIcon,
  'center-canvas': CenterCanvasIcon,
  'check': CheckIcon,
  'chevron-up': ChevronUpIcon,
  'cmd-doc-in': CmdDocInIcon,
  'cmd-doc-lines': CmdDocLinesIcon,
  'cmd-doc-out': CmdDocOutIcon,
  'cmd-droplet': CmdDropletIcon,
  'cmd-export': CmdExportIcon,
  'cmd-folder': CmdFolderIcon,
  'cmd-grid': CmdGridIcon,
  'cmd-import': CmdImportIcon,
  'cmd-info': CmdInfoIcon,
  'cmd-moon': CmdMoonIcon,
  'cmd-panel-b': CmdPanelBIcon,
  'cmd-panel-l': CmdPanelLIcon,
  'cmd-panel-r': CmdPanelRIcon,
  'cmd-sliders': CmdSlidersIcon,
  'cmd-text': CmdTextIcon,
  'custom': CustomIcon,
  'date': DateIcon,
  'datetime': DatetimeIcon,
  'distribute-h': DistributeHIcon,
  'distribute-v': DistributeVIcon,
  'empty-upload': EmptyUploadIcon,
  'expand-bottom': ExpandBottomIcon,
  'export': ExportIcon,
  'fit-view': FitViewIcon,
  'panel-collapse-bottom': PanelCollapseBottomIcon,
  'panel-collapse-left': PanelCollapseLeftIcon,
  'panel-collapse-right': PanelCollapseRightIcon,
  'plus': PlusIcon,
  'refresh': RefreshIcon,
  'search': SearchIcon,
  'select-all': SelectAllIcon,
  'set-language': SetLanguageIcon,
  'set-others': SetOthersIcon,
  'step-first': StepFirstIcon,
  'step-last': StepLastIcon,
  'step-next': StepNextIcon,
  'step-prev': StepPrevIcon,
  'text': TextIcon,
  'win-close': WinCloseIcon,
  'win-maximize': WinMaximizeIcon,
  'win-minimize': WinMinimizeIcon,
  'win-restore': WinRestoreIcon,
  'zoom-minus': ZoomMinusIcon,
  'zoom-plus': ZoomPlusIcon,
}

const props = defineProps({
  name: {type: String, required: true},
})

const icon = computed(() => {
  const resolved = registry[props.name]
  if (!resolved && import.meta.env.DEV) {
    console.warn(`[SvgIcon] 未注册的图标名: "${props.name}"`)
  }
  return resolved
})
</script>
