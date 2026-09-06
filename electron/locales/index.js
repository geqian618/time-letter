const i18next = require('i18next')
const settingsManager = require('../utils/settings-manager')

const zhCN = require('./languages/zh-CN.js')
const en = require('./languages/en.js')


// 语言设置的候选值（存储值：system 为跟随系统）
const LANGUAGES = ['system', 'zh-CN', 'en']

/**
 * 跟随系统时按系统语言解析：zh* → 中文，其余 → English
 * @returns {string}
 */
const resolveSystemLanguage = () => {
    const systemLocale = Intl.DateTimeFormat().resolvedOptions().locale || ''
    return systemLocale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

/**
 * 将语言设置解析为实际语言
 * @param language {string} 配置的语言偏好（'system' | 'zh-CN' | 'en'）
 * @returns {string}
 */
const resolveLanguage = (language) => {
    return language === 'system' ? resolveSystemLanguage() : language
}

/**
 * 初始化语言：在 initializeApp 中与 initTheme 同阶段调用。
 * 读取应用配置中的语言偏好，并以解析后的语言初始化 i18next
 */
const initLanguage = () => {
    // 当前配置的语言偏好（配置文件不存在或解析失败时使用默认值）
    let language = 'system'
    const configured = settingsManager.read().language
    if (LANGUAGES.includes(configured)) {
        language = configured
    }

    i18next.init({
        lng: resolveLanguage(language),
        fallbackLng: 'zh-CN',
        resources: {
            'zh-CN': {translation: zhCN},
            en: {translation: en},
        },
        interpolation: {escapeValue: false}
    })
}

const t = (key, options) => i18next.t(key, options)

/**
 * 运行时切换语言（language:set）：重新解析并应用
 * @param language {string} 配置的语言偏好
 * @returns {string} 解析后的实际语言
 */
const changeLanguage = (language) => {
    const resolved = resolveLanguage(language);
    i18next.changeLanguage(resolved)
    return resolved
}

/**
 * 切换语言：持久化偏好（合并写入，保留主题等其他字段）并切换 i18next 语言，返回解析后的实际语言
 * @param language
 * @returns {string}
 */
const setLanguage = (language) => {
    if (!LANGUAGES.includes(language)) return i18next.language
    settingsManager.write({language})
    return changeLanguage(language)
}

module.exports = {initLanguage, t, setLanguage, changeLanguage, resolveLanguage, LANGUAGES}
