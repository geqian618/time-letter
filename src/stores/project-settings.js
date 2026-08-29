import {ref, computed, watch} from 'vue'
import {defineStore} from 'pinia'
import _ from 'lodash'

import StorageManager from '@/object/StorageManager'

import {defaultProjectSettings} from '@/config/default-project-settings'

export const useProjectSettingsStore = defineStore('projectSettings', () => {

    const settings = ref(_.cloneDeep(defaultProjectSettings))

    // availableFonts 为运行时维护的可用字体缓存（Map），随设置一并持久化
    settings.value.availableFonts = new Map()

    const availableFonts = computed(() => {
        return Array.from(settings.value.availableFonts.values())
    })

    const isHideDeleteTips = computed(() => {
        return !settings.value.others.deleteTipVisible
    })

    // 任意设置变化时持久化到本地
    watch(settings, (newVal) => {
        const clonedSettings = _.cloneDeep(newVal);
        clonedSettings.availableFonts = Array.from(clonedSettings.availableFonts.entries())
        StorageManager.saveProjectSettings(clonedSettings)
    }, {
        deep: true
    });

    const loadProjectSettings = () => {
        const userConfig = StorageManager.getProjectSettings();
        if (userConfig) {
            const newUserConfig = _.merge({}, settings.value, userConfig);
            newUserConfig.availableFonts = new Map(newUserConfig.availableFonts)
            settings.value = newUserConfig
            StorageManager.saveProjectSettings(newUserConfig)
        }
    }

    // 合并导入的设置（返回合并后的完整设置对象）
    const mergeProjectSettings = (importedSettings) => {
        const newUserSettings = _.merge({}, settings.value, importedSettings);
        settings.value = newUserSettings
        StorageManager.saveProjectSettings(newUserSettings)
        return newUserSettings
    }

    // 重置项目设置为工厂默认值（返回重置后的完整设置对象）
    const resetProjectSettings = () => {
        const newUserSettings = _.cloneDeep(defaultProjectSettings);
        // availableFonts 属于运行时维护的字体缓存，重置时保留
        newUserSettings.availableFonts = settings.value.availableFonts
        settings.value = newUserSettings
        StorageManager.saveProjectSettings(newUserSettings)
        return newUserSettings
    }

    // 获取工厂默认设置的深拷贝（避免外部直接引用默认值对象）
    const getDefaultSettings = () => {
        return _.cloneDeep(defaultProjectSettings)
    }

    const deleteTipsDialogVisible = () => {
        settings.value.others.deleteTipVisible = !settings.value.others.deleteTipVisible
    }

    return {
        settings,
        availableFonts,
        isHideDeleteTips,
        // 状态操作
        loadProjectSettings,
        mergeProjectSettings,
        resetProjectSettings,
        getDefaultSettings,
        deleteTipsDialogVisible,
    }
})
