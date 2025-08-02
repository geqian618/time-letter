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
 * 打开选择文件对话框
 */
const selectFile = async (window, type) => {
    const {filePaths} = await dialog.showOpenDialog({
        buttonLabel: '选择',
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp']}]
    });
    if (filePaths && filePaths.length) {
        const files = await Promise.all(
            filePaths.map(async (filePath) => {
                const extname = path.extname(filePath).slice(1);
                return {
                    name: path.basename(filePath),
                    url: getSafeImagePath(filePath),
                    path: filePath,
                    extname: extname
                };
            })
        );
        const data = new Map(files.map(item => [item.path, item]));
        window.webContents.send('input-images', {type, data})
    }
}

/**
 * 打开保存文件对话框
 */
const saveFile = (args) => {
    dialog.showSaveDialog().then(res => {
        console.log(res.filePath)
    })
}

/**
 * 打开保存文件对话框
 */
const openFiles = () => {
    dialog.showOpenDialog({
        buttonLabel: '打开',
        defaultPath: app.getPath('desktop'),
        properties: ['openFile', 'multiSelections'],
        filters: [{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']}]
    }).then(res => {
        const {filePaths} = res;
        console.log(filePaths)
    })
}


/**
 * mainMenu 定义为函数，主进程可以传参到菜单中
 * @param args
 * @returns {Electron.Menu}
 */
const mainMenu = (args) => {
    return Menu.buildFromTemplate([
        {
            label: '文件',
            submenu: [
                {
                    label: '导入',
                    // 无传参
                    click: () => selectFile(args.window, 0),
                    accelerator: 'ctrl+n'

                }, {
                    label: '追加导入',
                    // 无传参
                    click: () => selectFile(args.window, 1),
                    accelerator: 'ctrl+p'

                },
                {
                    label: '导出',
                    // 有传参，如何这样写 saveFile(args)函数会立即执行，而不是作为回调函数
                    click: () => openFiles(args.window),
                    accelerator: 'ctrl+o'
                }
            ]
        },
        {
            label: '设置',
            submenu: [
                {
                    label: '导出设置',
                    role: 'toggleDevTools'
                },
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: 'DevTools',
                    role: 'toggleDevTools'
                }
            ]
        }
    ]);
}

module.exports = mainMenu
