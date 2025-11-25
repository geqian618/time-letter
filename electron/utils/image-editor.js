const path = require('path');
const {createCanvas, loadImage} = require('@napi-rs/canvas');
// 使用 promises API
const fs = require('fs').promises;
const {copyExifDataToBuffer} = require('./exif-helper')
const {createBlurFilterFromBuffer} = require('../utils/drop-filter')

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

function drawText(ctx, text, newWidth, newHeight, fontConfig) {
    const fontSize = text.options.fontSizeRatio * newWidth;
    const fontFamily = text.options.fontFamily;
    const fontStyle = text.options.fontStyle;
    const fontWeight = text.options.fontWeight;
    const textDirection = text.options.textDirection;
    const angle = text.options.angle;
    const textShadow = text.options.textShadow;

    // 添加文字样式
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = text.options.fontColor;

    // 设置对齐基准点
    ctx.textAlign = 'left'; // 水平对齐
    ctx.textBaseline = 'top'; // 垂直基线

    // 测量文本尺寸
    const metrics = ctx.measureText(text.content);
    const textWidth = metrics.width;
    const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

    const {offsetX, offsetY} = fontConfig.get(fontFamily) || {offsetX: 0, offsetY: 0};
    let textX = text.offsetLeftRatio * newWidth + offsetX * fontSize
    let textY = text.offsetTopRatio * newHeight + offsetY * fontSize

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
        ctx.shadowColor = textShadow.shadowColor || 'rgba(0,0,0,1)';
        // 默认模糊0像素
        ctx.shadowBlur = textShadow.blurRatio * fontSize || 0;
        // 默认X偏移
        ctx.shadowOffsetX = textShadow.offsetXRatio * fontSize || 0;
        // 默认Y偏移
        ctx.shadowOffsetY = textShadow.offsetYRatio * fontSize || 0;
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


function drawVerticalText(ctx, text, x, y, fontSize, rotation = 0) {
    ctx.save();
    const characters = text.split('');
    // 计算文本总高度
    const totalHeight = characters.length * fontSize;
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
            const textMetrics = ctx.measureText(char);
            const charHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
            const charWidth = textMetrics.width;
            const offsetX = Math.max((fontSize - charWidth) / 2, 0);
            const offsetY = Math.max((fontSize - charHeight) / 2, 0);
            ctx.translate(x + offsetX, y + i * fontSize + offsetY);
            ctx.rotate(0);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        } else {
            ctx.fillText(char, x, y + i * fontSize);
        }
    }
    ctx.restore();
}


async function drawImage(ctx, image, newWidth, newHeight) {

    const path = image.path;

    const alpha = image.options.alpha ? image.options.alpha / 10 : 1;

    const width = image.options.imageWidthRatio * newWidth;

    const height = image.options.imageHeightRatio * newHeight;

    let imageX = image.offsetLeftRatio * newWidth

    let imageY = image.offsetTopRatio * newHeight;

    let imageBuffer;

    try {
        // 1. 读取图片为 Buffer
        imageBuffer = await fs.readFile(path);
    } catch (err) {
        throw new Error('文件已不存在：' + path)
    }

    const overlay = await loadImage(imageBuffer);

    // 添加旋转功能 =================================================
    // 获取旋转角度（默认0度），并转换为弧度
    const rotation = image.options.angle || 0;
    const rotationRadians = rotation * Math.PI / 180;

    // 保存当前画布状态
    ctx.save();

    ctx.globalAlpha = alpha

    // ============== 新增阴影设置 ==============
    if (image.options.boxShadow) {
        const boxShadow = image.options.boxShadow;
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


/**
 * 绘制圆角矩形图片
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {Image} img - 图片对象
 * @param {number} x - 图片左上角x坐标
 * @param {number} y - 图片左上角y坐标
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @param {number|object} borderRadius - 圆角大小
 *   数字类型：统一设置四个角的圆角半径
 *   对象类型：分别设置四个角的半径 { topLeft, topRight, bottomRight, bottomLeft }
 */
function drawRoundedImage(ctx, img, x, y, width, height, borderRadius) {

    // 保存上下文状态
    ctx.save();

    // ============== 方法1：先绘制阴影，再绘制图片 ==============
    // 设置阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 150;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 创建圆角路径用于绘制阴影
    createRoundedPath(ctx, x, y, width, height, borderRadius);

    // 填充路径以产生阴影（使用透明色，这样只有阴影可见）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'; // 几乎透明的颜色
    ctx.fill();

    // 清除阴影设置，避免影响后续绘制
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // 创建圆角路径用于裁剪
    createRoundedPath(ctx, x, y, width, height, borderRadius);

    // 设置为裁剪区域
    ctx.clip();

    // 绘制图片
    ctx.drawImage(img, x, y, width, height);

    // 恢复上下文状态
    ctx.restore();
}

/**
 * 创建圆角矩形路径
 */
function createRoundedPath(ctx, x, y, width, height, borderRadius) {
    let topLeft = 0;
    let topRight = 0;
    let bottomRight = 0;
    let bottomLeft = 0;

    // 处理不同类型的borderRadius参数
    if (typeof borderRadius === 'number') {
        topLeft = topRight = bottomRight = bottomLeft = borderRadius;
    } else if (typeof borderRadius === 'object') {
        topLeft = borderRadius.topLeft || 0;
        topRight = borderRadius.topRight || 0;
        bottomRight = borderRadius.bottomRight || 0;
        bottomLeft = borderRadius.bottomLeft || 0;
    }

    // 确保圆角不超过宽度或高度的一半
    const maxRadius = Math.min(width, height) / 2;
    topLeft = Math.min(topLeft, maxRadius);
    topRight = Math.min(topRight, maxRadius);
    bottomRight = Math.min(bottomRight, maxRadius);
    bottomLeft = Math.min(bottomLeft, maxRadius);

    ctx.beginPath();
    ctx.moveTo(x + topLeft, y);

    // 上边线 + 右上角
    ctx.lineTo(x + width - topRight, y);
    ctx.arcTo(x + width, y, x + width, y + topRight, topRight);

    // 右边线 + 右下角
    ctx.lineTo(x + width, y + height - bottomRight);
    ctx.arcTo(x + width, y + height, x + width - bottomRight, y + height, bottomRight);

    // 下边线 + 左下角
    ctx.lineTo(x + bottomLeft, y + height);
    ctx.arcTo(x, y + height, x, y + height - bottomLeft, bottomLeft);

    // 左边线 + 左上角
    ctx.lineTo(x, y + topLeft);
    ctx.arcTo(x, y, x + topLeft, y, topLeft);

    ctx.closePath();
}

async function addBorderAndText(settings) {
    try {
        // 创建视图来访问共享内存
        const interruptView = new Int32Array(settings.interrupt);
        if (Atomics.load(interruptView, 0) === 1) {
            return;
        }

        let {
            // 原始图片路径
            inputPath,
            // 输出目录
            outputDirectory,
            projectSettings: {
                outputSettings: {
                    quality,
                    extname: extnameType,
                    outputSize: {longSide, shortSide, width, height, type},
                    isSynchronizeMetadata,
                },
                fontConfig
            },
            border: {
                borderLeftRatio,
                borderRightRatio,
                borderTopRatio,
                borderBottomRatio,
                borderBlurRatio,
                borderRadiusRatio,
                options: {
                    borderColor,
                    borderType,
                }
            },
            texts,
            images
        } = settings;


        const originalExtname = path.extname(inputPath).slice(1);

        const outputExtname = getExtname(originalExtname, extnameType)

        const outputPath = path.join(outputDirectory, path.parse(inputPath).name + "." + outputExtname)

        let imageBuffer;

        try {
            // 1. 读取图片为 Buffer
            imageBuffer = await fs.readFile(inputPath);
        } catch (err) {
            throw new Error('文件已不存在：' + path)
        }

        const image = await loadImage(imageBuffer);

        let borderLeft, borderRight, borderTop, borderBottom, borderBlur, borderRadius

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
        borderBlur = borderBlurRatio * imageWidth
        borderRadius = borderRadiusRatio * imageWidth

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

        if (borderLeftRatio + borderRightRatio + borderTopRatio + borderBottomRatio !== 0) {
            // 4. 绘制边框背景
            if (borderType === 0) {
                ctx.fillStyle = borderColor;
                ctx.fillRect(0, 0, newWidth, newHeight);
            } else {
                borderBlur = Math.min(Math.max(0.3, borderBlur), 1000)
                const backgroundBuffer = await createBlurFilterFromBuffer(imageBuffer, borderBlur);
                const background = await loadImage(backgroundBuffer);
                // 绘制原始图片（居中）
                drawRoundedImage(ctx, background, 0, 0, newWidth, newHeight, borderRadius)
            }
        }

        if (borderRadius > 0) {
            // 5. 绘制原始图片（居中）
            drawRoundedImage(ctx, image, borderLeft, borderTop, imageWidth, imageHeight, borderRadius);
        } else {
            // 5. 绘制原始图片（居中）
            ctx.drawImage(image, borderLeft, borderTop, imageWidth, imageHeight);
        }

        let elements = [...texts, ...images];

        if (elements && elements.length) {
            elements = elements.sort((before, next) => before.options.zIndex - next.options.zIndex);
            for (let element of elements) {
                if (element.type === 0) {
                    try {
                        await drawImage(ctx, element, newWidth, newHeight);
                    } catch (err) {
                        console.log(err)
                        throw err
                    }
                } else {
                    drawText(ctx, element, newWidth, newHeight, fontConfig);
                }
            }
        }

        // 7. 保存图片 (使用 Buffer 写入)
        let buffer;

        if (outputExtname === 'png') {
            buffer = canvas.toBuffer('image/png');
        } else {
            buffer = canvas.toBuffer(`image/${outputExtname === 'jpg' ? 'jpeg' : outputExtname}`, extnameType === 0 ? 100 : quality);
        }

        if (['jpeg', 'jpg'].includes(originalExtname) && ['jpeg', 'jpg'].includes(outputExtname) && isSynchronizeMetadata) {
            buffer = await copyExifDataToBuffer(inputPath, buffer)
        }

        await fs.writeFile(outputPath, buffer);
        console.log(`处理完成！图片已保存至: ${outputPath}`);
    } catch (error) {
        console.error('处理图片时出错:', error);
        throw error;
    }

}

module.exports = {addBorderAndText}


