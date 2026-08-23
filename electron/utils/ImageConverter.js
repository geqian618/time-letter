const sharp = require('sharp');
const path = require('path');

/**
 * @typedef {Object} ResizeOptions
 * @property {number} [width] - 目标宽度（像素）
 * @property {number} [height] - 目标高度（像素）
 * @property {string} [fit='cover'] - 适配模式，可选 'cover'、'contain'、'fill'、'inside'、'outside'
 * @property {string|Object} [position='center'] - 裁剪位置，如 'center'、'top'、'left'、'right'、'bottom' 或坐标对象
 * @property {string|Object} [background] - 填充背景色（当 fit 为 'contain' 时使用）
 * @property {string} [kernel] - 缩放内核（sharp.kernel 常量）
 * @property {boolean} [withoutEnlargement] - 是否禁止放大
 * @property {boolean} [withoutReduction] - 是否禁止缩小
 */

/**
 * @typedef {Object} TransformOptions
 * @property {number} [rotate] - 旋转角度（度），正数顺时针；未提供时按 EXIF Orientation 自动摆正，显式传 0 可跳过自动摆正
 * @property {boolean} [grayscale] - 是否转为灰度
 * @property {boolean} [flip] - 是否垂直翻转（上下颠倒）
 * @property {boolean} [flop] - 是否水平翻转（左右镜像）
 * @property {number} [blur] - 高斯模糊的 sigma 值（≥0.3）
 * @property {number|Object|boolean} [sharpen] - 锐化参数：数值（sigma）、对象 { sigma, m1, m2, x1, y2, y3 } 或 true（使用默认锐化）
 * @property {Object} [modulate] - 调色 { brightness, saturation, hue, lightness }
 * @property {Object|string} [tint] - 着色 { r, g, b }（0-255）或十六进制颜色字符串
 * @property {number} [gamma] - 伽马校正值（1-3）
 */

/**
 * @typedef {Object} FormatOptions
 * @description 格式专用选项，具体支持的键值取决于目标格式，下面列出常见格式的常用选项
 * @property {number} [quality] - 图片质量（1-100），适用于 JPEG、WebP、AVIF、TIFF、JP2、JXL、HEIF
 * @property {boolean} [progressive] - 是否渐进式（JPEG）
 * @property {boolean} [mozjpeg] - 是否使用 mozjpeg 编码（JPEG，压缩率更高但编码更慢）
 * @property {number} [compressionLevel] - 压缩级别（0-9），适用于 PNG
 * @property {boolean} [palette] - 是否启用调色板模式（PNG）
 * @property {number} [colours] - 调色板颜色数（2-256），用于 PNG
 * @property {number} [dither] - 抖动系数（0-1），用于 PNG 调色板
 * @property {boolean} [lossless] - 是否无损压缩（WebP、AVIF）
 * @property {boolean} [nearLossless] - 是否接近无损（WebP）
 * @property {number} [alphaQuality] - 透明度通道质量（WebP）
 * @property {string} [compression] - 压缩算法，如 'lzw'、'deflate'、'jpeg'（TIFF）；HEIF 为 'av1' 或 'hevc'
 * @property {boolean} [reoptimise] - 是否重新优化（GIF）
 */

/**
 * @typedef {Object} ConvertOptions
 * @description 通用转换选项，用于 {@link ImageConverter.convertToFile} 和 {@link ImageConverter.convertToBuffer}
 * @property {string} format - 目标格式（如 'jpeg'、'png'、'webp'，支持带点扩展名如 '.jpg'）
 * @property {ResizeOptions} [resize] - 缩放参数
 * @property {TransformOptions} [transform] - 变换操作
 * @property {FormatOptions} [formatOptions] - 格式专用选项
 * @property {boolean} [keepMetadata=false] - 是否保留输入图片的元数据（EXIF、ICC、XMP 等），默认不保留
 */

/**
 * @typedef {Object} FormatConvertOptions
 * @description 用于特定格式转换方法的选项（不包含 format 字段，因为格式已固定；编码选项会与默认值合并）
 * @property {ResizeOptions} [resize] - 缩放参数
 * @property {TransformOptions} [transform] - 变换操作
 * @property {FormatOptions} [formatOptions] - 格式专用选项（会与 {@link ImageConverter} 的 DEFAULT_FORMAT_OPTIONS 合并）
 * @property {boolean} [keepMetadata=false] - 是否保留输入图片的元数据，默认不保留
 */

/**
 * 图片转换工具类，基于 sharp 库提供多种格式转换功能。
 * 支持转换到文件或 Buffer，支持缩放、旋转、灰度等变换操作。
 *
 * 行为说明：
 * - 默认按 EXIF Orientation 自动摆正图片（手机竖拍照片不会横躺）；显式传 transform.rotate: 0 可跳过
 * - 先旋转/摆正再缩放，避免带角度旋转时先裁剪导致错位
 * - 不设静态格式白名单，格式广度跟随当前 sharp 构建；运行时按实际编码能力校验
 * -（如预编译版不含 JP2/JXL/HEVC 编码器），可用格式可经 {@link ImageConverter.getSupportFormats} 查询
 * - 需要 Node.js ≥ 16.9（错误对象使用 cause 选项）
 *
 * @class ImageConverter
 */
class ImageConverter {

    /**
     * 各输出格式的默认编码选项，专用方法（toJPEG、toPNGBuffer 等）统一引用此处默认值。
     * HEIF 默认 compression 为 'av1'：sharp 预编译版只捆绑 AV1 编码器（HEVC 授权原因），
     * 自行编译且带 HEVC 支持时可显式传 { compression: 'hevc' }。
     * @type {Object<string, FormatOptions>}
     */
    static #DEFAULT_FORMAT_OPTIONS = {
        jpeg: {quality: 80, progressive: true, mozjpeg: true},
        png: {compressionLevel: 6, palette: false},
        webp: {quality: 80, lossless: false, nearLossless: false},
        avif: {quality: 50, lossless: false},
        tiff: {quality: 80, compression: 'lzw'},
        gif: {reoptimise: true},
        heif: {quality: 80, compression: 'av1'},
        jp2: {quality: 80},
        jxl: {quality: 80},
        raw: {}
    };

    /**
     * 格式别名映射（归一化时使用）；可用格式以当前 sharp 构建的实际编码能力为准，不设静态白名单
     * @constant {Object<string, string>}
     */
    static #FORMAT_ALIASES = {jpg: 'jpeg', tif: 'tiff', heic: 'heif'};

    // ---------- 内部工具方法 ----------

    /**
     * 检测当前 sharp 构建是否真正具备某格式的编码能力。
     *
     * @param {string} format - 归一化后的格式名（不含点、jpg 已映射为 jpeg）
     * @returns {boolean} 是否可编码
     * @private
     */
    static #canEncode(format) {
        const info = sharp.format[format];
        if (info) return info.output?.buffer === true;
        // sharp 预编译版没有独立的 sharp.format.avif 键，AVIF 编码走 HEIF 容器（AV1 压缩）
        if (format === 'avif') return sharp.format.heif?.output?.buffer === true;
        return false;
    }

    /**
     * 校验目标格式：必须在支持列表中，且当前 sharp 构建必须能编码。
     *
     * @param {string} format - 目标格式（支持带点扩展名、大小写不敏感）
     * @returns {string} 归一化后的格式名（'jpg' 统一映射为 'jpeg'）
     * @throws {Error} 未指定格式、格式不在支持列表或当前构建缺少编码器时抛出
     * @private
     */
    static #normalizeFormat(format) {
        if (!format) throw new Error('必须指定格式');
        const normalized = String(format).toLowerCase().replace(/^\./, '');
        const finalFormat = this.#FORMAT_ALIASES[normalized] || normalized;
        // 校验 sharp 是否支持该格式类型，avif 在 sharp.format 中无独立键（编码走 HEIF 容器 + AV1），单独视为已知格式。
        const known = finalFormat === 'avif' || !!sharp.format[finalFormat];
        if (!known) {
            throw new Error(`不支持的格式类型: ${format}`);
        }
        if (!this.#canEncode(finalFormat)) {
            throw new Error(`当前 sharp 构建不支持编码 ${finalFormat}（缺少对应编码器）`);
        }
        return finalFormat;
    }

    /**
     * 应用缩放参数（完整透传 ResizeOptions，包括 fit、position、background、kernel 等）。
     *
     * @param {sharp.Sharp} pipeline - sharp 管道
     * @param {ResizeOptions|null} resize - 缩放参数
     * @returns {sharp.Sharp} sharp 管道
     * @private
     */
    static #applyResize(pipeline, resize) {
        if (!resize) return pipeline;
        const {width, height, ...rest} = resize;
        if (width === undefined && height === undefined) return pipeline;
        return pipeline.resize(width, height, rest);
    }

    /**
     * 应用变换操作。注意：旋转/EXIF 摆正最先执行，调用方应保证其发生在缩放之前。
     *
     * @param {sharp.Sharp} pipeline - sharp 管道
     * @param {TransformOptions} [transform] - 变换参数
     * @returns {sharp.Sharp} sharp 管道
     * @private
     */
    static #applyTransform(pipeline, transform = {}) {
        // 未显式传角度时，无参 rotate() 按 EXIF Orientation 自动摆正；显式传 0 可跳过
        pipeline = pipeline.rotate(transform.rotate);
        if (transform.flip) pipeline = pipeline.flip();
        if (transform.flop) pipeline = pipeline.flop();
        if (transform.grayscale) pipeline = pipeline.grayscale();
        if (transform.modulate) pipeline = pipeline.modulate(transform.modulate);
        if (transform.tint) pipeline = pipeline.tint(transform.tint);
        if (transform.gamma) pipeline = pipeline.gamma(transform.gamma);
        if (transform.blur) pipeline = pipeline.blur(transform.blur);
        if (transform.sharpen === true) pipeline = pipeline.sharpen();
        else if (transform.sharpen) pipeline = pipeline.sharpen(transform.sharpen);
        return pipeline;
    }

    /**
     * 构建转换管道：元数据保留 → 变换（含 EXIF 摆正/旋转）→ 缩放。
     * 所有转换入口共用此方法，保证各入口行为一致。
     *
     * @param {sharp.Sharp} sharpInstance - 已创建的 sharp 实例
     * @param {Object} params - 管道参数
     * @param {ResizeOptions|null} [params.resize] - 缩放参数
     * @param {TransformOptions} [params.transform] - 变换参数
     * @param {boolean} [params.keepMetadata] - 是否保留元数据
     * @returns {sharp.Sharp} 构建好的 sharp 管道（未设置输出格式）
     * @private
     */
    static #buildPipeline(sharpInstance, {resize = null, transform = {}, keepMetadata = false} = {}) {
        let pipeline = sharpInstance;
        if (keepMetadata) {
            pipeline = pipeline.keepMetadata();
        }
        pipeline = this.#applyTransform(pipeline, transform);
        pipeline = this.#applyResize(pipeline, resize);
        return pipeline;
    }

    /**
     * 设置输出格式。
     *
     * @param {sharp.Sharp} pipeline - sharp 管道
     * @param {string} finalFormat - 归一化后的格式名
     * @param {FormatOptions} [formatOptions] - 格式专用选项
     * @returns {sharp.Sharp} sharp 管道
     * @private
     */
    static #applyFormat(pipeline, finalFormat, formatOptions = {}) {
        return typeof pipeline[finalFormat] === 'function'
            ? pipeline[finalFormat](formatOptions)
            : pipeline.toFormat(finalFormat, formatOptions);
    }

    /**
     * 转换核心：校验格式、创建 sharp 实例、构建管道，按 target 是否为 undefined 决定输出到文件或 Buffer。
     *
     * @param {string|Buffer|sharp.Sharp} source - 输入图片路径或 Buffer（Sharp 实例在方法内创建）；
     *   也接受已创建的 sharp 实例（原始像素入口 {@link ImageConverter.convertRawToSharp} 的返回值）
     * @param {string|undefined} target - 输出文件路径；undefined 时输出 Buffer
     * @param {ConvertOptions} [options] - 转换选项
     * @returns {Promise<Object|Buffer>} 文件模式返回 { success, target, info }，Buffer 模式返回 Buffer
     * @throws {Error} 转换失败时抛出（cause 属性携带原始错误）
     * @private
     */
    static async #convertPipeline(source, target, options = {}) {
        const {format, resize = null, transform = {}, formatOptions = {}, keepMetadata = false} = options;
        const finalFormat = this.#normalizeFormat(format);
        try {
            const sharpInstance = source instanceof sharp ? source : sharp(source);
            const pipeline = this.#applyFormat(
                this.#buildPipeline(sharpInstance, {resize, transform, keepMetadata}),
                finalFormat,
                formatOptions
            );
            if (target === undefined) {
                return await pipeline.toBuffer();
            }
            const info = await pipeline.toFile(target);
            return {success: true, target, info};
        } catch (error) {
            throw new Error(`转换失败: ${error.message}`, {cause: error});
        }
    }

    /**
     * 将格式专用方法的选项与 DEFAULT_FORMAT_OPTIONS 中该格式的默认值合并。
     *
     * @param {string} format - 格式名
     * @param {FormatConvertOptions} [options] - 用户选项
     * @returns {ConvertOptions} 合并默认值后的完整转换选项
     * @private
     */
    static #withDefaultFormatOptions(format, options = {}) {
        const {resize = null, transform = {}, formatOptions = {}, keepMetadata = false} = options;
        return {
            format,
            resize,
            transform,
            keepMetadata,
            formatOptions: {...(this.#DEFAULT_FORMAT_OPTIONS[format] || {}), ...formatOptions}
        };
    }

    /**
     * 批量任务执行核心：滚动并发（完成一个立即补位），使用全局索引报告成功/失败。
     *
     * @param {Array<Object>} tasks - 任务列表
     * @param {Function} worker - 任务执行函数，入参为单个 task，返回结果或抛错
     * @param {number} concurrency - 并发数
     * @returns {Promise<Object>} 批量结果统计，results/errors 均含全局 index 与任务 source
     * @private
     */
    static async #runBatch(tasks, worker, concurrency = 5) {

        if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('任务列表为空');
        let limit = Number.parseInt(concurrency, 10);
        if (!Number.isInteger(limit) || limit < 1) limit = 5;
        limit = Math.min(limit, tasks.length);

        const results = [], errors = [];
        let next = 0;
        const runner = async () => {
            while (next < tasks.length) {
                const index = next++;
                const task = tasks[index];
                try {
                    const result = await worker(task);
                    const entry = {index, source: task.source, result};
                    if (task.target !== undefined) entry.target = task.target;
                    results.push(entry);
                } catch (err) {
                    errors.push({index, source: task.source, error: err.message});
                }
            }
        };
        await Promise.all(Array.from({length: limit}, () => runner()));
        results.sort((a, b) => a.index - b.index);
        errors.sort((a, b) => a.index - b.index);
        return {total: tasks.length, succeeded: results.length, failed: errors.length, results, errors};
    }

    // ---------- 通用转换入口 ----------

    /**
     * 通用图片转换方法，将输入图片转换为指定格式并保存到文件。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（需包含扩展名）
     * @param {ConvertOptions} [options] - 转换选项，详见 {@link ConvertOptions}
     * @returns {Promise<Object>} 返回包含成功状态、目标路径和输出信息的对象
     * @throws {Error} 输入为空、输出路径为空、格式未指定或不支持时抛出错误
     * @example
     * await ImageConverter.convertToFile('input.png', 'output.jpg', {
     *   format: 'jpeg',
     *   resize: { width: 800, height: 600, fit: 'cover' },
     *   formatOptions: { quality: 90, progressive: true },
     *   transform: { grayscale: true, rotate: 45 },
     *   keepMetadata: true
     * });
     */
    static async convertToFile(source, target, options = {}) {
        if (!source) throw new Error('输入不能为空');
        if (!target) throw new Error('输出路径不能为空');
        return this.#convertPipeline(source, target, options);
    }

    /**
     * 通用图片转换方法，将输入图片转换为指定格式并返回 Buffer。
     * 与 {@link ImageConverter.convertToFile} 共用同一管道构建逻辑，行为完全一致。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {ConvertOptions} [options] - 转换选项（同 {@link ConvertOptions}）
     * @returns {Promise<Buffer>} 返回转换后的图片数据 Buffer
     * @throws {Error} 输入为空、格式未指定或不支持时抛出错误
     * @example
     * const buf = await ImageConverter.convertToBuffer('input.png', {
     *   format: 'webp',
     *   resize: { width: 400 },
     *   formatOptions: { quality: 75 },
     *   keepMetadata: true
     * });
     */
    static async convertToBuffer(source, options = {}) {
        if (!source) throw new Error('输入不能为空');
        return this.#convertPipeline(source, undefined, options);
    }

    // ---------- 各格式专用方法（文件输出） ----------

    /**
     * 转换为 JPEG 格式并保存到文件。
     * 默认编码选项：{ quality: 80, progressive: true, mozjpeg: true }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .jpg 或 .jpeg）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JPEG 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toJPEG(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('jpeg', options));
    }

    /**
     * 转换为 PNG 格式并保存到文件。
     * 默认编码选项：{ compressionLevel: 6, palette: false }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .png）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，PNG 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toPNG(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('png', options));
    }

    /**
     * 转换为 WebP 格式并保存到文件。
     * 默认编码选项：{ quality: 80, lossless: false, nearLossless: false }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .webp）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，WebP 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toWebP(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('webp', options));
    }

    /**
     * 转换为 AVIF 格式并保存到文件。
     * 默认编码选项：{ quality: 50, lossless: false }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .avif）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，AVIF 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toAVIF(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('avif', options));
    }

    /**
     * 转换为 TIFF 格式并保存到文件。
     * 默认编码选项：{ quality: 80, compression: 'lzw' }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .tiff 或 .tif）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，TIFF 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toTIFF(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('tiff', options));
    }

    /**
     * 转换为 GIF 格式并保存到文件。
     * 默认编码选项：{ reoptimise: true }。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .gif）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，GIF 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toGIF(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('gif', options));
    }

    /**
     * 转换为 HEIF（含 HEIC）格式并保存到文件。
     * 默认编码选项：{ quality: 80, compression: 'av1' }（预编译 sharp 只捆绑 AV1 编码器，
     * 自行编译带 HEVC 支持时可传 { compression: 'hevc' }）。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .heif 或 .heic）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，HEIF 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toHEIF(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('heif', options));
    }

    /**
     * 转换为 JP2 (JPEG 2000) 格式并保存到文件。
     * 默认编码选项：{ quality: 80 }。注意：sharp 预编译版不含 OpenJPEG 编码器，
     * 仅自行编译 libvips 带 OpenJPEG 支持时可用。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .jp2）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JP2 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toJP2(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('jp2', options));
    }

    /**
     * 转换为 JXL (JPEG XL) 格式并保存到文件。
     * 默认编码选项：{ quality: 80 }。注意：sharp 预编译版不含 JXL 编码器，
     * 仅自行编译 libvips 带支持时可用。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .jxl）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JXL 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toJXL(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('jxl', options));
    }

    /**
     * 转换为 RAW (原始像素数据) 格式并保存到文件。
     * 注意：RAW 输出为未压缩像素数据，通常需要结合宽高、通道数等信息才能使用。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（建议 .raw）
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，RAW 固定）
     * @returns {Promise<Object>} 转换结果对象
     * @see ImageConverter.convertToFile
     */
    static async toRAW(source, target, options = {}) {
        return this.convertToFile(source, target, this.#withDefaultFormatOptions('raw', options));
    }

    // ---------- 各格式专用方法（Buffer 输出） ----------

    /**
     * 转换为 JPEG 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toJPEG}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JPEG 固定）
     * @returns {Promise<Buffer>} JPEG 图片数据 Buffer
     */
    static async toJPEGBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('jpeg', options));
    }

    /**
     * 转换为 PNG 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toPNG}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，PNG 固定）
     * @returns {Promise<Buffer>} PNG 图片数据 Buffer
     */
    static async toPNGBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('png', options));
    }

    /**
     * 转换为 WebP 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toWebP}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，WebP 固定）
     * @returns {Promise<Buffer>} WebP 图片数据 Buffer
     */
    static async toWebPBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('webp', options));
    }

    /**
     * 转换为 AVIF 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toAVIF}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，AVIF 固定）
     * @returns {Promise<Buffer>} AVIF 图片数据 Buffer
     */
    static async toAVIFBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('avif', options));
    }

    /**
     * 转换为 TIFF 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toTIFF}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，TIFF 固定）
     * @returns {Promise<Buffer>} TIFF 图片数据 Buffer
     */
    static async toTIFFBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('tiff', options));
    }

    /**
     * 转换为 GIF 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toGIF}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，GIF 固定）
     * @returns {Promise<Buffer>} GIF 图片数据 Buffer
     */
    static async toGIFBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('gif', options));
    }

    /**
     * 转换为 HEIF 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toHEIF}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，HEIF 固定）
     * @returns {Promise<Buffer>} HEIF 图片数据 Buffer
     */
    static async toHEIFBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('heif', options));
    }

    /**
     * 转换为 JP2 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toJP2}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JP2 固定）
     * @returns {Promise<Buffer>} JP2 图片数据 Buffer
     */
    static async toJP2Buffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('jp2', options));
    }

    /**
     * 转换为 JXL 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toJXL}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，JXL 固定）
     * @returns {Promise<Buffer>} JXL 图片数据 Buffer
     */
    static async toJXLBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('jxl', options));
    }

    /**
     * 转换为 RAW 格式并返回 Buffer。默认编码选项同 {@link ImageConverter.toRAW}。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {FormatConvertOptions} [options] - 转换选项（不含 format，RAW 固定）
     * @returns {Promise<Buffer>} RAW 像素数据 Buffer
     */
    static async toRAWBuffer(source, options = {}) {
        return this.convertToBuffer(source, this.#withDefaultFormatOptions('raw', options));
    }


    // ---------- 辅助方法 ----------

    /**
     * 根据目标文件扩展名自动推断格式并进行转换，编码选项同样合并默认值。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @param {string} target - 输出文件路径（扩展名决定格式）
     * @param {FormatConvertOptions} [options] - 其他转换选项（不含 format，会自动填充）
     * @returns {Promise<Object>} 转换结果对象
     * @throws {Error} 无法从扩展名推断格式、格式不支持或缺少编码器时抛出错误
     * @example
     * await ImageConverter.autoConvert('image.png', 'output.webp', {
     *   resize: { width: 300 },
     *   formatOptions: { quality: 70 },
     *   keepMetadata: true
     * });
     */
    static async autoConvert(source, target, options = {}) {
        if (!target) throw new Error('输出路径不能为空');
        const format = path.extname(target).toLowerCase().replace(/^\./, '');
        if (!format) throw new Error('无法获取文件格式格式');
        return this.convertToFile(source, target, this.#withDefaultFormatOptions(format, options));
    }

    /**
     * 获取输入图片的元数据（尺寸、格式、色彩空间等）。
     *
     * @param {string|Buffer} source - 输入图片路径或 Buffer
     * @returns {Promise<Object>} 图片元数据对象
     * @throws {Error} 获取失败时抛出错误
     */
    static async getMetadata(source) {
        try {
            return await sharp(source).metadata();
        } catch (e) {
            throw new Error(`获取元数据失败: ${e.message}`);
        }
    }

    /**
     * 检查给定的格式是否被当前 sharp 构建真正支持（sharp 认识该格式，且具备编码能力）。
     *
     * @param {string} format - 格式名称或扩展名（如 'jpeg', '.png'）
     * @returns {boolean} 是否支持该格式
     */
    static isSupportFormat(format) {
        try {
            return !!this.#normalizeFormat(format);
        } catch {
            return false;
        }
    }


    /**
     * 列出当前 sharp 构建实际可编码的输出格式
     * 结果同时包含 FORMAT_ALIASES 中的别名（如 jpeg 的 jpg/jfif、tiff 的 tif、heif 的 heic），
     * 别名仅在其对应主格式可编码时纳入，适合直接用于校验用户输入的格式/扩展名字符串。
     *
     * @returns {string[]} 可用格式名与别名的并集（字母序）
     */
    static getSupportedFormats() {
        const encodable = name => sharp.format[name]?.output?.buffer === true;
        const formats = Object.keys(sharp.format).filter(encodable);
        if (encodable('heif')) {
            // AVIF 编码走 HEIF 容器，sharp.format 中无独立键
            formats.push('avif');
        }
        for (const [alias, format] of Object.entries(this.#FORMAT_ALIASES)) {
            if (formats.includes(format)) {
                formats.push(alias);
            }
        }
        return [...new Set(formats)].sort();
    }

    /**
     * 批量转换图片并保存到文件，滚动并发（完成一个立即补位，慢任务不阻塞其他任务）。
     *
     * @param {Array<Object>} tasks - 任务列表，每个任务包含 source, target, options
     * @param {string|Buffer} tasks[].source - 输入图片路径或 Buffer
     * @param {string} tasks[].target - 输出文件路径
     * @param {ConvertOptions} [tasks[].options] - 转换选项（同 {@link ImageConverter.convertToFile} 的 options）
     * @param {number} [concurrency=5] - 并发数
     * @returns {Promise<Object>} 批量结果统计：{ total, succeeded, failed, results, errors }，
     *   results 为 [{ index, source, target, result }]，errors 为 [{ index, source, error }]，
     *   index 为任务在入参数组中的全局索引，均按 index 升序排列
     * @throws {Error} 任务列表为空时抛出错误
     * @example
     * const result = await ImageConverter.batchConvertToFile([
     *   { source: 'a.png', target: 'a.jpg', options: { format: 'jpeg', keepMetadata: true } },
     *   { source: 'b.png', target: 'b.webp', options: { format: 'webp' } }
     * ], 2);
     */
    static async batchConvertToFile(tasks, concurrency = 5) {
        return this.#runBatch(
            tasks,
            task => this.convertToFile(task.source, task.target, task.options || {}),
            concurrency
        );
    }

    /**
     * 批量转换图片并返回 Buffer，滚动并发（完成一个立即补位，慢任务不阻塞其他任务）。
     *
     * @param {Array<Object>} tasks - 任务列表，每个任务包含 source, options
     * @param {string|Buffer} tasks[].source - 输入图片路径或 Buffer
     * @param {ConvertOptions} [tasks[].options] - 转换选项（同 {@link ImageConverter.convertToBuffer} 的 options）
     * @param {number} [concurrency=5] - 并发数
     * @returns {Promise<Object>} 批量结果统计：{ total, succeeded, failed, results, errors }，
     *   results 为 [{ index, source, result(Buffer) }]，errors 为 [{ index, source, error }]，
     *   index 为任务在入参数组中的全局索引，均按 index 升序排列
     * @throws {Error} 任务列表为空时抛出错误
     * @example
     * const result = await ImageConverter.batchConvertToBuffer([
     *   { source: 'a.png', options: { format: 'jpeg', keepMetadata: true } },
     *   { source: 'b.png', options: { format: 'webp' } }
     * ], 2);
     */
    static async batchConvertToBuffer(tasks, concurrency = 5) {
        return this.#runBatch(
            tasks,
            task => this.convertToBuffer(task.source, task.options || {}),
            concurrency
        );
    }


    // ---------- 处理原始像素数据 ----------

    /**
     * 从原始像素数据创建 sharp 处理管道，适用于 node-canvas 的 ImageData 或类似对象。
     * 常用于从 `<canvas>` 获取 `ImageData` 后，直接进行图片编码或进一步处理。
     *
     * @param {Buffer|Uint8Array} raw - 原始像素数据（RGBA 顺序，每通道 0-255）
     * @param {number} width - 图像宽度（像素，正整数）
     * @param {number} height - 图像高度（像素，正整数）
     * @param {number} [channels=4] - 通道数（4 代表 RGBA，3 代表 RGB，2 代表灰度+alpha，1 代表灰度）
     * @param {Object} [rawOptions] - 额外的 raw 选项，如 `{ premultiplied: true }`，详见 sharp 文档
     * @returns {sharp.Sharp} sharp 实例，可继续进行链式处理（如 resize、toFile 等）
     * @throws {Error} 参数无效时抛出错误
     * @example
     * // 从 node-canvas 获取 ImageData
     * const canvas = createCanvas(width, height);
     * const ctx = canvas.getContext('2d');
     * const imageData = ctx.getImageData(0, 0, width, height);
     * // 创建 sharp 管道并直接输出为 JPEG
     * const pipeline = ImageConverter.convertRawToSharp(imageData.data, imageData.width, imageData.height);
     * await pipeline.jpeg({ quality: 90 }).toFile('output.jpg');
     */
    static convertRawToSharp(raw, width, height, channels = 4, rawOptions = {}) {
        if (!raw) throw new Error('像素数据不能为空');
        if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
            throw new Error('宽度和高度必须为正整数');
        }
        if (![1, 2, 3, 4].includes(channels)) throw new Error('通道数必须为 1, 2, 3 或 4');
        // sharp 直接接受 Buffer/Uint8Array（Buffer 是 Uint8Array 的子类），避免不必要的拷贝
        const buffer = raw instanceof Uint8Array ? raw : Buffer.from(raw);
        return sharp(buffer, {
            raw: {width, height, channels, ...rawOptions}
        });
    }

    /**
     * 直接将原始像素数据转换为指定格式并保存到文件。
     *
     * @param {Buffer|Uint8Array} raw - 原始像素数据
     * @param {number} width - 图像宽度
     * @param {number} height - 图像高度
     * @param {string} target - 输出文件路径
     * @param {Object} [options] - 转换选项（与 {@link ConvertOptions} 一致，另含 raw 专属字段）
     * @param {string} options.format - 目标格式（必须指定）
     * @param {number} [options.channels=4] - 通道数
     * @param {Object} [options.rawOptions] - 额外的 raw 选项（同 {@link ImageConverter.convertRawToSharp} 的 rawOptions）
     * @param {ResizeOptions} [options.resize] - 缩放参数
     * @param {TransformOptions} [options.transform] - 变换参数
     * @param {FormatOptions} [options.formatOptions] - 格式专用选项
     * @param {boolean} [options.keepMetadata=false] - 是否保留元数据（原始像素无元数据，仅保持 API 一致性）
     * @returns {Promise<Object>} 转换结果对象（同 {@link ImageConverter.convertToFile} 的返回值）
     * @throws {Error} 参数无效或转换失败时抛出错误
     * @example
     * // 从 canvas 获取 ImageData 并直接保存为 WebP
     * const imageData = ctx.getImageData(0, 0, 800, 600);
     * await ImageConverter.convertRawToFile(
     *   imageData.data,
     *   imageData.width,
     *   imageData.height,
     *   'output.webp',
     *   { format: 'webp', formatOptions: { quality: 80 } }
     * );
     */
    static async convertRawToFile(raw, width, height, target, options = {}) {
        if (!target) throw new Error('输出路径不能为空');
        const {channels = 4, rawOptions = {}} = options;
        const sharpInstance = this.convertRawToSharp(raw, width, height, channels, rawOptions);
        return this.#convertPipeline(sharpInstance, target, options);
    }

    /**
     * 直接将原始像素数据转换为指定格式并返回 Buffer。
     * 与 {@link ImageConverter.convertRawToFile} 类似，但输出为 Buffer。
     *
     * @param {Buffer|Uint8Array} raw - 原始像素数据
     * @param {number} width - 图像宽度
     * @param {number} height - 图像高度
     * @param {Object} [options] - 转换选项（同 {@link ImageConverter.convertRawToFile} 的 options，但无需 target）
     * @param {string} options.format - 目标格式（必须指定）
     * @returns {Promise<Buffer>} 转换后的图片数据 Buffer
     * @throws {Error} 参数无效或转换失败时抛出错误
     */
    static async convertRawToBuffer(raw, width, height, options = {}) {
        const {channels = 4, rawOptions = {}} = options;
        const sharpInstance = this.convertRawToSharp(raw, width, height, channels, rawOptions);
        return this.#convertPipeline(sharpInstance, undefined, options);
    }
}

module.exports = ImageConverter;
