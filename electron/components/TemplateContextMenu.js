const {Menu, dialog, app} = require('electron')

let window;

const contextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '删除',
            click: () => {
                window.webContents.send('watch-template-contextMenu', {type: 0});
            }
        }
    ])
};


module.exports = contextMenu
