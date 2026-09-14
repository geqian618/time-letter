const path = require('path')
const {app} = require('electron')

// 应用名称
const APP_NAME = '时光信笺';

// 版本
const APP_VERSION = 'v2.0.0';

// 应用图标路径（用 app.getAppPath() 计算，兼容开发环境与打包后整体打包进 main.jsc 的上下文）
// Windows 使用 ico；macOS / Linux 使用 png（Linux 托盘与窗口图标对 ico 支持不佳，
// macOS dock 图标取自安装包内由 electron-builder 从 png 生成的 icns，不受此项影响）
const APP_ICON_PATH = path.join(
    app.getAppPath(), 'electron', 'resources',
    process.platform === 'win32' ? 'favicon.ico' : 'favicon.png'
)

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

module.exports = {APP_VERSION, APP_NAME, APP_ICON_PATH, IMAGE_TYPES}
