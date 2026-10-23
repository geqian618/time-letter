const {getResourcePath, localPathToUrl, localPathToThumbUrl} = require('./path-helper')
const {listFonts} = require('./font-manager')
const path = require('path');
const fs = require('fs');

const loadResources = (window) => {
    const resourcesPath = getResourcePath()
    fs.readdir(resourcesPath, (err, filenames) => {
        const files = filenames.map((filename) => {
            const extname = path.extname(filename).slice(1);
            return {
                filename: filename,
                path: path.join(resourcesPath, filename),
                url: localPathToUrl(path.join(resourcesPath, filename)),
                thumbUrl: localPathToThumbUrl(path.join(resourcesPath, filename)),
                extname: extname
            };
        })
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('resources:watch-change', {type: 0, data, event: 0})
    });
}

const loadFonts = (window) => {
    const fonts = listFonts();
    window.webContents.send('fonts:watch-import', {type: -1, data: fonts})
}


module.exports = {loadResources, loadFonts}
