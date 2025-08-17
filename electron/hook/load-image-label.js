const path = require('path');
const fs = require('fs');
const {getResourcePath} = require('../utils/resource-path')
const resourcesPath = getResourcePath()

function getSafeImagePath(absolutePath) {
    if (process.platform === 'win32') {
        // Windows路径处理: C:\foo → /C:/foo
        const drivePath = absolutePath.replace(/\\/g, '/')
        return `app://${drivePath}`
    }
    // Linux/macOS处理: /foo/bar → /foo/bar
    return `app://${absolutePath}`
}


const loadImageLabels = (window) => {
    fs.readdir(resourcesPath, (err, fileNames) => {
        const files = fileNames.map((fileName) => {
            const extname = path.extname(fileName).slice(1);
            return {
                filename: fileName,
                url: getSafeImagePath(path.join(resourcesPath, fileName)),
                path: path.join(resourcesPath, fileName),
                extname: extname
            };
        })
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-editor-label', {type: 0, data, event: 0})
    });
}


module.exports = loadImageLabels
