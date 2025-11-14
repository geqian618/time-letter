const path = require('path');

const getResourcePath = () => {
    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'electron', 'resources', 'images')
        : path.join(process.resourcesPath, 'images')

}

const getFontPath = () => {
    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'electron', 'resources', 'fonts')
        : path.join(process.resourcesPath, 'fonts');
}


function getSafeImagePath(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
    }
    // 标准化路径分隔符并移除多余斜杠
    const normalizedPath = filePath
        // 将 \\ 替换为 /
        .replace(/\\/g, '/')
        // 将多个连续斜杠合并为一个
        .replace(/\/+/g, '/');
    return `app:///${normalizedPath}`;
}

module.exports = {getResourcePath, getFontPath, getSafeImagePath}
