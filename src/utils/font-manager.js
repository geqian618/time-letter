// 用于记录已加载的字体及其对应的 FontFace 实例
const fontRegistry = new Map();

const loadFont = async (family, url) => {
    // 如果字体已经加载过，直接返回
    if (fontRegistry.has(family)) {
        console.log(`字体 "${family}" 已加载，无需重复加载`);
        return;
    }
    try {
        // 定义字体
        const fontFace = new FontFace(
            family,
            `url('${url}')`,
            {
                format: 'truetype',
                display: 'swap'
            }
        );
        // 加载字体
        const loadedFace = await fontFace.load();
        // 将字体添加到文档中
        document.fonts.add(loadedFace);
        // 记录已加载的字体及其FontFace实例
        fontRegistry.set(family, loadedFace);
        console.log(`字体 "${family}" 加载成功`);
    } catch (error) {
        console.error(`字体 "${family}" 加载失败:`, error);
    }
}

const unloadFont = async (family) => {
    // 检查字体是否已加载
    if (!fontRegistry.has(family)) {
        console.log(`字体 "${family}" 未加载，无需卸载`);
        return false;
    }
    try {
        // 获取FontFace实例
        const fontFace = fontRegistry.get(family);
        // 从文档中移除字体
        document.fonts.delete(fontFace);
        // 从记录中移除
        fontRegistry.delete(family);
        // 尝试清除可能存在的@font-face规则
        const styleSheets = Array.from(document.styleSheets);
        for (const sheet of styleSheets) {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                for (let i = rules.length - 1; i >= 0; i--) {
                    const rule = rules[i];
                    if (rule.type === CSSRule.FONT_FACE_RULE && rule.style.fontFamily.includes(family)) {
                        sheet.deleteRule(i);
                    }
                }
            } catch (e) {
                // 某些样式表可能无法访问（跨域限制）
                console.warn('无法访问样式表:', e);
            }
        }
        console.log(`字体 "${family}" 卸载成功`);
        return true;
    } catch (error) {
        console.error(`字体 "${family}" 卸载失败:`, error);
        throw error;
    }
};


// 检查字体是否已加载
const isLoaded = (family) => {
    return fontRegistry.has(family);
};

// 批量卸载所有已加载字体
const unloadAllFonts = () => {
    const fontFamilies = Array.from(fontRegistry.keys());
    const results = fontFamilies.map(family => unloadFont(family));
    return Promise.allSettled(results);
};

export default {loadFont, unloadFont, unloadAllFonts, isLoaded}
