const path = require("path");
const createSharp = require("sharp");
const fs = require('fs');
const ImageMetadataHelper = require("./ImageMetadataHelper");

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
        } = await ImageMetadataHelper.readMetadata(filePath);

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

function getFileSize(filePath) {
    const size = fs.statSync(filePath)?.size;
    return size ? (size / 1024 / 1024).toFixed(2) + ' MB' : size
}

function formatDateTime(DateTimeOriginal) {
    const {year, month, day, hour, minute, second} = DateTimeOriginal
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

module.exports = {parsePhotoMetadata};
