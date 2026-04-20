const {globalShortcut} = require('electron')

const registerGlobalShortcut = (window) => {

    globalShortcut.register('ctrl+d', () => {
        window.webContents.send('watch-contextMenu', {type: 0});
    })

    globalShortcut.register('ctrl+l', () => {
        window.webContents.send('watch-contextMenu', {type: 4});
    })

    globalShortcut.register('ctrl+r', () => {
        window.webContents.send('watch-contextMenu', {type: 5});
    })

    globalShortcut.register('ctrl+t', () => {
        window.webContents.send('watch-contextMenu', {type: 2})
    })

}

module.exports = registerGlobalShortcut
