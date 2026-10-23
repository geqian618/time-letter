const {dialog, app, Menu, shell} = require('electron');
const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip');
const {getResourcePath, getFontPath, localPathToUrl, localPathToThumbUrl} = require('../utils/path-helper')
const {registerFont} = require('../utils/font-manager')
const {openImageManagerWindow} = require('./image-manager-window')
const {t} = require('../locales')
const {defaultShortcuts} = require('../../src/config/default-project-settings')
const {IMAGE_TYPES} = require("../constant/project-constants");

/**
 * mainMenu 定义为函数，主进程可以传参到菜单中
 * @settings args
 * @returns {Electron.Menu}
 */

let window;

const createApplicationMenu = (mainWindow, shortcuts = defaultShortcuts) => {

    window = mainWindow;

    const template = [];

    // macOS 需要标准 role 菜单：应用菜单缺失时 Cmd+Q / 隐藏等快捷键不生效
    if (process.platform === 'darwin') {
        template.push({role: 'appMenu'})
    }

    template.push(
        {
            id: 'file',
            label: t('menu.file'),
            submenu: [
                {
                    id: 'import-images',
                    label: t('menu.importImages'),
                    // 无传参
                    click: selectFile,
                    accelerator: shortcuts.importImages

                },
                {
                    id: 'export-images',
                    label: t('menu.exportImages'),
                    click: saveFiles,
                    accelerator: shortcuts.exportImages
                }
            ]
        },
        {
            id: 'settings',
            label: t('menu.settings'),
            submenu: [
                {
                    id: 'preferences',
                    label: t('menu.preferences'),
                    click: openSettingsDialog,
                    accelerator: shortcuts.preferences,
                },
                {
                    label: t('menu.templatePresets'),
                    submenu: [
                        {
                            id: 'import-templates',
                            label: t('menu.importFile'),
                            click: importTemplates
                        },
                        {
                            id: 'export-templates',
                            label: t('menu.exportFile'),
                            click: exportTemplates
                        }
                    ],
                },
                {
                    label: t('menu.globalSettings'),
                    submenu: [
                        {
                            id: 'import-settings',
                            label: t('menu.importFile'),
                            click: importSettings
                        },
                        {
                            id: 'export-settings',
                            label: t('menu.exportFile'),
                            click: exportSettings
                        }
                    ],
                },
            ]
        },
        {
            id: 'extensions',
            label: t('menu.extensions'),
            submenu: [
                {
                    label: t('menu.textLibrary'),
                    submenu: [
                        {
                            id: 'add-text',
                            label: t('menu.addText'),
                            click: addTextResource
                        },
                        {
                            id: 'manage-text',
                            label: t('menu.manageText'),
                            click: () => {
                                window.webContents.send('resources:watch-change', {type: 3})
                            }
                        }
                    ],
                },
                {
                    label: t('menu.imageLibrary'),
                    submenu: [
                        {
                            id: 'import-image-resources',
                            label: t('menu.importImages'),
                            click: selectImageResources
                        },
                        {
                            id: 'open-image-resources',
                            label: t('menu.openResources'),
                            click: () => {
                                // 尝试打开文件夹
                                shell.openPath(getResourcePath());
                            }
                        }
                    ]
                },
                {
                    label: t('menu.fontLibrary'),
                    submenu: [
                        {
                            id: 'import-fonts',
                            label: t('menu.importFonts'),
                            click: selectFonts
                        },
                        {
                            id: 'open-font-resources',
                            label: t('menu.openResources'),
                            click: () => {
                                // 尝试打开文件夹
                                shell.openPath(getFontPath());
                            }
                        }
                    ],
                },
            ]
        },
        {
            id: 'tools',
            label: t('menu.tools'),
            submenu: [
                {
                    id: 'image-manager',
                    label: t('menu.imageManager'),
                    click: openImageManagerWindow
                },
            ]
        }
    );

    // macOS 编辑/窗口菜单：role 缺失时输入框 Cmd+C / Cmd+V / Cmd+W 不生效；
    // Windows/Linux 下 Chromium 原生处理剪贴板快捷键，无需增加菜单项
    if (process.platform === 'darwin') {
        template.push({role: 'editMenu'}, {role: 'windowMenu'})
    }

    template.push({
        id: 'help',
        label: t('menu.help'),
        submenu: [
            {
                label: t('menu.console'),
                // role: 'toggleDevTools',
                click: (menuItem, browserWindow, event) => {
                    browserWindow.webContents.openDevTools({mode: "detach"})
                }
            },
            {
                id: 'about',
                label: t('menu.about'),
                click: openAboutDialog
            }
        ]
    });

    const applicationMenu = Menu.buildFromTemplate(template);

    // macOS 的应用菜单挂在应用级；Windows / Linux 挂在窗口上
    if (process.platform === 'darwin') {
        Menu.setApplicationMenu(applicationMenu)
    } else {
        window.setMenu(applicationMenu)
    }

    return applicationMenu;
}


/**
 * 图片导入
 */
const selectFile = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        title: t('dialog.importFile'),
        buttonLabel: t('dialog.import'),
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: IMAGE_TYPES}]
    });
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
        window.webContents.send('images:watch-import', data)
    }
}


const importTemplates = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        title: t('dialog.importFile'),
        buttonLabel: t('dialog.import'),
        properties: ['openFile'],
        filters: [{name: 'TILE', extensions: ['tile']}]
    });

    if (!filePaths?.length) return;

    const zip = new AdmZip(filePaths[0]);
    const configEntry = zip.getEntry('templates.json');

    if (!configEntry || configEntry.isDirectory) {
        return;
    }

    let config;
    try {
        const configData = configEntry.getData().toString('utf8');
        config = JSON.parse(configData);
    } catch (err) {
        return;
    }

    const {type, templates} = config;

    if (type !== 'TEMPLATE' || !templates?.length) {
        return;
    }

    const data = [];
    let nextId = Date.now();
    const entries = zip.getEntries();

    // 先处理模板配置中的图片路径
    for (const template of templates) {
        const newTemplate = {...template, templateId: nextId++};
        const elements = newTemplate.settings?.foreground?.elements;
        if (elements && Array.isArray(elements)) {
            for (const element of elements) {
                if (element.type === 'image' && element.meta?.path) {
                    const originalPath = element.meta.path;
                    const fileName = path.basename(originalPath);
                    const newFilePath = path.join(getResourcePath(), fileName);
                    element.meta.path = newFilePath;
                    element.src = localPathToUrl(newFilePath);
                }
            }
        }
        data.push(newTemplate);
    }

    for (const entry of entries) {
        if (!entry.isDirectory) {
            const entryName = entry.entryName;
            if (entryName.startsWith('resources/') || entryName.startsWith('fonts/')) {
                const filename = path.basename(entryName);
                const file = path.join(entryName.startsWith('resources/') ? getResourcePath() : getFontPath(), filename);
                fs.access(file, fs.constants.F_OK, (err) => {
                    if (err) {
                        const buffer = zip.readFile(entry);
                        fs.writeFile(file, buffer, err => {
                            if (err) {
                                console.log('文件写入失败：', err);
                            }
                        })
                    }
                });
            }
        }
    }
    window.webContents.send('templates:watch', {type: 2, data})
}


const exportTemplates = async () => {
    const {canceled, filePath} = await dialog.showSaveDialog({
        title: t('dialog.saveFile'),
        buttonLabel: t('dialog.save'),
        defaultPath: path.join(app.getPath('desktop'), 'templates.tile'),
        filters: [{name: 'TILE', extensions: ['tile']}]
    })
    if (!canceled && filePath) {
        window.webContents.send('templates:watch', {type: 1, data: filePath})
    }
}


const selectFonts = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        title: t('dialog.importFile'),
        buttonLabel: t('dialog.import'),
        properties: ['openFile', 'multiSelections'],
        filters: [
            {name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2']}
        ]
    });

    if (!filePaths || filePaths.length === 0) return;

    // 确保目标目录存在
    await fs.promises.mkdir(getFontPath(), {recursive: true});

    const fontMap = new Map();
    const errors = [];

    // 使用 Promise.allSettled 允许部分成功
    const results = await Promise.allSettled(
        filePaths.map(async (filePath) => {
            const destPath = path.join(getFontPath(), path.basename(filePath));
            // 文件拷贝
            await fs.promises.copyFile(filePath, destPath);

            const fileParsed = path.parse(destPath);
            const font = {
                family: fileParsed.name,
                url: localPathToUrl(destPath),
                path: destPath,
            };
            // 注册字体
            registerFont(font);
            return {family: font.family, font};
        })
    );

    // 处理每个结果
    for (const result of results) {
        if (result.status === 'fulfilled') {
            const {family, font} = result.value;
            fontMap.set(family, font);
        } else {
            errors.push(result.reason.message);
        }
    }

    if (fontMap.size && window) {
        window.webContents.send('fonts:watch-import', {type: 0, data: fontMap});
    }

    if (errors.length > 0) {
        throw new Error(`${errors.length} 个字体导入失败：请检查文件是否已存在或者文件/文件夹无读写权限`);
    }
};


const selectImageResources = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        title: t('dialog.importFile'),
        buttonLabel: t('dialog.import'),
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: [...IMAGE_TYPES, 'svg']}]
    });
    if (filePaths && filePaths.length) {
        fs.mkdirSync(getResourcePath(), {recursive: true});
        const files = await Promise.all(
            filePaths.map(async (filePath) => {
                // 读取文件
                const buffer = fs.readFileSync(filePath);
                // 写入文件
                fs.writeFileSync(path.join(getResourcePath(), path.basename(filePath)), buffer);
                const extname = path.extname(filePath).slice(1);
                filePath = path.join(getResourcePath(), path.basename(filePath));
                return {
                    filename: path.basename(filePath),
                    url: localPathToUrl(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('resources:watch-change', {type: 0, data, event: 0})
    }
}


const addTextResource = () => {
    window.webContents.send('resources:watch-change', {type: 1})
}

/**
 * 图片导出
 */
const saveFiles = async () => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        buttonLabel: t('dialog.export'),
        defaultPath: app.getPath('desktop'),
        properties: ['openDirectory', 'createDirectory']
    })
    if (!canceled && filePaths) {
        window.webContents.send('contextMenu:watch', {type: 3, outputDirectory: filePaths[0]})
    }
}


const openSettingsDialog = () => {
    window.webContents.send('settings-dialog:open')
}


const openAboutDialog = () => {
    window.webContents.send('about-dialog:open')
}


const exportSettings = async () => {
    const {canceled, filePath} = await dialog.showSaveDialog({
        title: t('dialog.saveFile'),
        buttonLabel: t('dialog.save'),
        defaultPath: path.join(app.getPath('desktop'), 'settings.json'),
        filters: [{name: 'JSON', extensions: ['json']}]
    })
    if (!canceled && filePath) {
        window.webContents.send('settings:watch', {type: 1, data: {filePath}})
    }
}


const importSettings = async () => {
    const {filePaths} = await dialog.showOpenDialog({
        title: t('dialog.importFile'),
        buttonLabel: t('dialog.import'),
        properties: ['openFile'],
        filters: [{name: 'JSON', extensions: ['json']}]
    });

    if (!filePaths?.length) return;

    try {
        const {settings, type} = JSON.parse(fs.readFileSync(filePaths[0], 'utf8'))
        if (type === 'Settings' && settings && typeof settings === 'object') {
            window.webContents.send('settings:watch', {type: 0, data: {settings}})
        }
    } catch (e) {
        dialog.showMessageBox({type: 'error', title: '导入失败', message: '无效配置文件'})
    }

}


module.exports = createApplicationMenu
