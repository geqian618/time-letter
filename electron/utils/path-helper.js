const path = require('path');

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

function localPathToProtocolUrl(filePath) {
    return `app:///${encodeLocalPath(filePath)}`;
}

/**
 * 缩略图协议 URL：由主进程按需生成小图，供预览列表加载，避免直接解码原图
 */
function localPathToThumbUrl(filePath) {
    return `thumb:///${encodeLocalPath(filePath)}`;
}

module.exports = {getResourcePath, getFontPath, localPathToProtocolUrl, localPathToThumbUrl}
