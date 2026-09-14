const {Menu} = require('electron')
const {t} = require('../locales')

let window;

const createTemplateContextMenu = (mainWindow) => {
    window = mainWindow;
    return Menu.buildFromTemplate([
        {
            label: t('menu.delete'),
            accelerator: 'CommandOrControl+D',
            click: () => {
                window.webContents.send('template-contextMenu:watch', {type: 0});
            }
        },
        {
            label: t('menu.rename'),
            accelerator: 'CommandOrControl+M',
            click: () => {
                window.webContents.send('template-contextMenu:watch', {type: 1});
            }
        }
    ])
};

module.exports = createTemplateContextMenu
