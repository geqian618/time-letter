import {ref, watch, nextTick} from 'vue'
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

    // 待提交的预设保存数据：{templateName, settings}，同名确认弹窗与直接新增共用
    const pendingTemplate = ref(null)

    const saveExistsDialogVisible = ref(false)

    // 提交一次预设保存：overwrite 为 true 时覆盖同名条目（保留原 id 与列表位置），否则追加新预设
    const commitTemplateSave = async (overwrite = false) => {
        const pending = pendingTemplate.value
        if (!pending) return
        const newTemplates = [...templates.value]
        const index = newTemplates.findIndex(template => template.templateName === pending.templateName)
        if (overwrite && index >= 0) {
            newTemplates.splice(index, 1, {
                templateId: newTemplates[index].templateId,
                templateName: pending.templateName,
                settings: pending.settings
            })
        } else {
            newTemplates.push({
                templateId: Date.now(),
                templateName: pending.templateName,
                settings: pending.settings
            })
        }
        // 重新赋值以触发模版列表重新渲染
        templates.value = []
        await nextTick();
        templates.value = newTemplates;
        pendingTemplate.value = null
        saveExistsDialogVisible.value = false
        saveTemplateDialogVisible.value = false
        newTemplate.value.templateName = ''
    }

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
        pendingTemplate,
        saveExistsDialogVisible,
        commitTemplateSave,
    }
})
