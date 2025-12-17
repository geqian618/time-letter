const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    parsePhotoMetadata: async (args) => await ipcRenderer.invoke('parse-photo-metadata', args),
    watchInputImage: (callback) => ipcRenderer.on('watch-input-image', callback),
    watchInputFonts: (callback) => ipcRenderer.on('watch-input-font', callback),
    watchLabelResources: (callback) => ipcRenderer.on('watch-label-resources', callback),
    openContextMenu: (args) => ipcRenderer.send('open-contextMenu', args),
    openTemplateContextMenu: () => ipcRenderer.send('open-template-contextMenu'),
    watchContextMenu: (callback) => ipcRenderer.on('watch-contextMenu', callback),
    watchTemplateContextMenu: (callback) => ipcRenderer.on('watch-template-contextMenu', callback),
    requestExportFiles: (args) => ipcRenderer.send('request-export-files', args),
    stopExportFiles: () => ipcRenderer.send('stop-export-files'),
    createThreadPool: (args) => ipcRenderer.send('create-thread-pool', args),
    requestImportFiles: (args) => ipcRenderer.send('request-import-files', args),
    downloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    editorOutputSettings: (callback) => ipcRenderer.on('editor-output-settings', callback)
});
