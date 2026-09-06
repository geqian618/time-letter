// 国际化入口：创建 vue-i18n 实例，并统一提供语言解析 / 切换的组合式方法
import {computed} from 'vue'
import {createI18n, useI18n} from 'vue-i18n'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import enLocale from 'element-plus/es/locale/lang/en'

import useEventListener from '@/composables/common/useEventListener'
import {useProjectSettingsStore} from '@/stores/project-settings'

import zhCN from './languages/zh-CN.js'
import en from './languages/en.js'

// 语言设置的候选值（存储值：system 为跟随系统）
export const LANGUAGES = ['system', 'zh-CN', 'en']

// 语言下拉框选项：中英文项以各自语言原生名称显示
export const languageOptions = [
    {value: 'system', labelKey: 'settings.languageSystem'},
    {value: 'zh-CN', label: '中文'},
    {value: 'en', label: 'English'},
]


const getLanguage = () => {
    try {
        const settings = JSON.parse(localStorage.getItem('projectSettings')) || {}
        const language = settings.locale?.language
        return LANGUAGES.includes(language) ? language : 'system'
    } catch (e) {
        return 'system'
    }
}

// 跟随系统时按浏览器语言解析：zh* → 中文，其余 → English
const resolveSystemLocale = () => {
    return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

// 将语言设置解析为实际 locale
const resolveLocale = (language) => {
    return language === 'system' ? resolveSystemLocale() : language
}


const renderLanguage = (language) => {
    const resolved = resolveLocale(language)
    i18n.global.locale.value = resolved
    document.documentElement.lang = resolved
}

// 应用语言设置变化，并把原始设置值同步给主进程（跟随系统时主进程自行解析系统语言）；
// 变更点（语言下拉切换 / 设置导入 / 恢复默认）显式调用本方法
export const applyLanguage = (language) => {
    renderLanguage(language)
    window.electronAPI?.setLanguage?.(language)
}

// 语言组合式函数：在根组件调用一次，返回 el-config-provider 所需的组件库 locale；
// 并登记初始语言应用、跟随系统重解析与独立窗口广播跟随
export const useLanguage = () => {

    const settingsStore = useProjectSettingsStore()

    const {locale} = useI18n()

    // Element Plus 组件库内置文案跟随界面语言
    const elementLocale = computed(() => locale.value === 'en' ? enLocale : zhCn)

    // 应用持久化的初始语言（App.vue setup 阶段同步执行，先于首次渲染，无闪烁）
    renderLanguage(settingsStore.projectSettings.locale?.language || 'system')

    // 跟随系统模式：系统语言变化时重新解析
    useEventListener(window, 'languagechange', () => {
        if (settingsStore.projectSettings.locale?.language === 'system') {
            applyLanguage('system')
        }
    })

    // 独立窗口（图片管理器）跟随主窗口切换语言的广播
    window.electronAPI?.watchLanguageChanged?.((event, resolvedLocale) => {
        i18n.global.locale.value = resolvedLocale
        document.documentElement.lang = resolvedLocale
    })

    return {elementLocale, applyLanguage}
}


// 国际化实例（挂载前确定初始语言，避免首屏语言闪烁）
const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: resolveLocale(getLanguage()),
    fallbackLocale: 'zh-CN',
    messages: {
        'zh-CN': zhCN,
        en: en,
    },
})

export default i18n
