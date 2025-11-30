const {app, ipcMain, protocol, BrowserWindow, Menu, dialog} = require('electron')
const WinState = require('electron-win-state').default
const path = require('path')

const imageParser = require('./utils/image-parser')

const imageExporter = require('./thread/image-exporter');

const resourcesLoader = require('./hook/resources-loader');

const environment = process.env.NODE_ENV

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const icon = path.join(__dirname, './resources/favicon.ico')

const createTray = require('./components/Tray')

const mainMenu = require('./components/MainMenu')

const contextMenu = require('./components/ContextMenu')

const templateContextMenu = require('./components/TemplateContextMenu')

const imageWatcher = require('./hook/image-file-watcher')

const fontWatcher = require('./hook/font-file-watcher')

const {getResourcePath, getFontPath} = require('./utils/path-helper')

const resourcesPath = getResourcePath()
const fontPath = getFontPath()

let window;

const createWindow = () => {

    const winState = new WinState({
        defaultWidth: 1000,
        defaultHeight: 600,
        electronStoreOptions: {
            name: 'main-window-state'
        }
    });

    window = new BrowserWindow({
        ...winState.winOptions,
        icon: path.join(icon),
        show: false,
        webPreferences: {
            // 重要：禁用不安全选项
            webSecurity: true, // 保持启用安全策略
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload', 'index.js'),
        }
    });

    if (environment === 'development') {
        // 开发环境加载 URL
        window.loadURL('http://localhost:5173/')
        // 打开开发者工具
        // window.webContents.openDevTools()
    } else {
        // 生产环境加载本地文件系统中的文件
        window.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`)
    }

    winState.manage(window)

    createTray(app, window)

    Menu.setApplicationMenu(mainMenu(window))

    // window.webContents.on('context-menu', () => {
    //     contextMenu(window).popup()
    // })

    window.webContents.on('did-finish-load', () => {
        // 发送消息到渲染进程
        resourcesLoader.loadImageLabels(window)
        resourcesLoader.loadFonts(window)
    })

    window.on('ready-to-show', () => {
        // 最大化窗口
        window.maximize();
        window.show()
    })

}


ipcMain.handle('parse-photo-metadata', async (event, filePath) => {
    return await imageParser.parsePhotoMetadata(filePath)
})


ipcMain.on('open-contextMenu', () => {
    contextMenu(window).popup()
})

ipcMain.handle('select-directory', async (event, args) => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: '选择',
        // defaultPath: app.getPath('desktop'),
        properties: ['multiSelections', 'createDirectory', 'openFile', "openDirectory"]
    })

    if (!canceled && filePaths && filePaths.length) {
        return filePaths[0]
    }
})

ipcMain.on('open-template-contextMenu', () => {
    templateContextMenu(window).popup()
})

ipcMain.on('request-export-files', (event, data) => {
    imageExporter.exportFiles(data, (progress) => {
        // console.log(`[进度] ${progress.percentage}% | 完成: ${progress.completed}/${progress.total} | 错误: ${progress.errors}`);
        window.webContents.send('download-progress', {percentage: progress.percentage, hasError: progress.errors > 0})
    });
})


ipcMain.on('stop-export-files', () => {
    imageExporter.stopExportFiles()
})


ipcMain.on('create-thread-pool', (event, maxThreads) => {
    imageExporter.createThreadPool(maxThreads)
})


app.whenReady().then(() => {
    // 注册安全协议
    protocol.registerFileProtocol('app', (request, callback) => {
        const url = request.url.replace('app://', '')
        callback({
            path: decodeURIComponent(url),
            // 关闭静态资源缓存（重复请求同一个资源路径时，重新向服务器请求访问资源）
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
    });

    createWindow()

    imageWatcher.fileWatcher(window, resourcesPath)

    fontWatcher.fileWatcher(window, fontPath)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})


app.on('before-quit', () => {
    imageWatcher.closeWatcher()
    fontWatcher.closeWatcher()
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
