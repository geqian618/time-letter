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


function localPathToProtocolUrl(filePath) {

    if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path');
    }

    // 标准化路径分隔符并移除多余斜杠
    let normalizedPath = filePath
        // 将 \\ 替换为 /
        .replace(/\\/g, '/')
        // 将多个连续斜杠合并为一个
        .replace(/\/+/g, '/');

    // 对路径进行分段编码，确保中文正确编码而斜杠保持不变
    const pathSegments = normalizedPath.split('/');

    const encodedSegments = pathSegments.map(segment =>
        segment ? encodeURIComponent(segment) : ''
    );

    const encodedPath = encodedSegments.join('/');

    return `app:///${encodedPath}`;
}

module.exports = {getResourcePath, getFontPath, localPathToProtocolUrl}
