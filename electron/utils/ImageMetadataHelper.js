'use strict';

/**
 * ImageMetadataHelper —— 图片元数据工具
 *
 * 用途：图片绘制到 <canvas> 再导出（toBlob / toDataURL）后，EXIF/XMP/ICC/IPTC
 * 元数据会全部丢失。本工具把「原图元数据」重新注入到 canvas 导出图上，并支持不同格式之间相互迁移。
 *
 * 引擎：exiftool-vendored（单依赖，vendored ExifTool 13.x 二进制）。exiftool 是
 * 业界事实标准，单库即覆盖 read/write/跨格式拷贝/MWG 同步/ICC/XMP/IPTC/MakerNote/
 * RAW/HEIC/AVIF。useMWG 默认开启（EXIF/XMP/IPTC 按 MWG 规则互相同步）。
 *
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const {exiftool} = require('exiftool-vendored');

class ImageMetadataHelper {

    // ============================ 常量 ============================

    static #OUTPUT_TYPE = Object.freeze({PATH: 'path', BUFFER: 'Buffer', UINT8_ARRAY: 'Uint8Array', BLOB: 'Blob',});

    /** HEIC / AVIF 的 ISOBMFF ftyp brand（小写） */
    static #HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1']);

    static #AVIF_BRANDS = new Set(['avif', 'avis']);

    /**
     * Blob 构造函数在当前环境是否可用。
     * 缓存结果，避免每次调用重复 typeof 检测。
     */
    static #HAS_BLOB = (() => typeof Blob !== 'undefined')();

    /** 默认 MIME（无法识别格式时回退，#resolveInput 与 #resolveOutput 共用） */
    static #DEFAULT_MIME = 'application/octet-stream';

    // ============================ 对外 API ============================

    /**
     * 读取图片元数据（不同格式通用）。
     * @param {string|Buffer|Uint8Array|Blob} source 图片：文件路径或二进制
     * @param {{ format?: string }} [options] format：内存型 RAW 的格式提示（如 'cr2'）
     * @returns {Promise<object>} exiftool 的 Tags 对象（字段为原生大小写：
     *     Make / Model / DateTimeOriginal / Orientation / GPSLatitude / ...）
     */
    static async readMetadata(source, options = {}) {
        const ctx = await this.#resolveInput(source, options);
        try {
            return await exiftool.read(ctx.file);
        } finally {
            await ctx.cleanup();
        }
    }

    /**
     * 写入图片元数据（不同格式通用；返回与 source 同类型）。
     * @param {string|Buffer|Uint8Array|Blob} source 图片：文件路径或二进制
     * @param {object} tags exiftool 标签引用，如 { Make: 'NIKON', 'IPTC:Keywords': ['a', 'b'] }；
     *     值为 null 表示删除该标签
     * @param {{ orientation?: 'reset'|'keep', useMWG?: boolean, windowsCompatible?: boolean, format?: string }} [options]
     *     orientation 默认 'reset'：canvas 像素已按 EXIF 方向烘焙，把 Orientation 重置为 1；
     *     传 'keep' 保留原值（当 source 不是 canvas 产物时适用）
     *     useMWG 默认 true：EXIF/XMP/IPTC 按 MWG 互相同步
     *     windowsCompatible 默认 true：追加 -XMP:all<EXIF:all 把 EXIF 镜像进 XMP，保证 Windows 属性面板可见（PNG 尤其关键，Windows 不读 eXIf 块）
     * @returns {Promise<string|Buffer|Uint8Array|Blob>} 写入后的图片（target），类型与 source 一致
     */
    static async writeMetadata(source, tags, options = {}) {
        const ctx = await this.#resolveInput(source, options);
        try {
            // 写入用户标签
            const writeArgs = ['-overwrite_original'];
            if (options.orientation !== 'keep' && !this.#hasOrientationKey(tags)) {
                writeArgs.push('-Orientation#=1');
            }
            await exiftool.write(ctx.file, tags || {}, {
                useMWG: options.useMWG !== false,
                writeArgs,
            });
            // EXIF → XMP 镜像（Windows 兼容）
            if (options.windowsCompatible !== false) {
                await exiftool.write(ctx.file, {}, {
                    useMWG: false,
                    writeArgs: ['-XMP:all<EXIF:all', '-overwrite_original'],
                });
            }
            return await this.#resolveOutput(ctx.file, ctx.outputType, ctx.mime);
        } finally {
            await ctx.cleanup();
        }
    }

    /**
     * 把 source 的元数据迁移到 target（不同格式通用；返回与 target 同类型）。
     * 典型用法：原图（任何格式）→ canvas 导出图（jpg/png/webp），元数据回灌。
     * @param {string|Buffer|Uint8Array|Blob} source 原图（含元数据，可与 target 不同格式）
     * @param {string|Buffer|Uint8Array|Blob} target 目标图（如 canvas.toBlob 产物，元数据将被注入）
     * @param {{ orientation?: 'reset'|'keep', windowsCompatible?: boolean, useMWG?: boolean, format?: string }} [options]
     *     orientation 默认 'reset'（canvas 已烘焙旋转）
     *     windowsCompatible 默认 true：追加 -XMP:all<EXIF:all 把 EXIF 镜像进 XMP，保证 Windows 属性面板可见（PNG 尤其关键，Windows 不读 eXIf 块）
     *     useMWG 默认 true
     * @returns {Promise<string|Buffer|Uint8Array|Blob>} 注入元数据后的图片（target），类型与 target 一致
     */
    static async syncMetadata(source, target, options = {}) {
        // source / target 同时落盘（并行 IO），再逐一操作
        const [sourceCtx, targetCtx] = await Promise.all([
            this.#resolveInput(source, options),
            this.#resolveInput(target, options),
        ]);
        try {
            // 从源文件拷贝全部可写标签
            const writeArgs = ['-tagsFromFile', sourceCtx.file, '-all:all'];
            // EXIF → XMP 镜像（Windows 读 XMP）
            if (options.windowsCompatible !== false) {
                writeArgs.push('-XMP:all<EXIF:all');
            }
            if (options.orientation !== 'keep') {
                writeArgs.push('-Orientation#=1');
            }
            writeArgs.push('-overwrite_original');
            // tags={} 时库会自动注入无害的 -FileName<FileName 以保持「写模式」，不影响 -tagsFromFile
            await exiftool.write(targetCtx.file, {}, {useMWG: false, writeArgs});
            return await this.#resolveOutput(targetCtx.file, targetCtx.outputType, targetCtx.mime);
        } finally {
            // 两个临时目录并行清理，即使中途抛错
            await Promise.all([sourceCtx.cleanup(), targetCtx.cleanup()]);
        }
    }

    /**
     * 剥离全部元数据（不同格式通用；返回与 source 同类型）。
     * 注意：路径输入会保留一份 `<name>_original` 备份（exiftool 安全默认，非破坏）；
     * 二进制输入走临时文件、用完即删，不留备份。
     * @param {string|Buffer|Uint8Array|Blob} source 图片：文件路径或二进制
     * @param {{ retain?: string[], format?: string }} [options] retain：保留指定标签（exiftool 标签引用）
     * @returns {Promise<string|Buffer|Uint8Array|Blob>} 清除后的图片（target），类型与 source 一致
     */
    static async removeMetadata(source, options = {}) {
        const ctx = await this.#resolveInput(source, options);
        try {
            await exiftool.deleteAllTags(ctx.file, options.retain ? {retain: options.retain} : undefined);
            return await this.#resolveOutput(ctx.file, ctx.outputType, ctx.mime);
        } finally {
            await ctx.cleanup();
        }
    }

    // ============================ 格式识别 ============================

    /**
     * 魔字节识别图片格式（纯字节，不依赖文件名）。
     * @param {Buffer|Uint8Array} buffer 图片字节（至少 4 字节）
     * @returns string | null 格式类型，不识别返回 null
     */
    static detectFormat(buffer) {

        if (!buffer || buffer.length < 4) return null;

        const bytes = buffer;

        // 大端读取 32 位（不依赖 Buffer 专有的 readUInt32BE）
        const u32 = (o) => (bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3];

        const ascii = (o, len) => String.fromCharCode(...bytes.subarray(o, o + len));

        // JPEG：FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';

        // PNG：89 50 4E 47
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';

        // WebP：RIFF....WEBP（至少 12 字节）
        if (bytes.length >= 12 && u32(0) === 0x52494646 && u32(8) === 0x57454250) return 'webp';

        // GIF87a / GIF89a：版本数字在第 4 字节（0x37='7'、0x39='9'）
        if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            if (bytes[4] === 0x37 || bytes[4] === 0x39) return 'gif';
        }

        // BMP：42 4D（"BM"）
        if (bytes[0] === 0x42 && bytes[1] === 0x4D) return 'bmp';

        // TIFF 系（含 CR2/NEF/ARW/DNG 等 RAW）：II*\0 (LE) 或 MM\0* (BE)
        const header32 = u32(0);
        if (header32 === 0x49492A00 || header32 === 0x4D4D002A) return 'tiff';

        // HEIC / AVIF：ISOBMFF ftyp box（偏移 4..8 = 'ftyp'，8..12 = brand）
        if (bytes.length >= 12 && u32(4) === 0x66747970) {
            const brand = ascii(8, 4).toLowerCase();
            if (this.#HEIC_BRANDS.has(brand)) return 'heic';
            if (this.#AVIF_BRANDS.has(brand)) return 'avif';
        }

        return null;
    }

    /** 把 'jpg' 或 '.JPG' 统一成 '.jpg'；空值返回 null。 */
    static #normalizeExt(ext) {
        if (!ext) return null;
        return (ext.startsWith('.') ? ext : '.' + ext).toLowerCase();
    }

    // ============================ 输入/输出归一化 ============================

    /**
     * 把任意输入归一化为「磁盘上的文件」+ 回收句柄。
     *   - 路径：原地操作，cleanup 为空函数，outputType=PATH。
     *   - 二进制：写临时文件（带正确扩展名，exiftool 据此选 reader），
     *     cleanup 删整个临时目录，outputType 为原输入类型。
     * @param {string|Buffer|Uint8Array|Blob} source 图片输入
     * @param {{ format?: string }} [options] ext：内存型 RAW 的格式提示（如 'cr2'），魔字节无法区分 RAW 子型时用
     * @returns {Promise<{ file: string, outputType: string, mime: string, cleanup: Function }>}
     */
    static async #resolveInput(source, options = {}) {

        // 路径：直接用，不拷贝（exiftool 原地改写最省）
        if (typeof source === 'string') {
            return {
                file: path.resolve(source),
                outputType: this.#OUTPUT_TYPE.PATH,
                mime: null,
                cleanup: async () => {
                },
            };
        }

        // 二进制：先取出字节与原类型（Buffer 须先判，因为 Buffer 也是 Uint8Array）
        let buffer, outputType;

        if (this.#HAS_BLOB && source instanceof Blob) {
            buffer = Buffer.from(await source.arrayBuffer());
            outputType = this.#OUTPUT_TYPE.BLOB;
        } else if (Buffer.isBuffer(source)) {
            buffer = source;
            outputType = this.#OUTPUT_TYPE.BUFFER;
        } else if (source instanceof Uint8Array) {
            // 共享底层 ArrayBuffer，零拷贝
            buffer = Buffer.from(source.buffer, source.byteOffset, source.byteLength);
            outputType = this.#OUTPUT_TYPE.UINT8_ARRAY;
        } else {
            throw new Error(
                `不支持的输入类型: ${source?.constructor?.name ?? typeof source}。` +
                ' source 必须是 string(文件路径) | Buffer | Uint8Array | Blob'
            );
        }

        // 扩展名：options.format > 魔字节 > 默认 .bin
        const detectedFormat = this.detectFormat(buffer);
        const ext = this.#normalizeExt(options.format || detectedFormat) ?? '.unknown';

        const mime = (this.#HAS_BLOB && source instanceof Blob) ? source.type : this.#DEFAULT_MIME;

        // 临时文件
        const dir = await fsp.mkdtemp(path.join(os.tmpdir()));
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filename = `temp-${timestamp}-${random}${ext}`;
        const file = path.join(dir, filename);
        await fsp.writeFile(file, buffer);
        const cleanup = async () => {
            try {
                await fsp.rm(file, {recursive: false, force: true});
            } catch { /* 尽力而为，不抛 */
            }
        };
        return {file, outputType, mime, cleanup};
    }

    /**
     * 操作完成后按原输入类型回读产出 target。
     * @param {string} file 磁盘上的（已修改）文件
     * @param {string} outputType 原输入类型（见 #OUTPUT_TYPE）
     * @param {string|null} mime 输出 MIME（仅 Blob 用）
     * @returns {Promise<string|Buffer|Uint8Array|Blob>}
     */
    static async #resolveOutput(file, outputType, mime) {

        // 路径输入：文件已原地改写，返回原路径即可，不读回
        if (outputType === this.#OUTPUT_TYPE.PATH) return file;

        const buffer = await fsp.readFile(file);

        switch (outputType) {
            case this.#OUTPUT_TYPE.BUFFER:
                return buffer;
            case this.#OUTPUT_TYPE.UINT8_ARRAY: {
                // 复制一份纯 Uint8Array（不返回 Buffer 子类，类型更纯粹）
                const u8 = new Uint8Array(buffer.length);
                u8.set(buffer);
                return u8;
            }
            case this.#OUTPUT_TYPE.BLOB:
                return new Blob([buffer], {type: mime || this.#DEFAULT_MIME});
            default:
                return buffer;
        }
    }

    /**
     * tags是否显式包含 Orientation（EXIF/XMP/MWG 任意分组）。
     * 用于判断 write 是否需要自动补 Orientation 重置——用户已显式给值就不覆盖。
     * @param {object|null|undefined} tags
     * @returns {boolean}
     */
    static #hasOrientationKey(tags) {
        if (!tags) return false;
        return Object.keys(tags).some((key) => /(^|:)orientation$/i.test(key));
    }

    /**
     * 关闭 exiftool 进程池。长驻服务用完调用；脚本退出时库会自管。
     * @returns {Promise<void>}
     */
    static async close() {
        try {
            await exiftool.end();
        } catch { /* 忽略已关闭等情况 */
        }
    }
}

module.exports = ImageMetadataHelper;
