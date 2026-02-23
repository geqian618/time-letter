const fs = require('fs');
const Exif = require("exif");
const createSharp = require("sharp");
const path = require("path");

async function parseMetadata(imagePath) {
    try {
        const buffer = await fs.promises.readFile(imagePath);

        return await new Promise((resolve, reject) => {
            new Exif.ExifImage({image: buffer}, (error, exifData) => {
                if (error) {
                    // 我们可以检查错误信息，对特定错误进行不同处理
                    if (error.message.includes("No Exif segment") || error.message.includes("Not a JPEG")) {
                        // 这个文件可能不是JPEG或者根本没有Exif数据，不一定是个“错误”
                        // 我们可以选择resolve一个空对象，或者带有提示的对象，而不是reject
                        resolve({
                            warning: `该文件不包含或不是支持的Exif格式: ${error.message}`,
                            rawError: error.message // 可选，记录原始错误
                        });
                    } else if (error.message.includes("Corrupt data")) {
                        // 可能是损坏的数据
                        resolve({
                            warning: `Exif数据可能已损坏: ${error.message}`,
                            partialData: null // 可以尝试其他方式提取部分数据吗？
                        });
                    } else {
                        // 其他未知错误，真正地reject
                        reject(error);
                    }
                } else {
                    // 成功解析
                    resolve(exifData);
                }
            });
        });
    } catch (err) {
        // 区分是文件读取错误还是Exif解析错误
        if (err.code === 'ENOENT') {
            throw new Error(`文件不存在: ${imagePath}`);
        } else if (err.code === 'EACCES') {
            throw new Error(`没有权限读取文件: ${imagePath}`);
        } else {
            // 其他未知的读取错误或最终的Exif解析错误
            throw new Error(`处理文件时发生未知错误: ${err.message}`);
        }
    }
}

/**
 * 获取图片分辨率
 * @settings imagePath
 * @returns {Promise<{width: undefined, height: undefined}>}
 */
async function getImageResolution(imagePath) {
    const {width, height} = await createSharp(imagePath).metadata();
    return width + ' x ' + height
}


function getFileSize(filePath) {
    const size = fs.statSync(filePath)?.size;
    return size ? (size / 1024 / 1024).toFixed(2) + ' MB' : size
}

function formatDateTime(DateTimeOriginal) {
    if (!DateTimeOriginal) {
        return
    }
    let parts = DateTimeOriginal.split(' ');
    let datePart = parts[0].replace(/:/g, '-');
    let timePart = parts[1];
    return datePart + ' ' + timePart;
}

async function parsePhotoMetadata(filePath) {
    const {width, height} = await createSharp(filePath).metadata();
    try {
        const metadata = await parseMetadata(filePath);
        const {
            image: {Make = '', Model = ''} = {},
            exif: {
                ISO = '',
                ExposureTime = '',
                FNumber = '',
                FocalLength = '',
                LensModel = '',
                DateTimeOriginal = ''
            } = {}
        } = metadata;
        return {
            iso: ISO,
            cameraBrand: Make,
            cameraModel: Model,
            lensModel: LensModel,
            focalLength: FocalLength ? Math.trunc(FocalLength) : '',
            shutter: FocalLength ? formatShutterSpeed(ExposureTime) : '',
            aperture: FNumber,
            shootingTime: DateTimeOriginal ? formatDateTime(DateTimeOriginal) : '',
            width,
            height,
            filename: path.basename(filePath),
            fileSize: getFileSize(filePath),
            resolution: await getImageResolution(filePath)
        }
    } catch (err) {
        return {width, height}
    }
}


function formatShutterSpeed(seconds) {

    // 处理无效输入
    if (isNaN(seconds) || seconds <= 0) return '';

    // 大于等于1秒的处理
    if (seconds >= 1) {
        // 四舍五入到0.1秒
        const rounded = Math.round(seconds * 10) / 10;
        return rounded % 1 === 0 ? `${rounded}s` : `${rounded}s`;
    }
    // 小于1秒的处理（分数形式）
    const MAX_DENOMINATOR = 10000;
    let bestNumerator = 0;
    let bestDenominator = 1;
    let minError = Infinity;

    // 遍历分母寻找最佳分数
    for (let d = 1; d <= MAX_DENOMINATOR; d++) {
        const n = Math.round(seconds * d);
        const error = Math.abs(n / d - seconds);

        // 更新最小误差的分数
        if (error < minError) {
            minError = error;
            bestNumerator = n;
            bestDenominator = d;
        }
    }

    // 处理极小的快门速度
    if (bestNumerator === 0) {
        bestNumerator = 1;
        bestDenominator = MAX_DENOMINATOR;
    }

    // 计算最大公约数（GCD）
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(bestNumerator, bestDenominator);
    const numerator = bestNumerator / divisor;
    const denominator = bestDenominator / divisor;

    // 返回格式化结果
    return numerator === 1 ? `1/${denominator}` : `${numerator}/${denominator}`;
}

module.exports = {parsePhotoMetadata};
