const path = require('path');
const {createCanvas, loadImage} = require('canvas');
// 使用 promises API
const fs = require('fs').promises;


/**
 * 查找指定目录下指定类型文件集合
 *
 * @param dirPath 查找目录
 * @param extensions 文件类型
 * @param deepSearch 深度查找
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
    const {
        imagePath,      // 原始图片路径
        outputPath,     // 输出图片路径
        borderWidth = 300,
        borderColor = '#3498db',
        texts = [
            {
                text: '旅行记忆 2023',
                textPosition: {x: 20, y: 20},
            },
            {
                text: '旅行记忆 2023',
                textPosition: {x: 2000, y: 0},
            }
        ],
        textStyle = {
            font: 'bold 40px "Microsoft YaHei"',
            color: '#ffffff',
            textAlign: 'left',
            textBaseline: 'top'
        }
    } = options;

    try {
        // 1. 读取图片为 Buffer
        const imageBuffer = await fs.readFile(imagePath);
        const image = await loadImage(imageBuffer);

        // 2. 计算新画布尺寸
        const newWidth = image.width + borderWidth * 2;
        const newHeight = image.height + borderWidth * 2;

        // 3. 创建画布
        const canvas = createCanvas(newWidth, newHeight);
        const ctx = canvas.getContext('2d');

        // 4. 绘制边框背景
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, newWidth, newHeight);

        // 5. 绘制原始图片（居中）
        ctx.drawImage(image, borderWidth, borderWidth);

        // 6. 添加文字
        ctx.font = textStyle.font;
        ctx.fillStyle = textStyle.color;
        ctx.textAlign = textStyle.textAlign;
        ctx.textBaseline = textStyle.textBaseline;


        for (let text of texts) {
            const textX = text.textPosition.x;
            const textY = text.textPosition.y;
            ctx.fillText(text.text, textX, textY);
        }

        // 7. 保存图片 (使用 Buffer 写入)
        const buffer = canvas.toBuffer('image/jpeg', {quality: 0.95}); // 或 'image/png'
        await fs.writeFile(outputPath, buffer);
        console.log(`处理完成！图片已保存至: ${outputPath}`);
    } catch (error) {
        console.error('处理图片时出错:', error);
        throw error;
    }
}

module.exports = {addBorderAndText}


