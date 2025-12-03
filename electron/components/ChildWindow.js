const {BrowserWindow} = require('electron')
const environment = process.env.NODE_ENV
const path = require('path')
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('../constant/ProjectConstants')

let childWindow;

const createChildWindow = () => {
    childWindow = new BrowserWindow({
        width: 600,
        height: 400,
        maxWidth: 600,
        minWidth: 600,
        maxHeight: 400,
        minHeight: 400,
        icon: APP_ICON_PATH,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            // 重要：禁用不安全选项
            webSecurity: true, // 保持启用安全策略
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    if (environment === 'development') {
        // 开发环境加载 URL
        // childWindow.loadURL('http://localhost:5173/')
        childWindow.loadURL(`file://${path.join(__dirname, '../windows/About.html')}`)
        // 打开开发者工具
        // window.webContents.openDevTools()
    } else {
        // 生产环境加载本地文件系统中的文件
        childWindow.loadURL(`file://${path.join(__dirname, '../windows/About.html')}`)
    }

    childWindow.on('ready-to-show', () => {
        childWindow.show()
    })
}


const closeWindow = () => {
    if (childWindow && childWindow.isActive) {
        childWindow = null;
    }
}


module.exports = {createChildWindow, closeWindow}
