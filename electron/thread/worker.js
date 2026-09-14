// 导出子进程（utilityProcess 入口）：包含单张导出的渲染逻辑与子进程消息宿主。
// 由 image-export-processor fork 拉起，串行处理任务（进程内复用同一个缓存
// CanvasEditor）；一批导出结束后由主进程 kill，@napi-rs/canvas 的原生内存
// （解码图、Skia surface）随进程退出由操作系统整体回收。
// 也支持被校验脚本直接 require 后调用单张导出函数。
'use strict'

const {promises: fs} = require("fs");
const path = require("path");
const {createCanvas} = require("@napi-rs/canvas");

const ImageMetadataHelper = require("../utils/ImageMetadataHelper");
const {CanvasEditor} = require("../canvas/NodeCanvasEditor");
const {loadCustomFonts} = require("../utils/child-font-loader");

// 每个进程的 GlobalFonts 独立，且默认只扫描系统字体目录，主进程注册的自定义字体
// 对本进程不可见。进程启动时像默认实现加载系统字体那样扫描注册自定义字体：
// 目录由主进程 fork 时经环境变量传入（开发/打包的资源布局不同，由主进程统一解析）。
loadCustomFonts(process.env.TIME_LETTER_FONT_DIR);

let cachedCanvasEditor;

// 自行暴露 gc：@napi-rs/canvas 1.x 分配的原生内存（解码图、Skia surface）不计入
// V8 堆，子进程的 JS 堆很小、V8 感受不到压力几乎不触发 GC，导出过程中原生内存会
// 持续堆积（200 张约 1GB）。这里用 vm 新建 context 的方式拿到 gc —— 新 context 与
// 主 context 同属一个 isolate，调用它会做整 isolate 的 Full GC，不依赖宿主注入。
// LEAK_NO_GC=1 供校验脚本构造“无 gc 基线”使用。
if (typeof global.gc !== 'function' && process.env.LEAK_NO_GC !== '1') {
    try {
        require('v8').setFlagsFromString('--expose-gc');
        const gc = require('vm').runInNewContext('typeof gc === "function" ? gc : undefined');
        require('v8').setFlagsFromString('--no-expose-gc');
        if (typeof gc === 'function') {
            global.gc = gc;
        }
    } catch (e) {
        // 暴露失败时保持原行为：原生内存随子进程退出统一回收
    }
}


const getCachedCanvasEditor = () => {
    if (!cachedCanvasEditor) {
        const canvas = new createCanvas(0, 0)
        cachedCanvasEditor = new CanvasEditor(canvas, {strictIntegerDimensions: true});
    }
    return cachedCanvasEditor;
}


// 单张导出：渲染 JSON 背景并写出文件
async function exportFile(params) {
    const {
        projectSettings: {
            outputSettings: {
                quality,
                extname: extnameType,
                outputSize: {width, height, maxWidth, maxHeight, type},
                isSynchronizeMetadata,
                fileNaming: {basename, prefix, suffix}
            }
        },
        outputDirectory,
        setting: {json, filePath, index, filename: originalName}
    } = params

    const parsed = path.parse(filePath);
    const originalExtname = parsed.ext.slice(1);

    let filename = basename === 0 ? originalName : basename === 1 ? String(index) : crypto.randomUUID().replaceAll('-', '')

    filename = prefix + filename + suffix;

    const outputExtname = getExtname(originalExtname, extnameType)

    const outputPath = path.join(outputDirectory, filename + "." + outputExtname)

    const settings = JSON.parse(json);

    const {elements, width: originalWidth, height: originalHeight} = settings;

    const background = elements[0];

    const {borderLeft, borderRight, borderTop, borderBottom} = background.meta;

    if (borderLeft === 0 && borderRight === 0 && borderTop === 0 && borderBottom === 0) {
        if (type === 0 && elements.length === 2 && originalExtname === outputExtname) {
            try {
                if (isSynchronizeMetadata) {
                    await fs.copyFile(filePath, outputPath);
                } else {
                    const sourceBuffer = await fs.readFile(filePath);
                    const strippedBuffer = await ImageMetadataHelper.removeMetadata(sourceBuffer);
                    await fs.writeFile(outputPath, strippedBuffer);
                }
            } catch (err) {
                console.error('拷贝失败:', err);
                throw err;
            }
            return null;
        }
        elements.splice(0, 1);
    }

    for (let element of elements) {
        if (element.type === 'image') {
            element.src = element.meta.path
        }
        if (element.shadow) {
            element.shadow.blur = element.shadow.blur * 0.7;
        }
    }

    if (type === 0) {
        settings.zoom = 1
    } else if (type === 1) {
        settings.zoom = width / originalWidth
    } else if (type === 2) {
        settings.zoom = height / originalHeight
    } else if (type === 3) {
        settings.zoom = Math.min(maxWidth / originalWidth, maxHeight / originalHeight)
    }

    const canvasEditor = getCachedCanvasEditor();
    await canvasEditor.loadFromJSON(JSON.stringify(settings))

    const canvas = canvasEditor.getCanvas();

    // 7. 保存图片 (使用 Buffer 写入)；保留原格式时强制最高质量
    let buffer = encodeCanvas(canvas, outputExtname, extnameType === 0 ? 100 : quality);

    if (isSynchronizeMetadata) {
        buffer = await ImageMetadataHelper.syncMetadata(filePath, buffer, {format: outputExtname});
    }

    await fs.writeFile(outputPath, buffer);

    // 立即丢弃对已导出内容的引用（解码图等），配合 finally 中的 gc 当场回收
    canvasEditor.clearCanvas();

    return null;
}


const getExtname = (originalExtname, extnameType) => {
    switch (extnameType) {
        case 0:
            return originalExtname
        case 1:
            return 'jpeg'
        case 2:
            return 'png'
        case 3:
            return 'webp'
        case 4:
            return 'avif'
        case 5:
            return 'gif'
    }
}

// canvas 按输出扩展名编码为 Buffer。png / gif 无损，不参与质量控制；
// jpeg / webp 直接传质量值；avif 走 AvifConfig。
// avif 的 quality 须反转后传入：@napi-rs/canvas 1.0.7 把它直接当作 rav1e 的
// quantizer（0-255，越小画质越好），与类型标注“0-100 scale, 100 is lossless”
// 相反，实测 q=100 输出仅几百字节且画面严重劣化、q=0 才接近无损，故滑块 100
// 映射为库值 0。
const encodeCanvas = (canvas, format, quality) => {
    switch (format) {
        case 'png':
            return canvas.toBuffer('image/png')
        case 'jpg':
        case 'jpeg':
            return canvas.toBuffer('image/jpeg', quality)
        case 'webp':
            return canvas.toBuffer('image/webp', quality)
        case 'avif':
            return canvas.toBuffer('image/avif', {quality: 100 - quality})
        case 'gif':
            return canvas.toBuffer('image/gif')
        default:
            throw new Error(`不支持的导出格式: ${format}`)
    }
}


// ---------- 子进程消息宿主 ----------

// 兼容两种宿主：Electron utilityProcess（process.parentPort，消息在 e.data 里）
// 与 Node child_process.fork（process.on('message')，供校验脚本使用）
const isUtility = !!process.parentPort

if (isUtility) {
    process.parentPort.on('message', (e) => handle(e.data))
} else if (typeof process.send === 'function') {
    process.on('message', (m) => handle(m))
}

async function handle(msg) {
    if (!msg || msg.type !== 'task') return
    try {
        const result = await module.exports(msg.task)
        reply({type: 'done', taskId: msg.taskId, result: result === undefined ? null : result})
    } catch (err) {
        reply({type: 'done', taskId: msg.taskId, error: (err && err.message) || String(err)})
    }
}

function reply(msg) {
    if (isUtility) {
        process.parentPort.postMessage(msg)
    } else if (process.send) {
        process.send(msg)
    }
}


// 对外暴露单张导出；每次导出后（含失败）主动触发 GC，让 napi finalizer 立即释放
// 原生内存，避免子进程在长批次导出中峰值持续上涨。gc 不可用时静默跳过。
module.exports = async (params) => {
    try {
        return await exportFile(params);
    } finally {
        if (typeof global.gc === 'function') {
            global.gc();
        }
    }
};
