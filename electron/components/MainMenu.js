const {app, dialog, Menu} = require('electron');
const path = require('path')

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
const selectFile = async (window) => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '导入',
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp']}]
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

/**
 * 图片导出
 */
const saveFiles = () => {
    dialog.showOpenDialog({
        buttonLabel: '导出',
        defaultPath: app.getPath('desktop'),
        properties: ['multiSelections', 'createDirectory', 'openFile', "openDirectory"]
    }).then(res => {
        console.log(res.filePaths)
    })
}

/**
 * mainMenu 定义为函数，主进程可以传参到菜单中
 * @settings args
 * @returns {Electron.Menu}
 */
const mainMenu = (args) => {
    return Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '导入图片',
                    // 无传参
                    click: () => selectFile(args.window),
                    accelerator: 'ctrl+i'

                },
                {
                    label: '导出图片',
                    // 有传参，如何这样写 saveFile(args)函数会立即执行，而不是作为回调函数
                    click: () => saveFiles(args.window),
                    accelerator: 'ctrl+o'
                }
            ]
        },
        {
            label: '设置',
            submenu: [
                {
                    label: '导出设置',
                    role: '',
                },
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
                    role: ''
                }
            ]
        }
    ]);
}

module.exports = mainMenu
