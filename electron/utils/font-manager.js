const {GlobalFonts} = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const {getFontPath, localPathToProtocolUrl} = require("./path-helper");
const fontPath = getFontPath();

const availableFonts = new Map();

const reloadFonts = () => {
    const filenames = fs.readdirSync(fontPath);
    const fonts = filenames.map((filename) => {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToProtocolUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
        };
        return [font.family, font]
    });
    GlobalFonts.families.forEach(font => {
        font.isSystem = true;
        availableFonts.set(font.family, font)
    })
    fonts.forEach(([_, font]) => {
        font.isSystem = false;
        registerFont(font)
    })
    return availableFonts;
}


const getSystemFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => font.isSystem));
}

const getCustomFonts = () => {
    return new Map([...availableFonts].filter(([_, font]) => !font.isSystem));
}

const registerFont = (font) => {
    if (!GlobalFonts.has(font.family)) {
        GlobalFonts.registerFromPath(font.path, font.family);
        availableFonts.set(font.family, font)
    }
}

const removeFont = (family) => {
    availableFonts.delete(family)
}


const hasFont = (family) => {
    return availableFonts.has(family)
}


module.exports = {reloadFonts, getCustomFonts, getSystemFonts, registerFont, removeFont, hasFont}
