// 用于记录已加载的字体
const fontSet = new Set();

const loadFont = async (fontFamily, path) => {

    // 如果字体已经加载过，直接返回
    if (fontSet.has(fontFamily)) {
        console.log(`字体 "${fontFamily}" 已加载，跳过重复加载`);
        return;
    }

    try {
        // 定义字体
        const fontFace = new FontFace(
            fontFamily,
            `url('${path}')`,
            {
                format: 'truetype',
                display: 'swap'
            }
        );
        // 加载字体
        const loadedFace = await fontFace.load();
        // 将字体添加到文档中
        document.fonts.add(loadedFace);
        // 记录已加载的字体
        fontSet.add(fontFamily);
        console.log(`字体 "${fontFamily}" 加载成功`);
    } catch (error) {
        console.error(`字体 "${fontFamily}" 加载失败:`, error);
    }
}

export default {loadFont}
