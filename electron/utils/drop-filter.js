const sharp = require('sharp');

async function createBlurFilterFromFile(inputPath, blurRadius = 10, overlayOpacity = 0.3) {
    try {
        // 使用文件路径创建 sharp 实例
        const originalImage = sharp(inputPath);
        const metadata = await originalImage.metadata();

        // 统一缩放尺寸
        const maxDimension = 4000;
        let processingImage = originalImage;

        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            processingImage = originalImage.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // 获取统一的处理尺寸
        const processedBuffer = await processingImage.toBuffer();
        const { width, height } = await sharp(processedBuffer).metadata();

        const cssToSharpFactor = 0.7;
        const adjustedBlurRadius = blurRadius * cssToSharpFactor;
        const adjustedBackgroundBlurRadius = blurRadius * 2 * cssToSharpFactor;

        // 并行处理，使用相同的源确保尺寸一致
        const [blurredBackground, slightlyBlurred] = await Promise.all([
            sharp(processedBuffer).blur(adjustedBackgroundBlurRadius).toBuffer(),
            sharp(processedBuffer).blur(adjustedBlurRadius).toBuffer()
        ]);

        // 创建精确尺寸的覆盖层
        const overlayBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.8 }
            }
        })
            .png()
            .toBuffer();

        // 直接合成，现在所有图像尺寸都相同
        const resultBuffer = await sharp(blurredBackground)
            .composite([
                {
                    input: overlayBuffer,
                    blend: 'over',
                    opacity: overlayOpacity
                },
                {
                    input: slightlyBlurred,
                    blend: 'over',
                    opacity: 0.9
                }
            ])
            .png()
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
        const originalImage = sharp(inputBuffer);
        const metadata = await originalImage.metadata();

        // 统一缩放尺寸
        const maxDimension = 4000;
        let processingImage = originalImage;

        if (metadata.width > maxDimension || metadata.height > maxDimension) {
            processingImage = originalImage.resize(maxDimension, maxDimension, {
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // 获取统一的处理尺寸
        const processedBuffer = await processingImage.toBuffer();
        const { width, height } = await sharp(processedBuffer).metadata();

        const cssToSharpFactor = 0.7;
        const adjustedBlurRadius = blurRadius * cssToSharpFactor;
        const adjustedBackgroundBlurRadius = blurRadius * 2 * cssToSharpFactor;

        // 并行处理，使用相同的源确保尺寸一致
        const [blurredBackground, slightlyBlurred] = await Promise.all([
            sharp(processedBuffer).blur(adjustedBackgroundBlurRadius).toBuffer(),
            sharp(processedBuffer).blur(adjustedBlurRadius).toBuffer()
        ]);

        // 创建精确尺寸的覆盖层
        const overlayBuffer = await sharp({
            create: {
                width: width,
                height: height,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.8 }
            }
        })
            .png()
            .toBuffer();

        // 直接合成，现在所有图像尺寸都相同
        const resultBuffer = await sharp(blurredBackground)
            .composite([
                {
                    input: overlayBuffer,
                    blend: 'over',
                    opacity: overlayOpacity
                },
                {
                    input: slightlyBlurred,
                    blend: 'over',
                    opacity: 0.9
                }
            ])
            .png()
            .toBuffer();

        console.log('Backdrop filter 处理完成');
        return resultBuffer;

    } catch (error) {
        console.error('处理失败:', error);
        throw error;
    }
}


module.exports = {createBlurFilterFromFile, createBlurFilterFromBuffer}
