const path = require('path')
const {getResourcePath, localPathToUrl} = require('./path-helper')

const RESOURCE_PREFIX = 'resources/'
const RESOURCE_TOKEN = /^resources[\\/]/

const isInside = (dir, filePath) => {
    const relative = path.relative(dir, filePath)
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

const forEachImageElement = (templates, fn) => {
    templates?.forEach(template => {
        const {background, foreground} = template?.settings || {}
        for (const layer of [background, foreground]) {
            layer?.elements?.forEach(element => {
                if (element?.type === 'image') fn(element)
            })
        }
    })
}

// 序列化：图片库路径转成相对数据根的引用（resources/xxx），src 由路径派生故不落盘
const serializeTemplates = (templates) => {
    const resourcePath = getResourcePath()
    forEachImageElement(templates, element => {
        const filePath = element.meta?.path
        if (!filePath) return
        delete element.src
        if (isInside(resourcePath, filePath)) {
            element.meta.path = RESOURCE_PREFIX + path.relative(resourcePath, filePath).split(path.sep).join('/')
        }
    })
    return JSON.stringify(templates, null, 2)
}

// 反序列化：相对引用还原成当前数据目录下的绝对路径，并按路径重建 src
const deserializeTemplates = (json) => {
    const templates = JSON.parse(json)
    const resourcePath = getResourcePath()
    forEachImageElement(templates, element => {
        const filePath = element.meta?.path
        if (!filePath) return
        if (RESOURCE_TOKEN.test(filePath)) {
            const resolved = path.join(resourcePath, ...filePath.split(/[\\/]/).slice(1))
            // 相对引用只允许落在图片库内，防手改文件穿越目录
            if (!isInside(resourcePath, resolved)) return
            element.meta.path = resolved
        }
        element.src = localPathToUrl(element.meta.path)
    })
    return templates
}

module.exports = {serializeTemplates, deserializeTemplates}
