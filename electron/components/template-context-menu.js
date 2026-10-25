const {Menu} = require('electron')
const {t} = require('../locales')

let window;

// macOS 关闭主窗口后应用仍存活，菜单仍可被唤起；
// 发送前统一判存活，避免向已销毁 webContents 发送抛 "Object has been destroyed"
const send = (channel, payload) => {
    if (!window || window.isDestroyed()) return
    window.webContents.send(channel, payload)
}

// 窗口关闭时由主进程调用，释放对已销毁窗口的引用
const dispose = () => {
    window = null
}

const createTemplateContextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: t('menu.delete'),
            accelerator: 'CommandOrControl+D',
            click: () => {
                send('template-contextMenu:watch', {type: 0});
            }
        },
        {
            label: t('menu.rename'),
            accelerator: 'CommandOrControl+M',
            click: () => {
                send('template-contextMenu:watch', {type: 1});
            }
        }
    ])
};

module.exports = {createTemplateContextMenu, dispose}
