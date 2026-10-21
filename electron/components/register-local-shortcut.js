const localshortcut = require('electron-localshortcut')
const {defaultShortcuts} = require('../../src/config/default-project-settings')

// 画布类快捷键 → 渲染进程右键菜单命令 type
const LOCAL_SHORTCUT_ACTIONS = {
    removeImage: 1,
    deleteImage: 2,
    savePreset: 4,
    clearCanvas: 6,
    resetCanvas: 7
}

const registerLocalShortcut = (window, shortcuts = defaultShortcuts) => {
    // 快捷键变更后重新注册前先注销，避免旧按键残留
    localshortcut.unregisterAll(window)

    for (const [action, type] of Object.entries(LOCAL_SHORTCUT_ACTIONS)) {
        const register = (accelerator) => {
            localshortcut.register(window, accelerator, () => {
                window.webContents.send('contextMenu:watch', {type});
            });
        };
        try {
            register(shortcuts[action] || defaultShortcuts[action]);
        } catch (e) {
            // 导入的设置可能包含非法按键：回落到默认快捷键，避免主进程抛错
            register(defaultShortcuts[action]);
        }
    }
}

module.exports = registerLocalShortcut
