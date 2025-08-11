const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    parsePhotoMetadata: async (args) => await ipcRenderer.invoke('parse-photo-metadata', args),
    watchInputImage: (callback) => ipcRenderer.on('watch-input-image', callback),
    watchImageLabel: (callback) => ipcRenderer.on('watch-image-label', callback),
    openContextMenu: () => ipcRenderer.send('open-contextMenu'),
    openTemplateContextMenu: () => ipcRenderer.send('open-template-contextMenu'),
    watchContextMenu: (callback) => ipcRenderer.on('watch-contextMenu', callback),
    watchTemplateContextMenu: (callback) => ipcRenderer.on('watch-template-contextMenu', callback),
    requestSaveFiles: (args) => ipcRenderer.send('request-save-files', args)
});
