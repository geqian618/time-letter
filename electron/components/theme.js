// 主进程主题：nativeTheme 跟随 / 设置，主题偏好持久化到应用配置文件 settings.json（与语言同文件）
const {nativeTheme, BrowserWindow} = require('electron')

const {readAppSettings, writeAppSettings} = require('../utils/app-settings')

// 主题的候选值（存储值：system 为跟随系统）
const THEME_VALUES = ['light', 'dark', 'system']

/**
 * 初始化主题：在 initializeApp 中与 initLanguage 同阶段调用。
 * 读取应用配置中的主题偏好并应用到 nativeTheme
 */
const initTheme = () => {
    const theme = readAppSettings().theme;
    nativeTheme.themeSource = THEME_VALUES.includes(theme) ? theme : 'system';
}

/**
 * 设置主题（theme:set）：应用到 nativeTheme、持久化偏好并同步到所有窗口
 * （图片管理器等副窗口跟随）
 * @param theme {'light' | 'dark' | 'system'}
 */
const setTheme = (theme) => {
    if (!THEME_VALUES.includes(theme)) {
        return
    }
    nativeTheme.themeSource = theme;
    // 持久化主题偏好（合并写入，保留语言等其他字段）
    writeAppSettings({theme});
    // 同步主题到所有窗口（图片管理器等副窗口跟随）
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('theme:changed', theme));
}

module.exports = {initTheme, setTheme}
