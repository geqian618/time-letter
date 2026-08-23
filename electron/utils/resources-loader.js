const {getResourcePath, localPathToUrl} = require('./path-helper')
const {reloadFonts} = require('./font-manager')
const path = require('path');
const fs = require('fs');

const resourcesPath = getResourcePath()

const loadImageLabels = (window) => {
    fs.readdir(resourcesPath, (err, filenames) => {
        const files = filenames.map((filename) => {
            const extname = path.extname(filename).slice(1);
            return {
                filename: filename,
                url: localPathToUrl(path.join(resourcesPath, filename)),
                path: path.join(resourcesPath, filename),
                extname: extname
            };
        })
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-label-resources', {type: 0, data, event: 0})
    });
}

const loadFonts = (window) => {
    const fonts = reloadFonts();
    window.webContents.send('watch-input-font', {type: -1, data: fonts})
}


module.exports = {loadImageLabels, loadFonts}
