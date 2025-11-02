// 用于记录已加载的字体
const loadedFonts = new Set();

const loadFont = async (fontFamilyName, path) => {
    // 如果字体已经加载过，直接返回
    if (loadedFonts.has(fontFamilyName)) {
        console.log(`字体 "${fontFamilyName}" 已加载，跳过重复加载`);
        return;
    }

    // 定义字体
    const fontFace = new FontFace(fontFamilyName, `url(${path})`);
    try {
        // 加载字体
        const font = await fontFace.load();
        // 将字体添加到文档中
        document.fonts.add(font);
        // 记录已加载的字体
        loadedFonts.add(fontFamilyName);
        console.log(`字体 "${fontFamilyName}" 加载成功`);
    } catch (error) {
        console.error(`字体 "${fontFamilyName}" 加载失败:`, error);
    }
}

export default { loadFont }
