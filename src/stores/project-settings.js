import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import _ from 'lodash'

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


    const deleteTipsDialogVisible = () => {
        projectSettings.value.others.deleteTipVisible = !projectSettings.value.others.deleteTipVisible
    }


    // 合并导入的设置（返回合并后的完整设置对象）
    const mergeProjectSettings = (userSettings) => {
        const newUserSettings = _.merge({}, projectSettings.value, userSettings);
        projectSettings.value = newUserSettings
        return newUserSettings
    }

    // 重置项目设置为工厂默认值（返回重置后的完整设置对象）
    const resetProjectSettings = () => {
        const newUserSettings = _.cloneDeep(defaultProjectSettings);
        // availableFonts 属于运行时维护的字体缓存，重置时保留
        newUserSettings.availableFonts = projectSettings.value.availableFonts
        projectSettings.value = newUserSettings
        return newUserSettings
    }

    // 获取工厂默认设置的深拷贝（避免外部直接引用默认值对象）
    const getDefaultProjectSettings = () => {
        return _.cloneDeep(defaultProjectSettings)
    }

    return {
        // 状态操作
        mergeProjectSettings,
        resetProjectSettings,
        getDefaultProjectSettings,
        deleteTipsDialogVisible,
        projectSettings,
        availableFonts,
        isHideDeleteTips,
    }
}, {
    // 仅持久化 projectSettings：key 为 store id（projectSettings），与历史本地数据格式一致；
    // availableFonts 为 Map，存储时转为数组、恢复时转回 Map
    persist: {
        serializer: {
            serialize: (state) => {
                const settings = _.cloneDeep(state.projectSettings)
                settings.availableFonts = Array.from(settings.availableFonts?.entries() ?? [])
                return JSON.stringify(settings)
            },
            deserialize: (json) => {
                const settings = JSON.parse(json)
                settings.availableFonts = new Map(Array.isArray(settings.availableFonts) ? settings.availableFonts : [])
                return {projectSettings: settings}
            }
        }
    }
})
