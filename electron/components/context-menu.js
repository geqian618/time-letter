const {Menu, dialog, app} = require('electron')
const {t} = require('../locales')
const {defaultShortcuts} = require('../../src/config/default-project-settings')

let window;

// macOS 关闭主窗口后应用仍存活，应用级菜单仍挂载可点击；
// 发送前统一判存活，避免向已销毁 webContents 发送抛 "Object has been destroyed"
const send = (channel, payload) => {
    if (!window || window.isDestroyed()) return
    window.webContents.send(channel, payload)
}

// 窗口关闭时由主进程调用，释放对已销毁窗口的引用
const dispose = () => {
    window = null
}

const createContextMenu = (mainWindow, shortcuts = defaultShortcuts) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: t('menu.removeImage'),
            accelerator: shortcuts.removeImage,
            click: () => {
                send('contextMenu:watch', {type: 1});
            }
        },
        {
            label: t('menu.deleteImage'),
            accelerator: shortcuts.deleteImage,
            click: () => {
                send('contextMenu:watch', {type: 2});
            }
        },
        {
            label: t('menu.clearCanvas'),
            accelerator: shortcuts.clearCanvas,
            click: () => {
                send('contextMenu:watch', {type: 6});
            }
        },
        {
            label: t('menu.resetCanvas'),
            accelerator: shortcuts.resetCanvas,
            click: () => {
                send('contextMenu:watch', {type: 7});
            }
        },
        {
            label: t('menu.syncConfig'),
            submenu: [
                {
                    label: t('menu.syncByValue'),
                    click: () => synchronizeTemplate(0)
                },
                {
                    label: t('menu.syncByRatio'),
                    click: () => synchronizeTemplate(1)
                }
            ]
        },
        {
            label: t('menu.saveAsPreset'),
            accelerator: shortcuts.savePreset,
            click: saveTemplate
        },
        {
            label: t('menu.exportImages'),
            accelerator: shortcuts.exportImages,
            click: saveFiles
        }
    ])
};


const saveTemplate = () => {
    send('contextMenu:watch', {type: 4})
}

const synchronizeTemplate = (method) => {
    send('contextMenu:watch', {type: 5, method})
}


/**
 * 图片导出
 */
const saveFiles = async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: t('dialog.export'),
        defaultPath: app.getPath('desktop'),
        properties: ['openDirectory', 'createDirectory']
    })
    if (!canceled && filePaths) {
        send('contextMenu:watch', {type: 3, outputDirectory: filePaths[0]})
    }
}

module.exports = {createContextMenu, dispose}
