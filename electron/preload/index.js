const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    inputImages: (callback) => ipcRenderer.on('input-images', callback),
    parsePhotoMetadata: async (args) => await ipcRenderer.invoke('parse-photo-metadata', args),
});
