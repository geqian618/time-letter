const {Menu, dialog, app} = require('electron')

let window;

const contextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '删除',
            accelerator: 'ctrl+d',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 0});
            }
        },
        {
            label: '导出',
            accelerator: 'ctrl+o',
            click: saveFiles
        }
    ])
};


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
