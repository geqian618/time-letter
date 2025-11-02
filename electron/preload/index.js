const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    parsePhotoMetadata: async (args) => await ipcRenderer.invoke('parse-photo-metadata', args),
    watchInputImage: (callback) => ipcRenderer.on('watch-input-image', callback),
    watchInputFonts: (callback) => ipcRenderer.on('watch-input-font', callback),
    watchEditorLabel: (callback) => ipcRenderer.on('watch-editor-label', callback),
    openContextMenu: (args) => ipcRenderer.send('open-contextMenu', args),
    selectDirectory: async (args) => await ipcRenderer.invoke('select-directory', args),
    openTemplateContextMenu: () => ipcRenderer.send('open-template-contextMenu'),
    watchContextMenu: (callback) => ipcRenderer.on('watch-contextMenu', callback),
    watchTemplateContextMenu: (callback) => ipcRenderer.on('watch-template-contextMenu', callback),
    requestSaveFiles: (args) => ipcRenderer.send('request-save-files', args),
    stopSaveFiles: () => ipcRenderer.send('stop-save-files'),
    createThreadPool: (args) => ipcRenderer.send('create-thread-pool', args),
    downloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    editorOutputSettings: (callback) => ipcRenderer.on('editor-output-settings', callback)
});
