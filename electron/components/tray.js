const {Tray, Menu, app} = require('electron')
const path = require('path')
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('../constant/project-constants')
const {t} = require('../locales')

let tray = null

let trayWindow = null

const createTray = (window) => {

    trayWindow = window

    tray = new Tray(APP_ICON_PATH);

    tray.setToolTip(APP_NAME)

    const contextMenu = Menu.buildFromTemplate([
        {label: t('menu.quit'), type: 'normal', click: () => app.quit()}
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        // 窗口显示点击托盘图标隐藏窗口，窗口隐藏点击托盘图标显示窗口
        trayWindow.isVisible() ? trayWindow.hide() : trayWindow.show()
    });

    return tray;
}


module.exports = {createTray}
