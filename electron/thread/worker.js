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

    const data = JSON.parse(json);

    const {elements, width: originalWidth, height: originalHeight} = data

    for (let element of elements) {
        if (element.type === 'image') {
            element.src = element.meta.path
        }
    }

    let targetCanvas = createCanvas(1000, 1000);
    const canvasEditor = new CanvasEditor(targetCanvas);
    await canvasEditor.loadFromJSON(JSON.stringify(data))
    canvasEditor.renderAll()

    if (type !== 0) {
        let scaleWidth, scaleHeight, scale;
        if (type === 1) {
            scale = width / originalWidth;
            scaleWidth = width;
            scaleHeight = originalHeight * scale
        }
        if (type === 2) {
            scale = height / originalHeight;
            scaleHeight = height;
            scaleWidth = originalWidth * scale
        }
        const scaledCanvas = createCanvas(scaleWidth, scaleHeight);
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCtx.drawImage(targetCanvas, 0, 0, scaleWidth, scaleHeight);
        targetCanvas = scaledCanvas;
    }

    // 7. 保存图片 (使用 Buffer 写入)
    let buffer = outputExtname === 'png'
        ? targetCanvas.toBuffer('image/png')
        : targetCanvas.toBuffer(`image/${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 100 : quality);

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
