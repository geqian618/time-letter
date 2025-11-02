const chokidar = require('chokidar')

const ResourceLoader = require('./resources-loader');

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
            ResourceLoader.loadImageLabels(window)
        }).on('change', filePath => {
            ResourceLoader.loadImageLabels(window)
        }).on('unlink', filePath => {
            window.webContents.send('watch-editor-label', {type: 0, data: [], event: 1, filePath})
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
