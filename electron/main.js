const {app, ipcMain, protocol, BrowserWindow, Menu, dialog} = require('electron')
const WinState = require('electron-win-state').default
const path = require('path')

// 工具模块
const imageParser = require('./utils/image-parser')
const imageExporter = require('./thread/image-exporter')
const {getResourcePath, getFontPath} = require('./utils/path-helper')

// 钩子和组件
const resourcesLoader = require('./utils/resources-loader')
const imageWatcher = require('./components/image-file-watcher')
const fontWatcher = require('./components/font-file-watcher')
const createTray = require('./components/Tray')
const createApplicationMenu = require('./components/ApplicationMenu')
const createContextMenu = require('./components/ContextMenu')
const createTemplateContextMenu = require('./components/TemplateContextMenu')

// 配置常量
const {APP_NAME, APP_ICON_PATH, APP_VERSION} = require('./constant/ProjectConstants')
const environment = process.env.NODE_ENV
const isDev = environment === 'development'
const resourcesPath = getResourcePath()
const fontPath = getFontPath()

// 禁用安全警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'


// 组件应用
let mainWindow = null;
let contextMenu = null;
let templateContextMenu = null;
let applicationMenu = null;
let tray = null;


/**
 * 创建主窗口
 */
const createMainWindow = () => {
    const winState = new WinState({
        defaultWidth: 1000,
        defaultHeight: 600,
        electronStoreOptions: {
            name: 'main-window-state'
        }
    })

    mainWindow = new BrowserWindow({
        ...winState.winOptions,
        icon: APP_ICON_PATH,
        show: false,
        webPreferences: {
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload', 'index.js'),
        }
    })

    // 加载应用
    loadAppContent(mainWindow)

    winState.manage(mainWindow)

    // 初始化组件
    initializeComponents(mainWindow)

    // 生命周期事件
    setupWindowEvents(mainWindow)
}

/**
 * 加载应用内容
 */
const loadAppContent = (window) => {
    if (isDev) {
        // 开发环境加载 URL
        window.loadURL('http://localhost:5173/')
    } else {
        // 生产环境加载本地文件系统中的文件
        window.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`)
    }
}

/**
 * 初始化组件
 */
const initializeComponents = (window) => {

    applicationMenu = createApplicationMenu(window);

    tray = createTray(window)

    contextMenu = createContextMenu(window);

    templateContextMenu = createTemplateContextMenu(window);

    imageWatcher.fileWatcher(window, resourcesPath)

    fontWatcher.fileWatcher(window, fontPath)
}

/**
 * 设置窗口事件
 */
const setupWindowEvents = (window) => {

    // 窗口加载完成
    window.webContents.on('did-finish-load', () => {
        resourcesLoader.loadImageLabels(window)
        resourcesLoader.loadFonts(window)
    })

    // 窗口准备就绪
    window.on('ready-to-show', () => {
        window.maximize()
        window.show()
    })


    // 窗口显示时
    window.on('show', () => {
        // 显示后立即聚焦
        window.focus();
    })

    // 右键菜单
    // window.webContents.on('context-menu', () => {
    //   contextMenu.popup()
    // })
}

/**
 * 设置IPC事件处理器
 */
const setupIpcHandlers = () => {

    // 解析图片元数据
    ipcMain.handle('parse-photo-metadata', async (event, filePath) => {
        try {
            return await imageParser.parsePhotoMetadata(filePath)
        } catch (error) {
            console.error('解析图片元数据失败:', error)
            throw error
        }
    })

    // 打开右键菜单
    ipcMain.on('open-contextMenu', () => {
        contextMenu?.popup()
    })

    // 打开模板右键菜单
    ipcMain.on('open-template-contextMenu', () => {
        templateContextMenu?.popup()
    })

    // 选择目录
    ipcMain.handle('select-directory', async () => {
        try {
            const {canceled, filePaths} = await dialog.showOpenDialog({
                buttonLabel: '选择',
                properties: ['multiSelections', 'createDirectory', 'openFile', 'openDirectory']
            })

            return !canceled && filePaths?.length ? filePaths[0] : null
        } catch (error) {
            console.error('选择目录失败:', error)
            return null
        }
    })

    // 导出文件
    ipcMain.on('request-export-files', (event, data) => {
        imageExporter.exportFiles(data, (progress) => {
            mainWindow?.webContents.send('download-progress', {
                percentage: progress.percentage,
                hasError: progress.errors > 0
            })
        })
    })

    // 停止导出
    ipcMain.on('stop-export-files', () => {
        imageExporter.stopExportFiles()
    })

    // 创建线程池
    ipcMain.on('create-thread-pool', (event, maxThreads) => {
        imageExporter.createThreadPool(maxThreads)
    })
}

/**
 * 注册自定义协议
 */
const registerCustomProtocol = () => {
    protocol.registerFileProtocol('app', (request, callback) => {
        try {
            const url = request.url.replace('app://', '')
            callback({
                path: decodeURIComponent(url),
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })
        } catch (error) {
            console.error('协议处理失败:', error)
            callback({error: -6}) // 文件未找到错误码
        }
    })
}

/**
 * 设置应用生命周期事件
 */
const setupAppLifecycle = () => {
    // 激活应用
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })

    // 应用退出前
    app.on('before-quit', () => {
        imageWatcher.closeWatcher()
        fontWatcher.closeWatcher()
    })

    // 所有窗口关闭
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
}

/**
 * 初始化应用
 */
const initializeApp = () => {

    registerCustomProtocol()

    setupIpcHandlers()

    setupAppLifecycle()

    createMainWindow()
}

// 应用准备就绪后初始化
app.whenReady().then(initializeApp)

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason)
})
