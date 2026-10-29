// 自动更新（electron-updater）：仅安装版生效。未打包、缺少 app-update.yml（未配 publish）、
// macOS 未签名、网络受限等失败一律返回 error，由渲染层回落到「GitHub release 检查 + 跳转下载页」。
const {app, BrowserWindow} = require('electron')

const CHECK_TIMEOUT = 15000
let initialized = false
let autoUpdater = null

// 延迟 require：更新模块异常不应影响主进程启动
const updater = () => {
    if (!autoUpdater) autoUpdater = require('electron-updater').autoUpdater
    return autoUpdater
}

const broadcast = (channel, payload) => {
    BrowserWindow.getAllWindows().forEach((win) => win.webContents.send(channel, payload))
}

const setup = () => {
    if (initialized) return
    initialized = true
    const instance = updater()
    instance.autoDownload = true
    instance.autoInstallOnAppQuit = true
    instance.on('download-progress', (info) => broadcast('update:progress', Math.round(info.percent)))
    instance.on('update-downloaded', (info) => broadcast('update:downloaded', {version: info?.version || ''}))
    instance.on('error', (error) => broadcast('update:error', {message: String(error?.message || error)}))
}

// 返回 {current, latest, hasUpdate} 或 {error}；autoDownload 开启，检查到新版本会自行开始下载
const checkForUpdate = () => {
    let check
    try {
        setup()
        check = updater().checkForUpdates()
            .then((result) => result == null
                ? {error: 'updater-inactive'}
                : {
                    current: app.getVersion(),
                    latest: result.updateInfo.version,
                    hasUpdate: result.isUpdateAvailable,
                })
            .catch((error) => ({error: String(error?.message || error)}))
    } catch (error) {
        return Promise.resolve({error: String(error?.message || error)})
    }
    const timeout = new Promise((resolve) => {
        setTimeout(() => resolve({error: 'timeout'}), CHECK_TIMEOUT)
    })
    return Promise.race([check, timeout])
}

const quitAndInstall = () => updater().quitAndInstall(false, true)

module.exports = {checkForUpdate, quitAndInstall}
