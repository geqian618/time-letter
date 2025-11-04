const path = require('path');
const pathToFileURL = require('url').pathToFileURL;
const {createCanvas, loadImage} = require('@napi-rs/canvas');
// 使用 promises API
const fs = require('fs').promises;


/**
 * 查找指定目录下指定类型文件集合
 *
 * @settings dirPath 查找目录
 * @settings extensions 文件类型
 * @settings deepSearch 深度查找
 * @returns {Promise<*[]>}
 */
async function findFilePaths(dirPath, extensions, deepSearch = false) {

    const results = [];

    const entries = await fs.readdir(dirPath, {withFileTypes: true});

    await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory() && deepSearch) {
            results.push(...await findFilePaths(fullPath, extensions));
        } else if (entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase())) {
            results.push(fullPath);
        }
    }));

    return results;
}

function drawText(ctx, text, newWidth, newHeight) {
    const fontSize = text.options.fontSizeRatio * newWidth;
    const fontFamily = text.options.fontFamily;
    const fontStyle = text.options.fontStyle;
    const fontWeight = text.options.fontWeight;
    const textDirection = text.options.textDirection;
    const angle = text.options.angle;

    // 添加文字样式
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = text.options.fontColor;

    // 设置对齐基准点
    ctx.textAlign = text.references[0]; // 水平对齐
    ctx.textBaseline = 'top';           // 垂直基线

    // 测量文本尺寸
    const metrics = ctx.measureText(text.content);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const specialFillFontSize = fontFamily.includes('Microsoft YaHei') ? 0.18 * fontSize : 0;

    // 计算初始位置（相对坐标）
    let textX = textDirection === 0 ? text.positionX * newWidth : text.positionX * newWidth + fontSize / 2;
    let textY = textDirection === 0 ? text.positionY * newHeight - specialFillFontSize : text.positionY * newHeight + fontSize / 2;
    // let textY = textDecoration === 0 ? text.positionY * newHeight - 0.2 * fontSize : text.positionY * newHeight + textHeight / 2;

    // 处理右/底对齐
    if (text.references.includes('right')) {
        textX = textDirection === 0
            ? (1 - text.positionX) * newWidth
            : (1 - text.positionX) * newWidth - fontSize / 2;
    }
    if (text.references.includes('bottom')) {
        textY = textDirection === 0
            // ? (1 - text.positionY) * newHeight - 1.2 * fontSize
            ? (1 - text.positionY) * newHeight - fontSize - specialFillFontSize
            : (1 - text.positionY) * newHeight - fontSize * text.content.length + fontSize / 2;
    }


    // 1. 计算文字中心点
    let centerX, centerY;

    switch (ctx.textAlign) {
        case 'left':
            centerX = textX + textWidth / 2;
            break;
        case 'right':
            centerX = textX - textWidth / 2;
            break;
        case 'center':
        default:
            centerX = textX;
    }

    // 根据 top 基线计算垂直中心
    centerY = textY + textHeight / 2;

    // 保存当前画布状态
    ctx.save();

    // =========== 新增：设置文字阴影属性 ===========
    if (text.options.textShadow) {
        // 默认不透明黑色
        ctx.shadowColor = text.options.textShadow.shadowColor || 'rgba(0,0,0,1)';
        // 默认模糊0像素
        ctx.shadowBlur = text.options.textShadow.blurRatio * fontSize || 0;
        // 默认X偏移
        ctx.shadowOffsetX = text.options.textShadow.offsetXRatio * fontSize || 0;
        // 默认Y偏移
        ctx.shadowOffsetY = text.options.textShadow.offsetYRatio * fontSize || 0;
    }

    if (textDirection === 0) {
        // 执行旋转绘制
        ctx.translate(centerX, centerY);  // 平移到中心点
        ctx.rotate(angle * Math.PI / 180);  // 旋转（角度转弧度）
        ctx.translate(-centerX, -centerY);  // 平移回原始坐标系
        // 3. 绘制旋转后的文字
        ctx.fillText(text.content, textX, textY);
    } else {
        // 绘制纵向文本
        drawVerticalText(ctx, text.content, textX, textY, fontSize, angle);
    }

    // 恢复画布状态
    ctx.restore();
}


function drawVerticalText(ctx, text, x, y, lineHeight, rotation = 0) {
    ctx.save();
    const characters = text.split('');
    const originalTextAlign = ctx.textAlign;
    const originalTextBaseline = ctx.textBaseline;

    // 设置统一的文本基线
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 计算文本总高度
    const totalHeight = characters.length * lineHeight;

    // 移动到旋转中心点
    ctx.translate(x, y + totalHeight / 2);

    // 应用旋转（转换为弧度）
    ctx.rotate(rotation * Math.PI / 180);

    // 移回原始位置
    ctx.translate(-x, -(y + totalHeight / 2));

    for (let i = 0; i < characters.length; i++) {
        const char = characters[i];
        const charCode = char.charCodeAt(0);
        if (charCode <= 256) {
            ctx.save();
            ctx.translate(x, y + i * lineHeight);
            ctx.rotate(0);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        } else {
            ctx.fillText(char, x, y + i * lineHeight);
        }
    }
    ctx.textAlign = originalTextAlign;
    ctx.textBaseline = originalTextBaseline;
    ctx.restore();
}


async function drawImage(ctx, imageItem, newWidth, newHeight) {

    const path = imageItem.path;

    const alpha = imageItem.options.alpha ? imageItem.options.alpha / 10 : 1;

    const height = imageItem.options.imageHeightRatio * newHeight;

    const width = imageItem.options.imageWidthRatio * newWidth;

    let imageX = imageItem.positionX * newWidth

    let imageY = imageItem.positionY * newHeight;


    let imageBuffer;

    try {
        // 1. 读取图片为 Buffer
        imageBuffer = await fs.readFile(path);
    } catch (err) {
        throw new Error('文件已不存在：' + path)
    }

    const overlay = await loadImage(imageBuffer);

    if (imageItem.references.includes('right')) {
        imageX = (1 - imageItem.positionX) * newWidth - width
    }

    if (imageItem.references.includes('bottom')) {
        imageY = (1 - imageItem.positionY) * newHeight - height
    }

    // 添加旋转功能 =================================================
    // 获取旋转角度（默认0度），并转换为弧度
    const rotation = imageItem.options.angle || 0;
    const rotationRadians = rotation * Math.PI / 180;

    // 保存当前画布状态
    ctx.save();

    ctx.globalAlpha = alpha

    // ============== 新增阴影设置 ==============
    if (imageItem.options.boxShadow) {
        const boxShadow = imageItem.options.boxShadow;
        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = boxShadow.shadowColor || 'rgba(0, 0, 0, 1)';
        // 设置阴影模糊度（像素）
        ctx.shadowBlur = boxShadow.blurRatio * width || 0;
        // 设置阴影偏移（像素）
        ctx.shadowOffsetX = boxShadow.offsetXRatio * width || 0;
        ctx.shadowOffsetY = boxShadow.offsetYRatio * width || 0;
    }

    // 将画布原点移动到图片中心点
    const centerX = imageX + width / 2;
    const centerY = imageY + height / 2;
    ctx.translate(centerX, centerY);

    // 旋转画布
    ctx.rotate(rotationRadians);

    // 绘制图片（注意坐标已偏移到中心点）
    ctx.drawImage(overlay, -width / 2, -height / 2, width, height);

    // 恢复画布到之前保存的状态
    ctx.restore();
}


const getExtname = (inputPath, extnameType) => {
    let extname;
    if (extnameType === 0) {
        extname = path.extname(inputPath).slice(1)
        if (extname === 'jpg') {
            extname = 'jpeg'
        }
    } else if (extnameType === 1) {
        extname = 'jpeg'
    } else if (extnameType === 2) {
        extname = 'png'
    } else if (extnameType === 3) {
        extname = 'webp'
    }
    return extname;
}

async function addBorderAndText(options) {
    try {
        // 创建视图来访问共享内存
        const interruptView = new Int32Array(options.interrupt);
        if (Atomics.load(interruptView, 0) === 1) {
            return;
        }

        let {
            inputPath,      // 原始图片路径
            outputDirectory,     // 输出目录
            projectSettings,
            border: {
                borderLeftRatio,
                borderRightRatio,
                borderTopRatio,
                borderBottomRatio,
                borderColor,
            },
            texts,
            images
        } = options;


        const outputSettings = projectSettings.outputSettings;

        let {
            quality,
            extname: extnameType,
            outputSize: {longSide, shortSide, width, height, type}
        } = outputSettings;


        quality = quality / 10;

        const extname = getExtname(inputPath, extnameType)

        const outputPath = path.join(outputDirectory, path.parse(inputPath).name + "." + extname)

        let imageBuffer;

        try {
            // 1. 读取图片为 Buffer
            imageBuffer = await fs.readFile(inputPath);
        } catch (err) {
            throw new Error('文件已不存在：' + path)
        }


        const image = await loadImage(imageBuffer);

        let borderLeft, borderRight, borderTop, borderBottom

        let newWidth, newHeight, imageWidth, imageHeight;

        const widthRatio = 1 + borderLeftRatio + borderRightRatio

        const heightRatio = 1 + borderTopRatio + borderBottomRatio


        if (type === 0) { // 原始尺寸，不含边框
            imageWidth = image.width;
            imageHeight = image.height;
        } else if (type === 1) { //原始尺寸，含边框
            imageWidth = image.width / widthRatio;
            imageHeight = image.height / widthRatio;
        } else if (type === 2) { // 长边固定，不包含边框
            if (image.height > image.width) {
                imageHeight = longSide;
                imageWidth = longSide * image.width / image.height
            } else {
                imageWidth = longSide
                imageHeight = longSide * image.height / image.width;
            }
        } else if (type === 3) { // 长边固定，包含边框
            if (image.height > image.width) {
                imageHeight = longSide / heightRatio;
                imageWidth = longSide * image.width / image.height / heightRatio
            } else {
                imageWidth = longSide / widthRatio
                imageHeight = longSide * image.height / image.width / widthRatio;
            }
        } else if (type === 4) { // 短边固定，不包含边框
            if (image.height < image.width) {
                imageHeight = shortSide;
                imageWidth = shortSide * image.width / image.height
            } else {
                imageWidth = shortSide
                imageHeight = longSide * image.height / image.width;
            }
        } else if (type === 5) { // 短边固定，包含边框
            if (image.height < image.width) {
                imageHeight = shortSide / heightRatio;
                imageWidth = shortSide * image.width / image.height / heightRatio
            } else {
                imageWidth = shortSide / widthRatio
                imageHeight = longSide * image.height / image.width / widthRatio
            }
        } else if (type === 6) { // 宽固定，不包含边框
            imageWidth = width;
            imageHeight = image.height * width / image.width
        } else if (type === 7) {// 宽固定，包含边框
            imageWidth = width / widthRatio;
            imageHeight = image.height * width / image.width / widthRatio
        } else if (type === 8) { // 高固定，不包含边框
            imageHeight = height;
            imageWidth = image.width * height / image.height
        } else if (type === 9) { // 高固定，包含边框
            imageHeight = height / heightRatio;
            imageWidth = image.width * height / image.height / heightRatio
        }

        // 边框值为比率
        borderLeft = borderLeftRatio * imageWidth
        borderRight = borderRightRatio * imageWidth
        borderTop = borderTopRatio * imageHeight
        borderBottom = borderBottomRatio * imageHeight

        // 2. 计算新画布尺寸
        newWidth = Math.round(imageWidth + borderLeft + borderRight);
        newHeight = Math.round(imageHeight + borderTop + borderBottom);

        // 3. 创建画布
        const canvas = createCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');

        //设置高质量渲染选项
        ctx.patternQuality = 'best';
        ctx.quality = 'best'
        ctx.antialias = 'subpixel'
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'

        // 4. 绘制边框背景
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, newWidth, newHeight);

        // 5. 绘制原始图片（居中）
        ctx.drawImage(image, borderLeft, borderTop, imageWidth, imageHeight);

        let elements = [...texts, ...images];

        if (elements && elements.length) {
            elements = elements.sort((before, next) => before.options.zIndex - next.options.zIndex);
            for (let element of elements) {
                if (element.path) {
                    try {
                        await drawImage(ctx, element, newWidth, newHeight);
                    } catch (err) {
                        console.log(err)
                        throw err
                    }

                } else {
                    drawText(ctx, element, newWidth, newHeight);
                }
            }
        }

        // 7. 保存图片 (使用 Buffer 写入)
        const buffer = canvas.toBuffer(`image/${extname}`, {
            // 图片质量
            quality: quality
        }); // 或 'image/png'
        await fs.writeFile(outputPath, buffer);
        console.log(`处理完成！图片已保存至: ${outputPath}`);
    } catch (error) {
        console.error('处理图片时出错:', error);
        throw error;
    }
}

module.exports = {addBorderAndText}


