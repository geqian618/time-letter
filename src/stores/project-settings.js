import {ref, computed, watch} from 'vue'
import {defineStore} from 'pinia'
import _ from 'lodash'

import StorageManager from '@/object/storage-manager'

import {defaultProjectSettings} from '@/config/default-project-settings'

export const useProjectSettingsStore = defineStore('projectSettings', () => {

    const projectSettings = ref(_.cloneDeep(defaultProjectSettings))

    // availableFonts 为运行时维护的可用字体缓存（Map），随设置一并持久化
    projectSettings.value.availableFonts = new Map()

    const availableFonts = computed(() => {
        return Array.from(projectSettings.value.availableFonts.values())
    })

    const isHideDeleteTips = computed(() => {
        return !projectSettings.value.others.deleteTipVisible
    })

    // 任意设置变化时持久化到本地
    watch(projectSettings, (newVal) => {
        const clonedSettings = _.cloneDeep(newVal);
        clonedSettings.availableFonts = Array.from(clonedSettings.availableFonts.entries())
        StorageManager.saveProjectSettings(clonedSettings)
    }, {
        deep: true
    });

    const loadProjectSettings = () => {
        const userConfig = StorageManager.getProjectSettings();
        if (userConfig) {
            const newUserConfig = _.merge({}, projectSettings.value, userConfig);
            newUserConfig.availableFonts = new Map(newUserConfig.availableFonts)
            projectSettings.value = newUserConfig
            StorageManager.saveProjectSettings(newUserConfig)
        }
    }

    // 合并导入的设置（返回合并后的完整设置对象）
    const mergeProjectSettings = (userSettings) => {
        const newUserSettings = _.merge({}, projectSettings.value, userSettings);
        projectSettings.value = newUserSettings
        StorageManager.saveProjectSettings(newUserSettings)
        return newUserSettings
    }

    // 重置项目设置为工厂默认值（返回重置后的完整设置对象）
    const resetProjectSettings = () => {
        const newUserSettings = _.cloneDeep(defaultProjectSettings);
        // availableFonts 属于运行时维护的字体缓存，重置时保留
        newUserSettings.availableFonts = projectSettings.value.availableFonts
        projectSettings.value = newUserSettings
        StorageManager.saveProjectSettings(newUserSettings)
        return newUserSettings
    }

    // 获取工厂默认设置的深拷贝（避免外部直接引用默认值对象）
    const getDefaultProjectSettings = () => {
        return _.cloneDeep(defaultProjectSettings)
    }

    const deleteTipsDialogVisible = () => {
        projectSettings.value.others.deleteTipVisible = !projectSettings.value.others.deleteTipVisible
    }

    return {
        // 状态操作
        loadProjectSettings,
        mergeProjectSettings,
        resetProjectSettings,
        getDefaultProjectSettings,
        deleteTipsDialogVisible,
        projectSettings,
        availableFonts,
        isHideDeleteTips,
    }
})
