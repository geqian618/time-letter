const piexif = require('piexifjs');
const fs = require('fs').promises

/**
 * 安装 npm i piexifjs
 * @param inputImagePath
 * @returns {Promise<*|{partialData: null, warning: string}|{rawError, warning: string}|{exifData, warning: string}>}
 */

async function readExifData(inputImagePath) {
    try {
        const buffer = await fs.readFile(inputImagePath);
        const data = buffer.toString('binary');
        let exifData;
        try {
            exifData = piexif.load(data);
            // 检查exifData是否为空，或者通过某些条件判断是否有有效数据
            // 例如，如果所有字段都是空，我们可以认为没有Exif数据
            if (isExifDataEmpty(exifData)) {
                return {
                    warning: "该文件不包含Exif数据",
                    // 仍然返回空的数据
                    exifData: exifData
                };
            }
        } catch (error) {
            // 这里，piexifjs在解析时抛出错误，可能是数据损坏等
            if (error.message.includes("No Exif")) {
                return {
                    warning: `该文件不包含或不是支持的Exif格式: ${error.message}`,
                    rawError: error.message
                };
            } else {
                // 其他错误，我们视为解析失败
                return {
                    warning: `Exif数据解析错误: ${error.message}`,
                    partialData: null
                };
            }
        }
        // 成功解析并包含Exif数据
        return exifData;
    } catch (err) {
        // 文件读取错误
        if (err.code === 'ENOENT') {
            throw new Error(`文件不存在: ${inputImagePath}`);
        } else if (err.code === 'EACCES') {
            throw new Error(`没有权限读取文件: ${inputImagePath}`);
        } else {
            throw new Error(`处理文件时发生未知错误: ${err.message}`);
        }
    }
}

function isExifDataEmpty(exifData) {
    // 检查 exifData 的各个字段是否为空
    return Object.keys(exifData["0th"]).length === 0 &&
        Object.keys(exifData["Exif"]).length === 0 &&
        Object.keys(exifData["GPS"]).length === 0;
}


/**
 *  拷贝图片元数据到文件
 * @param originalImagePath 原图片
 * @param targetImagePath 目标图片
 * @returns {Promise<void>}
 */
async function copyExifDataToFile(originalImagePath, targetImagePath) {

    const exifData = await readExifData(originalImagePath);

    writeExifDataToFile(exifData, targetImagePath);

}


/**
 *  拷贝图片元数据到文件
 * @param exifData 元数据
 * @param targetImagePath 目标图片
 * @returns {Promise<void>}
 */
async function writeExifDataToFile(exifData, targetImagePath) {

    if (!exifData) {
        return
    }

    try {
        // 检查目标文件是否存在
        try {
            await fs.access(targetImagePath);
        } catch (accessError) {
            if (accessError.code === 'ENOENT') {
                throw new Error(`目标文件不存在: ${targetImagePath}`);
            } else {
                throw new Error(`无法访问目标文件: ${targetImagePath} - ${accessError.message}`);
            }
        }

        // 检查目标文件是否可写
        try {
            await fs.access(targetImagePath, fs.constants.W_OK);
        } catch (writeError) {
            throw new Error(`目标文件不可写: ${targetImagePath} - 没有写入权限`);
        }

        // 读取目标图片的二进制数据
        const buffer = await fs.readFile(targetImagePath);
        const data = buffer.toString('binary');

        // 将Exif数据序列化为字符串
        const exifbytes = piexif.dump(exifData);

        // 将Exif数据插入到图片数据中
        const newData = piexif.insert(exifbytes, data);

        const newBuffer = Buffer.from(newData, 'binary');

        // 将新数据写入目标图片
        await fs.writeFile(targetImagePath, newBuffer);

        console.log(`元数据已成功写入: ${targetImagePath}`);

    } catch (error) {
        console.error(`复制元数据失败: ${error.message}`);
        throw error; // 重新抛出错误，让调用者处理
    }
}

/**
 * 写入图片元数据到 buffer 中
 * @param originalImagePath 原图片
 * @param targetBuffer 目标图片 buffer
 * @returns {Promise<Buffer<ArrayBufferLike>>}
 */
async function copyExifDataToBuffer(originalImagePath, targetBuffer) {

    const exifData = await readExifData(originalImagePath);

    return await writeExifDataToBuffer(exifData, targetBuffer);
}


/**
 * 拷贝图片元数据到 buffer 中
 * @param exifData 元数据
 * @param targetBuffer 目标图片 buffer
 * @returns {Promise<Buffer<ArrayBufferLike>>}
 */
async function writeExifDataToBuffer(exifData, targetBuffer) {

    if (!exifData) {
        return
    }

    const data = targetBuffer.toString('binary');

    // 将Exif数据序列化为字符串（实际上是Exif字节数组的Base64表示，但piexifjs内部会处理）
    const exifbytes = piexif.dump(exifData);

    // 将Exif数据插入到图片数据中
    const newData = piexif.insert(exifbytes, data);

    // 将新数据写入新图片
    return Buffer.from(newData, 'binary');
}

module.exports = {copyExifDataToFile, copyExifDataToBuffer, readExifData, writeExifDataToBuffer, writeExifDataToFile}
