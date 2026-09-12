const path = require('path')
const {app} = require('electron')

// 应用名称
const APP_NAME = '时光信笺';
// 版本
const APP_VERSION = 'v2.0.0';
// 应用图标路径（用 app.getAppPath() 计算，兼容开发环境与打包后整体打包进 main.jsc 的上下文）
const APP_ICON_PATH = path.join(app.getAppPath(), 'electron', 'resources', 'favicon.ico')

const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']

module.exports = {APP_VERSION, APP_NAME, APP_ICON_PATH, IMAGE_TYPES}
