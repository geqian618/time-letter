const chokidar = require('chokidar')

const ResourceLoader = require('./resources-loader');
const path = require("path");
const fontOptions = require("./font-options");

let watcher;

const imageFileWatcher = async (window, folderPath) => {
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
            ResourceLoader.loadFonts(window)
        }).on('change', filePath => {
            ResourceLoader.loadFonts(window)
        }).on('unlink', filePath => {
            const fileParse = path.parse(filePath);
            const fontFamily = fileParse.name;
            fontOptions.delete(fontFamily)
            window.webContents.send('watch-input-font', {type: 1, data: {fontFamily}})
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

module.exports = {fileWatcher: imageFileWatcher, closeWatcher}
