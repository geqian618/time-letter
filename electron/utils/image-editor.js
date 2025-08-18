const path = require('path');
const pathToFileURL = require('url').pathToFileURL;
const {createCanvas, loadImage} = require('canvas');
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

async function addBorderAndText(options) {
    try {

        let {
            inputPath,      // 原始图片路径
            outputDirectory,     // 输出目录
            border: {
                borderLeftRatio,
                borderRightRatio,
                borderTopRatio,
                borderBottomRatio,
                borderColor,
                percentage = false
            },
            texts,
            images
        } = options;

        const outputPath = path.join(outputDirectory, path.basename(inputPath))

        let extname = path.extname(inputPath).slice(1);

        extname = extname === 'jpg' ? 'jpeg' : extname

        // 1. 读取图片为 Buffer
        const imageBuffer = await fs.readFile(inputPath);

        const image = await loadImage(imageBuffer);

        let borderLeft, borderRight, borderTop, borderBottom

        // 边框值为比率
        if (percentage) {
            borderLeft = borderLeftRatio * image.width
            borderRight = borderRightRatio * image.width
            borderTop = borderTopRatio * image.height
            borderBottom = borderBottomRatio * image.height
        }

        // 2. 计算新画布尺寸
        const newWidth = image.width + borderLeft + borderRight;
        const newHeight = image.height + borderTop + borderBottom;

        // 3. 创建画布
        const canvas = createCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');

        // 4. 绘制边框背景
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, newWidth, newHeight);

        // 5. 绘制原始图片（居中）
        ctx.drawImage(image, borderLeft, borderTop, image.width, image.height);

        for (let text of texts) {
            const fontSize = text.options.fontSizeRatio * newWidth;
            const fontFamily = text.options.fontFamily;
            // 添加文字样式
            ctx.font = `normal ${fontSize + 'px'} ${fontFamily}`;
            ctx.fillStyle = text.options.fontColor;

            // 设置对齐基准点
            ctx.textAlign = text.references[0]; // 水平对齐
            ctx.textBaseline = 'top';           // 垂直基线

            // 测量文本尺寸
            const metrics = ctx.measureText(text.content);
            const textWidth = metrics.width;
            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

            // 计算初始位置（相对坐标）
            let textX = text.positionX * newWidth;
            let textY = text.positionY * newHeight - 0.15 * textHeight;

            // 处理右/底对齐
            if (text.references.includes('right')) {
                textX = (1 - text.positionX) * newWidth;
            }
            if (text.references.includes('bottom')) {
                textY = (1 - text.positionY) * newHeight - 1.15 * textHeight;
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

            // 执行旋转绘制
            ctx.translate(centerX, centerY);  // 平移到中心点
            ctx.rotate(text.options.angle * Math.PI / 180);  // 旋转（角度转弧度）
            ctx.translate(-centerX, -centerY);  // 平移回原始坐标系

            // 3. 绘制旋转后的文字
            ctx.fillText(text.content, textX, textY);
            // 恢复画布状态
            ctx.restore();
        }

        for (let imageItem of images) {

            const path = imageItem.path;

            const alpha = imageItem.options.alpha ? imageItem.options.alpha / 10 : 1;

            const height = imageItem.options.imageHeightRatio * newHeight;

            const width = imageItem.options.imageWidthRatio * newWidth;

            let imageX = imageItem.positionX * newWidth

            let imageY = imageItem.positionY * newHeight;

            // 1. 读取图片为 Buffer
            const imageBuffer = await fs.readFile(path);

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


        // 7. 保存图片 (使用 Buffer 写入)
        const buffer = canvas.toBuffer(`image/${extname}`, {quality: 1}); // 或 'image/png'
        await fs.writeFile(outputPath, buffer);
        console.log(`处理完成！图片已保存至: ${outputPath}`);
    } catch (error) {
        console.error('处理图片时出错:', error);
        throw error;
    }
}

module.exports = {addBorderAndText}


