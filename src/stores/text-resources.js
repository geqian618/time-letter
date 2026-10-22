import {ref, computed} from 'vue'
import {defineStore} from 'pinia'

import {TextResource} from '@/object/Configuration'

import i18n from '@/locales'

export const useTextResourcesStore = defineStore('textResources', () => {

    const textResources = ref([])

    const textResource = ref(new TextResource())

    // 弹窗模式：0 新增 / 1 编辑
    const handleTextResourceType = ref(0)

    const textResourceDialogVisible = ref(false)

    const editorImageLabelDialogVisible = ref(false)

    const textResourceManagerDialogVisible = ref(false)

    const textResourceDialogTitle = computed(() => {
        return i18n.global.t(handleTextResourceType.value === 0 ? 'textResource.addTitle' : 'textResource.editTitle')
    })

    return {
        textResources,
        textResource,
        handleTextResourceType,
        textResourceDialogVisible,
        editorImageLabelDialogVisible,
        textResourceManagerDialogVisible,
        textResourceDialogTitle,
    }
}, {
    // 仅持久化 textResources：存储为数据目录下的 text-resources.json（纯数组）
    persist: {
        key: 'text-resources',
        storage: window.electronAPI?.persistedStorage,
        serializer: {
            serialize: (state) => JSON.stringify(state.textResources, null, 2),
            deserialize: (json) => ({textResources: JSON.parse(json)})
        }
    }
})
