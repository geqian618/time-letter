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
    // 仅持久化 templates：存储为数据目录下的 templates.json（纯数组）
    persist: {
        key: 'templates',
        storage: window.electronAPI?.persistedStorage,
        serializer: {
            serialize: (state) => JSON.stringify(state.templates, null, 2),
            deserialize: (json) => ({templates: JSON.parse(json)})
        }
    }
})
