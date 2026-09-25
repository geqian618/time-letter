const {app, ipcMain, protocol, globalShortcut, BrowserWindow, Menu, dialog, shell, nativeTheme} = require('electron')
const WinState = require('electron-win-state').default
const path = require('path');
const fs = require('fs')
const AdmZip = require('adm-zip');
const localshortcut = require('electron-localshortcut')
const sharp = require("sharp");

// 工具模块
const imageParser = require('./utils/image-parser')
const imageExportProcessor = require('./thread/image-export-processor')
const resourcesLoader = require('./utils/resources-loader')
const {getResourcePath, getFontPath, localPathToUrl, localPathToThumbUrl} = require('./utils/path-helper')
const {getSystemFonts, getCustomFonts} = require('./utils/font-manager')
const ImageMetadataHelper = require("./utils/ImageMetadataHelper");


// 钩子和组件
const imageWatcher = require('./components/image-watcher')
const fontWatcher = require('./components/font-watcher')
const {createTray} = require('./components/tray')
const createApplicationMenu = require('./components/application-menu')
const createContextMenu = require('./components/context-menu')
const createTemplateContextMenu = require('./components/template-context-menu')
const registerLocalShortcut = require('./components/register-local-shortcut')
const {closeImageManagerWindow, getImageManagerWindow} = require('./components/image-manager-window')

// 配置常量
const {APP_NAME, APP_ICON_PATH, APP_VERSION, IMAGE_TYPES} = require('./constant/project-constants')
const {initLanguage, t, setLanguage, changeLanguage} = require('./locales')
const {initTheme, setTheme} = require('./components/theme')
const environment = process.env.NODE_ENV
const isDev = environment === 'development'
const resourcesPath = getResourcePath()
const fontPath = getFontPath()

// 禁用安全警告
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// 打包后渲染进程加载器（解密 renderer.pkg + myclient:// 协议 + asar 完整性校验）
const {registerPrivilegedSchemes, registerRendererProtocol, verifyAsarIntegrity} = require('./runtime/renderer-loader')


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

    const isDarkTheme = nativeTheme.themeSource === 'dark' || (nativeTheme.themeSource === 'system' && nativeTheme.shouldUseDarkColors)

    const winState = new WinState({
        defaultWidth: 1000,
        defaultHeight: 600,
        electronStoreOptions: {
            name: 'main-window-state'
        }
    })

    const isMac = process.platform === 'darwin'

    mainWindow = new BrowserWindow({
        ...winState.winOptions,
        icon: APP_ICON_PATH,
        show: false,
        // 标题栏 / 菜单栏 / 窗口控制全部由渲染进程自绘的顶部工具栏承担：
        // Windows / Linux 用无边框窗口；macOS 保留系统红绿灯（hiddenInset），避免失去关闭 / 最小化入口
        ...(isMac
            ? {frame: true, titleBarStyle: 'hiddenInset', trafficLightPosition: {x: 14, y: 15}}
            : {frame: false}),
        backgroundColor: isDarkTheme ? '#0a0a0d' : '#fafafa',
        webPreferences: {
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
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
        // 生产环境：渲染进程已被 electron-builder-encryptor 加密为 resources/renderer.pkg，
        // 打包时注入主进程的辅助模块负责解密，并通过自定义协议 myclient:// 加载
        window.loadURL('myclient://apps/index.html')
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
 * 语言切换后按当前语言重建全部原生 UI（应用菜单 / 画布与模板右键菜单 / 托盘菜单 / 副窗口标题）
 */
const rebuildAppComponents = () => {

    if (mainWindow && !tray.isDestroyed()) {
        applicationMenu = createApplicationMenu(mainWindow);
        contextMenu = createContextMenu(mainWindow);
        templateContextMenu = createTemplateContextMenu(mainWindow);
    }

    if (tray && !tray.isDestroyed()) {
        tray.destroy();
        tray = createTray(mainWindow);
    }
}

/**
 * 设置窗口事件
 */
const setupWindowEvents = (window) => {

    // 窗口加载完成
    window.webContents.on('did-finish-load', () => {
        resourcesLoader.loadResources(window)
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
            // 联动关闭图片管理器窗口
            closeImageManagerWindow()
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
    ipcMain.handle('photo:parse-metadata', async (event, filePath) => {
        try {
            return await imageParser.parsePhotoMetadata(filePath)
        } catch (error) {
            console.error('解析图片元数据失败:', error)
            throw error
        }
    })

    // 打开右键菜单
    ipcMain.on('contextMenu:open', () => {
        contextMenu?.popup()
    })

    // 打开模板右键菜单
    ipcMain.on('template-contextMenu:open', () => {
        templateContextMenu?.popup()
    })

    // ---------- 自绘窗口控制（无边框窗口由渲染进程顶部工具栏驱动） ----------

    // 最小化
    ipcMain.on('window:minimize', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.minimize()
    })

    // 最大化 / 还原
    ipcMain.on('window:toggle-maximize', (event) => {
        const target = BrowserWindow.fromWebContents(event.sender)
        if (!target) return
        if (target.isMaximized()) {
            target.unmaximize()
        } else {
            target.maximize()
        }
    })

    // 关闭
    ipcMain.on('window:close', (event) => {
        BrowserWindow.fromWebContents(event.sender)?.close()
    })

    // 查询最大化状态（供渲染进程同步按钮图标）
    ipcMain.handle('window:is-maximized', (event) => {
        return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
    })

    // 弹出应用菜单的某个顶级子菜单（渲染进程自绘菜单栏点击后调用，复用原生命令）
    ipcMain.on('menu:popup', (event, {id, x, y}) => {
        // 注意：主窗口用 win.setMenu() 挂载菜单，Menu.getApplicationMenu() 在 Windows 上可能为空，
        // 直接复用 createApplicationMenu 的返回值
        const item = applicationMenu?.items?.find(entry => entry.id === id)
        if (item?.submenu) {
            item.submenu.popup({
                window: BrowserWindow.fromWebContents(event.sender) ?? undefined,
                x: Math.round(Number(x) || 0),
                y: Math.round(Number(y) || 0)
            })
        }
    })

    // 触发原生菜单中的某一项（自绘导出按钮复用「文件 › 导出图片」的原生流程）
    ipcMain.on('menu:invoke', (event, id) => {
        const sender = BrowserWindow.fromWebContents(event.sender)
        const walk = (items) => {
            for (const item of items ?? []) {
                if (item.id === id) return item
                const found = walk(item.submenu?.items)
                if (found) return found
            }
            return null
        }
        const target = walk(applicationMenu?.items)
        if (!target) return
        if (typeof target.click === 'function') {
            target.click(target, sender, event)
        } else if (sender) {
            // role 型菜单项没有 click 函数，交由主进程按 role 派发
            target.click?.(target, sender, event)
        }
    })

    // 选择目录
    ipcMain.handle('select-directory', async () => {
        try {
            const {canceled, filePaths} = await dialog.showOpenDialog({
                buttonLabel: t('dialog.choose'),
                properties: ['multiSelections', 'createDirectory', 'openFile', 'openDirectory']
            })
            return !canceled && filePaths?.length ? filePaths[0] : null
        } catch (error) {
            console.error('选择目录失败:', error)
            return null
        }
    })

    // 语言切换：持久化偏好并重建全部原生 UI（菜单 / 右键菜单 / 托盘 / 窗口标题），广播各窗口跟随
    ipcMain.on('language:set', (event, language) => {
        const resolved = setLanguage(language)
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('language:changed', resolved))
        rebuildAppComponents()
    })

    // 主题切换
    ipcMain.on('theme:set', (event, theme) => {
        setTheme(theme)
        // 同步主题到所有窗口（图片管理器等副窗口跟随）
        BrowserWindow.getAllWindows().forEach(w => w.webContents.send('theme:changed', theme));
    });


    // 导出文件
    ipcMain.on('files:request-export', (event, data) => {
        imageExportProcessor.exportFiles(data, (progress) => {
            mainWindow?.webContents.send('download-progress:watch', {
                percentage: progress.percentage,
                hasError: progress.errors > 0
            })
        })
    })

    // 拖拽导入图片
    ipcMain.on('files:request-import', async (event, {isDragOver, paths}) => {
        let filePaths = paths;
        if (!isDragOver) {
            const result = await dialog.showOpenDialog({
                title: t('dialog.importFile'),
                buttonLabel: t('dialog.import'),
                properties: ['openFile', 'multiSelections'],
                filters: [{name: 'Images', extensions: IMAGE_TYPES}]
            });
            filePaths = result.filePaths;
        }
        if (filePaths && filePaths.length) {
            const files = await Promise.all(
                filePaths.map(async (filePath) => {
                    const extname = path.extname(filePath).slice(1);
                    return {
                        filename: path.basename(filePath),
                        url: localPathToUrl(filePath),
                        thumbUrl: localPathToThumbUrl(filePath),
                        path: filePath,
                        extname: extname
                    };
                })
            );
            const data = new Map(files.map(item => [item.path, item]));
            mainWindow.webContents.send('images:watch-import', data)
        }
    })

    // 停止导出
    ipcMain.on('files:stop-export', () => {
        imageExportProcessor.stopExportFiles()
    })

    // 创建线程池
    ipcMain.on('thread-pool:create', (event, maxThreads) => {

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


    // 删除文件（移入回收站）
    ipcMain.on('images:delete', async (event, filePaths) => {
        if (!Array.isArray(filePaths) || filePaths.length === 0) return;
        for (const filePath of filePaths) {
            try {
                // 1. 确保路径格式正确
                const resolvedPath = path.resolve(filePath);
                await shell.trashItem(resolvedPath);
                console.log(`已移入回收站: ${resolvedPath}`);
            } catch (error) {
                console.error(`删除失败: ${filePath}`, error);
            }
        }
    });


    // ---------- 图片管理器（独立窗口，经主进程中转同步画布数据） ----------

    // 管理器请求快照 → 转发主窗口收集
    ipcMain.on('image-manager:request-data', () => {
        mainWindow?.webContents.send('image-manager:collect')
    })

    // 主窗口推送的画布快照 → 转发管理器
    ipcMain.on('image-manager:sync', (event, data) => {
        getImageManagerWindow()?.webContents.send('image-manager:data', data)
    })

    // 管理器移除图片 → 转发主窗口执行
    ipcMain.on('image-manager:remove', (event, filePaths) => {
        mainWindow?.webContents.send('image-manager:apply-remove', filePaths)
    })

    // 管理器删除图片：移入回收站后按移除流程处理
    ipcMain.on('image-manager:delete', async (event, filePaths) => {
        if (!filePaths?.length) return
        for (let filePath of filePaths) {
            await shell.trashItem(filePath)
        }
        mainWindow?.webContents.send('image-manager:apply-remove', filePaths)
    })

    // 管理器移动图片：选择目标目录 → 移动文件 → 通知主窗口重新登记画布
    ipcMain.on('image-manager:move', async (event, filePaths) => {
        if (!filePaths?.length) return
        const {canceled, filePaths: dirs} = await dialog.showOpenDialog({
            title: t('dialog.moveTo'),
            buttonLabel: t('dialog.move'),
            defaultPath: app.getPath('desktop'),
            properties: ['openDirectory', 'createDirectory']
        })
        if (canceled || !dirs?.length) return

        const targetDir = dirs[0]
        const moved = []
        let skippedCount = 0
        let failedCount = 0

        for (const filePath of filePaths) {
            const newPath = path.join(targetDir, path.basename(filePath))
            // 同目录移动或目标已存在同名文件时跳过
            if (newPath === filePath || fs.existsSync(newPath)) {
                skippedCount++
                continue
            }
            try {
                try {
                    await fs.promises.rename(filePath, newPath)
                } catch (e) {
                    // 跨盘移动 rename 失败，降级为复制 + 删除源文件
                    await fs.promises.copyFile(filePath, newPath)
                    await fs.promises.unlink(filePath)
                }
                moved.push({
                    oldPath: filePath,
                    newPath: newPath,
                    url: localPathToUrl(newPath),
                    thumbUrl: localPathToThumbUrl(newPath)
                })
            } catch (e) {
                failedCount++
            }
        }

        if (moved.length) {
            mainWindow?.webContents.send('image-manager:moved', moved)
        }
        getImageManagerWindow()?.webContents.send('image-manager:move-result', {
            movedCount: moved.length,
            skippedCount,
            failedCount
        })
    })


    ipcMain.on('image:request-import', async () => {
        const {filePaths} = await dialog.showOpenDialog({
            title: t('dialog.importImages'),
            buttonLabel: t('dialog.ok'),
            defaultPath: app.getPath('desktop'),
            properties: ['openFile'],
            filters: [{name: 'Images', extensions: IMAGE_TYPES}]
        });
        if (filePaths && filePaths.length) {
            const filePath = filePaths[0];
            const extname = path.extname(filePath).slice(1);
            mainWindow.webContents.send('image:watch-import', {
                filename: path.basename(filePath),
                url: localPathToUrl(filePath),
                path: filePath,
                extname: extname
            })
        }
    })
}

/**
 * 注册自定义协议
 */
const registerUncompressedImageProtocol = () => {
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
 * 注册缩略图协议：预览列表通过 thumb:// 加载主进程生成的小图，
 * 避免缩略图直接读取并解码原图导致大量图片时加载缓慢
 */
const registerThumbnailProtocol = () => {
    protocol.registerBufferProtocol('thumb', async (request, callback) => {

        try {
            // 可选高度作为查询参数 thumb:///D:/photos/a.jpg?height=512，缺省 256
            const requestUrl = request.url.replace('thumb:///', '');

            // 分离路径与查询参数：路径分段已逐段编码，真实的 ? 即查询分隔符
            const queryIndex = requestUrl.indexOf('?');
            const encodedPath = queryIndex === -1 ? requestUrl : requestUrl.slice(0, queryIndex);
            const filePath = decodeURIComponent(encodedPath);

            // 期望高度：缺省 256，?height= 可覆盖；下限 64
            let thumbHeight = 256;

            if (queryIndex !== -1) {
                const height = parseInt(new URLSearchParams(requestUrl.slice(queryIndex + 1)).get('height'), 10);
                if (!Number.isNaN(height)) {
                    thumbHeight = Math.max(height, 64);
                }
            }

            // 直接读取原图文件为 Buffer
            const buffer = await fs.promises.readFile(filePath);

            // withoutEnlargement：期望高度超过原图时不下采样放大，由 sharp 原生封顶为原图尺寸
            const thumbnail = await sharp(buffer)
                .resize({height: thumbHeight, withoutEnlargement: true})
                // 转换为 WebP 格式，质量 80
                .webp({quality: 80})
                .toBuffer();

            if (thumbnail?.length) {
                callback({
                    data: thumbnail,
                    mimeType: 'image/webp',
                    headers: {
                        // 每次请求都按当前源文件重新生成，无需缓存协商
                        'Cache-Control': 'no-cache'
                    }
                });
                return;
            }
            // 兜底：返回原图 Buffer
            callback(buffer);
        } catch (error) {
            console.error('缩略图协议处理失败:', error);
            callback({statusCode: 404, data: Buffer.alloc(0)});
        }
    });
};


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
        imageWatcher.close()
        fontWatcher.close();
        // 注销全局快捷键
        globalShortcut.unregisterAll();

        ImageMetadataHelper.close()
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
                mainWindow.show();
                mainWindow.focus();
                // macOS：应用非激活状态下 focus() 可能不抢焦点，需强制前置
                if (process.platform === 'darwin') {
                    app.focus({steal: true});
                }
            }
        });
    } else {
        // 如果没有获取到锁，说明已有实例在运行，直接退出当前启动的进程
        app.quit();
    }
}


/**
 * 设置用户数据（必须在 whenReady 方法执行之前调用才生效）
 *
 * 数据目录按平台选择：
 *   开发环境 —— npm 脚本均从项目根启动，各平台统一使用项目根 data/；
 *   Windows 打包 —— 沿用工作目录下 data/（安装目录便携化，保持既有行为）；
 *   macOS / Linux 打包 —— 工作目录不可靠：macOS 从 Finder/Dock 启动时 cwd 为 /，
 *     且 Gatekeeper 会把应用转移到随机只读路径；AppImage 挂载点与 deb 安装目录同样只读。
 *     改用系统标准用户数据目录（如 ~/.config/时光信笺/data、
 *     ~/Library/Application Support/时光信笺/data）
 */
const setupUserData = () => {
    const userDataPath = (isDev || process.platform === 'win32')
        ? path.join(process.cwd(), 'data')
        : path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, {recursive: true})
    }
    app.setPath('userData', userDataPath);
}

/**
 * 初始化应用
 */
const initializeApp = () => {

    // 设置用户数据（必须在 whenReady 方法执行之前调用才生效）
    setupUserData()

    // 设置主题
    initTheme()

    // 初始化语言：读取 language.json 并以解析后的语言初始化 i18next
    initLanguage()

    // 自定义协议权限必须在 app ready 之前注册
    registerPrivilegedSchemes()

}

/**
 * 启动应用
 */
const startApp = () => {

    if (!isDev) {
        // 校验 app.asar 是否被篡改（不通过则退出）
        verifyAsarIntegrity()
        // 解密 renderer.pkg 并注册 myclient:// 协议，供生产环境加载渲染进程
        registerRendererProtocol()
    }

    registerUncompressedImageProtocol()

    registerThumbnailProtocol()

    setupIpcHandlers()

    setupAppLifecycle()

    createMainWindow()
}


initializeApp();

// 应用准备就绪后初始化
app.whenReady().then(startApp)

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error)
    dialog.showMessageBox({
        type: 'error',
        title: '执行错误',
        message: error?.message ?? String(error)
    })
})

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason)
    dialog.showMessageBox({
        type: 'error',
        title: '执行错误',
        message: reason?.message ?? String(reason)
    })
})
