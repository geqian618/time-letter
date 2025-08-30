const fs = require('fs');
const Exif = require("exif");
const createSharp = require("sharp");
const path = require("path");
const shutterSpeed = require("./shutter-speed");


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
 * @settings imagePath
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

    try {
        const {
            image: {Make, Model},
            exif: {ISO, ExposureTime, FNumber, FocalLength, LensMake, LensModel, CreateDate, DateTimeOriginal}
        } = await parseMetadata(filePath);
        return {
            details: [
                {label: '文件名称', value: path.basename(filePath)},
                {label: '文件大小', value: getFileSize(filePath)},
                {label: '分辨率', value: await getImageResolution(filePath)},
                {label: '拍摄日期', value: formatDateTime(DateTimeOriginal)},
                {label: '修改日期', value: CreateDate},
                {label: '设备厂商', value: Make},
                {label: '设备型号', value: Model},
                {label: '镜头厂商', value: LensMake},
                {label: '镜头型号', value: LensModel},
                {label: 'ISO', value: ISO},
                {label: '快门速度', value: shutterSpeed.formatShutterSpeed(ExposureTime)},
                {label: '光圈', value: FNumber ? FNumber : ''},
                {label: '焦段', value: Math.trunc(FocalLength) || ''}
            ],
            base: {
                iso: ISO,
                cameraBrand: Make,
                cameraModel: Model,
                lensModel: LensModel,
                focalLength: FocalLength ? Math.trunc(FocalLength) : '',
                shutter: shutterSpeed.formatShutterSpeed(ExposureTime),
                aperture: FNumber ? FNumber : '',
                shootingTime: formatDateTime(DateTimeOriginal)
            }
        }
    } catch
        (err) {
        console.log(err)
    }
}

module.exports = {parsePhotoMetadata};
