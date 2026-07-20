const {CanvasEditor} = require("../canvas/NodeCanvasEditor");
const path = require("path");
const {copyExifDataToBuffer} = require("../utils/exif-helper");
const {promises: fs} = require("fs");
const {Image, LazyImage} = require('../canvas/NodeCanvasEditor')
const {reloadCustomFonts} = require('../utils/font-manager')

let cachedCanvasEditor;

const getCachedCanvasEditor = (graphicsRenderer) => {
    if (!cachedCanvasEditor) {
        let canvas;
        if (graphicsRenderer === 0) {
            const {createCanvas, loadImage} = require('@napi-rs/canvas')
            canvas = new createCanvas(0, 0)
            LazyImage.loadImage = Image.loadImage = loadImage
        } else {
            const {Canvas, loadImage} = require('skia-canvas')
            canvas = new Canvas()
            // 禁用 GPU 加速，强制使用软件渲染器
            canvas.gpu = false;
            LazyImage.loadImage = Image.loadImage = loadImage
            // 加载自定义字体
            reloadCustomFonts()
        }
        cachedCanvasEditor = new CanvasEditor(canvas, {strictIntegerDimensions: true});
    }
    return cachedCanvasEditor;
}


module.exports = async (params) => {
    const {
        projectSettings: {
            outputSettings: {
                quality,
                extname: extnameType,
                outputSize: {width, height, maxWidth, maxHeight, type},
                isSynchronizeMetadata,
                fileNaming: {basename, prefix, suffix}
            },
            performance: {
                graphicsRenderer
            }
        },
        outputDirectory,
        setting: {json, filePath, index, filename: originalName}
    } = params

    const parsed = path.parse(filePath);
    const originalExtname = parsed.ext.slice(1);

    let filename = basename === 0 ? originalName : basename === 1 ? String(index) : crypto.randomUUID().replaceAll('-', '')

    filename = prefix + filename + suffix;

    const outputExtname = getExtname(originalExtname, extnameType)

    const outputPath = path.join(outputDirectory, filename + "." + outputExtname)

    const settings = JSON.parse(json);

    const {elements, width: originalWidth, height: originalHeight} = settings;

    const background = elements[0];

    const {borderLeft, borderRight, borderTop, borderBottom} = background.meta;

    if (borderLeft === 0 && borderRight === 0 && borderTop === 0 && borderBottom === 0) {
        if (type === 0 && elements.length === 2 && originalExtname === outputExtname) {
            try {
                await fs.copyFile(filePath, outputPath);
            } catch (err) {
                console.error('拷贝失败:', err);
            }
            return null;
        }
        elements.splice(0, 1);
    }

    for (let element of elements) {
        if (element.type === 'image') {
            element.src = element.meta.path
        }
        if (graphicsRenderer === 0 && element.shadow) {
            element.shadow.blur = element.shadow.blur * 0.7;
        }
    }

    if (type === 0) {
        settings.zoom = 1
    } else if (type === 1) {
        settings.zoom = width / originalWidth
    } else if (type === 2) {
        settings.zoom = height / originalHeight
    } else if (type === 3) {
        settings.zoom = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
    }

    const canvasEditor = getCachedCanvasEditor(graphicsRenderer);
    canvasEditor.resizeCanvas(originalWidth, originalHeight)
    await canvasEditor.loadFromJSON(JSON.stringify(settings))
    canvasEditor.renderAll()

    const canvas = canvasEditor.getCanvas();

    let buffer;

    // 7. 保存图片 (使用 Buffer 写入)
    if (graphicsRenderer === 0) {
        buffer = outputExtname === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer(`image/${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 100 : quality);
    } else {
        buffer = outputExtname === 'png' ? await canvas.toBuffer('png') : await canvas.toBuffer(`${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 1 : quality / 100);
    }

    if (['jpeg', 'jpg'].includes(originalExtname) && ['jpeg', 'jpg'].includes(outputExtname) && isSynchronizeMetadata) {
        buffer = await copyExifDataToBuffer(filePath, buffer)
    }

    await fs.writeFile(outputPath, buffer);

    return null;
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
