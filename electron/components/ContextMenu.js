const {Menu} = require('electron')
const contextMenu = () => {
    return Menu.buildFromTemplate([
        {
            label: '复制',
            accelerator: 'ctrl+c',
            role: 'copy'
        },
        {
            label: '粘贴',
            accelerator: 'ctrl+v',
            role: 'paste'
        },
        {
            label: '剪切',
            accelerator: 'ctrl+x',
            role: 'cut'
        },
        {
            label: '新建',
            click: (event, params) => {

            }
        },
        {
            label: '刷新',
            click: (event, params) => {

            }
        }
    ])
};

module.exports = contextMenu
