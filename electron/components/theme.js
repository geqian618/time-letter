const {nativeTheme, BrowserWindow} = require('electron')
const settingsManager = require('../utils/settings-manager')


// 主题的候选值（存储值：system 为跟随系统）
const THEMES = ['light', 'dark', 'system']

/**
 * 初始化主题：在 initializeApp 中与 initLanguage 同阶段调用。
 * 读取应用配置中的主题偏好并应用到 nativeTheme
 */
const initTheme = () => {
    const theme = settingsManager.read().theme;
    nativeTheme.themeSource = THEMES.includes(theme) ? theme : 'system';
}

/**
 * 设置主题（theme:set）：应用到 nativeTheme、持久化偏好并同步到所有窗口
 * （图片管理器等副窗口跟随）
 * @param theme {'light' | 'dark' | 'system'}
 */
const setTheme = (theme) => {
    if (!THEMES.includes(theme)) return
    nativeTheme.themeSource = theme;
    // 持久化主题偏好（合并写入，保留语言等其他字段）
    settingsManager.write({theme});
    // 同步主题到所有窗口（图片管理器等副窗口跟随）
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('theme:changed', theme));
}

module.exports = {initTheme, setTheme}
