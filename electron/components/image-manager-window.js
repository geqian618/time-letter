const {BrowserWindow, nativeTheme, app} = require('electron')
const path = require('path')
const WinState = require('electron-win-state').default

const {APP_ICON_PATH} = require('../constant/project-constants')

const isDev = process.env.NODE_ENV === 'development'

let imageManagerWindow = null

/**
 * 打开图片管理器窗口（单例：已存在则聚焦）
 */
const openImageManagerWindow = () => {
    if (imageManagerWindow && !imageManagerWindow.isDestroyed()) {
        if (imageManagerWindow.isMinimized()) {
            imageManagerWindow.restore()
        }
        imageManagerWindow.focus()
        return
    }

    const isDarkTheme = nativeTheme.themeSource === 'dark' || (nativeTheme.themeSource === 'system' && nativeTheme.shouldUseDarkColors)

    const winState = new WinState({
        defaultWidth: 960,
        defaultHeight: 640,
        electronStoreOptions: {
            name: 'image-manager-window-state'
        }
    })

    imageManagerWindow = new BrowserWindow({
        ...winState.winOptions,
        title: '图片管理器',
        icon: APP_ICON_PATH,
        show: false,
        backgroundColor: isDarkTheme ? '#262626' : '#f5f5f5',
        webPreferences: {
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            // 锚定应用根目录（bundle 打平后 __dirname 与源码目录不一致，参照 ProjectConstants 的处理）
            preload: path.join(app.getAppPath(), 'electron', 'preload', 'index-loader.js')
        }
    })

    // 加载图片管理器页面（与主窗口同源，共享 localStorage 与自定义协议）
    if (isDev) {
        imageManagerWindow.loadURL('http://localhost:5173/#/image-manager')
    } else {
        imageManagerWindow.loadURL('myclient://apps/index.html#/image-manager')
    }

    // 图片管理器窗口不显示应用菜单
    imageManagerWindow.setMenu(null)

    // WinState 管理窗口（持久化位置与大小）
    winState.manage(imageManagerWindow)

    // electron-win-state 不记录最大化状态，手动持久化（winOptions 中保存的仍是还原后的常规尺寸）。
    // 库在 close/closed 上都会 saveState，且内部 state 的 isMaximized 永不更新，
    // 因此这里直接修正 winState.state，交由库自身的保存逻辑落盘，避免被陈旧值覆盖
    if (winState.store.store.isMaximized) {
        imageManagerWindow.maximize()
    }
    imageManagerWindow.on('close', () => {
        winState.state.isMaximized = imageManagerWindow.isMaximized()
    })

    imageManagerWindow.on('ready-to-show', () => {
        imageManagerWindow.show()
    })

    imageManagerWindow.on('closed', () => {
        imageManagerWindow = null
    })

    return imageManagerWindow
}


/**
 * 关闭图片管理器窗口
 */
const closeImageManagerWindow = () => {
    if (imageManagerWindow && !imageManagerWindow.isDestroyed()) {
        imageManagerWindow.close()
    }
}

const getImageManagerWindow = () => imageManagerWindow


module.exports = {openImageManagerWindow, closeImageManagerWindow, getImageManagerWindow}
