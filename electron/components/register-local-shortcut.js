const localshortcut  = require('electron-localshortcut')

const registerLocalShortcut = (window) => {

    // 使用 electron-localshortcut 注册快捷键
    localshortcut.register(window, 'CommandOrControl+D', () => {
        window.webContents.send('contextMenu:watch', { type: 1 });
    });

    localshortcut.register(window, 'CommandOrControl+Alt+D', () => {
        window.webContents.send('contextMenu:watch', { type: 2 });
    });

    localshortcut.register(window, 'CommandOrControl+L', () => {
        window.webContents.send('contextMenu:watch', { type: 6 });
    });

    localshortcut.register(window, 'CommandOrControl+R', () => {
        window.webContents.send('contextMenu:watch', { type: 7 });
    });

    localshortcut.register(window, 'CommandOrControl+T', () => {
        window.webContents.send('contextMenu:watch', { type: 4 });
    });
}

module.exports = registerLocalShortcut
