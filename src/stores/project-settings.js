import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import _ from 'lodash'

import {defaultProjectSettings} from '@/config/default-project-settings'

export const useProjectSettingsStore = defineStore('projectSettings', () => {

    const projectSettings = ref(_.cloneDeep(defaultProjectSettings))

    const availableFontsMap = ref(new Map())

    const availableFonts = computed(() => {
        return Array.from(availableFontsMap.value.values())
    })


    const isHideDeleteTips = computed(() => {
        return !projectSettings.value.others.deleteTipVisible
    })


    const deleteTipsDialogVisible = () => {
        projectSettings.value.others.deleteTipVisible = !projectSettings.value.others.deleteTipVisible
    }


    // 合并导入的设置（返回合并后的完整设置对象）；剔除历史版本残留的字体列表字段
    // 与旧版多配色预设字段（uiTheme 已被自定义强调色 uiAccent 取代）
    const mergeProjectSettings = (userSettings) => {
        delete userSettings.availableFonts
        if (userSettings.appearance) {
            delete userSettings.appearance.uiTheme
        }
        const newUserSettings = _.merge({}, projectSettings.value, userSettings);
        projectSettings.value = newUserSettings
        return newUserSettings
    }

    // 重置项目设置为工厂默认值（返回重置后的完整设置对象）
    const resetProjectSettings = () => {
        const newUserSettings = _.cloneDeep(defaultProjectSettings);
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
        availableFontsMap,
        availableFonts,
        isHideDeleteTips,
    }
}, {
    // 仅持久化 projectSettings：key 为 store id（projectSettings），与历史本地数据格式一致；
    // availableFontsMap 为运行时字体缓存（Map），不参与持久化
    persist: {
        serializer: {
            serialize: (state) => JSON.stringify(state.projectSettings),
            deserialize: (json) => ({projectSettings: JSON.parse(json)})
        },
        // 恢复持久化数据后清理历史残留：旧版多配色预设字段（uiTheme 已被 uiAccent 取代）
        afterHydrate: (ctx) => {
            if (ctx.store?.projectSettings?.appearance) {
                delete ctx.store.projectSettings.appearance.uiTheme
            }
            // 旧版本数据没有快捷键字段：补齐默认值，缺少单项时也回落到默认按键
            if (ctx.store?.projectSettings) {
                ctx.store.projectSettings.shortcuts = {
                    ...defaultProjectSettings.shortcuts,
                    ...ctx.store.projectSettings.shortcuts
                }
            }
        }
    }
})
