const {Menu, dialog, app} = require('electron')

let window;

const createContextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '移除图片',
            accelerator: 'CommandOrControl+D',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 0});
            }
        },
        {
            label: '清空画布',
            accelerator: 'CommandOrControl+L',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 4});
            }
        },
        {
            label: '重置画布',
            accelerator: 'CommandOrControl+R',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 5});
            }
        },
        {
            label: '同步配置',
            submenu: [
                {
                    label: '按固定数值同步',
                    click: () => synchronizeTemplate(0)
                },
                {
                    label: '按比例同步',
                    click: () => synchronizeTemplate(1)
                }
            ]
        },
        {
            label: '保存为预设',
            accelerator: 'CommandOrControl+T',
            click: saveTemplate
        },
        {
            label: '导出图片',
            accelerator: 'CommandOrControl+O',
            click: saveFiles
        }
    ])
};


const saveTemplate = () => {
    window.webContents.send('watch-contextMenu', {type: 2})
}

const synchronizeTemplate = (method) => {
    window.webContents.send('watch-contextMenu', {type: 3, method})
}


/**
 * 图片导出
 */
const saveFiles = async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导出',
        defaultPath: app.getPath('desktop'),
        properties: ['openDirectory', 'createDirectory']
    })
    if (!canceled && filePaths) {
        window.webContents.send('watch-contextMenu', {type: 1, outputDirectory: filePaths[0]})
    }
}

module.exports = createContextMenu
