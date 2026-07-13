const Exif = require("exif");
const path = require("path");
const createSharp = require("sharp");
const fs = require('fs');
const ExifManager = require("./ExifManager");

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

function getFileSize(filePath) {
    const size = fs.statSync(filePath)?.size;
    return size ? (size / 1024 / 1024).toFixed(2) + ' MB' : size
}

function formatDateTime(DateTimeOriginal) {
    const {year, month, day, hour, minute, second} = DateTimeOriginal
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

async function parsePhotoMetadata(filePath) {
    try {
        const {
            FileName = '',
            ImageWidth = '',
            ImageHeight = '',
            Make = '',
            Model = '',
            ISO = '',
            ExposureTime = '',
            FNumber = '',
            FocalLength = '',
            LensModel = '',
            DateTimeOriginal = ''
        } = await ExifManager.read(filePath);
        return {
            iso: ISO instanceof Array ? ISO[0] : ISO,
            cameraBrand: Make,
            cameraModel: Model,
            lensModel: LensModel,
            focalLength: FocalLength ? Number.parseInt(FocalLength) : '',
            shutter: ExposureTime || '',
            aperture: FNumber,
            shootingTime: DateTimeOriginal ? formatDateTime(DateTimeOriginal) : '',
            width: ImageWidth,
            height: ImageHeight,
            fullFilename: FileName,
            filename: path.parse(filePath)?.name,
            fileSize: getFileSize(filePath),
            resolution: `${ImageWidth} x ${ImageHeight}`
        }
    } catch (err) {
        const {width, height} = await createSharp(filePath).metadata();
        return {width, height}
    }
}

module.exports = {parsePhotoMetadata};
