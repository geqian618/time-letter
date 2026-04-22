const {dialog, Menu, shell} = require('electron');
const path = require('path')
const fs = require('fs')
const {getResourcePath, getFontPath, localPathToProtocolUrl} = require('../utils/path-helper')
const {registerFont} = require('../utils/font-manager')

const resourcesPath = getResourcePath()
const fontPath = getFontPath()

/**
 * mainMenu 定义为函数，主进程可以传参到菜单中
 * @settings args
 * @returns {Electron.Menu}
 */

let window;

const createApplicationMenu = (mainWindow) => {
    window = mainWindow;
    const applicationMenu = Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '导入图片',
                    // 无传参
                    click: selectFile,
                    accelerator: 'CommandOrControl+I'

                },
                {
                    label: '导出图片',
                    // 有传参，如何这样写 saveFile(args)函数会立即执行，而不是作为回调函数
                    click: saveFiles,
                    accelerator: 'CommandOrControl+O'
                }
            ]
        },
        {
            label: '设置',
            submenu: [
                {
                    label: '偏好设置',
                    click: editorOutputSettings,
                },
            ]
        },
        {
            label: '扩展',
            submenu: [
                {
                    label: '文本库',
                    submenu: [
                        {
                            label: '新增',
                            click: customTextLabels
                        },
                        {
                            label: '管理',
                            click: () => {
                                window.webContents.send('watch-label-resources', {type: 3})
                            }
                        }
                    ],
                },
                {
                    label: '图片库',
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
                    label: '字体库',
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
                },
                {
                    label: '模板预设',
                    submenu: [
                        {
                            label: '导入',
                            click: importTemplates
                        },
                        {
                            label: '导出',
                            click: exportTemplates
                        }
                    ],
                }
            ]
        },
        // {
        //     label: '工具',
        //     submenu: [
        //         {
        //             label: '图片搬运',
        //             role: ''
        //         },
        //     ]
        // },
        {
            label: '帮助',
            submenu: [
                {
                    label: '控制台',
                    // role: 'toggleDevTools',
                    click: (menuItem, browserWindow, event) => {
                        browserWindow.webContents.openDevTools({mode: "detach"})
                    }
                },
                {
                    label: '关于',
                    click: openAboutDialog
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(applicationMenu)

    return applicationMenu;
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
                    url: localPathToProtocolUrl(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-input-image', data)
    }
}


const importTemplates = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [{name: '模板配置文件', extensions: ['json']}]
    });
    if (filePaths && filePaths.length) {
        const data = [];
        filePaths.forEach(filePath => {
            // 读取文件内容
            const buffer = fs.readFileSync(filePath);
            // Buffer 转 字符串
            const templates = JSON.parse(buffer.toString());
            templates.forEach(template => {
                template.templateId = Date.now();
                data.push(template);
            })
        })
        window.webContents.send('templates:watch', {type: 2, data})
    }
}


const exportTemplates = async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导出',
        // defaultPath: app.getPath('desktop'),
        properties: ['multiSelections', 'createDirectory', 'openFile', "openDirectory"]
    })
    if (!canceled && filePaths) {
        window.webContents.send('templates:watch', {type: 1, data: filePaths[0]})
    }
}


const selectFonts = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [
            {name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2']}
        ]
    });
    if (filePaths && filePaths.length) {
        const fonts = await Promise.all(
            filePaths.map(async (filePath) => {
                // 读取文件
                const buffer = fs.readFileSync(filePath);
                // 写入文件
                fs.writeFileSync(path.join(fontPath, path.basename(filePath)), buffer);
                filePath = path.join(fontPath, path.basename(filePath));
                const fileParsed = path.parse(filePath);
                const font = {
                    family: fileParsed.name,
                    url: localPathToProtocolUrl(filePath),
                    path: filePath,
                };
                return [font.family, font]
            })
        );
        fonts.forEach(([family, font]) => registerFont(font))
        window.webContents.send('watch-input-font', {type: 0, data: new Map(fonts)})
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
                    url: localPathToProtocolUrl(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('watch-label-resources', {type: 0, data, event: 0})
    }
}


const customTextLabels = () => {
    window.webContents.send('watch-label-resources', {type: 1})
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


const editorOutputSettings = () => {
    window.webContents.send('editor-output-settings')
}


const openAboutDialog = () => {
    window.webContents.send('watch-about-dialog')
}

module.exports = createApplicationMenu
