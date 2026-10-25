const chokidar = require('chokidar')
const path = require('path');
const {addFont, removeFont, hasFont} = require('../utils/font-manager');
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

        // 监听文件变化事件。回调闭包持有 window：macOS 关闭主窗口后应用仍存活，
        // 变动推送前先判存活，避免向已销毁 webContents 发送抛 "Object has been destroyed"
        watcher.on('add', filePath => {
            if (!window || window.isDestroyed()) return
            const fileParse = path.parse(filePath);
            const family = fileParse.name;
            if (!hasFont(family)) {
                const font = {family, path: filePath, url: localPathToUrl(filePath), isSystem: false};
                addFont(font)
                window.webContents.send('fonts:watch-import', {type: 0, data: new Map([[font.family, font]])})
            }
        }).on('unlink', filePath => {
            if (!window || window.isDestroyed()) return
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


const close = async () => {
    if (watcher) {
        const closing = watcher
        watcher = null
        await closing.close()
    }
}

module.exports = {watch, close}
