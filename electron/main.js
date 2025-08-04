const {app, ipcMain, protocol, BrowserWindow, Menu} = require('electron')
const WinState = require('electron-win-state').default
const path = require('path')

const imageParser = require('./utils/image-parser')

const imageEditor = require('./utils/image-editor')

const environment = process.env.NODE_ENV

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const icon = path.join(__dirname, './resources/favicon.ico')

const createTray = require('./components/Tray')

const mainMenu = require('./components/MainMenu')

const contextMenu = require('./components/ContextMenu')

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

    Menu.setApplicationMenu(mainMenu({window}))

    // window.webContents.on('context-menu', () => {
    //     contextMenu(window).popup()
    // })

    window.on('ready-to-show', () => {
        window.show()
    })
}


ipcMain.handle('parse-photo-metadata', async (event, filePath) => {
    return await imageParser.parsePhotoMetadata(filePath)
})


ipcMain.on('open-contextMenu', () => {
    contextMenu(window).popup()
})

ipcMain.on('request-save-files', (event, settingss) => {
    const {outputDirectory, files, border} = settingss;
    for (let file of files) {
        const options = {
            inputPath: file,      // 原始图片路径
            outputDirectory: outputDirectory,     // 输出图片路径
            border: {...border, percentage: true},
            texts: [
                {
                    text: '旅行记忆 2023',
                    textPosition: {x: 20, y: 20},
                },
                {
                    text: '旅行记忆 2023',
                    textPosition: {x: 2000, y: 0},
                }
            ],
            textStyle: {
                font: 'bold 40px "Microsoft YaHei"',
                color: '#ffffff',
                textAlign: 'left',
                textBaseline: 'top'
            }
        }
        imageEditor.addBorderAndText(options)
    }
})


app.whenReady().then(() => {
    // 注册安全协议
    protocol.registerFileProtocol('app', (request, callback) => {
        const path = request.url.replace('app://', '');
        callback(decodeURIComponent(path));
    });

    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
