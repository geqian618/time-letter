const {exiftool} = require('exiftool-vendored');
const fs = require('fs');

/**
 * 图片元数据工具类
 * 支持 JPG、PNG、WebP 格式的 EXIF/IPTC/XMP 元数据读写
 */
class ExifManager {

    /**
     * 读取图片元数据
     * @param {string} filePath - 图片文件路径
     * @returns {Promise<Object>} 元数据对象
     */
    async read(filePath) {
        if (!this.isReadable(filePath)) {
            throw new Error(`读取元数据失败，文件[${filePath}]不存在或不可读`);
        }
        try {
            const tags = await exiftool.read(filePath);
            // 检查是否有解析错误/警告
            if (tags.errors?.length > 0) {
                console.warn(`元数据解析警告:`, tags.errors);
            }
            return tags;
        } catch (error) {
            throw new Error(`读取元数据失败 [${filePath}]: ${error.message}`);
        }
    }

    /**
     * 写入元数据到图片（覆盖式）
     * @param {string} filePath - 图片文件路径
     * @param {Object} metadata - 要写入的元数据键值对
     * @param overwrite 覆盖原文件
     * @returns {Promise<void>}
     */
    async write(filePath, metadata, overwrite = true) {
        if (!this.isReadable(filePath)) {
            throw new Error(`读取元数据失败，文件[${filePath}]不存在或不可读`);
        }
        try {
            const options = overwrite ? {writeArgs: ['-overwrite_original']} : {};
            await exiftool.write(filePath, metadata, options);
        } catch (error) {
            throw new Error(`写入元数据失败 [${filePath}]: ${error.message}`);
        }
    }


    /**
     * 校验文件是否存在并且可读
     * @param filePath
     * @returns {boolean}
     */
    isReadable(filePath) {
        try {
            fs.accessSync(filePath, fs.constants.F_OK);
            return true
        } catch (err) {
            return false
        }
    }

    /**
     * 关闭 exiftool 进程（程序退出前调用）
     * @returns {Promise<void>}
     */
    async close() {
        await exiftool.end();
    }
}


module.exports = ExifManager
