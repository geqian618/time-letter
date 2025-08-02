const createSharp = require('sharp');
const path = require('path');
const fs = require('fs');
const os = require('os');
const Exif = require('exif');
// 默认并发限制为CPU核心数
const DEFAULT_CONCURRENCY = os.cpus().length;
const shutterSpeed = require('./shutter-speed')

/**
 * 添加图片边框
 *
 * @param imagesPaths 图片路径集合
 * @param outputDir
 * @param config 边框配置
 * @param concurrency 最大并发数
 * @returns {Promise<void>}
 */

async function addMultipleBorders(imagesPaths, outputDir, config, concurrency = DEFAULT_CONCURRENCY) {

    await fs.mkdir(outputDir, {recursive: true});

    // 使用队列和集合跟踪执行状态
    const executing = new Set();

    let hasErrors = false;

    // 处理单个图片的函数
    const processImage = async (imagesPath) => {
        const outputPath = path.join(outputDir, path.basename(imagesPath));
        try {
            await addBorder(imagesPath, outputPath, config);
            console.log(`图片处理成功: ${imagesPath}`);
            return {success: true, imagesPath};
        } catch (err) {
            hasErrors = true;
            console.error(`图片处理失败: ${imagesPath}:`, err.message);
            return {success: false, imagesPath, error: err};
        }
    };

    // 创建任务队列
    const processQueue = async () => {
        const results = [];
        for (const imagesPath of imagesPaths) {
            // 如果达到并发限制，等待其中一个任务完成
            if (executing.size >= concurrency) {
                await Promise.race(executing);
            }
            // 创建任务并添加到执行集合
            const task = processImage(imagesPath)
                .then(result => {
                    executing.delete(task);
                    return result;
                })
                .catch(error => {
                    executing.delete(task);
                    return error;
                });

            executing.add(task);

            results.push(task);
        }

        // 等待所有任务完成
        return Promise.allSettled(results);
    };

    // 执行任务队列
    await processQueue();

    if (hasErrors) {
        throw new Error('部分图片处理失败，请检查日志');
    }
}

/**
 * 添加图片边框
 *
 * @param inputPath 图片路径
 * @param outputPath 输出路径
 * @param config 边框配置
 * @returns {Promise<void>}
 */
async function addBorder(inputPath, outputPath, config = {}) {
    // 设置带验证的默认配置
    const borderConfig = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        background: {r: 255, g: 255, b: 255, alpha: 1},
        ...config
    };

    // 验证边界值
    const dimensions = ['top', 'bottom', 'left', 'right'];
    for (const dim of dimensions) {
        if (!Number.isInteger(borderConfig[dim])) {
            throw new TypeError(`边框尺寸 ${dim} 必须是整数`);
        }
        if (borderConfig[dim] < 0) {
            throw new RangeError(`边框尺寸 ${dim} 不能为负数`);
        }
    }

    // 使用pipeline处理
    await createSharp(inputPath)
        .extend({
            top: borderConfig.top,
            bottom: borderConfig.bottom,
            left: borderConfig.left,
            right: borderConfig.right,
            background: borderConfig.background
        })
        .toFile(outputPath);
}


/**
 * 添加图片边框
 *
 * @param image 图片信息
 * @param outputPath 输出路径
 * @returns {Promise<void>}
 */
async function addTextBorder(image, outputPath,) {

    try {
        const infos = image.infos || [{text: '111', left: 5000, top: 200}, {text: '222', left: 50, top: 100}];

        // 设置带验证的默认配置
        const borderConfig = {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            background: {r: 255, g: 255, b: 255, alpha: 1},
            ...image.config
        };

        const sharp = await createSharp(image.path);

        const metadata = await sharp.metadata();

        // 边框设置
        const topBorder = borderConfig.top;
        const bottomBorder = borderConfig.bottom;
        const leftBorder = borderConfig.left;
        const rightBorder = borderConfig.right;

        // 计算新尺寸
        const newWidth = metadata.width + leftBorder + rightBorder;
        // const newHeight = metadata.height + topBorder + bottomBorder;

        const composites = []; // 存储所有合成操作

        // 验证边界值
        const dimensions = ['top', 'bottom', 'left', 'right'];

        for (const dim of dimensions) {
            if (!Number.isInteger(borderConfig[dim])) {
                throw new TypeError(`边框尺寸 ${dim} 必须是整数`);
            }
            if (borderConfig[dim] < 0) {
                throw new RangeError(`边框尺寸 ${dim} 不能为负数`);
            }
        }

        // 使用pipeline处理
        sharp.extend({
            top: borderConfig.top,
            bottom: borderConfig.bottom,
            left: borderConfig.left,
            right: borderConfig.right,
            background: borderConfig.background
        });

        // 为所有文本生成单个SVG
        let svgTexts = '';

        infos.forEach(infoItem => {
            svgTexts += `
                <text 
                    x="${infoItem.left}" 
                    y="${infoItem.top}" 
                    font-family="Arial" 
                    font-size="100" 
                    fill="#000" 
                    text-anchor="start" 
                    dominant-baseline="hanging">${infoItem.text}
                </text>
            `;
        });

        const textSvg = Buffer.from(`
            <svg width="${newWidth}" height="${bottomBorder}" xmlns="http://www.w3.org/2000/svg">
                ${svgTexts}
            </svg>
        `);

        composites.push({
            input: textSvg,
            top: metadata.height + topBorder,
            left: 0
        });

        // 一次性添加所有合成操作
        await sharp.composite(composites);

        await sharp.toFile(outputPath);

        console.log(`处理完成！保存至: ${outputPath}`);

    } catch (err) {
        throw new Error(err.message)
    }

}


async function addMultipleTextBorders(images, outputDir, concurrency = DEFAULT_CONCURRENCY) {

    await fs.mkdir(outputDir, {recursive: true});

    // 使用队列和集合跟踪执行状态
    const executing = new Set();

    let hasErrors = false;

    // 处理单个图片的函数
    const processImage = async (image) => {
        const outputPath = path.join(outputDir, path.basename(image.path));
        try {
            await addTextBorder(image, outputPath);
            return {success: true, path: image.path};
        } catch (err) {
            hasErrors = true;
            console.error(`图片处理失败: ${image.path}:`, err.message);
            return {success: false, path: image.path, error: err};
        }
    };

    // 创建任务队列
    const processQueue = async () => {
        const results = [];
        for (const image of images) {
            // 如果达到并发限制，等待其中一个任务完成
            if (executing.size >= concurrency) {
                await Promise.race(executing);
            }
            // 创建任务并添加到执行集合
            const task = processImage(image)
                .then(result => {
                    executing.delete(task);
                    return result;
                })
                .catch(error => {
                    executing.delete(task);
                    return error;
                });

            executing.add(task);

            results.push(task);
        }
        // 等待所有任务完成
        return Promise.allSettled(results);
    };

    // 执行任务队列
    await processQueue();

    if (hasErrors) {
        throw new Error('部分图片处理失败，请检查日志');
    }
}


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

async function parseMetadata(imagePath) {
    try {
        const data = await fs.promises.readFile(imagePath);
        // 将 ExifImage 转换为 Promise
        return await new Promise((resolve, reject) => {
            new Exif.ExifImage({image: data}, (error, data) => {
                if (error) reject(error);
                else resolve(data);
            });
        });
    } catch (err) {
        // 统一处理所有错误，避免暴露文件路径
        throw new Error(`解析元数据失败: ${err.message}`);
    }
}

/**
 * 获取图片分辨率
 * @param imagePath
 * @returns {Promise<{width: undefined, height: undefined}>}
 */
async function getImageResolution(imagePath) {
    const {width, height} = await createSharp(imagePath).metadata();
    return width + ' x ' + height
}

function getFileSize(filePath) {
    const size = fs.statSync(filePath)?.size;
    return size ? (size / 1000 / 1000).toFixed(2) + 'MB' : size
}


async function parsePhotoMetadata(filePath) {
    const {
        image: {Make, Model},
        exif: {ISO, ExposureTime, FNumber, FocalLength, LensMake, LensModel, CreateDate, DateTimeOriginal}
    } = await parseMetadata(filePath);
    return [
        {label: '文件名称', value: path.basename(filePath)},
        {label: '文件大小', value: getFileSize(filePath)},
        {label: '分辨率', value: await getImageResolution(filePath)},
        {label: '拍摄日期', value: DateTimeOriginal},
        {label: '修改日期', value: CreateDate},
        {label: '设备厂商', value: Make},
        {label: '设备型号', value: Model},
        {label: '镜头厂商', value: LensMake},
        {label: '镜头型号', value: LensModel},
        {label: 'ISO', value: ISO},
        {label: '快门速度', value: shutterSpeed.formatShutterSpeed(ExposureTime)},
        {label: '光圈', value: FNumber ? FNumber + 'f' : ''},
        {label: '焦段', value: FocalLength ? Math.trunc(FocalLength * 1.5) + 'mm' : ''},
    ]
}

// findFilePaths("D:\\desktop\\摄影后期", ['.jpg']).then(paths => {
//     let images = paths.map(path => {
//         return {
//             path,
//             infos: [{text: '1111', left: 1000, top: 200}, {text: '1111', left: 2000, top: 400}],
//             config: {left: 50, right: 50, top: 50, bottom: 500}
//         }
//     });
//
//     const outputImage = 'D:\\Desktop\\测试';
//
//     addMultipleTextBorders(images, outputImage);
// })


module.exports = {parsePhotoMetadata};


