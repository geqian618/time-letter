const {Menu, dialog, app} = require('electron')
const {t} = require('../locales')

let window;

const createContextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: t('menu.removeImage'),
            accelerator: 'CommandOrControl+D',
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 1});
            }
        },
        {
            label: t('menu.deleteImage'),
            accelerator: 'CommandOrControl+Alt+D',
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 2});
            }
        },
        {
            label: t('menu.clearCanvas'),
            accelerator: 'CommandOrControl+L',
            click: () => {
                window.webContents.send('contextMenu:watch', {type: 6});
            }
        },
        {
            label: t('menu.resetCanvas'),
            accelerator: 'CommandOrControl+R',
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
            accelerator: 'CommandOrControl+T',
            click: saveTemplate
        },
        {
            label: t('menu.exportImages'),
            accelerator: 'CommandOrControl+O',
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
