const {GlobalFonts} = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const {getFontPath, localPathToUrl} = require("./path-helper");
const fontPath = getFontPath();

const availableFonts = new Map();

const reloadFonts = () => {

    availableFonts.clear();

    reloadSystemFonts();

    reloadCustomFonts();

    return availableFonts;
}


const reloadSystemFonts = () => {
    GlobalFonts.families.forEach(font => {
        font.isSystem = true;
        availableFonts.set(font.family, font)
    })
}


const reloadCustomFonts = () => {
    const filenames = fs.readdirSync(fontPath);
    for (let filename of filenames) {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
            isSystem: false
        };
        registerFont(font)
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
