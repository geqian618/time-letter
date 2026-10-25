const {dialog, app, Menu, shell} = require('electron');
const path = require('path')
const fs = require('fs')
const yauzl = require('yauzl');
// stream/promises 的 pipeline 在 Node 16（Electron 22）与更高版本 Node 上均为 promise 形式；
// 顶层 require('stream').pipeline 在部分版本要求必须传回调
const {pipeline} = require('stream/promises');
const {getResourcePath, getFontPath, localPathToUrl, localPathToThumbUrl} = require('../utils/path-helper')
const {addFont} = require('../utils/font-manager')
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

// macOS 关闭主窗口后应用仍存活，应用菜单仍挂载可点击；
// 发送前统一判存活，避免向已销毁 webContents 发送抛 "Object has been destroyed"
const send = (channel, payload) => {
    if (!window || window.isDestroyed()) return
    send(channel, payload)
}

// 窗口关闭时由主进程调用，释放对已销毁窗口的引用
const dispose = () => {
    window = null
}

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
                                send('resources:watch-change', {type: 3})
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
        send('images:watch-import', data)
    }
}


// ---------- .tile（zip）流式读取（yauzl） ----------
// AdmZip 会把整个压缩包读进内存，导入大模板包时主进程峰值随包体积线性增长；
// yauzl 逐条目流式读取，内存占用约等于当前正在解压的单个文件。

const openZip = (zipPath) => new Promise((resolve, reject) => {
    yauzl.open(zipPath, {lazyEntries: true, autoClose: false}, (err, zipfile) => {
        if (err) reject(err)
        else resolve(zipfile)
    })
})

const openZipEntryStream = (zipfile, entry) => new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, stream) => {
        if (err) reject(err)
        else resolve(stream)
    })
})

// 流式读取 zip 内指定文本条目的完整内容；条目不存在时 resolve(null)
const readZipTextEntry = async (zipPath, entryName) => {
    const zipfile = await openZip(zipPath)
    try {
        return await new Promise((resolve, reject) => {
            zipfile.on('error', reject)
            zipfile.on('end', () => resolve(null))
            zipfile.on('entry', (entry) => {
                if (entry.fileName !== entryName) {
                    zipfile.readEntry()
                    return
                }
                openZipEntryStream(zipfile, entry).then(stream => {
                    const chunks = []
                    stream.on('data', (chunk) => chunks.push(chunk))
                    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
                    stream.on('error', reject)
                }).catch(reject)
            })
            zipfile.readEntry()
        })
    } finally {
        zipfile.close()
    }
}

// 流式解出 zip 中 targetDirOf 命中的条目：以 basename 落到目标目录，已存在的文件不覆盖
// （与旧行为一致）；未命中的条目跳过。targetDirOf(entryName) 返回 null 表示不处理
const extractZipEntriesByBasename = async (zipPath, targetDirOf) => {
    const zipfile = await openZip(zipPath)
    try {
        await new Promise((resolve, reject) => {
            zipfile.on('error', reject)
            zipfile.on('end', resolve)
            zipfile.on('entry', (entry) => {
                // 目录条目（名以 / 结尾）直接跳过
                if (/\/$/.test(entry.fileName)) {
                    zipfile.readEntry()
                    return
                }
                const targetDir = targetDirOf(entry.fileName)
                if (targetDir == null) {
                    zipfile.readEntry()
                    return
                }
                openZipEntryStream(zipfile, entry).then(async (stream) => {
                    try {
                        const target = path.join(targetDir, path.basename(entry.fileName))
                        // 已存在则不覆盖：yauzl 要求当前流结束或销毁后才能继续遍历
                        const exists = await fs.promises.access(target, fs.constants.F_OK)
                            .then(() => true).catch(() => false)
                        if (exists) {
                            stream.destroy()
                        } else {
                            await fs.promises.mkdir(targetDir, {recursive: true})
                            await pipeline(stream, fs.createWriteStream(target))
                        }
                        zipfile.readEntry()
                    } catch (err) {
                        reject(err)
                    }
                }).catch(reject)
            })
            zipfile.readEntry()
        })
    } finally {
        zipfile.close()
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

    try {
        // 第一遍只读 templates.json 做校验（流式）：配置无效时与旧行为一致，不写任何文件
        const configText = await readZipTextEntry(filePaths[0], 'templates.json');
        if (configText == null) return;

        let config;
        try {
            config = JSON.parse(configText);
        } catch (err) {
            return;
        }

        const {type, templates} = config;

        if (type !== 'TEMPLATE' || !templates?.length) {
            return;
        }

        const data = [];
        let nextId = Date.now();

        // 处理模板配置中的图片路径（重写为本机资源目录）
        for (const template of templates) {
            const newTemplate = {...template, templateId: nextId++};
            const elements = newTemplate.settings?.foreground?.elements;
            if (elements && Array.isArray(elements)) {
                for (const element of elements) {
                    if (element.type === 'image' && element.meta?.path) {
                        const fileName = path.basename(element.meta.path);
                        const newFilePath = path.join(getResourcePath(), fileName);
                        element.meta.path = newFilePath;
                        element.src = localPathToUrl(newFilePath);
                    }
                }
            }
            data.push(newTemplate);
        }

        // 第二遍流式解出资源与字体文件
        await extractZipEntriesByBasename(filePaths[0], (entryName) => {
            if (entryName.startsWith('resources/')) return getResourcePath();
            if (entryName.startsWith('fonts/')) return getFontPath();
            return null;
        });
        send('templates:watch', {type: 2, data})
    } catch (err) {
        console.error('模板导入失败:', err)
    }
}


const exportTemplates = async () => {
    const {canceled, filePath} = await dialog.showSaveDialog({
        title: t('dialog.saveFile'),
        buttonLabel: t('dialog.save'),
        defaultPath: path.join(app.getPath('desktop'), 'templates.tile'),
        filters: [{name: 'TILE', extensions: ['tile']}]
    })
    if (!canceled && filePath) {
        send('templates:watch', {type: 1, data: filePath})
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
                isSystem: false
            };
            addFont(font);
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
        send('fonts:watch-import', {type: 0, data: fontMap});
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
                // 直接复制文件，内容不进主进程内存中转（此前 readFileSync/writeFileSync
                // 使每个文件完整内容在内存过一遍，且 async 包裹内全是同步调用、实为串行阻塞）
                const target = path.join(getResourcePath(), path.basename(filePath));
                await fs.promises.copyFile(filePath, target);
                return {
                    filename: path.basename(target),
                    url: localPathToUrl(target),
                    path: target,
                    extname: path.extname(target).slice(1)
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        send('resources:watch-change', {type: 0, data, event: 0})
    }
}


const addTextResource = () => {
    send('resources:watch-change', {type: 1})
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
        send('contextMenu:watch', {type: 3, outputDirectory: filePaths[0]})
    }
}


const openSettingsDialog = () => {
    send('settings-dialog:open')
}


const openAboutDialog = () => {
    send('about-dialog:open')
}


const exportSettings = async () => {
    const {canceled, filePath} = await dialog.showSaveDialog({
        title: t('dialog.saveFile'),
        buttonLabel: t('dialog.save'),
        defaultPath: path.join(app.getPath('desktop'), 'settings.json'),
        filters: [{name: 'JSON', extensions: ['json']}]
    })
    if (!canceled && filePath) {
        send('settings:watch', {type: 1, data: {filePath}})
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
            send('settings:watch', {type: 0, data: {settings}})
        }
    } catch (e) {
        dialog.showMessageBox({type: 'error', title: '导入失败', message: '无效配置文件'})
    }

}


module.exports = {createApplicationMenu, dispose}
