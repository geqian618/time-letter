const {app, dialog, Menu, shell} = require('electron');
const path = require('path')
const fs = require('fs')
const {getResourcePath, getFontPath} = require('../utils/resource-path')
const resourcesPath = getResourcePath()
const fontPath = getFontPath()

const {createChildWindow} = require('../components/ChildWindow')

function getSafeImagePath(absolutePath) {
    if (process.platform === 'win32') {
        // Windows路径处理: C:\foo → /C:/foo
        const drivePath = absolutePath.replace(/\\/g, '/')
        return `app://${drivePath}`
    }
    // Linux/macOS处理: /foo/bar → /foo/bar
    return `app://${absolutePath}`
}

/**
 * 图片导入
 */
const selectFile = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']}]
    });
    if (filePaths && filePaths.length) {
        const files = await Promise.all(
            filePaths.map(async (filePath) => {
                const extname = path.extname(filePath).slice(1);
                return {
                    filename: path.basename(filePath),
                    url: getSafeImagePath(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-input-image', data)
    }
}


const selectFonts = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [
            {name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot']}
        ]
    });
    if (filePaths && filePaths.length) {
        const files = await Promise.all(
            filePaths.map(async (filePath) => {
                // 读取文件
                const buffer = fs.readFileSync(filePath);
                // 写入文件
                fs.writeFileSync(path.join(fontPath, path.basename(filePath)), buffer);
                filePath = path.join(fontPath, path.basename(filePath));
                const fileParsed = path.parse(filePath);
                return {
                    filename: path.basename(filePath),
                    fontFamily: fileParsed.name,
                    url: getSafeImagePath(filePath),
                    path: filePath,
                    extname: fileParsed.ext
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-input-font', {type: 0, data})
    }
}


const selectImageLabels = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']}]
    });
    if (filePaths && filePaths.length) {
        const files = await Promise.all(
            filePaths.map(async (filePath) => {
                // 读取文件
                const buffer = fs.readFileSync(filePath);
                // 写入文件
                fs.writeFileSync(path.join(resourcesPath, path.basename(filePath)), buffer);
                const extname = path.extname(filePath).slice(1);
                filePath = path.join(resourcesPath, path.basename(filePath));
                return {
                    filename: path.basename(filePath),
                    url: getSafeImagePath(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-editor-label', {type: 0, data, event: 0})
    }
}


const customTextLabels = () => {
    window.webContents.send('watch-editor-label', {type: 1})
}

/**
 * 图片导出
 */
const saveFiles = async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导出',
        // defaultPath: app.getPath('desktop'),
        properties: ['multiSelections', 'createDirectory', 'openFile', "openDirectory"]
    })
    if (!canceled && filePaths) {
        window.webContents.send('watch-contextMenu', {type: 1, outputDirectory: filePaths[0]})
    }
}


const outputSettings = () => {
    window.webContents.send('editor-output-settings')
}

/**
 * mainMenu 定义为函数，主进程可以传参到菜单中
 * @settings args
 * @returns {Electron.Menu}
 */

let window;

const mainMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '导入图片',
                    // 无传参
                    click: selectFile,
                    accelerator: 'ctrl+i'

                },
                {
                    label: '导出图片',
                    // 有传参，如何这样写 saveFile(args)函数会立即执行，而不是作为回调函数
                    click: saveFiles,
                    accelerator: 'ctrl+o'
                }
            ]
        },
        {
            label: '设置',
            submenu: [
                {
                    label: '偏好设置',
                    click: outputSettings,
                },
            ]
        },
        {
            label: '资源',
            submenu: [
                {
                    label: '图片标签',
                    submenu: [
                        {
                            label: '导入',
                            click: selectImageLabels
                        },
                        {
                            label: '打开资源管理器',
                            click: () => {
                                // 尝试打开文件夹
                                shell.openPath(resourcesPath);
                            }
                        }
                    ]
                },
                {
                    label: '文本标签',
                    submenu: [
                        {
                            label: '新增',
                            click: customTextLabels
                        },
                        {
                            label: '管理',
                            click: () => {
                                window.webContents.send('watch-editor-label', {type: 3})
                            }
                        }
                    ],
                },
                {
                    label: '字体',
                    submenu: [
                        {
                            label: '导入',
                            click: selectFonts
                        },
                        {
                            label: '打开资源管理器',
                            click: () => {
                                // 尝试打开文件夹
                                shell.openPath(fontPath);
                            }
                        }
                    ],
                }
            ]
        },
        {
            label: '工具',
            submenu: [
                {
                    label: '图片搬运',
                    accelerator: 'ctrl+r',
                    role: ''
                },
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '控制台',
                    role: 'toggleDevTools'
                },
                {
                    label: '关于',
                    click: createChildWindow
                }
            ]
        }
    ]);
}

module.exports = mainMenu
