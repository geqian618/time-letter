// 主进程不加载字体：本模块只维护推给渲染端的字体清单；实际加载发生在渲染端（FontFace），与导出子进程（GlobalFonts），两者的字体库都不与本进程共享
const fs = require("fs");
const path = require("path");
const {GlobalFonts} = require("@napi-rs/canvas");
const {getFontPath, localPathToUrl} = require("./path-helper");

const fontRegistry = new Map();


const pullSystemFonts = () => {
    const systemFonts = new Map();
    GlobalFonts.families.forEach(({family}) => {
        const font = {family, url: null, path: null, isSystem: true};
        systemFonts.set(font.family, font);
    });
    return systemFonts;
};

const pullCustomFonts = () => {
    const customFonts = new Map();
    const fontPath = getFontPath();
    const filenames = fs.readdirSync(fontPath);
    for (const filename of filenames) {
        const fullPath = path.join(fontPath, filename);
        const font = {
            family: path.parse(filename).name,
            url: localPathToUrl(fullPath),
            path: fullPath,
            isSystem: false
        };
        customFonts.set(font.family, font);
    }
    return customFonts;
};


const pullFonts = () => {
    const systemFonts = pullSystemFonts();
    const customFonts = pullCustomFonts();
    // 自定义字体优先，覆盖同名系统字体
    const allFonts = new Map([...systemFonts, ...customFonts]);
    fontRegistry.clear();
    for (const [family, font] of allFonts) {
        fontRegistry.set(family, font);
    }
    return fontRegistry;
};


const listFonts = () => {
    if (fontRegistry.size === 0) {
        return pullFonts()
    }
    return fontRegistry;
}


const listSystemFonts = () => {
    return new Map([...fontRegistry].filter(([_, font]) => font.isSystem));
}


const listCustomFonts = () => {
    return new Map([...fontRegistry].filter(([_, font]) => !font.isSystem));
}


const hasFont = (family) => {
    return fontRegistry.has(family)
}


const addFont = (font) => {
    if (!fontRegistry.has(font.family)) {
        fontRegistry.set(font.family, font)
    }
}


const removeFont = (family) => {
    fontRegistry.delete(family)
}


module.exports = {listFonts, listCustomFonts, listSystemFonts, addFont, removeFont, hasFont}
