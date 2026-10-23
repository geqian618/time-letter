const path = require('path');
const {app} = require('electron');

// 数据根目录：主进程启动时确定（自定义目录 / 开发与 Windows 的 data / macOS、Linux 用户目录下的 data）
let dataRoot = ''

const setDataRoot = (dir) => {
    dataRoot = dir
}

const getDataRoot = () => {
    if (!dataRoot) throw new Error('数据根目录尚未初始化：setupUserData 必须先于所有路径调用执行')
    return dataRoot
}

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


// 图片库与字体库随用户数据存放，避免安装目录变更 / 覆盖升级时丢失导入的资源
const getResourcePath = () => {
    return path.join(getDataRoot(), 'resources')
}

const getFontPath = () => {
    return path.join(getDataRoot(), 'fonts')
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

module.exports = {setDataRoot, getDataRoot, getConfigDir, getSettingsFilePath, getResourcePath, getFontPath, localPathToUrl, localPathToThumbUrl}
