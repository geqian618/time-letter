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


function getSafeImagePath(absolutePath) {
    if (process.platform === 'win32') {
        // Windows路径处理: C:\foo → /C:/foo
        const drivePath = absolutePath.replace(/\\/g, '/')
        return `app://${drivePath}`
    }
    // Linux/macOS处理: /foo/bar → /foo/bar
    return `app://${absolutePath}`
}

module.exports = {getResourcePath, getFontPath, getSafeImagePath}
