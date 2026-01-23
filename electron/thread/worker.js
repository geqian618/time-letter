const {CanvasEditor} = require("../canvas/NodeCanvasEditor");
const {createCanvas} = require('@napi-rs/canvas')
const path = require("path");
const {copyExifDataToBuffer} = require("../utils/exif-helper");
const {promises: fs} = require("fs");

module.exports = async (params) => {
    const {
        projectSettings: {
            outputSettings: {
                quality,
                extname: extnameType,
                outputSize: {width, height, type},
                isSynchronizeMetadata,
                fileNaming: {basename, prefix, suffix}
            }
        },
        outputDirectory,
        setting: {json, filePath, index}
    } = params

    const parsed = path.parse(filePath);
    const originalName = parsed.name;
    const originalExtname = parsed.ext.slice(1);

    let filename = basename === 0 ? originalName : basename === 1 ? String(index) : crypto.randomUUID().replaceAll('-', '')

    filename = prefix + filename + suffix;

    const outputExtname = getExtname(originalExtname, extnameType)

    const outputPath = path.join(outputDirectory, filename + "." + outputExtname)

    const settings = JSON.parse(json);

    const {elements, width: originalWidth, height: originalHeight} = settings

    for (let element of elements) {
        if (element.type === 'image') {
            element.src = element.meta.path
        }
    }

    if (type === 0) {
        settings.zoom = 1
    } else if (type === 1) {
        settings.zoom = width / originalWidth
    } else if (type === 2) {
        settings.zoom = height / originalHeight
    }

    const canvas = createCanvas(originalWidth, originalHeight);
    const canvasEditor = new CanvasEditor(canvas);
    await canvasEditor.loadFromJSON(JSON.stringify(settings))
    canvasEditor.renderAll()

    // 7. 保存图片 (使用 Buffer 写入)
    let buffer = outputExtname === 'png'
        ? canvas.toBuffer('image/png')
        : canvas.toBuffer(`image/${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 100 : quality);

    if (['jpeg', 'jpg'].includes(originalExtname) && ['jpeg', 'jpg'].includes(outputExtname) && isSynchronizeMetadata) {
        buffer = await copyExifDataToBuffer(filePath, buffer)
    }

    await fs.writeFile(outputPath, buffer);

};


const getExtname = (originalExtname, extnameType) => {
    if (extnameType === 0) {
        return originalExtname
    } else if (extnameType === 1) {
        return 'jpeg'
    } else if (extnameType === 2) {
        return 'png'
    } else if (extnameType === 3) {
        return 'webp'
    }
}
