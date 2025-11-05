const {Tray, Menu} = require('electron')
const path = require('path')

const createTray = (app, window) => {
    const icon = path.join(__dirname, '../resources/favicon.ico')
    const tray = new Tray(icon);
    tray.setToolTip('时光信笺')

    const contextMenu = Menu.buildFromTemplate([
        {label: '退出', type: 'normal', click: () => app.quit()}
    ]);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        // 窗口显示点击托盘图标隐藏窗口，窗口隐藏点击托盘图标显示窗口
        window.isVisible() ? window.hide() : window.show()
    });
}

module.exports = createTray
