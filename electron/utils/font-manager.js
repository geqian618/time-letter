const {GlobalFonts} = require("@napi-rs/canvas");
const {FontLibrary} = require("skia-canvas");
const fs = require("fs");
const path = require("path");
const {getFontPath, localPathToProtocolUrl} = require("./path-helper");
const fontPath = getFontPath();

const availableFonts = new Map();

const reloadFonts = () => {

    availableFonts.clear();

    reloadSystemFonts();

    reloadCustomFonts();

    return availableFonts;
}


const reloadSystemFonts = () => {

    // 获取 skia-canvas 字体家族列表
    const skiaFamilies = FontLibrary.families;

    // 获取 @napi-rs/canvas 字体家族列表（假设返回的是对象数组，每个有 family 属性，或字符串数组）
    const napiFamilies = GlobalFonts.families.map(font => font.family);

    // 取交集
    const commonFamilies = napiFamilies.filter(family => skiaFamilies.includes(family));

    commonFamilies.forEach(family => {
        // 可以从 GlobalFonts 获取详细信息，但这里简单存储
        const font = FontLibrary.family(family);
        availableFonts.set(family, {...font, isSystem: true});
    });
}


const reloadCustomFonts = () => {
    const filenames = fs.readdirSync(fontPath);
    for (let filename of filenames) {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToProtocolUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
            isSystem: false
        };
        registerFont(font)
    }
}


const registerFont = (font) => {
    if (!FontLibrary.has(font.family)) {
        GlobalFonts.registerFromPath(font.path, font.family);
        FontLibrary.use(font.family, [font.path]);
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
