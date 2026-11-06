const {Tray, Menu, app} = require('electron')
const path = require('path')
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('../constant/project-constants')
const {t} = require('../locales')

let tray = null

let trayWindow = null

// 托盘菜单触发的弹窗渲染在主窗口里：窗口可能处于隐藏 / 最小化状态，先唤起再聚焦，
// 否则弹窗打开在隐藏窗口里用户看不到
const focusMainWindow = () => {
    if (!trayWindow || trayWindow.isDestroyed()) return
    if (trayWindow.isMinimized()) trayWindow.restore()
    if (!trayWindow.isVisible()) trayWindow.show()
    trayWindow.focus()
}

const sendToWindow = (channel) => {
    if (!trayWindow || trayWindow.isDestroyed()) return
    trayWindow.webContents.send(channel)
}

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
        // 与应用菜单「关于」/ 顶栏「检查更新」共用渲染层弹窗（AboutDialog / UpdateDialog）
        {
            label: t('menu.checkUpdate'),
            type: 'normal',
            click: () => {
                focusMainWindow()
                sendToWindow('update-dialog:open')
            }
        },
        {
            label: t('menu.about'),
            type: 'normal',
            click: () => {
                focusMainWindow()
                sendToWindow('about-dialog:open')
            }
        },
        {type: 'separator'},
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
