const chokidar = require('chokidar')
const path = require("path");
const {registerFonts} = require("./font-manager");
const {localPathToProtocolUrl} = require("../utils/path-helper");
let watcher;


const fileWatcher = async (window, folderPath) => {
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
            const font = {family, path: filePath, url: localPathToProtocolUrl(filePath)};
            registerFonts(font)
            window.webContents.send('watch-input-font', {type: 0, data: new Map([[font.family, font]])})
        }).on('error', error => {
            console.error('监控错误:', error);
        });

    } catch (error) {
        console.error('文件监控失败:', error)
    }
}


const closeWatcher = () => {
    if (watcher) {
        watcher.close();
    }
}

module.exports = {fileWatcher, closeWatcher}
