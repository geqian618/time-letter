const path = require('path');
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
    let {
        inputPath,      // 原始图片路径
        outputDirectory,     // 输出目录
        border: {borderLeftRatio, borderRightRatio, borderTopRatio, borderBottomRatio, borderColor, percentage = false},
        texts,
        images
    } = options;

    try {

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
            // 6. 添加文字
            ctx.font = `normal ${fontSize + 'px'} ${fontFamily}`;
            ctx.fillStyle = text.options.fontColor;

            ctx.textAlign = text.references[0]
            ctx.textBaseline = 'top';
            // ctx.textAlign = text.options.textAlign;
            // ctx.textBaseline = text.options.textBaseline;


            // 测量文本高度
            const metrics = ctx.measureText(text.content);
            const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

            let textX = text.positionX * newWidth;

            let textY = text.positionY * newHeight - 0.15 * textHeight;

            if (text.references.includes('right')) {
                textX = (1 - text.positionX) * newWidth
            }


            if (text.references.includes('bottom')) {
                textY = (1 - text.positionY) * newHeight - 1.15 * textHeight
            }

            ctx.fillText(text.content, textX, textY);
        }


        for (let imageItem of images) {

            const url = imageItem.path;

            const height = imageItem.options.imageHeightRatio * newHeight;

            const width = imageItem.options.imageWidthRatio * newWidth;

            let imageX = imageItem.positionX * newWidth

            let imageY = imageItem.positionY * newHeight;

            const overlay = await loadImage(url);


            if (imageItem.references.includes('right')) {
                imageX = (1 - imageItem.positionX) * newWidth - width
            }

            if (imageItem.references.includes('bottom')) {
                imageY = (1 - imageItem.positionY) * newHeight - height
            }

            ctx.drawImage(overlay, imageX, imageY, width, height);
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


