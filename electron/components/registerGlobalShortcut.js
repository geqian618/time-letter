const {globalShortcut} = require('electron')

const registerGlobalShortcut = (window) => {

    globalShortcut.register('CommandOrControl+D', () => {
        window.webContents.send('watch-contextMenu', {type: 0});
    })

    globalShortcut.register('CommandOrControl+L', () => {
        window.webContents.send('watch-contextMenu', {type: 4});
    })

    globalShortcut.register('CommandOrControl+R', () => {
        window.webContents.send('watch-contextMenu', {type: 5});
    })

    globalShortcut.register('CommandOrControl+T', () => {
        window.webContents.send('watch-contextMenu', {type: 2})
    })

}

module.exports = registerGlobalShortcut
