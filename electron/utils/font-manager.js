// 主进程不加载字体：本模块只维护推给渲染端的字体清单；实际加载发生在渲染端（FontFace），与导出子进程（GlobalFonts），两者的字体库都不与本进程共享
const fs = require("fs");
const path = require("path");
const {GlobalFonts} = require("@napi-rs/canvas");
const {getFontPath, localPathToUrl} = require("./path-helper");

const availableFonts = new Map();

const refreshFonts = () => {

    availableFonts.clear();

    refreshSystemFonts();

    refreshCustomFonts();

    return availableFonts;
}

const refreshSystemFonts = () => {
    GlobalFonts.families.forEach(({family}) => {
        const font = {family, url: null, path: null, isSystem: true};
        availableFonts.set(font.family, font)
    })
}


const refreshCustomFonts = () => {
    const fontPath = getFontPath();
    const filenames = fs.readdirSync(fontPath);
    for (let filename of filenames) {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
            isSystem: false
        };
        addFont(font);
    }
}


const getSystemFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => font.isSystem));
}


const getCustomFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => !font.isSystem));
}


const hasFont = (family) => {
    return availableFonts.has(family)
}


const addFont = (font) => {
    if (!availableFonts.has(font.family)) {
        availableFonts.set(font.family, font)
    }
}


const removeFont = (family) => {
    availableFonts.delete(family)
}


module.exports = {refreshFonts, getCustomFonts, getSystemFonts, addFont, removeFont, hasFont}
