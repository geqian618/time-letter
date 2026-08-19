'use strict';

/**
 * ImageMetadataHelper —— 图片元数据工具
 *
 * canvas 导出会丢失 EXIF/XMP/ICC/IPTC 元数据，本工具把原图元数据重新注入
 * 导出图，并支持跨格式迁移（引擎：exiftool-vendored，默认开启 MWG 同步）。
 *
 * 输入可为 文件路径 | Buffer | Uint8Array 输出与输入同类型：
 * 路径输入原地改写；二进制输入写临时文件、用完即删整目录。
 * 出错统一抛带 cause 的错误，原始 exiftool 错误在 .cause 中。
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');
const {randomUUID} = require('crypto');
const {exiftool} = require('exiftool-vendored');

class ImageMetadataHelper {

    // ============================ 常量 ============================

    // 输出类型标记，供输入/输出归一化往返使用
    static #OUTPUT_TYPE = Object.freeze({
        PATH: 'path',
        BUFFER: 'Buffer',
        UINT8_ARRAY: 'Uint8Array',
    });


    // HEIC / AVIF 的 ISOBMFF ftyp brand（小写）
    static #HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'mif1']);

    static #AVIF_BRANDS = new Set(['avif', 'avis']);

    // EXIF→XMP 镜像时排除的二进制大标签，避免缩略图撑大文件
    static #XMP_MIRROR_EXCLUDE = ['-XMP:PreviewImage=', '-XMP:ThumbnailImage='];

    // 路径输入无需清理，复用空实现
    static #NOOP_CLEANUP = async () => {
    };

    // ============================ 对外 API ============================

    /**
     * 读取图片元数据。
     * @param {string|Buffer|Uint8Array} source 图片：文件路径或二进制
     * @param {{format?: string}} [options] format：内存型 RAW 的格式提示（如 'cr2'）
     * @returns {Promise<object>} exiftool Tags（Make / Model / DateTimeOriginal / ...）
     */
    static async readMetadata(source, options = {}) {
        const ctx = await this.#resolveInput(source, options);
        try {
            return await exiftool.read(ctx.file);
        } catch (err) {
            throw this.#rethrow(`读取图片元数据失败: ${ctx.file}`, err);
        } finally {
            await ctx.cleanup();
        }
    }

    /**
     * 写入元数据，返回与 source 同类型的新图。
     * @param {string|Buffer|Uint8Array} source 图片：文件路径或二进制
     * @param {object} tags exiftool 标签，如 { Make: 'NIKON' }；值为 null 表示删除
     * @param {{orientation?: 'reset'|'keep', useMWG?: boolean, windowsCompatible?: boolean, format?: string}} [options]
     *     orientation 默认 'reset'：canvas 已烘焙旋转，把 Orientation 重置为 1；'keep' 保留原值
     *     useMWG 默认 true：EXIF/XMP/IPTC 按 MWG 互相同步
     *     windowsCompatible 默认 true：EXIF 镜像进 XMP，Windows 属性面板可读（PNG 尤关键）
     * @returns {Promise<string|Buffer|Uint8Array>} 写入后的图片，类型与 source 一致
     */
    static async writeMetadata(source, tags, options = {}) {

        const orientation = this.#extractOrientation(options.orientation);

        const ctx = await this.#resolveInput(source, options);

        try {
            // 用户显式给了 Orientation 就不自动重置
            const writeArgs = ['-overwrite_original'];

            if (orientation === 'reset' && !this.#hasOrientationKey(tags)) {
                writeArgs.push('-Orientation#=1');
            }
            // Orientation 是 exiftool 特殊标签：tag 对象形式写成不带 # 的参数，
            // 会被当作旋转指令而非字面赋值（标签被丢弃）。剥离后转成带 # 的字面参数。
            const {tags: writeTags, orientationArg} = this.#resolveOrientationArg(tags);

            if (orientationArg) {
                writeArgs.push(orientationArg);
            }
            await exiftool.write(ctx.file, writeTags, {
                useMWG: options.useMWG !== false,
                writeArgs
            });
            if (options.windowsCompatible !== false) {
                await this.#copyExifToXmp(ctx.file);
            }
            return await this.#resolveOutput(ctx.file, ctx.outputType);
        } catch (err) {
            throw this.#rethrow(`写入图片元数据失败: ${ctx.file}`, err);
        } finally {
            await ctx.cleanup();
        }
    }

    /**
     * 把 source 的元数据迁移到 target，返回与 target 同类型的新图。
     * 典型用法：原图（任何格式）→ canvas 导出图（jpg/png/webp）元数据回灌。
     * @param {string|Buffer|Uint8Array} source 原图（可与 target 不同格式）
     * @param {string|Buffer|Uint8Array} target 目标图（如 canvas 导出图）
     * @param {{orientation?: 'reset'|'keep', windowsCompatible?: boolean, useMWG?: boolean, sourceFormat?: string, targetFormat?: string}} [options]
     *     format：两个输入通用的内存型 RAW 格式提示（如 'cr2'，与其他 API 一致）
     *     sourceFormat / targetFormat：分别提示 source / target 的 RAW 格式，优先于 format
     * @returns {Promise<string|Buffer|Uint8Array>} 注入元数据后的图片，类型与 target 一致
     */
    static async syncMetadata(source, target, options = {}) {

        this.#assertDistinctPaths(source, target);

        // source / target 同时落盘（并行 IO），再逐一操作；各自格式提示优先，未指定时回退到通用的 format（与其他 API 保持一致）
        const [sourceCtx, targetCtx] = await Promise.all([
            this.#resolveInput(source, {...options, format: options.sourceFormat}),
            this.#resolveInput(target, {...options, format: options.targetFormat}),
        ]);

        try {
            // 拷贝源全部可写标签 + EXIF → XMP 镜像（Windows 读 XMP）+ 方向重置
            const writeArgs = [
                '-tagsFromFile', sourceCtx.file, '-all:all',
                ...(options.windowsCompatible !== false ? ['-XMP:all<EXIF:all', ...this.#XMP_MIRROR_EXCLUDE] : []),
                ...(this.#extractOrientation(options.orientation) === 'reset' ? ['-Orientation#=1'] : []),
                '-overwrite_original',
            ];
            // tags={} 时库自动注入无害的 -FileName<FileName 保持写模式，不影响 -tagsFromFile
            await exiftool.write(targetCtx.file, {}, {
                useMWG: options.useMWG !== false,
                writeArgs
            });
            return await this.#resolveOutput(targetCtx.file, targetCtx.outputType);
        } catch (err) {
            throw this.#rethrow(`迁移图片元数据失败: ${sourceCtx.file} → ${targetCtx.file}`, err);
        } finally {
            // 两个临时目录并行清理，即使中途抛错
            await Promise.all([sourceCtx.cleanup(), targetCtx.cleanup()]);
        }
    }

    /**
     * 剥离全部元数据，返回与 source 同类型的新图。
     * @param {string|Buffer|Uint8Array} source 图片：文件路径或二进制
     * @param {{retain?: string|string[], format?: string}} [options]
     *         retain：需要保留的标签（exiftool 标签引用，单个字符串或数组）
     * @returns {Promise<string|Buffer|Uint8Array>} 清除后的图片，类型与 source 一致
     */
    static async removeMetadata(source, options = {}) {
        const ctx = await this.#resolveInput(source, options);
        try {
            const retain = options.retain ? (Array.isArray(options.retain) ? options.retain : [options.retain]) : undefined;
            await exiftool.deleteAllTags(ctx.file, retain ? {retain} : undefined);
            return await this.#resolveOutput(ctx.file, ctx.outputType);
        } catch (err) {
            throw this.#rethrow(`剥离图片元数据失败: ${ctx.file}`, err);
        } finally {
            await ctx.cleanup();
        }
    }


    /**
     * 魔数字节识别图片格式（纯字节，不依赖文件名）
     * @param {Buffer|Uint8Array} buffer 图片字节（至少 4 字节）
     * @returns {string|null} 小写格式名（jpeg/png/webp/gif/bmp/tiff/heic/avif），无法识别返回 null
     */
    static detectFormat(buffer) {

        if (!buffer || buffer.length < 4) return null;

        const bytes = buffer;

        // 大端读取 32 位，>>> 0 归一为无符号，避免高位字节符号扩展的隐患
        const u32 = (o) => ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;

        const ascii = (o, len) => String.fromCharCode(...bytes.subarray(o, o + len));

        // JPEG：FF D8 FF
        if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'jpeg';

        // PNG：89 50 4E 47
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';

        // WebP：RIFF....WEBP（至少 12 字节）
        if (bytes.length >= 12 && u32(0) === 0x52494646 && u32(8) === 0x57454250) return 'webp';

        // GIF87a / GIF89a：版本数字在第 4 字节（0x37='7'、0x39='9'）
        if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && (bytes[4] === 0x37 || bytes[4] === 0x39)) return 'gif';

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


    // ============================ 内部 API ============================

    /**
     * 提取 orientation 取值；undefined 按默认 'reset' 处理
     * @param orientation
     * @returns {*|string}
     */
    static #extractOrientation(orientation) {
        if (orientation === undefined) return 'reset';
        if (orientation === 'reset' || orientation === 'keep') return orientation;
        throw new TypeError(`orientation 的值只允许是 'reset' 或 'keep'，接收到的值是: ${JSON.stringify(orientation)}`);
    }

    /**
     * tags 是否显式含 Orientation（任意分组），决定 write 是否跳过自动重置
     * @param tags
     * @returns {boolean}
     */
    static #hasOrientationKey(tags) {
        if (!tags) return false;
        return Object.keys(tags).some((key) => /(^|:)orientation$/i.test(key));
    }

    /**
     * 剥离 tags 中的 Orientation，转成带 # 修饰符的字面参数：
     * 不带 # 时 exiftool 视为旋转指令而非赋值（标签被丢弃）；null 值转删除参数；
     * 必须带前导 '-'，否则被当作文件名。
     * @param tags
     * @returns {orientationArg: string, tags: Omit<*, never>}
     */
    static #resolveOrientationArg(tags) {
        // 如果 tags 为空，返回空对象和无参数
        if (!tags) {
            return {tags: {}, orientationArg: null};
        }
        // 查找 orientation 键（可能带有命名空间前缀）
        const orientationKey = Object.keys(tags).find(key => /(^|:)orientation$/i.test(key));
        // 如果没有找到，返回原始 tags 和无参数
        if (!orientationKey) {
            return {tags, orientationArg: null};
        }
        // 提取该键的值，并移除该键
        const {[orientationKey]: orientationValue, ...remainingTags} = tags;
        // 构造 exiftool 参数：如果值为 null 或 undefined，删除标签；否则带 # 赋值
        const orientationArg = orientationValue == null ? `-${orientationKey}=` : `-${orientationKey}#=${orientationValue}`;
        return {tags: remainingTags, orientationArg};
    }

    /**
     *  拒绝 source/target 为同一路径的误用（-tagsFromFile 自身无意义且会破坏文件）
     * @param source
     * @param target
     */
    static #assertDistinctPaths(source, target) {
        if (typeof source === 'string' && typeof target === 'string') {
            const sourcePath = path.resolve(source);
            const targetPath = path.resolve(target);
            if (sourcePath === targetPath) {
                throw new Error(`source 与 target 不能是同一个文件: ${sourcePath}`);
            }
        }
    }

    /**
     * 统一错误包装：补全上下文，原错误挂到 cause
     * @param {string} message - 补充的上下文信息
     * @param {unknown} originalError - 原始错误或任意异常值
     * @returns {Error} 包装后的错误对象
     */
    static #rethrow(message, originalError) {
        const detail = originalError instanceof Error ? originalError.message : String(originalError);
        return new Error(`${message},Because of: ${detail}`, {cause: originalError});
    }


    /**
     * EXIF → XMP 镜像（Windows 读 XMP，PNG 尤关键），排除二进制大标签防膨胀
     * @param file 文件
     * @returns {Promise<void>}
     */
    static async #copyExifToXmp(file) {
        await exiftool.write(file, {}, {
            useMWG: false,
            writeArgs: ['-XMP:all<EXIF:all', ...this.#XMP_MIRROR_EXCLUDE, '-overwrite_original'],
        });
    }


    /**
     *
     * @param {string} format 格式名或扩展名
     * @returns {string|null} 扩展名或 null
     */
    static #extractNormalizeExt(format) {
        if (!format) return null;
        return (format.startsWith('.') ? format : `.${format}`).toLowerCase();
    }


    // ============================ 输入/输出归一化（策略注册表） ============================

    /**
     * 输入归一化策略表：每种输入类型一个策略，先匹配先服务。
     * 顺序即优先级：Buffer 也是 Uint8Array，须先判 Buffer。
     * 每个策略统一产出「磁盘文件 + 回收句柄」。
     */
    static #INPUT_STRATEGIES = Object.freeze([
        {
            name: 'path',
            // 路径输入：校验存在且为文件后原地操作，无需临时文件
            match: (source) => typeof source === 'string',
            resolve: async (source) => {
                const file = path.resolve(source);
                const stat = await fsp.stat(file).catch(() => {
                    throw new Error(`图片文件不存在或不可访问: ${file}`);
                });
                if (!stat.isFile()) throw new Error(`无效的文件路径: ${file}`);
                return {
                    file,
                    outputType: this.#OUTPUT_TYPE.PATH,
                    cleanup: this.#NOOP_CLEANUP,
                };
            }
        },
        {
            name: 'buffer',
            match: (source) => Buffer.isBuffer(source),
            resolve: (source, options) => this.#createTempFile(
                source,
                this.#OUTPUT_TYPE.BUFFER,
                options.format
            )
        },
        {
            name: 'uint8Array',
            match: (source) => source instanceof Uint8Array,
            resolve: (source, options) => this.#createTempFile(
                // 共享底层 ArrayBuffer，零拷贝
                Buffer.from(source.buffer, source.byteOffset, source.byteLength),
                this.#OUTPUT_TYPE.UINT8_ARRAY,
                options.format,
            )
        }
    ]);

    /**
     * 输出策略表：按原输入类型（outputType）查表回读产出。
     * 每个策略接收磁盘文件，返回与输入同类型的图。
     */
    static #OUTPUT_STRATEGIES = Object.freeze({
        [this.#OUTPUT_TYPE.PATH]: {
            resolve: async (file) => file,
        },
        [this.#OUTPUT_TYPE.BUFFER]: {
            resolve: (file) => this.#readFileToBuffer(file),
        },
        [this.#OUTPUT_TYPE.UINT8_ARRAY]: {
            resolve: async (file) => {
                const buffer = await this.#readFileToBuffer(file);
                // 复制一份纯 Uint8Array（不返回 Buffer 子类，类型更纯粹）
                const u8 = new Uint8Array(buffer.length);
                u8.set(buffer);
                return u8;
            },
        },
    });


    /**
     * 输入归一化为「磁盘文件 + 回收句柄」。
     * 路径：校验存在且为文件后原地操作（outputType=PATH，无需清理）；
     * 二进制：写临时文件（扩展名按格式，供 exiftool 识别），清理为删整个目录。
     * @param {string|Buffer|Uint8Array} source 图片输入
     * @param {{format?: string}} [options] format：内存型 RAW 的格式提示（如 'cr2'）
     * @returns {Promise<{ file: string, outputType: string, cleanup: () => Promise<void> }>}
     */
    static async #resolveInput(source, options = {}) {
        // 策略分派：按类型匹配首个策略，取代原来的 if-else 类型判断链
        const strategy = this.#INPUT_STRATEGIES.find((s) => s.match(source));
        if (!strategy) {
            throw new TypeError(
                `不支持的输入类型: ${source?.constructor?.name ?? typeof source}。` +
                ' source 必须是 string(文件路径) | Buffer | Uint8Array'
            );
        }
        return await strategy.resolve(source, options);
    }


    /**
     * 按原输入类型回读产出。
     * 路径输入直接返回路径；Uint8Array 复制一份纯视图。
     * @param {string} file 磁盘上的（已修改）文件
     * @param {string} outputType 原输入类型（见 #OUTPUT_TYPE）
     * @returns {Promise<string|Buffer|Uint8Array>}
     */
    static async #resolveOutput(file, outputType) {
        // 策略分派：按 outputType 查表，取代原来的 if / switch 分支
        const strategy = this.#OUTPUT_STRATEGIES[outputType];
        if (!strategy) {
            // 兜底：未知输出类型按 Buffer 读出，与旧的 default 行为一致
            return this.#readFileToBuffer(file);
        }
        return await strategy.resolve(file);
    }


    /**
     * 二进制输入统一落盘：扩展名按格式推断（options.format > 魔字节 > .unknown），
     * 独立临时目录 + 整个目录回收，避免向系统临时目录泄漏空目录。
     * @param {Buffer} buffer 图片字节
     * @param {string} outputType 原输入类型（见 #OUTPUT_TYPE）
     * @param {string} [format] 内存型 RAW 的格式提示（如 'cr2'）
     * @returns {Promise<{ file: string, outputType: string, cleanup: () => Promise<void> }>}
     */
    static async #createTempFile(buffer, outputType, format) {

        const finalFormat = format || this.detectFormat(buffer);

        const ext = this.#extractNormalizeExt(finalFormat) ?? '.unknown';

        const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'temp-'));

        const file = path.join(dir, `${randomUUID()}${ext}`);

        await fsp.writeFile(file, buffer);

        const cleanup = async () => {
            try {
                await fsp.rm(dir, {recursive: true, force: true});
            } catch { /* 尽力而为，不抛 */
            }
        };
        return {file, outputType, cleanup};
    }


    /**
     * 读取磁盘文件为 Buffer，失败统一包装错误。
     * @param {string} file 文件路径
     * @returns {Promise<Buffer>}
     */
    static async #readFileToBuffer(file) {
        return fsp.readFile(file).catch(error => {
            throw new Error(`无法读取文件: ${file}`, {cause: error});
        });
    }

}

module.exports = ImageMetadataHelper;
