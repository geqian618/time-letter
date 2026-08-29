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
})
