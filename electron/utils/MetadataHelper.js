const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const {exiftool} = require("exiftool-vendored");

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
     * @returns {Promise<Buffer>} 写入元数据后的新 Buffer
     */
    static async write(buffer, metadata = {}, options = {}) {
        if (!Buffer.isBuffer(buffer)) {
            throw new TypeError('MetadataHelper.write 的 buffer 参数必须是 Buffer');
        }
        const format = (options.format || this._sniffFormat(buffer)).toLowerCase();
        switch (format) {
            case 'jpeg':
            case 'jpg':
                return this._writeJpeg(buffer, metadata, options);
            case 'png':
                return this._writePng(buffer, metadata, options);
            case 'webp':
                return this._writeWebp(buffer, metadata, options);
            default:
                throw new Error(`MetadataHelper 暂不支持目标格式: ${format}（仅支持 png / jpeg / webp）`);
        }
    }

    /**
     * 读取原图片元数据并同步写入目标 Buffer（最佳努力：失败时返回原 Buffer 并告警）
     * @param {string} filePath - 原图片文件路径
     * @param {Buffer} buffer - 目标图片 Buffer
     * @param {Object} [options] - 同 write()
     * @returns {Promise<Buffer>}
     */
    static async syncToBuffer(filePath, buffer, options = {}) {
        try {
            const metadata = await this.read(filePath);
            if (!metadata.hasMetadata) {
                return buffer;
            }
            return await this.write(buffer, metadata, options);
        } catch (error) {
            console.warn(`[MetadataHelper] 同步元数据失败，已跳过: ${error.message}`);
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
     * @param {Object} [options] - 同 write()
     * @returns {Promise<Buffer|null>} 注入元数据后的新 Buffer；目标文件不存在、
     *   源文件无元数据或同步失败时返回 null
     */
    static async syncToFile(sourcePath, targetPath, options = {}) {

        let metadata, targetBuffer, outBuffer;

        try {
            metadata = await this.read(sourcePath);
        } catch (error) {
            console.warn(`[MetadataHelper] 读取源文件元数据失败，已跳过: ${error.message}`);
            return null;
        }

        if (!metadata.hasMetadata) {
            return null;
        }

        try {
            targetBuffer = await fs.readFile(targetPath);
        } catch (error) {
            console.warn(`[MetadataHelper] 读取目标文件失败，已跳过: ${error.message}`);
            return null;
        }

        try {
            outBuffer = await this.write(targetBuffer, metadata, options);
        } catch (error) {
            console.warn(`[MetadataHelper] 同步元数据失败，已跳过: ${error.message}`);
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
            console.warn(`[MetadataHelper] 写入目标文件失败，已跳过: ${error.message}`);
            return null;
        }
        return outBuffer;
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
        throw new Error(`MetadataHelper 无法识别的图片格式`);
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
            console.warn(`[MetadataHelper] jpeg APP 段过大(>64KB)，已跳过 ${signature.slice(0, 16)} 段写入`);
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
     * 避免 piexif 等库重写时丢失未知标签/厂商注释）
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
