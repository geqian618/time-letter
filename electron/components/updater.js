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
    // 不自动下载：检测到新版本先在弹窗询问，用户确认后再 downloadUpdate（渲染层触发 update:download）
    instance.autoDownload = false
    instance.autoInstallOnAppQuit = true
    instance.on('download-progress', (info) => broadcast('update:progress', {percent: Math.round(info.percent), speed: info.bytesPerSecond || 0}))
    instance.on('update-downloaded', (info) => broadcast('update:downloaded', {version: info?.version || ''}))
    instance.on('error', (error) => broadcast('update:error', {message: String(error?.message || error)}))
}

// releaseNotes 兼容三种形态：字符串 / [{version, note}] / 空，统一折成纯文本
const normalizeNotes = (notes) => Array.isArray(notes)
    ? notes.map((item) => String(item?.note || '')).filter(Boolean).join('\n')
    : String(notes || '')

// 返回 {current, latest, hasUpdate, notes} 或 {error}；autoDownload 开启，检查到新版本会自行开始下载
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
                    notes: normalizeNotes(result.updateInfo.releaseNotes),
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

// 手动触发下载（检测到新版本且用户确认后调用）；失败广播 update:error 由渲染层回落 GitHub 页面
const downloadUpdate = () => {
    try {
        setup()
        updater().downloadUpdate().catch((error) => broadcast('update:error', {message: String(error?.message || error)}))
    } catch (error) {
        broadcast('update:error', {message: String(error?.message || error)})
    }
}

module.exports = {checkForUpdate, downloadUpdate, quitAndInstall}
