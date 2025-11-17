const sharp = require('sharp');

async function createBlurFilterFromFile(inputPath, blurRadius = 10, overlayOpacity = 0.3) {
    try {
        // 使用文件路径创建 sharp 实例
        const originalImage = sharp(inputPath);
        const metadata = await originalImage.metadata();

        // CSS blur 与 Sharp blur 的转换因子
        // 根据经验，Sharp 的模糊半径需要大约 CSS 模糊值的 0.6-0.8 倍才能达到类似效果
        const cssToSharpFactor = 0.7;

        // 调整模糊半径以更接近 CSS 效果
        const adjustedBlurRadius = blurRadius * cssToSharpFactor;
        const adjustedBackgroundBlurRadius = blurRadius * 2 * cssToSharpFactor;

        // 创建高度模糊的背景
        const blurredBackground = await originalImage
            .clone()
            .blur(adjustedBackgroundBlurRadius)
            .toBuffer();

        // 创建轻微模糊的前景（模拟 backdrop-filter）
        const slightlyBlurred = await sharp(inputPath)
            .blur(adjustedBlurRadius)
            .toBuffer();

        // 创建半透明覆盖层 - 使用与 CSS backdrop-filter 更匹配的浅色
        const overlay = await sharp({
            create: {
                width: metadata.width,
                height: metadata.height,
                channels: 4, // 使用 RGBA 通道支持透明度
                background: {r: 255, g: 255, b: 255, alpha: 0.8} // 白色半透明
            }
        })
            .png()
            .toBuffer();

        // 更精确的合成方式，模拟 CSS backdrop-filter
        const resultBuffer = await sharp(blurredBackground)
            .composite([
                {
                    input: overlay,
                    blend: 'over',
                    opacity: overlayOpacity
                },
                {
                    input: slightlyBlurred,
                    blend: 'over',
                    opacity: 0.9 // 稍微提高前景不透明度
                }
            ])
            .png() // 使用 PNG 格式保持透明度
            .toBuffer();

        console.log('Backdrop filter 处理完成');
        return resultBuffer;
    } catch (error) {
        console.error('处理失败:', error);
        throw error;
    }
}

async function createBlurFilterFromBuffer(inputBuffer, blurRadius = 10, overlayOpacity = 0.3) {
    try {
        // 使用传入的 Buffer 创建 sharp 实例
        const originalImage = sharp(inputBuffer);
        const metadata = await originalImage.metadata();

        // CSS blur 与 Sharp blur 的转换因子
        // 根据经验，Sharp 的模糊半径需要大约 CSS 模糊值的 0.6-0.8 倍才能达到类似效果
        const cssToSharpFactor = 0.7;

        // 调整模糊半径以更接近 CSS 效果
        const adjustedBlurRadius = blurRadius * cssToSharpFactor;
        const adjustedBackgroundBlurRadius = blurRadius * 2 * cssToSharpFactor;

        // 创建高度模糊的背景
        const blurredBackground = await originalImage
            .clone()
            .blur(adjustedBackgroundBlurRadius)
            .toBuffer();

        // 创建轻微模糊的前景（模拟 backdrop-filter）
        const slightlyBlurred = await sharp(inputBuffer)
            .blur(adjustedBlurRadius)
            .toBuffer();

        // 创建半透明覆盖层 - 使用与 CSS backdrop-filter 更匹配的浅色
        const overlay = await sharp({
            create: {
                width: metadata.width,
                height: metadata.height,
                channels: 4, // 使用 RGBA 通道支持透明度
                background: {r: 255, g: 255, b: 255, alpha: 0.8} // 白色半透明
            }
        })
            .png()
            .toBuffer();

        // 更精确的合成方式，模拟 CSS backdrop-filter
        const resultBuffer = await sharp(blurredBackground)
            .composite([
                {
                    input: overlay,
                    blend: 'over',
                    opacity: overlayOpacity
                },
                {
                    input: slightlyBlurred,
                    blend: 'over',
                    opacity: 0.9 // 稍微提高前景不透明度
                }
            ])
            .png() // 使用 PNG 格式保持透明度
            .toBuffer();

        console.log('Backdrop filter 处理完成');
        return resultBuffer;
    } catch (error) {
        console.error('处理失败:', error);
        throw error;
    }
}

module.exports = {createBlurFilterFromFile, createBlurFilterFromBuffer}
