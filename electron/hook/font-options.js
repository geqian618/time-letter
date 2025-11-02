const defaultFonts = [
    {
        value: 'Microsoft YaHei',
        label: '微软雅黑',
    },
    {
        value: 'SimSun',
        label: '宋体',
    },
    {
        value: 'KaiTi',
        label: '楷体',
    },
    {
        value: 'FangSong',
        label: '仿宋',
    },
    {
        value: 'SimHei',
        label: '黑体',
    },
    {
        value: 'NSimSun',
        label: '新宋体',
    },
    {
        value: 'LiSu',
        label: '隶书',
    },
    {
        value: 'YouYuan',
        label: '幼圆',
    },
    {
        value: 'STXihei',
        label: '华文细黑',
    },
    {
        value: 'STKaiti',
        label: '华文楷体',
    },
    {
        value: 'STSong',
        label: '华文宋体',
    },
    {
        value: 'Arial',
        label: 'Arial',
    },
    {
        value: 'Verdana',
        label: 'Verdana',
    },
    {
        value: 'Tahoma',
        label: 'Tahoma',
    },
    {
        value: 'Helvetica',
        label: 'Helvetica',
    },
    {
        value: 'Times New Roman',
        label: 'Times New Roman',
    },
    {
        value: 'Georgia',
        label: 'Georgia',
    },
    {
        value: 'Courier New',
        label: 'Courier New',
    },
    {
        value: 'Impact',
        label: 'Impact',
    },
    {
        value: 'Comic Sans MS',
        label: 'Comic Sans MS',
    },
    {
        value: 'Trebuchet MS',
        label: 'Trebuchet MS',
    },
    {
        value: 'PingFang SC',
        label: '苹方简体',
    },
    {
        value: 'Source Han Sans SC',
        label: '思源黑体',
    },
    {
        value: 'Hiragino Sans GB',
        label: '冬青黑体',
    }
]

const fontOptions = new Map()
defaultFonts.forEach(font => fontOptions.set(font.value, {default: true, ...font}))

module.exports = fontOptions
