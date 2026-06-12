const {app, ipcMain, protocol, globalShortcut, BrowserWindow, Menu, dialog} = require('electron')
const WinState = require('electron-win-state').default
const path = require('path');
const fs = require('fs')
const AdmZip = require('adm-zip');
const localshortcut = require('electron-localshortcut')

// 工具模块
const imageParser = require('./utils/image-parser')
const imageExporter = require('./thread/image-exporter')
const {getResourcePath, getFontPath, localPathToProtocolUrl} = require('./utils/path-helper')
const {getSystemFonts, getCustomFonts} = require('./utils/font-manager')

// 钩子和组件
const resourcesLoader = require('./utils/resources-loader')
const imageWatcher = require('./components/image-watcher')
const fontWatcher = require('./components/font-watcher')
const createTray = require('./components/Tray')
const createApplicationMenu = require('./components/ApplicationMenu')
const createContextMenu = require('./components/ContextMenu')
const createTemplateContextMenu = require('./components/TemplateContextMenu')
const registerLocalShortcut = require('./components/registerLocalShortcut')

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
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload', 'index-loader.js'),
        }
    })

    // 加载应用
    loadAppContent(mainWindow)

    // WinState 管理窗口
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
        // window.loadURL(`file://${path.join(__dirname, '../dist/index.html')}`)
        window.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

/**
 * 初始化组件
 */
const initializeComponents = (window) => {

    applicationMenu = createApplicationMenu(window);

    contextMenu = createContextMenu(window);

    templateContextMenu = createTemplateContextMenu(window);

    tray = createTray(window)

    registerLocalShortcut(window);

    imageWatcher.watch(window, resourcesPath)

    fontWatcher.watch(window, fontPath)
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


    // 窗口已关闭
    window.on('close', () => {
        if (window) {
            // 注销快捷键
            localshortcut.unregisterAll(window)
            window = null
        }
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

    // 拖拽导入图片
    ipcMain.on('request-import-files', async (event, paths) => {
        if (paths && paths.length) {
            const files = await Promise.all(
                paths.map(async (filePath) => {
                    const extname = path.extname(filePath).slice(1);
                    return {
                        filename: path.basename(filePath),
                        url: localPathToProtocolUrl(filePath),
                        path: filePath,
                        extname: extname
                    };
                })
            );
            const data = new Map(files.map(item => [item.path, item]));
            mainWindow.webContents.send('watch-input-image', data)
        }
    })

    // 停止导出
    ipcMain.on('stop-export-files', () => {
        imageExporter.stopExportFiles()
    })

    // 创建线程池
    ipcMain.on('create-thread-pool', (event, maxThreads) => {
        imageExporter.createThreadPool(maxThreads)
    })


    // 导出模板配置
    ipcMain.on('templates:export', (event, {outputPath, templates}) => {

        const imageSet = new Set();
        const fontSet = new Set();
        const systemFonts = getSystemFonts();
        const customFonts = getCustomFonts();

        for (let template of templates) {
            const elements = template.settings.foreground.elements;
            for (let element of elements) {
                if (element.type === 'image') {
                    const imagePath = element.meta?.path;
                    if (!imagePath || !fs.existsSync(imagePath)) {
                        dialog.showMessageBox({
                            type: 'error',
                            title: '导出失败',
                            message: `预设名称：${template.templateName}\n找不到文件：${imagePath}`
                        })
                        return;
                    }
                    imageSet.add(imagePath)
                }

                if (element.type === 'text' && ![...systemFonts.keys()].includes(element.fontFamily)) {
                    const fontPath = customFonts.get(element.fontFamily)?.path;
                    if (!fontPath || !fs.existsSync(fontPath)) {
                        dialog.showMessageBox({
                            type: 'error',
                            title: '导出失败',
                            message: `预设名称：${template.templateName}\n找不到字体：${element.fontFamily}`
                        })
                        return;
                    }
                    fontSet.add(fontPath)
                }
            }
        }

        const zip = new AdmZip();
        const data = JSON.stringify({type: 'TEMPLATE', templates}, null, 2);
        const textBuffer = Buffer.from(data, 'utf-8');
        zip.addFile('templates.json', textBuffer);
        zip.addFile("resources/", Buffer.alloc(0));
        zip.addFile("fonts/", Buffer.alloc(0));

        imageSet.forEach(item => {
            const stat = fs.statSync(item);
            if (stat.isFile()) {
                // 如果是文件，直接添加
                zip.addLocalFile(item, "resources/");
            }
        });

        fontSet.forEach(item => {
            const stat = fs.statSync(item);
            if (stat.isFile()) {
                // 如果是文件，直接添加
                zip.addLocalFile(item, "fonts/");
            }
        });

        // 遍历所有条目，为每个条目的头部设置 UTF-8 标志位
        zip.getEntries().forEach(entry => {
            // 设置创建系统的版本号为Unix (0x314)，以确保兼容性
            entry.header.made = 0x314;
            // 设置 bit 11 (0x800)
            entry.header.flags |= 0x800;
        });

        // 将压缩包写入磁盘
        zip.writeZip(outputPath);
    })


    // 导出应用配置文件
    ipcMain.on('settings:export', (event, {filePath, settings}) => {
        const data = JSON.stringify({type: 'Settings', settings}, null, 2);
        fs.writeFileSync(filePath, data, 'utf8')
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

    // 所有窗口已关闭，应用即将退出
    app.on('will-quit', () => {
        imageWatcher.colse()
        fontWatcher.close();
        // 注销全局快捷键
        globalShortcut.unregisterAll();
    })

    // 所有窗口关闭
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })

    // 尝试获取单例锁
    if (app.requestSingleInstanceLock()) {
        // 成功获取锁，没有实例在运行，正常启动应用
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // 当用户再次尝试启动应用时，聚焦到已有窗口
            if (mainWindow) {
                if (mainWindow.isMinimized()) {
                    mainWindow.restore();
                }
                mainWindow.focus();
            }
        });
    } else {
        // 如果没有获取到锁，说明已有实例在运行，直接退出当前启动的进程
        app.quit();
    }
}


/**
 * 设置用户数据（必须在 whenReady 方法执行之前调用才生效）
 */
const setupUserData = () => {
    const userDataPath = path.join(process.cwd(), 'data');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, {recursive: true})
    }
    app.setPath('userData', userDataPath);
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

// 设置用户数据（必须在 whenReady 方法执行之前调用才生效）
setupUserData()

// 应用准备就绪后初始化
app.whenReady().then(initializeApp)

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error)
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason)
})
