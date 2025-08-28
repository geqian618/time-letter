const {Menu, dialog, app} = require('electron')

let window;

const contextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '删除图片',
            accelerator: 'ctrl+d',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 0});
            }
        },
        {
            label: '清空标签',
            accelerator: 'ctrl+l',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 4});
            }
        },
        {
            label: '重置配置',
            accelerator: 'ctrl+r',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 5});
            }
        },
        {
            label: '导出图片',
            accelerator: 'ctrl+o',
            click: saveFiles
        },
        {
            label: '同步配置',
            accelerator: 'ctrl+u',
            submenu: [
                {
                    label: '按固定值同步位置',
                    click: () => synchronizeTemplate(0)
                },
                {
                    label: '按比例同步位置',
                    click: () => synchronizeTemplate(1)
                }
            ]
        },
        {
            label: '保存为预设',
            accelerator: 'ctrl+t',
            click: saveTemplate
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
        // defaultPath: app.getPath('desktop'),
        properties: ['multiSelections', 'createDirectory', 'openFile', "openDirectory"]
    })
    if (!canceled && filePaths) {
        window.webContents.send('watch-contextMenu', {type: 1, outputDirectory: filePaths[0]})
    }
}

module.exports = contextMenu
