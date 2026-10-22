const path = require('path');
const {app} = require('electron');

// 安装目录：开发环境为项目根目录，打包后为可执行文件所在目录
const getInstallDir = () => {
    return process.env.NODE_ENV === 'development'
        ? process.cwd()
        : path.dirname(app.getPath('exe'))
}

// 应用配置目录：安装目录/config；macOS / Linux 安装位置可能只读（DMG / AppImage），
// 回退到系统标准用户目录（与默认 userData 同级）
const getConfigDir = () => {
    return process.env.NODE_ENV === 'development' || process.platform === 'win32'
        ? path.join(getInstallDir(), 'config')
        : path.join(app.getPath('appData'), app.getName(), 'config')
}

// 应用偏好配置文件（config/settings.json）：主题 / 语言 / 快捷键等模块共用
const getSettingsFilePath = () => {
    return path.join(getConfigDir(), 'settings.json');
}

const getResourcePath = () => {
    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'electron', 'resources', 'resources')
        : path.join(process.resourcesPath, 'resources')

}

const getFontPath = () => {
    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'electron', 'resources', 'fonts')
        : path.join(process.resourcesPath, 'fonts');
}


/**
 * 路径分段编码：标准化分隔符后逐段 encodeURIComponent，确保中文正确编码而斜杠保持不变
 */
function encodeLocalPath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
    }
    // 标准化路径分隔符并移除多余斜杠
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    const pathSegments = normalizedPath.split('/');
    const encodedSegments = pathSegments.map(segment => segment ? encodeURIComponent(segment) : '');
    return encodedSegments.join('/');
}

function localPathToUrl(filePath) {
    return `app:///${encodeLocalPath(filePath)}`;
}

/**
 * 缩略图协议 URL：由主进程按需生成小图，供预览列表加载，避免直接解码原图
 */
function localPathToThumbUrl(filePath) {
    return `thumb:///${encodeLocalPath(filePath)}`;
}

module.exports = {getConfigDir, getSettingsFilePath, getResourcePath, getFontPath, localPathToUrl, localPathToThumbUrl}
