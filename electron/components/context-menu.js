const {Menu, dialog, app} = require('electron')
const {t} = require('../locales')
const {defaultShortcuts} = require('../../src/config/default-project-settings')

let window;

const createContextMenu = (mainWindow, shortcuts = defaultShortcuts) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: t('menu.removeImage'),
            accelerator: shortcuts.removeImage,
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 1});
            }
        },
        {
            label: t('menu.deleteImage'),
            accelerator: shortcuts.deleteImage,
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 2});
            }
        },
        {
            label: t('menu.clearCanvas'),
            accelerator: shortcuts.clearCanvas,
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 6});
            }
        },
        {
            label: t('menu.resetCanvas'),
            accelerator: shortcuts.resetCanvas,
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 7});
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
    window.webContents.send('contextMenu:watch', {type: 4})
}

const synchronizeTemplate = (method) => {
    window.webContents.send('contextMenu:watch', {type: 5, method})
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
        window.webContents.send('contextMenu:watch', {type: 3, outputDirectory: filePaths[0]})
    }
}

module.exports = createContextMenu
