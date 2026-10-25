const {contextBridge, ipcRenderer} = require('electron');

// 订阅主进程事件，返回取消订阅函数：渲染端在组件卸载时调用即可解绑。
// 若无解绑能力，在可卸载 / 可重复挂载的组件（如路由页、开发期 HMR 重挂载）中
// 每次挂载都会向 ipcRenderer 追加一个监听器——同一事件回调重复执行且无法从外部移除。
const subscribe = (channel, callback) => {
    ipcRenderer.on(channel, callback);
    return () => ipcRenderer.removeListener(channel, callback);
};

contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    parsePhotoMetadata: (args) => ipcRenderer.invoke('photo:parse-metadata', args),
    watchImportImages: (callback) => subscribe('images:watch-import', callback),
    watchImportFonts: (callback) => subscribe('fonts:watch-import', callback),
    watchResources: (callback) => subscribe('resources:watch-change', callback),
    openContextMenu: (args) => ipcRenderer.send('contextMenu:open', args),
    openTemplateContextMenu: () => ipcRenderer.send('template-contextMenu:open'),
    watchContextMenu: (callback) => subscribe('contextMenu:watch', callback),
    watchTemplateContextMenu: (callback) => subscribe('template-contextMenu:watch', callback),
    requestExportFiles: (args) => ipcRenderer.send('files:request-export', args),
    stopExportFiles: () => ipcRenderer.send('files:stop-export'),
    createThreadPool: (args) => ipcRenderer.send('thread-pool:create', args),
    requestImportFiles: (args) => ipcRenderer.send('files:request-import', args),
    setTheme: (theme) => ipcRenderer.send('theme:set', theme),
    watchDownloadProgress: (callback) => subscribe('download-progress:watch', callback),
    openSettingsDialog: (callback) => subscribe('settings-dialog:open', callback),
    openAboutDialog: (callback) => subscribe('about-dialog:open', callback),
    watchTemplates: (callback) => subscribe('templates:watch', callback),
    exportTemplates: (args) => ipcRenderer.send('templates:export', args),
    watchProjectSettings: (callback) => subscribe('settings:watch', callback),
    exportSettings: (args) => ipcRenderer.send('settings:export', args),
    deleteImages: (args) => ipcRenderer.send('images:delete', args),
    requestImportBackgroundImage: (args) => ipcRenderer.send('image:request-import', args),
    watchImportBackgroundImage: (callback) => subscribe('image:watch-import', callback),
    // 图片管理器（独立窗口，画布数据经主进程中转）
    imageManagerRequestData: () => ipcRenderer.send('image-manager:request-data'),
    imageManagerWatchData: (callback) => subscribe('image-manager:data', callback),
    imageManagerSync: (args) => ipcRenderer.send('image-manager:sync', args),
    watchImageManagerCollect: (callback) => subscribe('image-manager:collect', callback),
    watchImageManagerRemoveApply: (callback) => subscribe('image-manager:apply-remove', callback),
    watchImageManagerMoved: (callback) => subscribe('image-manager:moved', callback),
    imageManagerRemove: (args) => ipcRenderer.send('image-manager:remove', args),
    imageManagerDelete: (args) => ipcRenderer.send('image-manager:delete', args),
    imageManagerMove: (args) => ipcRenderer.send('image-manager:move', args),
    watchImageManagerMoveResult: (callback) => subscribe('image-manager:move-result', callback),
    watchThemeChanged: (callback) => subscribe('theme:changed', callback),

    // 自绘窗口控制（无边框窗口）
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    toggleMaximizeWindow: () => ipcRenderer.send('window:toggle-maximize'),
    closeWindow: () => ipcRenderer.send('window:close'),
    isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    // 应用性能指标（全部进程内存 / CPU 占用，供右下角状态栏展示）
    getPerformanceMetrics: () => ipcRenderer.invoke('performance:get-metrics'),
    // 弹出原生应用菜单的顶级子菜单（自绘菜单栏复用原生命令）
    popupAppMenu: (args) => ipcRenderer.send('menu:popup', args),
    // 触发原生菜单中的某一项（自绘导出按钮复用「文件 › 导出图片」）
    invokeAppMenu: (id) => ipcRenderer.send('menu:invoke', id),

    // 数据目录（设置项：查看 / 更改 / 打开）
    getDataDir: () => ipcRenderer.invoke('data-dir:get'),
    changeDataDir: () => ipcRenderer.invoke('data-dir:change'),
    openDataDir: () => ipcRenderer.invoke('data-dir:open'),

    // 持久化数据（模板 / 文本资源）：主进程读写数据目录下的 JSON 文件
    persistedStorage: {
        getItem: (key) => ipcRenderer.sendSync('storage:read', key),
        setItem: (key, value) => ipcRenderer.send('storage:write', key, value),
    },

    // 语言切换（渲染进程为设置来源，主进程持久化并重建原生 UI 后广播回各窗口）
    setLanguage: (language) => ipcRenderer.send('language:set', language),
    watchLanguageChanged: (callback) => subscribe('language:changed', callback),

    // 全局快捷键（设置页修改后同步主进程重新注册；录制期间暂停快捷键响应）
    setShortcuts: (shortcuts) => ipcRenderer.send('shortcuts:set', shortcuts),
    setShortcutRecording: (recording) => ipcRenderer.send('shortcuts:recording', recording),
});
