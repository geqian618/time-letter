const fs = require('fs');
const path = require('path');
const {GlobalFonts} = require('@napi-rs/canvas');

// GlobalFonts 是 @napi-rs/canvas 进程内的字体库（native 侧 fontdb），进程间不共享。
// 库的默认实现只在模块加载时扫描一次系统字体目录（load_system_fonts），自定义字体
// 目录不在其扫描范围内，因此每个需要自定义字体的进程都必须自行扫描注册。
// 这里复刻默认实现的加载方式：遍历目录逐个 registerFromPath，解析失败的文件返回
// null 直接跳过（与系统字体扫描对坏文件的处理一致）。
const loadCustomFonts = (fontDir) => {

    if (!fontDir) return 0;

    let filenames;
    try {
        filenames = fs.readdirSync(fontDir);
    } catch (err) {
        console.error('读取字体目录失败:', err.message);
        return 0;
    }

    let count = 0;
    for (const filename of filenames) {
        const filePath = path.join(fontDir, filename);
        try {
            if (!fs.statSync(filePath).isFile()) continue;
            // family 取文件名（不含扩展名），与主进程 font-manager 的注册命名一致，
            // 保证导出 JSON 中的 fontFamily 能命中
            if (GlobalFonts.registerFromPath(filePath, path.parse(filename).name)) {
                count++;
            }
        } catch (err) {
            console.error(`字体注册失败 ${filename}:`, err.message);
        }
    }
    return count;
};

module.exports = {loadCustomFonts};
