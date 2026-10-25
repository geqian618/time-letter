const chokidar = require('chokidar')
const path = require("path");
const {localPathToUrl} = require("../utils/path-helper");

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

        // 监听文件变化事件。回调闭包持有 window：macOS 关闭主窗口后应用仍存活，
        // 变动推送前先判存活，避免向已销毁 webContents 发送抛 "Object has been destroyed"
        watcher.on('add', filePath => {
            if (!window || window.isDestroyed()) return
            const pathParsed = path.parse(filePath);
            const image = {
                filename: path.basename(filePath),
                url: localPathToUrl(filePath),
                path: filePath,
                extname: pathParsed.ext
            };
            const data = new Map([[image.path, image]])
            window.webContents.send('resources:watch-change', {type: 0, data, event: 0})
        }).on('unlink', filePath => {
            if (!window || window.isDestroyed()) return
            window.webContents.send('resources:watch-change', {type: 0, data: {filePath}, event: 1})
        }).on('error', error => {
            console.error('监控错误:', error);
        });

    } catch (error) {
        console.error('文件监控失败:', error)
    }
}


const close = async () => {
    if (watcher) {
        const closing = watcher
        watcher = null
        await closing.close()
    }
}

module.exports = {watch, close}
