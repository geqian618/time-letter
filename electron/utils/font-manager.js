const {GlobalFonts} = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");
const {getFontPath, localPathToProtocolUrl} = require("./path-helper");
const fontPath = getFontPath();
const loadedFonts = new Map();

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

    loadedFonts.clear()
    GlobalFonts.families.forEach(font => loadedFonts.set(font.family, font))
    fonts.forEach(([family, font]) => registerFont(font))
    return loadedFonts;
}


const reloadExtendFonts = () => {
    const filenames = fs.readdirSync(fontPath);
    return new Map(filenames.map((filename) => {
        const fileParsed = path.parse(filename);
        const font = {
            family: fileParsed.name,
            url: localPathToProtocolUrl(path.join(fontPath, filename)),
            path: path.join(fontPath, filename),
        };
        return [font.family, font]
    }));
}

const registerFont = (font) => {
    if (!GlobalFonts.has(font.family)) {
        GlobalFonts.registerFromPath(font.path, font.family);
    }
    loadedFonts.set(font.family, font)
}

const removeFont = (family) => {
    loadedFonts.delete(family)
}


const hasFont = (family) => {
    return loadedFonts.has(family)
}


module.exports = {reloadFonts, reloadExtendFonts, registerFont, removeFont, hasFont}
