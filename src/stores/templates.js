import {ref, watch} from 'vue'
import {defineStore} from 'pinia'

export const useTemplatesStore = defineStore('templates', () => {

    // 数据文件在 data/templates.json，读写都交给主进程，不再走浏览器持久化插件
    const templates = ref(window.electronAPI?.persistedStorage.getItem('templates') ?? [])

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

    watch(templates, value => window.electronAPI?.persistedStorage.setItem('templates', JSON.parse(JSON.stringify(value))), {deep: true})

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
})
