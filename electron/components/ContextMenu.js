const {Menu} = require('electron')
const contextMenu = (window) => {
    return Menu.buildFromTemplate([
        {
            label: '删除',
            accelerator: 'ctrl+d',
            click: () => {
                window.webContents.send('watch-contextMenu', {type: 0});
            }
        }
    ])
};

module.exports = contextMenu
