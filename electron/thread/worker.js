const {CanvasEditor, Text} = require("../canvas/CanvasEditor");
const {createCanvas} = require('@napi-rs/canvas')
const path = require("path");
const {copyExifDataToBuffer} = require("../utils/exif-helper");
const {promises: fs} = require("fs");

module.exports = async (params) => {
    try {
        const {
            outputDirectory,
            projectSettings: {
                outputSettings: {
                    quality,
                    extname: extnameType,
                    outputSize: {longSide, shortSide, width, height, type},
                    isSynchronizeMetadata,
                    fileNaming: {basename, prefix, suffix}
                },
                availableFonts
            },
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

        const {canvas: {elements}} = data

        for (let element of elements) {
            if (element.type === 'image') {
                element.src = element.path
            }
        }

        console.log(elements)

        const canvas = createCanvas(1000, 1000);
        const canvasEditor = new CanvasEditor(canvas);
        await canvasEditor.loadFromJSON(JSON.stringify(data))
        canvasEditor.renderAll()

        // 7. 保存图片 (使用 Buffer 写入)
        let buffer = outputExtname === 'png'
            ? canvas.toBuffer('image/png')
            : canvas.toBuffer(`image/${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 100 : quality);

        if (['jpeg', 'jpg'].includes(originalExtname) && ['jpeg', 'jpg'].includes(outputExtname) && isSynchronizeMetadata) {
            buffer = await copyExifDataToBuffer(filePath, buffer)
        }

        await fs.writeFile(outputPath, buffer);
    } catch (error) {
        throw error;
    }
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


// 定义策略配置
const resizeStrategies = {
    // 原始尺寸，不含边框
    0: (image) => ({
        width: image.width,
        height: image.height
    }),

    // 原始尺寸，含边框
    1: (image, {widthRatio}) => ({
        width: image.width / widthRatio,
        height: image.height / widthRatio
    }),

    // 长边固定，不包含边框
    2: (image, {longSide}) => ({
        width: image.height > image.width ?
            longSide * image.width / image.height : longSide,
        height: image.height > image.width ?
            longSide : longSide * image.height / image.width
    }),

    // 长边固定，包含边框
    3: (image, {longSide, widthRatio, heightRatio}) => ({
        width: image.height > image.width ?
            longSide * image.width / image.height / heightRatio :
            longSide / widthRatio,
        height: image.height > image.width ?
            longSide / heightRatio :
            longSide * image.height / image.width / widthRatio
    }),

    // 短边固定，不包含边框
    4: (image, {shortSide, longSide}) => ({
        width: image.height < image.width ?
            shortSide * image.width / image.height : shortSide,
        height: image.height < image.width ?
            shortSide : longSide * image.height / image.width
    }),

    // 短边固定，包含边框
    5: (image, {shortSide, longSide, widthRatio, heightRatio}) => ({
        width: image.height < image.width ?
            shortSide * image.width / image.height / heightRatio :
            shortSide / widthRatio,
        height: image.height < image.width ?
            shortSide / heightRatio :
            longSide * image.height / image.width / widthRatio
    }),

    // 宽固定，不包含边框
    6: (image, {width}) => ({
        width: width,
        height: image.height * width / image.width
    }),

    // 宽固定，包含边框
    7: (image, {width, widthRatio}) => ({
        width: width / widthRatio,
        height: image.height * width / image.width / widthRatio
    }),

    // 高固定，不包含边框
    8: (image, {height}) => ({
        width: image.width * height / image.height,
        height: height
    }),
    // 高固定，包含边框
    9: (image, {height, heightRatio}) => ({
        width: image.width * height / image.height / heightRatio,
        height: height / heightRatio
    })
};

