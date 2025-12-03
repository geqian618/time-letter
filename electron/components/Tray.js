const {Tray, Menu, app} = require('electron')
const path = require('path')
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('../constant/ProjectConstants')
const createTray = (window) => {

    const tray = new Tray(APP_ICON_PATH);

    tray.setToolTip(APP_NAME)

    const contextMenu = Menu.buildFromTemplate([
        {label: '退出', type: 'normal', click: () => app.quit()}
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        // 窗口显示点击托盘图标隐藏窗口，窗口隐藏点击托盘图标显示窗口
        window.isVisible() ? window.hide() : window.show()
    });

    return tray;
}

module.exports = createTray
