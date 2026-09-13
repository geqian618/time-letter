import {ref} from 'vue'
import {defineStore} from 'pinia'

export const useTemplatesStore = defineStore('templates', () => {

    const templates = ref([])

    const templateSettings = ref({})

    const newTemplate = ref({
        templateName: '',
    })

    const oldTemplate = ref({
        templateId: 0,
        templateName: ''
    })

    const synchronousMode = ref(0);

    const saveTemplateDialogVisible = ref(false)

    const renameTemplateDialogVisible = ref(false)

    const enableTemplateDialogVisible = ref(false)

    return {
        templates,
        templateSettings,
        newTemplate,
        oldTemplate,
        synchronousMode,
        saveTemplateDialogVisible,
        renameTemplateDialogVisible,
        enableTemplateDialogVisible,
    }
}, {
    // 仅持久化 templates：key 为 store id（templates），以纯数组形式读写，与历史本地数据格式一致
    persist: {
        serializer: {
            serialize: (state) => JSON.stringify(state.templates),
            deserialize: (json) => ({templates: JSON.parse(json)})
        }
    }
})
