const {Tray, Menu, app} = require('electron')
const path = require('path')
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('../constant/project-constants')
const {t} = require('../locales')

let tray = null

let trayWindow = null

const createTray = (window) => {

    // macOS 下所有窗口关闭后应用仍存活，激活时会重新走 createMainWindow → createTray，
    // 先销毁旧托盘避免图标重复
    if (tray && !tray.isDestroyed()) {
        tray.destroy()
    }

    trayWindow = window

    tray = new Tray(APP_ICON_PATH);

    tray.setToolTip(APP_NAME)

    const contextMenu = Menu.buildFromTemplate([
        {label: t('menu.quit'), type: 'normal', click: () => app.quit()}
    ]);

    if (process.platform === 'darwin') {
        // macOS：设置常驻菜单后左键只会弹出菜单，无法再用点击切换窗口显隐，改为左键切换窗口、右键弹出菜单
        tray.on('right-click', () => {
            tray.popUpContextMenu(contextMenu)
        });
    } else {
        // Windows / Linux：常驻菜单；部分 Linux 桌面环境（appindicator）不触发，click 事件，此时左键弹出菜单仍可用
        tray.setContextMenu(contextMenu);
    }

    tray.on('click', () => {
        // 窗口显示点击托盘图标隐藏窗口，窗口隐藏点击托盘图标显示窗口
        if (!trayWindow || trayWindow.isDestroyed()) return
        trayWindow.isVisible() ? trayWindow.hide() : trayWindow.show()
    });

    return tray;
}


module.exports = {createTray}
