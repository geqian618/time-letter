const path = require('path');
const fs = require('fs');
const {getResourcePath, localPathToProtocolUrl} = require('../utils/path-helper')
const resourcesPath = getResourcePath()
const {reloadFonts} = require('./font-manager')


const loadImageLabels = (window) => {
    fs.readdir(resourcesPath, (err, filenames) => {
        const files = filenames.map((filename) => {
            const extname = path.extname(filename).slice(1);
            return {
                filename: filename,
                url: localPathToProtocolUrl(path.join(resourcesPath, filename)),
                path: path.join(resourcesPath, filename),
                extname: extname
            };
        })
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-editor-label', {type: 0, data, event: 0})
    });
}

const loadFonts = (window) => {
    const fonts = reloadFonts();
    window.webContents.send('watch-input-font', {type: 0, data: fonts})
}


module.exports = {loadImageLabels, loadFonts}
