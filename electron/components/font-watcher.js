const chokidar = require('chokidar')
const path = require('path');
const {registerFont, removeFont, hasFont} = require('../utils/font-manager');
const {localPathToUrl} = require('../utils/path-helper');

let watcher;


const watch = async (window, folderPath) => {
    try {
        // 关闭现有监控
        if (watcher) {
            watcher.close();
            watcher = null;
        }
        // 初始化文件监控
        watcher = chokidar.watch(folderPath, {
            ignored: /(^|[\/\\])\../, // 忽略隐藏文件
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        // 监听文件变化事件
        watcher.on('add', filePath => {
            const fileParse = path.parse(filePath);
            const family = fileParse.name;
            if (!hasFont(family)) {
                const font = {family, path: filePath, url: localPathToUrl(filePath), isSystem: false};
                registerFont(font)
                window.webContents.send('fonts:watch-import', {type: 0, data: new Map([[font.family, font]])})
            }
        }).on('unlink', filePath => {
            const fileParse = path.parse(filePath);
            const family = fileParse.name;
            removeFont(family)
            window.webContents.send('fonts:watch-import', {type: 1, data: {family}})
        }).on('error', error => {
            console.error('监控错误:', error);
        });

    } catch (error) {
        console.error('文件监控失败:', error)
    }
}


const close = () => {
    if (watcher) {
        watcher.close();
    }
}

module.exports = {watch, close}
