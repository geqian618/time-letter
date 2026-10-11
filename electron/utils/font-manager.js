const {GlobalFonts} = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const {getFontPath, localPathToUrl} = require("./path-helper");
const fontPath = getFontPath();

const availableFonts = new Map();

// 事件循环让位：把同步原生调用排到宏任务队列，避免字体枚举/注册期间
// 阻塞主进程正在处理的其他任务（如自定义协议响应、窗口首帧信号）
const yieldToLoop = () => new Promise(resolve => setImmediate(resolve));

const reloadFonts = async () => {

    availableFonts.clear();

    await reloadSystemFonts();

    await reloadCustomFonts();

    return availableFonts;
}


const reloadSystemFonts = async () => {
    // GlobalFonts.families 访问即触发一次同步的原生全量枚举（Windows 系统字体可达数百项），
    // 先让位一拍再执行，避免卡住主进程当前正在调度的任务
    await yieldToLoop();
    GlobalFonts.families.forEach(font => {
        font.isSystem = true;
        availableFonts.set(font.family, font)
    })
}


const reloadCustomFonts = async () => {
    const filenames = await fs.promises.readdir(fontPath);
    for (let filename of filenames) {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
            isSystem: false
        };
        registerFont(font);
        // registerFromPath 为同步原生解析，逐个字体之间让位，避免连续解析拖住主进程
        await yieldToLoop();
    }
}


const registerFont = (font) => {
    if (!availableFonts.has(font.family)) {
        GlobalFonts.registerFromPath(font.path, font.family);
        availableFonts.set(font.family, font)
    }
}


const getSystemFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => font.isSystem));
}


const getCustomFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => !font.isSystem));
}


const removeFont = (family) => {
    availableFonts.delete(family)
}


const hasFont = (family) => {
    return availableFonts.has(family)
}


module.exports = {reloadFonts, reloadCustomFonts, getCustomFonts, getSystemFonts, registerFont, removeFont, hasFont}
