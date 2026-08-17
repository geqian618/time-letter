'use strict';

/**
 * ImageMetadataHelper —— 图片元数据同步工具（参考 Photoshop / Lightroom 的导出行为）
 *
 * 解决的问题：
 *   图片绘制到 <canvas> 后再导出（toBlob / toDataURL），浏览器只保留像素数据，
 *   EXIF / XMP / ICC / IPTC 等元数据会全部丢失。
 *   本工具把「原图的元数据」重新注入到 canvas 导出的图片上，并且支持
 *   jpeg / png / webp 三种格式之间的元数据互相迁移（原图与导出图格式可以不同）。
 *
 * 元数据存放位置（与 Photoshop / Lightroom 写文件的方式一致）：
 *   EXIF : JPEG APP1(Exif)  ↔  PNG eXIf 块  ↔  WebP EXIF 块   （负载均为原始 TIFF，可无损互通）
 *   XMP  : JPEG APP1(xap)   ↔  PNG iTXt(XML:com.adobe.xmp)  ↔  WebP "XMP " 块
 *   ICC  : JPEG APP2(分片)  ↔  PNG iCCP(zlib 压缩)  ↔  WebP ICCP 块
 *   IPTC : JPEG APP13(Photoshop 8BIM)  ↔  PNG tEXt(Raw profile type iptc，ImageMagick 兼容)  ↔  WebP 无标准位置（自动丢弃）
 *
 * 零第三方依赖，仅使用 Node.js 内置模块（fs / zlib / path）。
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const zlib = require('zlib');

// ---------------- 常量 ----------------

const SIG_EXIF_APP1 = Buffer.from('Exif\0\0', 'binary');
const SIG_XMP_APP1 = Buffer.from('http://ns.adobe.com/xap/1.0/\0', 'binary');
const SIG_ICC_APP2 = Buffer.from('ICC_PROFILE\0', 'binary');
const SIG_PS_APP13 = Buffer.from('Photoshop 3.0\0', 'binary');

// APP2 段最大负载 = 65535(段长) - 2(长度字段) - 12('ICC_PROFILE\0') - 2(seq/total)
const ICC_CHUNK_MAX = 65519;

// WebP VP8X 标志位（byte0 从高位到低位：rsv rsv I L E X A rsv）
const VP8X_I = 0x20; // 含 ICC profile
const VP8X_L = 0x10; // 含 Alpha
const VP8X_E = 0x08; // 含 EXIF
const VP8X_X = 0x04; // 含 XMP
const VP8X_A = 0x02; // 动画

// TIFF 值类型的字节长度
const EXIF_TYPE_SIZE = {1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8};

const IFD0_TAG_NAMES = {
    0x0100: 'ImageWidth', 0x0101: 'ImageHeight', 0x010E: 'ImageDescription',
    0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation',
    0x0113: 'XResolution', 0x0114: 'YResolution', 0x0128: 'ResolutionUnit',
    0x0131: 'Software', 0x0132: 'DateTime', 0x013B: 'Artist', 0x8298: 'Copyright',
};
const EXIF_TAG_NAMES = {
    0x829A: 'ExposureTime', 0x829D: 'FNumber', 0x8822: 'ExposureProgram',
    0x8827: 'ISO', 0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal',
    0x9004: 'DateTimeDigitized', 0x9201: 'ShutterSpeedValue', 0x9202: 'ApertureValue',
    0x9204: 'ExposureBiasValue', 0x9207: 'MeteringMode', 0x9208: 'LightSource',
    0x9209: 'Flash', 0x920A: 'FocalLength', 0xA002: 'ExifImageWidth',
    0xA003: 'ExifImageHeight', 0xA402: 'ExposureMode', 0xA403: 'WhiteBalance',
    0xA405: 'FocalLengthIn35mmFilm', 0xA408: 'Contrast', 0xA409: 'Saturation',
    0xA40A: 'Sharpness', 0xA40C: 'SceneCaptureType', 0xA431: 'BodySerialNumber',
    0xA433: 'LensMake', 0xA434: 'LensModel',
};
const GPS_TAG_NAMES = {
    0x0001: 'GPSLatitudeRef', 0x0002: 'GPSLatitude', 0x0003: 'GPSLongitudeRef',
    0x0004: 'GPSLongitude', 0x0006: 'GPSAltitude', 0x0012: 'GPSMapDatum',
};

// ---------------- 内部工具函数 ----------------

const CRC_TABLE = (() => {
    const t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c;
    }
    return t;
})();

function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}

function startsWith(buf, sig) {
    return buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);
}

async function toBuffer(input) {
    if (Buffer.isBuffer(input)) return input;
    if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength);
    if (typeof input === 'string') return fsp.readFile(input);
    if (input && typeof input.arrayBuffer === 'function') return Buffer.from(await input.arrayBuffer()); // Blob
    throw new Error('输入必须是文件路径 / Buffer / Uint8Array / Blob');
}

const EMPTY_PARTS = {exif: null, xmp: null, icc: null, iptc: null};

class ImageMetadataHelper {

    /**
     * 读取图片元数据
     * @param {string|Buffer|Uint8Array|Blob} input 文件路径或二进制
     * @returns {Promise<{format:string, exif:Buffer|null, xmp:string|null,
     *          icc:Buffer|null, iptc:Buffer|null, tags:Object}>}
     *          exif  —— 原始 TIFF 字节（可直接跨格式搬运）
     *          xmp   —— XMP 文本
     *          icc   —— ICC 色彩配置文件字节
     *          iptc  —— Photoshop IRB(IPTC) 字节
     *          tags  —— 常用 EXIF 字段解析结果（Make/Model/Orientation/...）
     */
    static async readMetadata(input) {
        const buf = await toBuffer(input);
        const format = this.detectFormat(buf);
        if (!format) throw new Error('无法识别的图片格式（支持 jpeg / png / webp）');
        const parts = format === 'jpeg' ? this._readJpeg(buf) : format === 'png' ? this._readPng(buf) : this._readWebp(buf);
        let tags = {};
        if (parts.exif) {
            try {
                tags = this.parseExifTags(parts.exif);
            } catch {
                tags = {};
            }
        }
        return {
            format,
            exif: parts.exif || null,
            xmp: parts.xmp || null,
            icc: parts.icc || null,
            iptc: parts.iptc || null,
            tags,
        };
    }

    /**
     * 把元数据写入目标图片（返回新 Buffer，不修改原数据）
     * 目标格式自动识别，元数据按目标格式的规范位置写入，因此天然支持跨格式
     * @param {string|Buffer|Uint8Array|Blob} target 目标图片（如 canvas.toBlob 的产物）
     * @param {{exif?:Buffer|null, xmp?:string|null, icc?:Buffer|null,
     *          iptc?:Buffer|null, tags?:Object}} metadata readMetadata 的返回值或手工构造
     * @param {{include?:{exip?:boolean,xmp?:boolean,icc?:boolean,iptc?:boolean},
     *          orientation?:'reset'|'keep', pngRawProfile?:boolean}} [options]
     *          orientation 默认 'reset'：参考 PS/LR 导出——canvas 像素已按 EXIF 方向烘焙，
     *          故把 Orientation 重置为 1，避免看图软件二次旋转；传 'keep' 保留原值
     *          pngRawProfile：额外写 ImageMagick 风格 "Raw profile type exif/iptc" tEXt 块，兼容老工具
     */
    static async writeMetadata(target, metadata, options = {}) {
        if (metadata == null) return this.stripMetadata(target);
        const buf = await toBuffer(target);
        const format = this.detectFormat(buf);
        if (!format) throw new Error('无法识别的目标图片格式（支持 jpeg / png / webp）');
        const parts = this._normalizeParts(metadata, options);
        if (format === 'jpeg') return this._writeJpeg(buf, parts);
        if (format === 'png') return this._writePng(buf, parts, options);
        return this._writeWebp(buf, parts);
    }

    /**
     * 同步元数据到 Buffer（一步完成：原图读元数据 → 注入 canvas 导出图）
     * @param {string|Buffer} source 原图（任何支持格式，可与 target 不同格式）
     * @param {string|Buffer} target canvas 导出图
     * @param {object} [options] 同 writeMetadata
     * @returns {Promise<Buffer>} 注入元数据后的新图片
     */
    static async syncMetadataToBuffer(source, target, options = {}) {
        const meta = await this.readMetadata(await toBuffer(source));
        return this.writeMetadata(await toBuffer(target), meta, options);
    }

    /**
     * 同步元数据到文件
     * @param {string|Buffer} source 原图
     * @param {string|Buffer} target canvas 导出图
     * @param {string} [outputPath] 输出路径；省略且 target 为路径时原地覆盖 target
     * @param {object} [options] 同 writeMetadata
     * @returns {Promise<string>} 实际写入的文件路径
     */
    static async syncMetadataToFile(source, target, outputPath, options = {}) {
        let out = outputPath;
        if (out == null) {
            if (typeof target !== 'string') {
                throw new Error('必须提供 outputPath（或让 target 为文件路径以原地覆盖）');
            }
            out = target;
        }
        const buf = await this.syncMetadataToBuffer(source, target, options);
        const dir = path.dirname(out);
        if (dir && dir !== '.') await fsp.mkdir(dir, {recursive: true});
        await fsp.writeFile(out, buf);
        return out;
    }

    /**
     * 剥离全部元数据（用于模拟 canvas.toBlob 的行为 / 干净导出）
     * @param {string|Buffer} target
     * @returns {Promise<Buffer>}
     */
    static async stripMetadata(target) {
        const buf = await toBuffer(target);
        const format = this.detectFormat(buf);
        if (!format) throw new Error('无法识别的图片格式（支持 jpeg / png / webp）');
        if (format === 'jpeg') return this._writeJpeg(buf, EMPTY_PARTS);
        if (format === 'png') return this._writePng(buf, EMPTY_PARTS, {});
        return this._writeWebp(buf, EMPTY_PARTS);
    }

    /** 识别图片格式：'jpeg' | 'png' | 'webp' | null */
    static detectFormat(buf) {
        if (!buf || buf.length < 4) return null;
        if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg';
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png';
        if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
        return null;
    }

    // --------------------------------------------------------------
    //  EXIF 工具（解析 / 构造 / Orientation 修补）
    // --------------------------------------------------------------

    /** 轻量解析 EXIF(TIFF) 为常用字段对象；支持 IFD0 / Exif 子 IFD / GPS 子 IFD */
    static parseExifTags(exifBuf) {
        const tags = {};
        const buf = exifBuf;
        if (!buf || buf.length < 8) return tags;
        const orderMark = buf.toString('ascii', 0, 2);
        if (orderMark !== 'II' && orderMark !== 'MM') return tags;
        const le = orderMark === 'II';
        const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
        const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
        if (u16(2) !== 0x2A) return tags;

        const readValue = (type, count, vo) => {
            const size = EXIF_TYPE_SIZE[type];
            if (!size) return null;
            const total = size * count;
            if (vo < 0 || vo + total > buf.length) return null;
            switch (type) {
                case 2: { // ASCII
                    const raw = buf.subarray(vo, vo + count);
                    const z = raw.indexOf(0);
                    return raw.subarray(0, z < 0 ? count : z).toString('utf8').trim();
                }
                case 3: // SHORT
                    if (count === 1) return u16(vo);
                    return Array.from({length: count}, (_, i) => u16(vo + i * 2));
                case 4: // LONG
                    if (count === 1) return u32(vo);
                    return Array.from({length: count}, (_, i) => u32(vo + i * 4));
                case 5:
                case 10: { // RATIONAL / SRATIONAL
                    const arr = [];
                    for (let i = 0; i < count; i++) {
                        const o = vo + i * 8;
                        const n = type === 5 ? u32(o) : (le ? buf.readInt32LE(o) : buf.readInt32BE(o));
                        const d = type === 5 ? u32(o + 4) : (le ? buf.readInt32LE(o + 4) : buf.readInt32BE(o + 4));
                        arr.push(d === 0 ? 0 : Math.round((n / d) * 1e6) / 1e6);
                    }
                    return count === 1 ? arr[0] : arr;
                }
                case 7:
                    return buf.subarray(vo, vo + count).toString('latin1'); // UNDEFINED（如 ExifVersion）
                case 1:
                    return count === 1 ? buf[vo] : buf.subarray(vo, vo + count).toString('hex'); // BYTE
                case 9:
                    return count === 1 ? (le ? buf.readInt32LE(vo) : buf.readInt32BE(vo)) : null; // SLONG
                default:
                    return null;
            }
        };

        const walk = (ifdOff, names, prefix, depth) => {
            if (depth > 3 || ifdOff < 8 || ifdOff + 2 > buf.length) return;
            const n = u16(ifdOff);
            for (let i = 0; i < n; i++) {
                const e = ifdOff + 2 + i * 12;
                if (e + 12 > buf.length) return;
                const tag = u16(e);
                const type = u16(e + 2);
                const count = u32(e + 4);
                if (!prefix) { // 只在 IFD0 层处理子 IFD 指针
                    if (tag === 0x8769) {
                        walk(u32(e + 8), EXIF_TAG_NAMES, 'Exif.', depth + 1);
                        continue;
                    }
                    if (tag === 0x8825) {
                        walk(u32(e + 8), GPS_TAG_NAMES, 'GPS.', depth + 1);
                        continue;
                    }
                }
                if (tag === 0x927C || tag === 0x9286) continue; // MakerNote / UserComment 内容不可移植，跳过
                const size = EXIF_TYPE_SIZE[type] || 1;
                const vo = size * count <= 4 ? e + 8 : u32(e + 8);
                const val = readValue(type, count, vo);
                if (val == null) continue;
                tags[names[tag] || `${prefix}0x${tag.toString(16).padStart(4, '0')}`] = val;
            }
        };

        walk(u32(4), IFD0_TAG_NAMES, '', 0);

        // GPS 经纬度换算为十进制（便于直接使用）
        try {
            if (Array.isArray(tags.GPSLatitude) && tags.GPSLatitude.length === 3) {
                let d = tags.GPSLatitude[0] + tags.GPSLatitude[1] / 60 + tags.GPSLatitude[2] / 3600;
                if (tags.GPSLatitudeRef === 'S') d = -d;
                tags.GPSLatitudeDecimal = Math.round(d * 1e6) / 1e6;
            }
            if (Array.isArray(tags.GPSLongitude) && tags.GPSLongitude.length === 3) {
                let d = tags.GPSLongitude[0] + tags.GPSLongitude[1] / 60 + tags.GPSLongitude[2] / 3600;
                if (tags.GPSLongitudeRef === 'W') d = -d;
                tags.GPSLongitudeDecimal = Math.round(d * 1e6) / 1e6;
            }
        } catch { /* 尽力而为 */
        }

        return tags;
    }

    /** 用简单字段构造一个最小 EXIF(TIFF) 字节块（IFD0，小端） */
    static buildExifBlob(fields = {}) {
        const DEFS = {
            ImageDescription: 0x010E, Make: 0x010F, Model: 0x0110, Orientation: 0x0112,
            Software: 0x0131, DateTime: 0x0132, Artist: 0x013B, Copyright: 0x8298,
        };
        const entries = [];
        for (const [name, val] of Object.entries(fields)) {
            const tag = DEFS[name];
            if (tag == null || val == null || val === '') continue;
            if (name === 'Orientation') {
                entries.push({tag, type: 3, count: 1, short: Number(val) || 1});
            } else {
                const bytes = Buffer.from(String(val), 'latin1');
                entries.push({tag, type: 2, count: bytes.length + 1, bytes});
            }
        }
        entries.sort((a, b) => a.tag - b.tag); // 规范要求按 tag 升序
        const n = entries.length;
        if (!n) throw new Error('buildExifBlob: 没有可写入的字段');

        let dataOff = 8 + 2 + n * 12 + 4; // TIFF头 + IFD(计数+条目+下一IFD指针)
        const dataBlobs = [];
        const ifd = Buffer.alloc(2 + n * 12 + 4);
        ifd.writeUInt16LE(n, 0);
        entries.forEach((en, i) => {
            const o = 2 + i * 12;
            ifd.writeUInt16LE(en.tag, o);
            ifd.writeUInt16LE(en.type, o + 2);
            ifd.writeUInt32LE(en.count, o + 4);
            if (en.type === 3) {
                ifd.writeUInt16LE(en.short, o + 8);
            } else if (en.count <= 4) {
                en.bytes.copy(ifd, o + 8); // 不足 4 字节的部分保持 0（含结尾 \0）
            } else {
                ifd.writeUInt32LE(dataOff, o + 8);
                const blob = Buffer.concat([en.bytes, Buffer.from([0])]);
                dataBlobs.push(blob);
                dataOff += blob.length;
            }
        });
        ifd.writeUInt32LE(0, 2 + n * 12); // 无下一个 IFD

        const head = Buffer.alloc(8);
        head.write('II', 0, 'ascii');
        head.writeUInt16LE(0x2A, 2);
        head.writeUInt32LE(8, 4);

        return Buffer.concat([head, ifd, ...dataBlobs]);
    }

    /**
     * 修补 EXIF 中的 Orientation 值（就地返回新 Buffer）
     * 用途：canvas 绘制时浏览器已按 EXIF 方向把像素转正，
     *       导出后应把 Orientation 改回 1，否则看图软件会二次旋转 —— 与 PS/LR「烘焙旋转」一致
     */
    static patchExifOrientation(exifBuf, orientation = 1) {
        try {
            const buf = Buffer.from(exifBuf);
            if (buf.length < 8) return exifBuf;
            const orderMark = buf.toString('ascii', 0, 2);
            if (orderMark !== 'II' && orderMark !== 'MM') return exifBuf;
            const le = orderMark === 'II';
            const u16 = (o) => (le ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
            const u32 = (o) => (le ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
            if (u16(2) !== 0x2A) return exifBuf;
            const ifd = u32(4);
            if (ifd + 2 > buf.length) return exifBuf;
            const n = u16(ifd);
            for (let i = 0; i < n; i++) {
                const e = ifd + 2 + i * 12;
                if (e + 12 > buf.length) break;
                if (u16(e) !== 0x0112) continue;
                if (u32(e + 4) !== 1) return buf; // count != 1：结构异常，不动
                const type = u16(e + 2);
                if (type === 3) {
                    le ? buf.writeUInt16LE(orientation, e + 8) : buf.writeUInt16BE(orientation, e + 8);
                } else if (type === 4) {
                    le ? buf.writeUInt32LE(orientation, e + 8) : buf.writeUInt32BE(orientation, e + 8);
                }
                return buf;
            }
            return buf; // 没有 Orientation 条目：本来就等同于 1
        } catch {
            return exifBuf;
        }
    }

    /**
     * 把 EXIF Flash(0x9209) 16 位位掩码拆解为 XMP exif:Flash 结构体的「属性形式」XML。
     * 位布局（EXIF 2.3 / CIPA）：
     *   bit0(0x01) Flash Fired
     *   bits1-2(0x06) Return Light（0无检测 2未检测到 3检测到）
     *   bits3-4(0x18) Mode（0未知 1强制闪光 2强制不闪光 3自动）
     *   bit5(0x20) Function Present bit6(0x40) Red-eye Reduction
     * 输出形如 <exif:Flash exif:Fired="False" exif:Return="0" exif:Mode="2" exif:Function="False" exif:RedEyeMode="False"/>
     */
    static _flashToXmpAttrs(flashVal) {
        const v = Number(flashVal);
        if (!Number.isFinite(v)) return null;
        const fired = (v & 0x01) ? 'True' : 'False';
        const ret = (v >> 1) & 0x03;
        const mode = (v >> 3) & 0x03;
        const func = (v & 0x20) ? 'True' : 'False';
        const redeye = (v & 0x40) ? 'True' : 'False';
        return `<exif:Flash exif:Fired="${fired}" exif:Return="${ret}" exif:Mode="${mode}" exif:Function="${func}" exif:RedEyeMode="${redeye}"/>`;
    }

    static _xmlEscape(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /** EXIF 日期 "YYYY:MM:DD HH:MM:SS" → ISO "YYYY-MM-DDTHH:MM:SS" */
    static _exifDateToIso(s) {
        const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(String(s || ''));
        return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : null;
    }

    static _gcd(a, b) {
        return b ? this._gcd(b, a % b) : a;
    }

    /** 数值 → XMP Rational 字符串（"num/den"，如 0.025 → "1/40"） */
    static _toXmpRational(v) {
        const n = Number(v);
        if (!isFinite(n)) return null;
        if (Number.isInteger(n)) return `${n}/1`;
        let bn = n, bd = 1, best = Infinity;
        for (let d = 1; d <= 100000; d++) {
            const num = Math.round(n * d);
            const err = Math.abs(num / d - n);
            if (err < best - 1e-12) {
                best = err;
                bn = num;
                bd = d;
                if (err === 0) break;
            }
        }
        const g = this._gcd(bn, bd) || 1;
        return `${bn / g}/${bd / g}`;
    }

    /**
     * 为 Windows 资源管理器补全 XMP 字段（PNG 专用）。
     * 实测（Win11，Shell COM 探测）：资源管理器对 PNG 不读 eXIf 块，只读 iTXt(XMP) 与
     * tEXt("Creation Time")，XMP 字段映射为：
     *   tiff:Make/tiff:Model→相机制造商/型号、exif:DateTimeOriginal→拍摄日期、
     *   dc:title→标题、dc:creator→作者、dc:subject→标记、dc:rights→版权、
     *   xmp:Rating→分级、xmp:CreatorTool→程序名，
     *   以及拍摄参数列：exif:ExposureTime→曝光时间、exif:FNumber→光圈、exif:ISOSpeedRatings→ISO、
     *   exif:FocalLength/FocalLengthIn35mmFilm→焦距/35mm焦距、exif:MeteringMode→测光模式、
     *   exif:WhiteBalance→白平衡、exif:ExposureProgram/ExposureMode→曝光程序/程序模式、
     *   exif:Saturation→饱和度、exif:LightSource→光源、exif:ExifVersion→EXIF版本、
     *   exifEX:LensMake/LensModel→镜头制造商/型号
     *   exif:Flash→闪光灯模式（System.Photo.FlashMode）：关键——必须以「属性形式」序列化，即 <exif:Flash exif:Fired="False" exif:Mode="2" .../>（子字段作为 XML 属性）。
     * 本方法把「EXIF 有而 XMP 缺」的字段合并进 XMP（同 rdf:about 的多个 rdf:Description
     * 按规范合并）；无 XMP 时合成最小 XMP 包。已是 XMP 首选信息源，注入只补缺、不覆盖。
     */
    static _enhanceXmpForWindows(xmp, exifBuf) {
        let tags = {};
        try {
            tags = exifBuf ? this.parseExifTags(exifBuf) : {};
        } catch {
            tags = {};
        }
        const esc = (v) => this._xmlEscape(v);
        const iso = this._exifDateToIso(tags.DateTimeOriginal || tags.DateTime);
        const rat = (v) => this._toXmpRational(v);
        const additions = [];
        if (tags.Make) additions.push({ns: 'tiff', name: 'tiff:Make', xml: `<tiff:Make>${esc(tags.Make)}</tiff:Make>`});
        if (tags.Model) additions.push({
            ns: 'tiff',
            name: 'tiff:Model',
            xml: `<tiff:Model>${esc(tags.Model)}</tiff:Model>`
        });
        if (tags.LensMake) additions.push({
            ns: 'exifEX',
            name: 'exifEX:LensMake',
            xml: `<exifEX:LensMake>${esc(tags.LensMake)}</exifEX:LensMake>`
        });
        if (tags.LensModel) additions.push({
            ns: 'exifEX',
            name: 'exifEX:LensModel',
            xml: `<exifEX:LensModel>${esc(tags.LensModel)}</exifEX:LensModel>`
        });
        if (tags.BodySerialNumber) additions.push({
            ns: 'exifEX',
            name: 'exifEX:BodySerialNumber',
            xml: `<exifEX:BodySerialNumber>${esc(tags.BodySerialNumber)}</exifEX:BodySerialNumber>`
        });
        if (iso) additions.push({
            ns: 'exif',
            name: 'exif:DateTimeOriginal',
            xml: `<exif:DateTimeOriginal>${iso}</exif:DateTimeOriginal>`
        });
        if (tags.ImageDescription) additions.push({
            ns: 'dc',
            name: 'dc:title',
            xml: `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(tags.ImageDescription)}</rdf:li></rdf:Alt></dc:title>`
        });
        if (tags.Artist) additions.push({
            ns: 'dc',
            name: 'dc:creator',
            xml: `<dc:creator><rdf:Seq><rdf:li>${esc(tags.Artist)}</rdf:li></rdf:Seq></dc:creator>`
        });
        if (tags.Copyright) additions.push({
            ns: 'dc',
            name: 'dc:rights',
            xml: `<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${esc(tags.Copyright)}</rdf:li></rdf:Alt></dc:rights>`
        });
        if (tags.Software) additions.push({
            ns: 'xmp',
            name: 'xmp:CreatorTool',
            xml: `<xmp:CreatorTool>${esc(tags.Software)}</xmp:CreatorTool>`
        });
        // 拍摄参数（资源管理器「照相机」分组各行）
        if (tags.ExposureTime != null && rat(tags.ExposureTime)) additions.push({
            ns: 'exif',
            name: 'exif:ExposureTime',
            xml: `<exif:ExposureTime>${rat(tags.ExposureTime)}</exif:ExposureTime>`
        });
        if (tags.FNumber != null && rat(tags.FNumber)) additions.push({
            ns: 'exif',
            name: 'exif:FNumber',
            xml: `<exif:FNumber>${rat(tags.FNumber)}</exif:FNumber>`
        });
        if (tags.ExposureProgram != null) additions.push({
            ns: 'exif',
            name: 'exif:ExposureProgram',
            xml: `<exif:ExposureProgram>${tags.ExposureProgram}</exif:ExposureProgram>`
        });
        if (tags.ISO != null) {
            additions.push({
                ns: 'exif',
                name: 'exif:ISOSpeedRatings',
                xml: `<exif:ISOSpeedRatings><rdf:Seq><rdf:li>${tags.ISO}</rdf:li></rdf:Seq></exif:ISOSpeedRatings>`
            });
            additions.push({ns: 'exif', name: 'exif:ISO', xml: `<exif:ISO>${tags.ISO}</exif:ISO>`});
        }
        if (tags.ExifVersion) additions.push({
            ns: 'exif',
            name: 'exif:ExifVersion',
            xml: `<exif:ExifVersion>${esc(tags.ExifVersion)}</exif:ExifVersion>`
        });
        if (tags.ExposureBiasValue != null && rat(tags.ExposureBiasValue)) additions.push({
            ns: 'exif',
            name: 'exif:ExposureBiasValue',
            xml: `<exif:ExposureBiasValue>${rat(tags.ExposureBiasValue)}</exif:ExposureBiasValue>`
        });
        if (tags.MeteringMode != null) additions.push({
            ns: 'exif',
            name: 'exif:MeteringMode',
            xml: `<exif:MeteringMode>${tags.MeteringMode}</exif:MeteringMode>`
        });
        if (tags.LightSource != null) additions.push({
            ns: 'exif',
            name: 'exif:LightSource',
            xml: `<exif:LightSource>${tags.LightSource}</exif:LightSource>`
        });
        if (tags.FocalLength != null && rat(tags.FocalLength)) additions.push({
            ns: 'exif',
            name: 'exif:FocalLength',
            xml: `<exif:FocalLength>${rat(tags.FocalLength)}</exif:FocalLength>`
        });
        if (tags.FocalLengthIn35mmFilm != null) additions.push({
            ns: 'exif',
            name: 'exif:FocalLengthIn35mmFilm',
            xml: `<exif:FocalLengthIn35mmFilm>${tags.FocalLengthIn35mmFilm}</exif:FocalLengthIn35mmFilm>`
        });
        if (tags.ExposureMode != null) additions.push({
            ns: 'exif',
            name: 'exif:ExposureMode',
            xml: `<exif:ExposureMode>${tags.ExposureMode}</exif:ExposureMode>`
        });
        if (tags.WhiteBalance != null) additions.push({
            ns: 'exif',
            name: 'exif:WhiteBalance',
            xml: `<exif:WhiteBalance>${tags.WhiteBalance}</exif:WhiteBalance>`
        });
        if (tags.Contrast != null) additions.push({
            ns: 'exif',
            name: 'exif:Contrast',
            xml: `<exif:Contrast>${tags.Contrast}</exif:Contrast>`
        });
        if (tags.Saturation != null) additions.push({
            ns: 'exif',
            name: 'exif:Saturation',
            xml: `<exif:Saturation>${tags.Saturation}</exif:Saturation>`
        });
        if (tags.Sharpness != null) additions.push({
            ns: 'exif',
            name: 'exif:Sharpness',
            xml: `<exif:Sharpness>${tags.Sharpness}</exif:Sharpness>`
        });
        if (tags.Flash != null) {
            const flashXml = this._flashToXmpAttrs(tags.Flash);
            if (flashXml) additions.push({ns: 'exif', name: 'exif:Flash', xml: flashXml});
        }

        if (!additions.length) return xmp;

        const NS_URI = {
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            dc: 'http://purl.org/dc/elements/1.1/',
            xmp: 'http://ns.adobe.com/xap/1.0/',
            exif: 'http://ns.adobe.com/exif/1.0/',
            tiff: 'http://ns.adobe.com/tiff/1.0/',
            exifEX: 'http://cipa.jp/exif/1.0/',
        };
        const nsDeclOf = (list) => [...new Set(list)].map((p) => `xmlns:${p}="${NS_URI[p]}"`).join(' ');

        if (!xmp) { // 无 XMP：合成最小 XMP 包
            return '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n'
                + '<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="ImageMetadataHelper">\n'
                + ` <rdf:RDF xmlns:rdf="${NS_URI.rdf}">\n`
                + `  <rdf:Description rdf:about="" ${nsDeclOf(['rdf', ...additions.map((a) => a.ns)])}>\n`
                + additions.map((a) => `   ${a.xml}`).join('\n') + '\n'
                + '  </rdf:Description>\n </rdf:RDF>\n</x:xmpmeta>\n<?xpacket end="w"?>';
        }

        const missing = additions.filter((a) => !xmp.includes(a.name));
        if (!missing.length) return xmp;
        const desc = `  <rdf:Description rdf:about="" ${nsDeclOf(['rdf', ...missing.map((a) => a.ns)])}>\n`
            + missing.map((a) => `   ${a.xml}`).join('\n') + '\n  </rdf:Description>\n';
        const idx = xmp.lastIndexOf('</rdf:RDF>');
        if (idx < 0) return xmp;
        return xmp.slice(0, idx) + desc + xmp.slice(idx);
    }

    // --------------------------------------------------------------
    //  元数据规范化
    // --------------------------------------------------------------

    static _normalizeParts(metadata, options) {
        const inc = Object.assign({exif: true, xmp: true, icc: true, iptc: true}, options.include || {});
        let exif = inc.exif && metadata.exif ? Buffer.from(metadata.exif) : null;
        const xmp = inc.xmp ? (typeof metadata.xmp === 'string' ? metadata.xmp : (metadata.xmp ? metadata.xmp.toString('utf8') : null)) : null;
        const icc = inc.icc && metadata.icc ? Buffer.from(metadata.icc) : null;
        const iptc = inc.iptc && metadata.iptc ? Buffer.from(metadata.iptc) : null;
        // 只有 tags 没有 exif 字节时，尽力从 tags 重建
        if (!exif && inc.exif && metadata.tags) {
            try {
                exif = this.buildExifBlob(metadata.tags);
            } catch {
                exif = null;
            }
        }
        if (exif && options.orientation !== 'keep') {
            exif = this.patchExifOrientation(exif, 1);
        }
        return {exif, xmp, icc, iptc};
    }

    // --------------------------------------------------------------
    //  JPEG：APP1(EXIF/XMP) / APP2(ICC 分片) / APP13(IPTC)
    // --------------------------------------------------------------

    /** 解析 JPEG 标记段（到 SOS 为止） */
    static _jpegSegments(buf) {
        const segs = [];
        let off = 2; // 跳过 SOI
        while (off + 4 <= buf.length) {
            if (buf[off] !== 0xFF) {
                off++;
                continue;
            }
            const m = buf[off + 1];
            if (m === 0xFF) {
                off++;
                continue;
            }
            if (m === 0x01 || (m >= 0xD0 && m <= 0xD7) || m === 0xD8) {
                off += 2;
                continue;
            } // 无长度段
            if (m === 0xD9) break; // EOI
            const len = buf.readUInt16BE(off + 2);
            const end = off + 2 + len;
            if (m === 0xDA) { // SOS：其后为熵编码数据，整体保留
                segs.push({marker: m, start: off, end, payload: null});
                break;
            }
            segs.push({marker: m, start: off, end, payload: buf.subarray(off + 4, end)});
            off = end;
        }
        return segs;
    }

    static _readJpeg(buf) {
        let exif = null, xmp = null, iptc = null;
        const iccParts = new Map();
        for (const s of this._jpegSegments(buf)) {
            const p = s.payload;
            if (!p) continue;
            if (s.marker === 0xE1 && startsWith(p, SIG_EXIF_APP1)) {
                if (!exif) exif = Buffer.from(p.subarray(SIG_EXIF_APP1.length));
            } else if (s.marker === 0xE1 && startsWith(p, SIG_XMP_APP1)) {
                if (!xmp) xmp = p.subarray(SIG_XMP_APP1.length).toString('utf8');
            } else if (s.marker === 0xE2 && startsWith(p, SIG_ICC_APP2) && p.length >= 14) {
                iccParts.set(p[12], p.subarray(14)); // p[12]=序号, p[13]=总数
            } else if (s.marker === 0xED && startsWith(p, SIG_PS_APP13)) {
                if (!iptc) iptc = Buffer.from(p.subarray(SIG_PS_APP13.length));
            }
        }
        let icc = null;
        if (iccParts.size) {
            icc = Buffer.concat([...iccParts.keys()].sort((a, b) => a - b).map((k) => iccParts.get(k)));
        }
        return {exif, xmp, icc, iptc};
    }

    static _jpegSeg(marker, payload) {
        const b = Buffer.alloc(4 + payload.length);
        b[0] = 0xFF;
        b[1] = marker;
        b.writeUInt16BE(payload.length + 2, 2);
        payload.copy(b, 4);
        return b;
    }

    static _writeJpeg(buf, parts) {
        const segs = this._jpegSegments(buf);
        const sos = segs.find((s) => s.marker === 0xDA);
        const tailFrom = sos ? sos.start : buf.length;
        // 插入点：SOI 之后；若紧跟 JFIF APP0 则放到 APP0 之后（保持惯例顺序）
        let insertEnd = 2;
        if (segs.length && segs[0].marker === 0xE0 && segs[0].start === 2) insertEnd = segs[0].end;
        const isMetaSeg = (s) => {
            const p = s.payload;
            if (!p) return false;
            if (s.marker === 0xE1) return startsWith(p, SIG_EXIF_APP1) || startsWith(p, SIG_XMP_APP1);
            if (s.marker === 0xE2) return startsWith(p, SIG_ICC_APP2);
            if (s.marker === 0xED) return startsWith(p, SIG_PS_APP13);
            return false;
        };
        const kept = segs.filter((s) => s.marker !== 0xDA && !isMetaSeg(s));
        const news = [];
        if (parts.exif) news.push(this._jpegSeg(0xE1, Buffer.concat([SIG_EXIF_APP1, parts.exif])));
        if (parts.xmp) news.push(this._jpegSeg(0xE1, Buffer.concat([SIG_XMP_APP1, Buffer.from(parts.xmp, 'utf8')])));
        if (parts.icc) { // >64KB 的 ICC 按 APP2 规范分片
            const total = Math.ceil(parts.icc.length / ICC_CHUNK_MAX);
            for (let i = 0; i < total; i++) {
                const slice = parts.icc.subarray(i * ICC_CHUNK_MAX, Math.min((i + 1) * ICC_CHUNK_MAX, parts.icc.length));
                news.push(this._jpegSeg(0xE2, Buffer.concat([SIG_ICC_APP2, Buffer.from([i + 1, total]), slice])));
            }
        }
        if (parts.iptc) news.push(this._jpegSeg(0xED, Buffer.concat([SIG_PS_APP13, parts.iptc])));

        return Buffer.concat([
            buf.subarray(0, insertEnd),
            ...news,
            ...kept.map((s) => buf.subarray(s.start, s.end)),
            buf.subarray(tailFrom),
        ]);
    }

    // --------------------------------------------------------------
    //  PNG：eXIf / iCCP / iTXt(XMP) / tEXt(Raw profile)
    // --------------------------------------------------------------

    static _pngChunks(buf) {
        const chunks = [];
        let off = 8; // 跳过签名
        while (off + 8 <= buf.length) {
            const len = buf.readUInt32BE(off);
            const type = buf.toString('ascii', off + 4, off + 8);
            const end = Math.min(off + 12 + len, buf.length);
            chunks.push({type, start: off, end, data: buf.subarray(off + 8, off + 8 + len)});
            off = end;
            if (type === 'IEND') break;
        }
        return chunks;
    }

    static _pngChunk(type, data) {
        const b = Buffer.alloc(12 + data.length);
        b.writeUInt32BE(data.length, 0);
        b.write(type, 4, 'ascii');
        data.copy(b, 8);
        b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
        return b;
    }

    static _pngKeyword(data) {
        const z = data.indexOf(0);
        return z < 0 ? null : data.toString('ascii', 0, z);
    }

    static _parseItxt(data) {
        const kwEnd = data.indexOf(0);
        if (kwEnd < 0) return {};
        const keyword = data.toString('ascii', 0, kwEnd);
        const flag = data[kwEnd + 1];
        const langEnd = data.indexOf(0, kwEnd + 3);
        if (langEnd < 0) return {keyword};
        const trEnd = data.indexOf(0, langEnd + 1);
        if (trEnd < 0) return {keyword};
        let text = data.subarray(trEnd + 1);
        if (flag === 1) {
            try {
                text = zlib.inflateSync(text);
            } catch {
                return {keyword};
            }
        }
        return {keyword, text};
    }

    /** 解析 ImageMagick "Raw profile type xxx" 的 tEXt 负载 */
    static _parseRawProfile(text, kind) {
        const lines = text.split('\n');
        let lenIdx = -1;
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            if (/^\d+$/.test(lines[i].trim())) {
                lenIdx = i;
                break;
            }
        }
        const body = lenIdx >= 0 ? lines.slice(lenIdx + 1).join('\n') : text;
        if (kind === 'xmp') return Buffer.from(body.replace(/^\n+|\n+$/g, ''), 'latin1');
        const hex = body.replace(/[^0-9a-fA-F]/g, '');
        return hex ? Buffer.from(hex, 'hex') : null;
    }

    static _rawProfileText(kind, data) {
        const hex = data.toString('hex').toUpperCase();
        const lines = hex.match(/.{1,72}/g) || [];
        return Buffer.from(`Raw profile type ${kind}\0\n${kind}\n${data.length}\n${lines.join('\n')}\n`, 'latin1');
    }

    static _readPng(buf) {
        let exif = null, xmp = null, icc = null, iptc = null;
        for (const c of this._pngChunks(buf)) {
            if (c.type === 'eXIf' && c.data.length) {
                if (!exif) exif = Buffer.from(c.data);
            } else if (c.type === 'iCCP') {
                if (!icc) {
                    const z = c.data.indexOf(0);
                    if (z >= 0 && c.data.length > z + 2) {
                        try {
                            icc = zlib.inflateSync(c.data.subarray(z + 2));
                        } catch { /* 损坏则忽略 */
                        }
                    }
                }
            } else if (c.type === 'iTXt') {
                const {keyword, text} = this._parseItxt(c.data);
                if (keyword === 'XML:com.adobe.xmp' && text && !xmp) xmp = text.toString('utf8');
            } else if (c.type === 'tEXt') {
                const keyword = this._pngKeyword(c.data);
                const m = keyword && keyword.match(/^Raw profile type (\w+)$/);
                if (!m) continue;
                const kind = m[1];
                const parsed = this._parseRawProfile(c.data.subarray((c.data.indexOf(0) + 1)).toString('latin1'), kind);
                if (!parsed) continue;
                if (kind === 'exif' && !exif) exif = parsed;
                else if (kind === 'iptc' && !iptc) iptc = parsed;
                else if ((kind === 'icc' || kind === 'icm') && !icc) icc = parsed;
                else if (kind === 'xmp' && !xmp) xmp = parsed.toString('utf8');
            }
        }
        return {exif, xmp, icc, iptc};
    }

    static _writePng(buf, parts, options) {
        const chunks = this._pngChunks(buf);
        if (!chunks.length || chunks[0].type !== 'IHDR') {
            throw new Error('PNG 结构异常：首个块必须是 IHDR');
        }
        const isMetaChunk = (c) => {
            if (c.type === 'eXIf' || c.type === 'iCCP') return true;
            if (c.type === 'iTXt') return this._pngKeyword(c.data) === 'XML:com.adobe.xmp';
            if (c.type === 'tEXt') {
                const kw = this._pngKeyword(c.data);
                return !!kw && (/^Raw profile type /.test(kw) || kw === 'Creation Time');
            }
            return false;
        };
        const kept = chunks.filter((c) => !isMetaChunk(c));

        // Windows 资源管理器对 PNG 不读 eXIf 块，只读 iTXt(XMP) 与 tEXt("Creation Time")：
        // 默认（windowsFriendly !== false）把 EXIF 中 Windows 需要的字段合并进 XMP，并补写
        // Creation Time；include.xmp === false 视为用户明确不要 XMP，跳过合并
        let xmp = parts.xmp;
        let tags = {};
        if (parts.exif) {
            try {
                tags = this.parseExifTags(parts.exif);
            } catch {
                tags = {};
            }
        }
        const winFriendly = options.windowsFriendly !== false
            && !(options.include && options.include.xmp === false);
        if (winFriendly && parts.exif) {
            xmp = this._enhanceXmpForWindows(xmp, parts.exif);
        }

        // 新块插在 IHDR 之后：满足 iCCP(需在 PLTE/IDAT 前) 与 eXIf(需在 IDAT 前) 的顺序约束
        const inserts = [];
        if (parts.exif) inserts.push(this._pngChunk('eXIf', parts.exif));
        if (parts.icc) {
            inserts.push(this._pngChunk('iCCP', Buffer.concat([
                Buffer.from('ICC profile\0', 'binary'), Buffer.from([0]), zlib.deflateSync(parts.icc),
            ])));
        }
        if (xmp) {
            inserts.push(this._pngChunk('iTXt', Buffer.concat([
                Buffer.from('XML:com.adobe.xmp\0\0\0\0\0', 'binary'), // keyword\0 + 压缩标志/方法 + 语言\0 + 译名\0
                Buffer.from(xmp, 'utf8'),
            ])));
        }
        if (winFriendly && (tags.DateTimeOriginal || tags.DateTime)) {
            inserts.push(this._pngChunk('tEXt',
                Buffer.from(`Creation Time\0${tags.DateTimeOriginal || tags.DateTime}`, 'latin1')));
        }
        if (options.pngRawProfile) { // ImageMagick 兼容的传统写法
            if (parts.exif) inserts.push(this._pngChunk('tEXt', this._rawProfileText('exif', parts.exif)));
            if (parts.iptc) inserts.push(this._pngChunk('tEXt', this._rawProfileText('iptc', parts.iptc)));
        }

        return Buffer.concat([
            buf.subarray(0, 8),                             // PNG 签名
            buf.subarray(chunks[0].start, chunks[0].end),   // IHDR 保持第一
            ...inserts,
            ...kept.slice(1).map((c) => buf.subarray(c.start, c.end)),
        ]);
    }

    // --------------------------------------------------------------
    //  WebP：RIFF 容器 + VP8X 标志位 + EXIF/XMP/ICCP 块
    // --------------------------------------------------------------

    static _riffChunks(buf) {
        if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF'
            || buf.toString('ascii', 8, 12) !== 'WEBP') {
            throw new Error('不是有效的 WebP(RIFF) 文件');
        }
        const chunks = [];
        let off = 12;
        while (off + 8 <= buf.length) {
            const fourcc = buf.toString('ascii', off, off + 4);
            const size = buf.readUInt32LE(off + 4);
            const dataEnd = Math.min(off + 8 + size, buf.length);
            const end = Math.min(off + 8 + size + (size & 1), buf.length); // 奇数负载补齐
            chunks.push({fourcc, size, data: buf.subarray(off + 8, dataEnd), start: off, end});
            off = end;
        }
        return chunks;
    }

    static _webpDims(chunks) {
        const vp8x = chunks.find((c) => c.fourcc === 'VP8X');
        if (vp8x && vp8x.data.length >= 10) {
            const v = vp8x.data;
            return {w: 1 + (v[4] | (v[5] << 8) | (v[6] << 16)), h: 1 + (v[7] | (v[8] << 8) | (v[9] << 16))};
        }
        const vp8 = chunks.find((c) => c.fourcc === 'VP8 ');
        if (vp8 && vp8.data.length >= 10) { // 关键帧：3字节tag + 3字节同步码 + 宽/高(各14bit)
            return {w: vp8.data.readUInt16LE(6) & 0x3FFF, h: vp8.data.readUInt16LE(8) & 0x3FFF};
        }
        const vp8l = chunks.find((c) => c.fourcc === 'VP8L');
        if (vp8l && vp8l.data.length >= 5) {
            const v = vp8l.data.readUInt32LE(1);
            return {w: (v & 0x3FFF) + 1, h: ((v >>> 14) & 0x3FFF) + 1};
        }
        throw new Error('WebP 中找不到图像数据块 (VP8/VP8L/VP8X)');
    }

    static _makeVp8x(flags, w, h) {
        const b = Buffer.alloc(10);
        b[0] = flags & 0xFF;             // 标志位
        // b[1..3] 保留 3 字节
        b.writeUIntLE(w - 1, 4, 3);      // 画布宽-1（24bit LE）
        b.writeUIntLE(h - 1, 7, 3);      // 画布高-1（24bit LE）
        return b;
    }

    static _assembleRiff(chunks) {
        let size = 4; // 'WEBP' 四字符
        for (const c of chunks) size += 8 + c.data.length + (c.data.length & 1);
        const out = Buffer.alloc(8 + size);
        out.write('RIFF', 0, 'ascii');
        out.writeUInt32LE(size, 4);
        out.write('WEBP', 8, 'ascii');
        let off = 12;
        for (const c of chunks) {
            out.write(c.fourcc, off, 'ascii');
            out.writeUInt32LE(c.data.length, off + 4);
            c.data.copy(out, off + 8);
            off += 8 + c.data.length + (c.data.length & 1);
        }
        return out;
    }

    static _readWebp(buf) {
        let exif = null, xmp = null, icc = null;
        for (const c of this._riffChunks(buf)) {
            if (c.fourcc === 'EXIF' && c.data.length) {
                if (!exif) exif = Buffer.from(c.data);
            } else if (c.fourcc === 'XMP ' && c.data.length) {
                if (!xmp) xmp = c.data.toString('utf8');
            } else if (c.fourcc === 'ICCP' && c.data.length) {
                if (!icc) icc = Buffer.from(c.data);
            }
        }
        return {exif, xmp, icc, iptc: null}; // WebP 无 IPTC 标准位置
    }

    static _writeWebp(buf, parts) {
        const chunks = this._riffChunks(buf);
        const hasVp8x = chunks.length > 0 && chunks[0].fourcc === 'VP8X';
        // 简单格式且没有元数据要写：原样返回，避免无意义地升级为扩展格式
        if (!hasVp8x && !parts.exif && !parts.xmp && !parts.icc) return Buffer.from(buf);

        const dims = this._webpDims(chunks);
        let flags = hasVp8x ? chunks[0].data[0] : 0;
        flags &= ~(VP8X_E | VP8X_X | VP8X_I); // 清旧标记，避免重复/残留
        if (!hasVp8x) {
            flags &= ~(VP8X_A | VP8X_L);        // 简单格式不含动画位
            if (chunks.some((c) => c.fourcc === 'ALPH')) flags |= VP8X_L;
        }
        if (parts.exif) flags |= VP8X_E;
        if (parts.xmp) flags |= VP8X_X;
        if (parts.icc) flags |= VP8X_I;

        // 规范顺序：VP8X → ICCP → 图像数据(ALPH/VP8/VP8L/ANIM...) → EXIF → XMP
        const inner = chunks.filter((c) => !['VP8X', 'EXIF', 'XMP ', 'ICCP'].includes(c.fourcc));
        const list = [{fourcc: 'VP8X', data: this._makeVp8x(flags, dims.w, dims.h)}];
        if (parts.icc) list.push({fourcc: 'ICCP', data: parts.icc});
        list.push(...inner);
        if (parts.exif) list.push({fourcc: 'EXIF', data: parts.exif});
        if (parts.xmp) list.push({fourcc: 'XMP ', data: Buffer.from(parts.xmp, 'utf8')});
        return this._assembleRiff(list);
    }
}

// ---------------- 命令行入口 ----------------

if (require.main === module) {
    (async () => {
        const [, , cmd, ...rest] = process.argv;
        if (cmd === 'read') {
            const m = await ImageMetadataHelper.readMetadata(rest[0]);
            console.log(JSON.stringify({
                format: m.format,
                tags: m.tags,
                exifBytes: m.exif ? m.exif.length : 0,
                xmpBytes: m.xmp ? Buffer.byteLength(m.xmp) : 0,
                iccBytes: m.icc ? m.icc.length : 0,
                iptcBytes: m.iptc ? m.iptc.length : 0,
            }, null, 2));
        } else if (cmd === 'sync') {
            const out = await ImageMetadataHelper.syncMetadataToFile(rest[0], rest[1], rest[2] || undefined);
            console.log('已输出:', out);
        } else if (cmd === 'strip') {
            const b = await ImageMetadataHelper.stripMetadata(rest[0]);
            await fsp.writeFile(rest[1], b);
            console.log('已输出:', rest[1]);
        } else {
            console.log('用法:\n'
                + '  node ImageMetadataHelper.js read  <图片>\n'
                + '  node ImageMetadataHelper.js sync  <原图> <canvas导出图> [输出路径]\n'
                + '  node ImageMetadataHelper.js strip <图片> <输出路径>');
        }
    })().catch((e) => {
        console.error(e.message);
        process.exit(1);
    });
}

module.exports = ImageMetadataHelper;
