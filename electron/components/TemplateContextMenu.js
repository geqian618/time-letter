const {Menu, dialog, app} = require('electron')

let window;

const createTemplateContextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '删除',
            accelerator: 'ctrl+d',
            click: () => {
                window.webContents.send('watch-template-contextMenu', {type: 0});
            }
        },
        {
            label: '重命名',
            accelerator: 'ctrl+m',
            click: () => {
                window.webContents.send('watch-template-contextMenu', {type: 1});
            }
        }
    ])
};

module.exports = createTemplateContextMenu
