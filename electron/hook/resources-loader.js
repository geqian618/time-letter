const path = require('path');
const fs = require('fs');
const {getResourcePath, getFontPath} = require('../utils/resource-path')
const resourcesPath = getResourcePath()
const fontPath = getFontPath();
const fontOptions = require('../hook/font-options')

let initialization = true

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
    fs.readdir(resourcesPath, (err, filenames) => {
        const files = filenames.map((filename) => {
            const extname = path.extname(filename).slice(1);
            return {
                filename: filename,
                url: getSafeImagePath(path.join(resourcesPath, filename)),
                path: path.join(resourcesPath, filename),
                extname: extname
            };
        })
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-editor-label', {type: 0, data, event: 0})
    });
}

const loadFonts = (window) => {
    fs.readdir(fontPath, (err, filenames) => {
        const fonts = filenames.map((filename) => {
            const fileParsed = path.parse(filename);
            const font = {
                default: false,
                filename,
                fontFamily: fileParsed.name,
                url: getSafeImagePath(path.join(fontPath, filename)),
                path: path.join(fontPath, filename),
                extname: fileParsed.ext
            };
            return [font.fontFamily, font]
        });

        fonts.forEach(([fontFamily, font]) => fontOptions.set(fontFamily, font))

        if (initialization) {
            window.webContents.send('watch-input-font', {type: 0, data: fontOptions})
            initialization = false
        } else {
            window.webContents.send('watch-input-font', {type: 0, data: fonts})
        }
    });
}


module.exports = {loadImageLabels, loadFonts}
