import {ref, computed, watch} from 'vue'
import {defineStore} from 'pinia'

import {TextResource} from '@/object/Configuration'

import i18n from '@/locales'

export const useTextResourcesStore = defineStore('textResources', () => {

    // 数据文件在 data/text-resources.json，读写都交给主进程，不再走浏览器持久化插件
    const textResources = ref(window.electronAPI?.persistedStorage.getItem('text-resources') ?? [])

    const textResource = ref(new TextResource())

    // 弹窗模式：0 新增 / 1 编辑
    const handleTextResourceType = ref(0)

    const textResourceDialogVisible = ref(false)

    const editorImageLabelDialogVisible = ref(false)

    const textResourceManagerDialogVisible = ref(false)

    const textResourceDialogTitle = computed(() => {
        return i18n.global.t(handleTextResourceType.value === 0 ? 'textResource.addTitle' : 'textResource.editTitle')
    })
    
    watch(textResources, value => window.electronAPI?.persistedStorage.setItem('text-resources', JSON.parse(JSON.stringify(value))), {deep: true})

    return {
        textResources,
        textResource,
        handleTextResourceType,
        textResourceDialogVisible,
        editorImageLabelDialogVisible,
        textResourceManagerDialogVisible,
        textResourceDialogTitle,
    }
})
