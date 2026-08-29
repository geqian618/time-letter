import {ref, computed} from 'vue'
import {defineStore} from 'pinia'

import {TextResource} from '@/object/Configuration'

export const useTextResourcesStore = defineStore('textResources', () => {

    const textResources = ref([])

    const textResource = ref(new TextResource())

    // 弹窗模式：0 新增 / 1 编辑
    const handleTextResourceType = ref(0)

    const textResourceDialogVisible = ref(false)

    const editorImageLabelDialogVisible = ref(false)

    const textResourceManagerDialogVisible = ref(false)

    const textResourceDialogTitle = computed(() => {
        return handleTextResourceType.value === 0 ? '新增文本' : '编辑文本'
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
})
