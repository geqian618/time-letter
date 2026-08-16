const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {exiftool} = require('exiftool-vendored');

/**
 * 图片元数据同步工具类
 *
 */
class MetadataHelper {

    /* ============================ 公共 API ============================ */

    /**
     * 从图片 Buffer 读取 EXIF 元数据
     * @param {Buffer} buffer - 图片数据 Buffer
     * @returns {Promise<Object>} exiftool 标签对象
     */
    static async readExifFromBuffer(buffer) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('readExifFromBuffer 参数必须是 Buffer');
        }
        let tempPath = null;
        try {
            // 生成临时文件路径
            tempPath = path.join(
                os.tmpdir(),
                `temp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.img`
            );

            await fs.writeFile(tempPath, buffer);

            // 读取元数据
            const tags = await exiftool.read(tempPath);
            if (tags.errors && tags.errors.length > 0) {
                console.warn('元数据解析警告:', tags.errors);
            }
            return tags;
        } finally {
            // 无论成功或失败，都清理临时文件
            if (tempPath) {
                await fs.unlink(tempPath).catch(() => {
                    // 忽略删除失败（如文件已被删除）
                });
            }
        }
    }

    /**
     * 从图片文件路径读取 EXIF 元数据
     * @param {string} filePath - 图片文件路径
     * @returns {Promise<Object>} exiftool 标签对象
     */
    static async readExifFromFile(filePath) {

        if (typeof filePath !== 'string') {
            throw new TypeError('readExifFromFile 参数必须是字符串路径');
        }
        // 检查文件是否存在且可读
        try {
            await fs.access(filePath);
        } catch (error) {
            throw new Error(`读取元数据失败，文件[${filePath}]不存在或不可读`);
        }
        // 直接读取元数据
        const tags = await exiftool.read(filePath);
        if (tags.errors && tags.errors.length > 0) {
            console.warn('元数据解析警告:', tags.errors);
        }
        return tags;
    }


    /**
     * 读取图片元数据
     * @param {string|Buffer} source - 图片文件路径或图片 Buffer
     * @returns {Promise<Object>} 元数据对象：
     *   {
     *     format, width, height, orientation, density,   // 基本属性
     *     exif: Buffer|null,   // 原始 EXIF 字节（jpeg/webp 含 "Exif\0\0" 前缀，png 不含）
     *     iptc: Buffer|null,   // 原始 IPTC 字节（jpeg 含 "Photoshop 3.0\0" 前缀）
     *     xmp: Buffer|null,    // XMP 数据包（不含容器头）
     *     icc: Buffer|null,    // ICC 色彩配置文件
     *     hasMetadata: boolean
     *   }
     */
    static async read(source) {
        const raw = await sharp(source).metadata();
        return {
            format: raw.format,
            width: raw.width,
            height: raw.height,
            orientation: raw.orientation || 1,
            density: raw.density || null,
            exif: raw.exif || null,
            iptc: raw.iptc || null,
            xmp: raw.xmp || null,
            icc: raw.icc || null,
            hasMetadata: !!(raw.exif || raw.iptc || raw.xmp)
        };
    }


    /**
     * 将元数据写入图片 Buffer（容器级写入，不重新编码像素）
     * @param {Buffer} buffer - 目标图片 Buffer（png / jpeg / webp）
     * @param {Object} metadata - 元数据对象（read() 的返回值或其子集）
     * @param {Object} [options]
     * @param {string} [options.format] - 目标格式 png|jpeg|webp，缺省时按 Buffer 头自动识别
     * @param {boolean} [options.normalizeOrientation=true] - 是否将 EXIF Orientation 归一化为 1
     * @param {boolean} [options.translateToXmp=true] - Photoshop 方式：源无 XMP 时，
     *   将 EXIF 翻译为标准 XMP 包双写（tiff:/exif:/xmp:/dc: 命名空间），使 Windows
     *   属性面板及各平台工具能读取 PNG/WebP 中的相机、时间、GPS 等信息
     * @param {boolean} [options.regenerateXmp=false] - 为 true 时忽略源图自带 XMP，
     *   始终用 EXIF 重新生成干净 XMP。实测 Lightroom 等软件写出的超大 XMP 包
     *   会导致 Windows WIC 解析 PNG 时字段大面积丢失，干净小包反而全部可读
     * @returns {Promise<Buffer>} 写入元数据后的新 Buffer
     */
    static async write(buffer, metadata = {}, options = {}) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('write 的 buffer 参数必须是 Buffer');
        }
        const format = (options.format || this._sniffFormat(buffer)).toLowerCase();
        // Photoshop 方式：EXIF → XMP 翻译（默认开启；regenerateXmp 时丢弃源 XMP 用干净包）
        if (options.translateToXmp !== false && metadata && metadata.exif && (options.regenerateXmp || !metadata.xmp)) {
            const generated = this._generateXmp(metadata, format);
            if (generated) {
                metadata = {...metadata, xmp: Buffer.from(generated, 'utf8')};
            }
        }
        switch (format) {
            case 'jpeg':
            case 'jpg':
                return this._writeJpeg(buffer, metadata, options);
            case 'png':
                return this._writePng(buffer, metadata, options);
            case 'webp':
                return this._writeWebp(buffer, metadata, options);
            default:
                throw new Error(`暂不支持目标格式: ${format}（仅支持 png / jpeg / webp）`);
        }
    }

    /**
     * 读取原图片元数据并同步写入目标 Buffer（最佳努力：失败时返回原 Buffer 并告警）
     *
     * 默认使用 exiftool 写入（Photoshop 同源、Windows 兼容性最好的方式）：将目标
     * Buffer 落临时文件，用 `exiftool -TagsFromFile 源 -All:All` 复制全部元数据
     * （exiftool 会自动按目标格式写 eXIf/iTXt/XMP 块），再读回。
     *
     * @param {string} filePath - 原图片文件路径
     * @param {Buffer} buffer - 目标图片 Buffer
     * @param {Object} [options] - 同 write()；useExiftool 默认 true
     * @returns {Promise<Buffer>}
     */
    static async syncToBuffer(filePath, buffer, options = {}) {
        try {
            if (options.useExiftool !== false) {
                return await this._syncBufferWithExiftool(filePath, buffer, options);
            }
            const metadata = await this.read(filePath);
            if (!metadata.hasMetadata) {
                return buffer;
            }
            return await this.write(buffer, metadata, options);
        } catch (error) {
            console.warn(`同步元数据失败，已跳过: ${error.message}`);
            return buffer;
        }
    }

    /**
     * 将原图片元数据同步写入目标图片文件（文件 → 文件）
     *
     * 读取 sourcePath 的元数据，注入到 targetPath 图片中（png / jpeg / webp）。
     * 写入采用【临时文件 + 原子重命名】方式，避免写坏目标文件：
     * 先在同目录写临时文件，再 rename 覆盖目标文件（同一卷内原子操作）。
     * 最佳努力：任何一步失败都保持目标文件不变、不抛出异常，返回 null。
     *
     * @param {string} sourcePath - 原图片文件路径（元数据来源）
     * @param {string} targetPath - 目标图片文件路径（将注入元数据，需已存在）
     * @param {Object} [options] - 同 write()；useExiftool 默认 true（exiftool 写入）
     * @returns {Promise<Buffer|null>} 注入元数据后的新 Buffer；目标文件不存在、
     *   源文件无元数据或同步失败时返回 null
     */
    static async syncToFile(sourcePath, targetPath, options = {}) {

        let targetBuffer, outBuffer;

        try {
            targetBuffer = await fs.readFile(targetPath);
        } catch (error) {
            console.warn(`读取目标文件失败，已跳过: ${error.message}`);
            return null;
        }

        try {
            if (options.useExiftool !== false) {
                outBuffer = await this._syncBufferWithExiftool(sourcePath, targetBuffer, options);
            } else {
                const metadata = await this.read(sourcePath);
                if (!metadata.hasMetadata) {
                    return null;
                }
                outBuffer = await this.write(targetBuffer, metadata, options);
            }
        } catch (error) {
            console.warn(`同步元数据失败，已跳过: ${error.message}`);
            return null;
        }

        // 同目录临时文件 + 原子重命名，避免写入中断导致目标文件损坏
        const tmpPath = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${Date.now()}.meta-tmp`);

        try {
            await fs.writeFile(tmpPath, outBuffer);
            await fs.rename(tmpPath, targetPath);
        } catch (error) {
            await fs.unlink(tmpPath).catch(() => {
            });
            console.warn(`写入目标文件失败，已跳过: ${error.message}`);
            return null;
        }
        return outBuffer;
    }

    /**
     * 用 exiftool 将源文件全部元数据复制到目标 Buffer（Photoshop 同源方式）
     *
     * `exiftool -TagsFromFile 源 -All:All -Orientation=1 目标`：
     * exiftool 会按目标格式自动写入规范容器（png→eXIf + iTXt XMP、jpeg→APP1、
     * webp→EXIF/XMP chunk），其 XMP 序列化与 Photoshop（Adobe XMP Core）同源，
     * 是各平台（含 Windows WIC）兼容性最好的写入方式。
     *
     * @param {string} sourcePath - 原图片文件路径（元数据来源）
     * @param {Buffer} targetBuffer - 目标图片 Buffer
     * @param {Object} [options] - 需含 format 或自动识别
     * @returns {Promise<Buffer>} 写入元数据后的新 Buffer
     */
    static async _syncBufferWithExiftool(sourcePath, targetBuffer, options = {}) {
        const format = (options.format || this._sniffFormat(targetBuffer)).toLowerCase();
        const ext = format === 'jpeg' || format === 'jpg' ? 'jpg' : format;
        const tmpPath = path.join(os.tmpdir(), `meta-sync-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
        try {
            await fs.writeFile(tmpPath, targetBuffer);
            // -All:All 复制全部元数据（File 组除外）；-n -Orientation=1 以原始数值
            // 模式归一化方向（不带 -n 时 "1" 会走 PrintConv 转换写成错误值）；
            // -overwrite_original 原地覆盖临时文件
            await exiftool.write(tmpPath, {}, {
                writeArgs: ['-TagsFromFile', sourcePath, '-All:All', '-n', '-Orientation=1', '-overwrite_original']
            });
            return await fs.readFile(tmpPath);
        } finally {
            await fs.unlink(tmpPath).catch(() => {
            });
        }
    }

    /* ============================ 格式识别 ============================ */

    static _sniffFormat(buffer) {
        if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return 'jpeg';
        }
        if (buffer.length >= 8 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
            return 'png';
        }
        if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
            return 'webp';
        }
        throw new Error(`无法识别的图片格式`);
    }


    /* ============================ JPEG 写入 ============================ */

    static _writeJpeg(buffer, metadata, options) {
        let out = buffer;
        const exif = this._prepareExif(metadata, options);
        if (exif) {
            out = this._setJpegApp(out, 0xE1, 'Exif\x00\x00', exif);
        }
        if (metadata.xmp && metadata.xmp.length) {
            const payload = Buffer.concat([
                Buffer.from('http://ns.adobe.com/xap/1.0/\x00', 'binary'),
                Buffer.from(metadata.xmp)
            ]);
            out = this._setJpegApp(out, 0xE1, 'http://ns.adobe.com/xap/1.0/\x00', payload);
        }
        if (metadata.iptc && metadata.iptc.length) {
            let iptc = Buffer.from(metadata.iptc);
            if (!iptc.toString('latin1', 0, Math.min(14, iptc.length)).startsWith('Photoshop 3.0\x00')) {
                iptc = Buffer.concat([Buffer.from('Photoshop 3.0\x00', 'binary'), iptc]);
            }
            out = this._setJpegApp(out, 0xED, 'Photoshop 3.0\x00', iptc);
        }
        return out;
    }

    /**
     * 设置/替换 jpeg 中的 APP 段
     * @param {Buffer} jpeg - jpeg Buffer
     * @param {number} marker - 段标记（0xE1 APP1 / 0xED APP13）
     * @param {string} signature - 段负载签名（用于识别并移除旧段）
     * @param {Buffer} payload - 完整段负载（含签名头）
     */
    static _setJpegApp(jpeg, marker, signature, payload) {
        if (payload.length > 65533) {
            console.warn(`jpeg APP 段过大(>64KB)，已跳过 ${signature.slice(0, 16)} 段写入`);
            return jpeg;
        }
        const segments = [];
        let offset = 2;
        // 解析 jpeg 段（SOI 之后，SOS 之前）
        while (offset + 4 <= jpeg.length) {
            if (jpeg[offset] !== 0xFF) {
                throw new Error('MetadataHelper: 无效的 jpeg 数据');
            }
            const mark = jpeg[offset + 1];
            if (mark === 0xDA) { // SOS，图像数据开始
                segments.push({offset, raw: jpeg.subarray(offset)});
                break;
            }
            if (mark === 0xD9) { // EOI
                segments.push({offset, raw: jpeg.subarray(offset)});
                break;
            }
            const length = jpeg.readUInt16BE(offset + 2);
            const segRaw = jpeg.subarray(offset, offset + 2 + length);
            const isTarget = mark === marker &&
                segRaw.length >= 4 + signature.length &&
                segRaw.toString('latin1', 4, 4 + signature.length) === signature;
            if (!isTarget) {
                segments.push({offset, raw: segRaw});
            }
            offset += 2 + length;
        }
        if (offset < jpeg.length && (segments.length === 0 || segments[segments.length - 1].offset !== offset)) {
            segments.push({offset, raw: jpeg.subarray(offset)});
        }

        // 构造新 APP 段：FF marker + 长度(2字节) + 负载
        const app = Buffer.alloc(4 + payload.length);
        app[0] = 0xFF;
        app[1] = marker;
        app.writeUInt16BE(2 + payload.length, 2);
        payload.copy(app, 4);

        // 新段插入到 SOI 之后（第一个段之前）
        const parts = [jpeg.subarray(0, 2), app];
        for (const seg of segments) {
            parts.push(seg.raw);
        }
        return Buffer.concat(parts);
    }

    /* ============================ PNG 写入 ============================ */

    static _writePng(buffer, metadata, options) {
        const chunks = this._parsePngChunks(buffer);

        // 移除将被替换的旧元数据块
        const kept = chunks.filter((chunk) => {
            if (metadata.exif && chunk.type === 'eXIf') return false;
            return !(metadata.xmp && ['iTXt', 'tEXt', 'zTXt'].includes(chunk.type) && this._pngChunkHasKeyword(chunk, 'XML:com.adobe.xmp'));

        });

        // 构造待插入的元数据块（插在 IHDR 之后、IDAT 之前）
        const inserts = [];
        const exif = this._prepareExif(metadata, options);
        if (exif) {
            // png eXIf 负载为 TIFF 数据（不含 "Exif\0\0" 前缀）
            inserts.push({type: 'eXIf', data: this._stripExifPrefix(exif)});
        }
        if (metadata.xmp && metadata.xmp.length) {
            inserts.push({type: 'iTXt', data: this._buildPngItxt('XML:com.adobe.xmp', Buffer.from(metadata.xmp))});
        }

        const ihdrIndex = kept.findIndex(c => c.type === 'IHDR');
        const ordered = ihdrIndex >= 0
            ? [...kept.slice(0, ihdrIndex + 1), ...inserts, ...kept.slice(ihdrIndex + 1)]
            : [...inserts, ...kept];

        return this._buildPng(buffer.subarray(0, 8), ordered);
    }


    static _parsePngChunks(buffer) {
        if (buffer.length < 8 || buffer.toString('ascii', 1, 4) !== 'PNG') {
            throw new Error('MetadataHelper: 无效的 png 数据');
        }
        const chunks = [];
        let offset = 8;
        while (offset + 12 <= buffer.length) {
            const length = buffer.readUInt32BE(offset);
            const type = buffer.toString('ascii', offset + 4, offset + 8);
            const data = buffer.subarray(offset + 8, offset + 8 + length);
            chunks.push({type, data});
            offset += 12 + length;
            if (type === 'IEND') break;
        }
        return chunks;
    }


    static _buildPng(signature, chunks) {
        const parts = [signature];
        for (const chunk of chunks) {
            const typeBuf = Buffer.from(chunk.type, 'ascii');
            const len = Buffer.alloc(4);
            len.writeUInt32BE(chunk.data.length);
            const crc = Buffer.alloc(4);
            crc.writeUInt32BE(this._crc32(Buffer.concat([typeBuf, chunk.data])));
            parts.push(len, typeBuf, chunk.data, crc);
        }
        return Buffer.concat(parts);
    }


    static _pngChunkHasKeyword(chunk, keyword) {
        const data = chunk.data;
        const end = data.indexOf(0);
        if (end < 0) return false;
        return data.toString('latin1', 0, end) === keyword;
    }

    /**
     * 构造 PNG iTXt 块数据：keyword\0 + 压缩标志(0) + 压缩方法(0) + 语言\0 + 译文关键词\0 + 文本
     * 采用 iTXt（UTF-8）承载 XMP：XMP 包含 UTF-8 BOM 字符，需 UTF-8 语义的块类型
     */
    static _buildPngItxt(keyword, text) {
        return Buffer.concat([
            Buffer.from(keyword, 'latin1'),
            Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]), // \0 + 压缩标志 0 + 压缩方法 0 + 语言 \0 + 译文关键词 \0
            text
        ]);
    }

    /* ============================ WebP 写入 ============================ */

    static _writeWebp(buffer, metadata, options) {
        if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
            throw new Error('MetadataHelper: 无效的 webp 数据');
        }
        const {chunks, imageIndex} = this._parseWebpChunks(buffer);
        if (imageIndex < 0) {
            throw new Error('MetadataHelper: webp 数据中未找到图像块(VP8/VP8L)');
        }
        const image = chunks[imageIndex];

        // 1. 移除旧的 EXIF/XMP 块
        const kept = chunks.filter(c => !(c.type === 'EXIF' || c.type === 'XMP '));

        // 2. 构建/更新 VP8X（设置 EXIF/XMP/ALPHA 标志位，兼容 libvips 约定）
        const oldVp8x = kept.find(c => c.type === 'VP8X');
        const dims = this._parseWebpDims(image);
        let flags = oldVp8x ? oldVp8x.data[0] : 0;
        if (metadata.exif) flags |= 0x08; // libvips: EXIF
        if (metadata.xmp && metadata.xmp.length) flags |= 0x04; // libvips: XMP
        if (image.type === 'VP8L' || kept.some(c => c.type === 'ALPH')) flags |= 0x10; // libvips: ALPHA
        const vp8xData = Buffer.alloc(10);
        vp8xData[0] = flags;
        if (oldVp8x) {
            oldVp8x.data.copy(vp8xData, 1, 1, 10);
        } else {
            vp8xData.writeUIntLE(dims.width - 1, 4, 3);
            vp8xData.writeUIntLE(dims.height - 1, 7, 3);
        }
        const vp8xChunk = {type: 'VP8X', data: vp8xData};

        // 3. 构造 EXIF / XMP 块
        const inserts = [];
        const exif = this._prepareExif(metadata, options);
        if (exif) {
            inserts.push({type: 'EXIF', data: this._ensureExifPrefix(exif)});
        }
        if (metadata.xmp && metadata.xmp.length) {
            inserts.push({type: 'XMP ', data: Buffer.from(metadata.xmp)});
        }

        // 4. 重排：VP8X + (ICCP/ALPH 等原块) + EXIF/XMP + 图像块（EXIF/XMP 须在图像数据之前）
        const parts = [];
        for (const chunk of kept) {
            if (chunk.type === 'VP8X') continue; // 已被新 VP8X 替换
            parts.push(chunk);
        }
        const imageChunk = parts.splice(parts.indexOf(image), 1)[0];
        const rebuilt = [vp8xChunk, ...parts, ...inserts, imageChunk];

        return this._buildWebp(rebuilt, buffer.subarray(0, 12));
    }

    static _parseWebpChunks(buffer) {
        const chunks = [];
        let imageIndex = -1;
        let offset = 12;
        while (offset + 8 <= buffer.length) {
            const type = buffer.toString('ascii', offset, offset + 4);
            const size = buffer.readUInt32LE(offset + 4);
            const data = buffer.subarray(offset + 8, offset + 8 + size);
            chunks.push({type, data, offset});
            if (type === 'VP8 ' || type === 'VP8L') {
                imageIndex = chunks.length - 1;
                break; // 图像块之后的数据（如 libvips 追加的 EXIF）忽略，交由重建处理
            }
            offset += 8 + size + (size & 1);
        }
        return {chunks, imageIndex};
    }

    static _buildWebp(chunks, header) {
        const parts = [header];
        for (const chunk of chunks) {
            const size = chunk.data.length;
            const chunkBuf = Buffer.alloc(8 + size + (size & 1)); // RIFF 块按偶数字节对齐
            chunkBuf.write(chunk.type, 0, 'ascii');
            chunkBuf.writeUInt32LE(size, 4);
            chunk.data.copy(chunkBuf, 8);
            parts.push(chunkBuf);
        }
        const out = Buffer.concat(parts);
        out.writeUInt32LE(out.length - 8, 4); // RIFF 大小 = 文件长度 - 8
        return out;
    }

    /** 解析 VP8/VP8L 图像块的画布尺寸 */
    static _parseWebpDims(image) {
        const d = image.data;
        if (image.type === 'VP8 ' && d.length >= 10) {
            return {
                width: (d[6] | (d[7] << 8)) & 0x3FFF,
                height: (d[8] | (d[9] << 8)) & 0x3FFF
            };
        }
        if (image.type === 'VP8L' && d.length >= 5) {
            const v = d.readUInt32LE(1);
            return {width: 1 + (v & 0x3FFF), height: 1 + ((v >> 14) & 0x3FFF)};
        }
        return null;
    }

    /* ============================ EXIF 预处理 ============================ */

    /**
     * 预处理 EXIF 字节：按需将 Orientation 归一化为 1
     * @returns {Buffer|null} 处理后的 EXIF（含/不含前缀保持原样）
     */
    static _prepareExif(metadata, options) {
        if (!metadata.exif) return null;
        let exif = Buffer.from(metadata.exif);
        if (options.normalizeOrientation !== false && metadata.orientation && metadata.orientation !== 1) {
            exif = this._normalizeOrientation(exif);
        }
        return exif;
    }

    /**
     * 将 EXIF 中的 Orientation 标签改写为 1（无损字节级修补，不重新序列化，
     * 避免重写时丢失未知标签/厂商注释）
     */
    static _normalizeOrientation(exif) {
        const tiff = this._stripExifPrefix(exif);
        if (tiff.length < 8) return exif;
        const little = tiff.toString('latin1', 0, 2) === 'II';
        const big = tiff.toString('latin1', 0, 2) === 'MM';
        if (!little && !big) return exif;
        const readU16 = (buf, o) => little ? buf.readUInt16LE(o) : buf.readUInt16BE(o);
        const writeU16 = (buf, o, v) => little ? buf.writeUInt16LE(v, o) : buf.writeUInt16BE(v, o);
        const readU32 = (buf, o) => little ? buf.readUInt32LE(o) : buf.readUInt32BE(o);

        const ifd0Offset = readU32(tiff, 4);
        if (ifd0Offset < 8 || ifd0Offset + 2 > tiff.length) return exif;
        const count = readU16(tiff, ifd0Offset);
        const entriesStart = ifd0Offset + 2;
        if (entriesStart + count * 12 > tiff.length) return exif;

        for (let i = 0; i < count; i++) {
            const entry = entriesStart + i * 12;
            const tag = readU16(tiff, entry);
            if (tag !== 0x0112) continue; // Orientation
            const type = readU16(tiff, entry + 2);
            const valueCount = readU32(tiff, entry + 4);
            if (valueCount !== 1) return exif;
            // tiff 为 exif 的视图（subarray），对副本的同一位置写入即可
            const copy = Buffer.from(exif);
            const target = this._stripExifPrefix(copy);
            if (type === 3) { // SHORT
                writeU16(target, entry + 8, 1);
            } else if (type === 4) { // LONG
                little ? target.writeUInt32LE(1, entry + 8) : target.writeUInt32BE(1, entry + 8);
            } else {
                return exif;
            }
            return copy;
        }
        return exif;
    }

    static _hasExifPrefix(buf) {
        return buf.length >= 6 && buf.toString('latin1', 0, 6) === 'Exif\x00\x00';
    }

    static _ensureExifPrefix(buf) {
        return this._hasExifPrefix(buf) ? buf : Buffer.concat([Buffer.from('Exif\x00\x00', 'binary'), buf]);
    }

    static _stripExifPrefix(buf) {
        return this._hasExifPrefix(buf) ? buf.subarray(6) : buf;
    }

    /* ============================ EXIF → XMP（Photoshop 方式） ============================ */

    /**
     * 纯字节级 EXIF 标签解析（替代 piexifjs，不依赖任何库）
     *
     * 解析 0th / Exif / GPS 三个 IFD 中的标签，供 EXIF→XMP 翻译使用。
     * 兼容大小端（II/MM）、"Exif\0\0" 前缀有无（png eXIf 无前缀）。
     * 值形态与 piexif.load 一致：
     *   - ASCII → string；SHORT/LONG → number（多值 → 数组）
     *   - RATIONAL → [分子, 分母]（多值 → 数组）；UNDEFINED/BYTE → Buffer
     *
     * @param {Buffer} exif - 原始 EXIF 字节
     * @returns {Object|null} { 0th: {tag: value}, Exif: {...}, GPS: {...} }；解析失败返回 null
     */
    static _parseExif(exif) {
        if (!Buffer.isBuffer(exif)) return null;
        const tiff = this._stripExifPrefix(exif);
        if (tiff.length < 8) return null;
        const little = tiff.toString('latin1', 0, 2) === 'II';
        const big = tiff.toString('latin1', 0, 2) === 'MM';
        if (!little && !big) return null;

        const u16 = (o) => little ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o);
        const u32 = (o) => little ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o);
        const i32 = (o) => little ? tiff.readInt32LE(o) : tiff.readInt32BE(o);

        // 读取一个 IFD 条目的值；valueField 为条目内 4 字节值区偏移
        const readValue = (type, count, valueField) => {
            const byteSize = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8}[type];
            if (!byteSize) return null;
            const total = byteSize * count;
            let dataOffset = valueField;
            if (total > 4) { // 超过内联容量，值区存的是数据偏移
                dataOffset = u32(valueField);
                if (dataOffset + total > tiff.length) return null;
            }
            switch (type) {
                case 2: { // ASCII
                    let end = dataOffset + count;
                    while (end > dataOffset && tiff[end - 1] === 0) end--; // 去尾部 \0
                    return tiff.toString('latin1', dataOffset, end);
                }
                case 1:
                case 7: // BYTE / UNDEFINED
                    return Buffer.from(tiff.subarray(dataOffset, dataOffset + total));
                case 3: { // SHORT
                    const values = [];
                    for (let i = 0; i < count; i++) values.push(u16(dataOffset + i * 2));
                    return count === 1 ? values[0] : values;
                }
                case 4: { // LONG
                    const values = [];
                    for (let i = 0; i < count; i++) values.push(u32(dataOffset + i * 4));
                    return count === 1 ? values[0] : values;
                }
                case 9: { // SLONG
                    const values = [];
                    for (let i = 0; i < count; i++) values.push(i32(dataOffset + i * 4));
                    return count === 1 ? values[0] : values;
                }
                case 5: { // RATIONAL
                    const values = [];
                    for (let i = 0; i < count; i++) values.push([u32(dataOffset + i * 8), u32(dataOffset + i * 8 + 4)]);
                    return count === 1 ? values[0] : values;
                }
                case 10: { // SRATIONAL
                    const values = [];
                    for (let i = 0; i < count; i++) values.push([i32(dataOffset + i * 8), i32(dataOffset + i * 8 + 4)]);
                    return count === 1 ? values[0] : values;
                }
                default:
                    return null;
            }
        };

        const readIfd = (offset) => {
            if (offset < 8 || offset + 2 > tiff.length) return {};
            const count = u16(offset);
            const entriesStart = offset + 2;
            if (entriesStart + count * 12 > tiff.length) return {};
            const dict = {};
            for (let i = 0; i < count; i++) {
                const entry = entriesStart + i * 12;
                dict[u16(entry)] = readValue(u16(entry + 2), u32(entry + 4), entry + 8);
            }
            return dict;
        };

        const ifd0 = readIfd(u32(4));
        const result = {'0th': ifd0, Exif: {}, GPS: {}};
        if (ifd0[34665]) result.Exif = readIfd(ifd0[34665]); // Exif IFD 指针
        if (ifd0[34853]) result.GPS = readIfd(ifd0[34853]);  // GPS IFD 指针
        return result;
    }

    /**
     * 将 EXIF 翻译为标准 XMP 包（Photoshop / MWG 做法）
     *
     * 源图只有 EXIF 没有 XMP 时，生成 tiff:/exif:/xmp:/dc: 命名空间的标准 XMP，
     * 与原 EXIF 字节双写。Windows WIC 对 PNG(tEXt)/WebP(XMP chunk) 的属性映射
     * 主要依赖 XMP，因此这是让 Windows 图片属性显示相机/时间/GPS 的关键；
     * macOS ImageIO 与 Linux 工具同样按标准解析。
     *
     * @param {Object} metadata - read() 的返回值（需含 exif 原始字节）
     * @param {string} [format] - 目标格式 jpeg|png|webp，用于 dc:format
     * @returns {string|null} XMP 包文本；无 EXIF 或解析失败时返回 null
     */
    static _generateXmp(metadata, format = '') {
        if (!metadata || !metadata.exif) return null;
        const parsed = this._parseExif(metadata.exif);
        if (!parsed) {
            console.warn(`[MetadataHelper] EXIF 转 XMP 失败，已跳过: EXIF 无法解析`);
            return null;
        }
        const o = parsed['0th'] || {};
        const e = parsed['Exif'] || {};
        const g = parsed['GPS'] || {};

        const fields = [];
        const push = (ns, name, value) => {
            if (value !== null && value !== undefined && value !== '') {
                fields.push(`   <${ns}:${name}>${this._escapeXml(value)}</${ns}:${name}>`);
            }
        };

        // 基础信息（0th IFD）
        push('tiff', 'Make', o[271]);
        push('tiff', 'Model', o[272]);
        push('tiff', 'Orientation', 1);
        push('tiff', 'XResolution', this._toRational(o[282]));
        push('tiff', 'YResolution', this._toRational(o[283]));
        push('xmp', 'CreatorTool', o[305]);
        push('xmp', 'ModifyDate', this._toIso8601(o[306]));

        // 拍摄信息（Exif IFD）
        push('exif', 'DateTimeOriginal', this._toIso8601(e[36867]));
        push('xmp', 'CreateDate', this._toIso8601(e[36868]));
        push('exif', 'ExposureTime', this._toRational(e[33434]));
        push('exif', 'FNumber', this._toRational(e[33437]));
        push('exif', 'ISOSpeedRatings', e[34855]);
        push('exif', 'FocalLength', this._toRational(e[37386]));
        push('exif', 'LensModel', e[42036]);
        // Windows WIC 的"镜头型号"从 aux:Lens 读取（Lightroom 同款写法）
        push('aux', 'Lens', e[42036]);
        push('exif', 'Flash', e[37385]);
        push('exif', 'WhiteBalance', e[41987]);
        push('exif', 'ColorSpace', e[40961]);

        // GPS：十进制度数 + 方向字母（如 31.236667N）
        const lat = this._toDecimalDegrees(g[2], g[1]);
        const lng = this._toDecimalDegrees(g[4], g[3]);
        if (lat !== null) push('exif', 'GPSLatitude', Math.abs(lat).toFixed(6) + (g[1] || (lat < 0 ? 'S' : 'N')));
        if (lng !== null) push('exif', 'GPSLongitude', Math.abs(lng).toFixed(6) + (g[3] || (lng < 0 ? 'W' : 'E')));
        push('exif', 'GPSAltitude', this._toRational(g[6]));

        const mime = format ? `image/${format === 'jpg' ? 'jpeg' : format}` : 'image';
        return `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
                    <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="MetadataHelper">
                     <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                      <rdf:Description rdf:about=""
                        xmlns:tiff="http://ns.adobe.com/tiff/1.0/"
                        xmlns:exif="http://ns.adobe.com/exif/1.0/"
                        xmlns:aux="http://ns.adobe.com/exif/1.0/aux/"
                        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
                        xmlns:dc="http://purl.org/dc/elements/1.1/">
                        ${fields.join('\n')}
                       <dc:format>${mime}</dc:format>
                      </rdf:Description>
                     </rdf:RDF>
                    </x:xmpmeta>
                    <?xpacket end="w"?>`;
    }

    /** EXIF 日期 "2024:05:01 12:34:56" → XMP ISO8601 "2024-05-01T12:34:56" */
    static _toIso8601(value) {
        if (typeof value !== 'string') return value;
        const m = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
        return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : value;
    }

    /** EXIF 有理数 → XMP 有理数文本。始终输出 num/den 形式（如 [8,1]→"8/1"、
     *  [1,250]→"1/250"）：实测 Windows WIC 的 XMP 有理数解析对裸整数兼容性差
     *  （如 "180" 无法解析为焦距，而 "1800/10" 可以） */
    static _toRational(value) {
        if (value === null || value === undefined) return value;
        if (typeof value === 'number' || typeof value === 'string') return value;
        if (Array.isArray(value)) {
            let pair = Array.isArray(value[0]) ? value[0] : value; // 多值取第一个
            if (typeof pair[0] === 'number' && typeof pair[1] === 'number') {
                return `${pair[0]}/${pair[1]}`;
            }
            return String(pair[0]);
        }
        return value;
    }

    /** GPS 度分秒/方向 → 十进制度数（S/W 为负）；解析失败返回 null */
    static _toDecimalDegrees(value, ref) {
        if (!Array.isArray(value) || value.length < 2) return null;
        const norm = value.map(pair => {
            if (Array.isArray(pair) && typeof pair[0] === 'number' && typeof pair[1] === 'number' && pair[1] !== 0) {
                return pair[0] / pair[1];
            }
            return Number(pair) || 0;
        });
        const [d = 0, m = 0, s = 0] = norm;
        let decimal = d + m / 60 + s / 3600;
        if (ref === 'S' || ref === 'W') decimal = -decimal;
        return Number.isFinite(decimal) ? decimal : null;
    }

    /** XML 特殊字符转义 */
    static _escapeXml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /* ============================ 工具 ============================ */

    /** PNG CRC32（IEEE 802.3） */
    static _crc32(buf) {
        let table = this._crc32.table;
        if (!table) {
            table = this._crc32.table = new Int32Array(256);
            for (let n = 0; n < 256; n++) {
                let c = n;
                for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
                table[n] = c;
            }
        }
        let c = -1;
        for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ -1) >>> 0;
    }


    /**
     * 关闭 exiftool 进程（程序退出前调用）
     * @returns {Promise<void>}
     */
    static async close() {
        await exiftool.end();
    }
}

module.exports = MetadataHelper
