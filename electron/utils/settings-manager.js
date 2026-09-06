const fs = require('fs');
const path = require('path');

const {getSettingsFilePath} = require('./path-helper')

/**
 * 读取应用配置文件 settings.json（主题 / 语言等模块共用）
 * @returns {object} 配置对象；文件不存在或内容异常时返回 {}
 */
const read = () => {
    try {
        const settings = JSON.parse(fs.readFileSync(getSettingsFilePath(), 'utf8'))
        // 防御非法内容（null / 数组等），保证调用方可以安全读取字段
        return settings && typeof settings === 'object' && !Array.isArray(settings) ? settings : {}
    } catch (e) {
        return {}
    }
}

/**
 * 合并写入应用配置文件 settings.json：只更新传入的字段，保留其余配置
 * @param partial {object} 要写入的配置片段，如 {theme} / {language}
 */
const write = (partial) => {
    const settings = {...read(), ...partial}
    fs.mkdirSync(path.dirname(getSettingsFilePath()), {recursive: true})
    fs.writeFileSync(getSettingsFilePath(), JSON.stringify(settings, null, 2), 'utf8')
}

module.exports = {read, write}
