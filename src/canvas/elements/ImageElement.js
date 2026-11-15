/**
 * 图片元素：即时图片（Image）与懒加载图片（LazyImage），支持缩放 / 圆角 / 阴影 / 背景模糊
 */
import {Element, getTransformScale} from './Element.js';

/**
 * 惰性 ½ 链 mipmap 金字塔（按源位图 WeakMap 缓存，命中后零开销，位图回收即随 GC 释放）：
 * 源图远大于目标设备像素时 drawImage 单次重采样会稀疏采样导致锯齿/摩尔纹
 * （Safari 忽略 imageSmoothingQuality 时尤其明显），先取最近的 ½ 链层级
 * （最终重采样比 ≤ 2x，落入 'high' 滤波的甜点区）再画到目标，效果等价 GPU mipmap；
 * 层级画布从上一级继续减半生成（每步一次高质量重采样）。实例间可安全共享：
 * 同一位图的层级内容恒等且构建后只读，clone / 快照恢复无需处理
 */
const mipCache = new WeakMap();

function mipmapSource(image, destW, destH) {
    let w = image.naturalWidth;
    let h = image.naturalHeight;
    let level = 0;
    // 逐级减半到再减就小于目标为止；8 级 / 最小约 128 封顶，避免为极端小目标生成碎层级
    while (w / 2 >= destW && h / 2 >= destH && level < 8 && w > 128 && h > 128) {
        w /= 2;
        h /= 2;
        level++;
    }
    if (!level) return image;
    let mips = mipCache.get(image);
    if (!mips) mipCache.set(image, (mips = new Map()));
    let mip = mips.get(level);
    if (!mip) {
        // 递归取上一级（自动补齐缺失的中间层级），从其继续减半
        const prev = level === 1 ? image : mipmapSource(image, w * 2, h * 2);
        const width = Math.max(1, Math.round(w));
        const height = Math.max(1, Math.round(h));
        if (typeof document !== 'undefined') {
            mip = document.createElement('canvas');
            mip.width = width;
            mip.height = height;
        } else {
            mip = require('@napi-rs/canvas').createCanvas(width, height);
        }
        const ctx = mip.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(prev, 0, 0, width, height);
        mips.set(level, mip);
    }
    return mip;
}

/**
 * 模糊绘制用边缘复制垫图（Skia kClamp 同款思路）：blur 核在图外采样到透明会让元素边缘
 * 半透明（实测 alpha 减半），把原图等距放中、四周 pad 环用最外圈像素拉伸复制，
 * 模糊时核采到的是内容延伸而非透明，边缘保持不透明且几何零变形
 * （替代旧的整图拉伸到扩展矩形方案——w≠h 时非等比变形，blur 越大越重）
 * 每帧重建（环宽/设备尺寸随 zoom 变化，缓存命中率低）：9 次 drawImage 为 GPU 微秒级操作
 * @param image 源位图
 * @param destW/destH 元素目标设备像素尺寸（中心按此等距放置，回贴主画布时 1:1 无重采样）
 * @param pad 环宽（设备像素），调用方取 ceil(blurAmount * 2) ≥ 4σ 覆盖高斯有效范围
 * @returns {canvas} (destW + 2pad) × (destH + 2pad) 垫图画布
 */
function blurPadSource(image, destW, destH, pad) {
    const w = Math.max(1, Math.round(destW));
    const h = Math.max(1, Math.round(destH));
    let source;
    if (typeof document !== 'undefined') {
        source = document.createElement('canvas');
        source.width = w + 2 * pad;
        source.height = h + 2 * pad;
    } else {
        source = require('@napi-rs/canvas').createCanvas(w + 2 * pad, h + 2 * pad);
    }
    const ctx = source.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // 中心：等距放原图（走 mipmap 层级，大图缩小进垫图同样无走样）
    const mip = mipmapSource(image, w, h);
    const mw = mip === image ? image.naturalWidth : mip.width;
    const mh = mip === image ? image.naturalHeight : mip.height;
    ctx.drawImage(mip, pad, pad, w, h);
    // 四条边：最外 1px 行/列沿法线方向拉伸出 pad 环
    ctx.drawImage(mip, 0, 0, 1, mh, 0, pad, pad, h);
    ctx.drawImage(mip, mw - 1, 0, 1, mh, pad + w, pad, pad, h);
    ctx.drawImage(mip, 0, 0, mw, 1, pad, 0, w, pad);
    ctx.drawImage(mip, 0, mh - 1, mw, 1, pad, pad + h, w, pad);
    // 四角：最近角点 1px 复制成 pad 方块
    ctx.drawImage(mip, 0, 0, 1, 1, 0, 0, pad, pad);
    ctx.drawImage(mip, mw - 1, 0, 1, 1, pad + w, 0, pad, pad);
    ctx.drawImage(mip, 0, mh - 1, 1, 1, 0, pad + h, pad, pad);
    ctx.drawImage(mip, mw - 1, mh - 1, 1, 1, pad + w, pad + h, pad, pad);
    return source;
}


export class Image extends Element {

    constructor(image, options = {}) {
        if (!image) {
            throw new Error('Failed to load image, image is null');
        }
        super(options);
        this.type = 'image'
        this.image = image
        this.src = image?.src || options.src || options.path || null
        this.path = options.path || image?.src || options.src || null
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.cacheable = options.cacheable || false
        this.scale = options.scale || 1
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        // 圆角属性
        this.radius = options.radius || 0;
        // 模糊强度
        this.blur = options.blur || 0;

        // 图片阴影
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };

        const {naturalWidth, naturalHeight} = image;
        const {width, height} = options;

        // 如果没有设置宽高，使用图片原始尺寸
        if (!width && !height) {
            this.width = naturalWidth;
            this.height = naturalHeight;
        }
        // 如果只设置了宽度，按比例计算高度
        else if (width && !height) {
            this.height = width * naturalHeight / naturalWidth;
        }
        // 如果只设置了高度，按比例计算宽度
        else if (height && !width) {
            this.width = height * naturalWidth / naturalHeight;
        }

    }


    static fromURL(options = {}) {
        return new Promise((resolve, reject) => {
            const source = typeof window !== 'undefined'
                ? (options.src || options.path)
                : (options.path || options.src);
            if (!source) {
                return reject(new Error(`Failed to load image: src is null`));
            }
            if (typeof window !== 'undefined') {
                const image = new window.Image();
                image.onload = () => {
                    resolve(new Image(image, options));
                };
                image.onerror = () => {
                    reject(new Error(`Failed to load image: ${source}`));
                };
                // crossOrigin 必须在赋 src 之前设置才生效：后设等于没设，跨域图片会污染画布，exportPNG/JPEG 直接抛 SecurityError
                image.crossOrigin = options.crossOrigin || 'anonymous';
                image.src = source;
            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(source).then(image => {
                    resolve(new Image(image, options))
                }).catch(err => {
                    reject(new Error(`Failed to load image from URL: ${source}. ${err && err.message}`))
                })
            }
        })
    }

    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width * this.scale && y >= this.y && y <= this.y + this.height * this.scale;
        }

        // 将点相对于中心点平移
        const translatedX = x - this.centerX;
        const translatedY = y - this.centerY;

        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;

        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

        // 将点平移回原坐标系
        const localX = rotatedX + this.centerX;
        const localY = rotatedY + this.centerY;

        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        // 与外层 globalAlpha 相乘而非覆盖（组合隔离模式对子树外内容降维依赖外层 alpha）
        ctx.globalAlpha = this.alpha * ctx.globalAlpha;

        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        const transformScale = getTransformScale(ctx);

        if (this.angle !== 0) {
            // 首次绘制时初始化中心点（centerX/centerY 默认为 0）
            if (!this.centerX && !this.centerY) {
                this.centerX = this.x + width / 2;
                this.centerY = this.y + height / 2;
            }
            // 旋转时中心点不变：缩放导致宽高变化时，由中心点反推 x、y
            this.x = this.centerX - width / 2;
            this.y = this.centerY - height / 2;
            // 绕中心点旋转
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        } else {
            // 未旋转：x、y 为左上角基准（缩放锚点），中心点由其派生
            this.centerX = this.x + width / 2;
            this.centerY = this.y + height / 2;
        }

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur * transformScale;
            ctx.shadowOffsetX = shadowOffsetX * transformScale;
            ctx.shadowOffsetY = shadowOffsetY * transformScale;
        }

        if (this.radius && this.radius > 0) {
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.fill();
            // 创建圆角路径并裁剪
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.clip();
        }

        // 如果有背景模糊效果
        if (this.blur && this.blur > 0) {
            const blurAmount = this.blur * transformScale;
            // pad 环 ≥ 4σ 覆盖高斯有效范围；垫图中心等距放原图，回贴后几何零变形且边缘不透明
            const pad = Math.ceil(blurAmount * 2);
            ctx.save();
            ctx.filter = `blur(${blurAmount}px)`;
            ctx.drawImage(blurPadSource(this.image, width * transformScale, height * transformScale, pad), this.x - pad, this.y - pad, width + 2 * pad, height + 2 * pad);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // 大倍率缩小先降采样到最近 mipmap 层级，最终重采样比 ≤ 2x 才无走样
            ctx.drawImage(mipmapSource(this.image, width * transformScale, height * transformScale), this.x, this.y, width, height);
        }
        ctx.restore();
    }

    // 修改后的通用圆角矩形路径方法
    _createRoundedRectPath(ctx, x, y, width, height, radius) {
        if (radius <= 0) {
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            return;
        }
        radius = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 选中包围盒需按 scale 缩放
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        return {x: this.x, y: this.y, w: this.width * this.scale, h: this.height * this.scale};
    }

}


export class LazyImage extends Element {

    constructor(options = {}) {
        super(options);
        this.type = 'image'
        this.image = null
        this.src = options.src || options.path || null
        this.path = options.path || options.src || null
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.cacheable = options.cacheable || false
        this.scale = options.scale || 1
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        // 圆角属性
        this.radius = options.radius || 0;
        // 模糊强度
        this.blur = options.blur || 0;

        // 图片阴影
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    load() {
        return new Promise((resolve, reject) => {
            const source = typeof window !== 'undefined' ? this.src : this.path;
            if (!source) {
                return reject(new Error(`Failed to load image: src is null`));
            }
            if (typeof window !== 'undefined') {
                const image = new window.Image();
                image.onload = () => {
                    const {naturalWidth, naturalHeight} = image;
                    // 如果没有设置宽高，使用图片原始尺寸
                    if (!this.width && !this.height) {
                        this.width = naturalWidth;
                        this.height = naturalHeight;
                    }
                    // 如果只设置了宽度，按比例计算高度
                    else if (this.width && !this.height) {
                        this.height = this.width * naturalHeight / naturalWidth;
                    }
                    // 如果只设置了高度，按比例计算宽度
                    else if (this.height && !this.width) {
                        this.width = this.height * naturalWidth / naturalHeight;
                    }
                    resolve();
                };
                image.onerror = () => {
                    reject(new Error(`Failed to load image: ${source}`));
                };
                // crossOrigin 必须在赋 src 之前设置才生效（同 Image.fromURL）
                image.crossOrigin = this.crossOrigin;
                image.src = source;
                this.image = image;
            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(source).then(image => {
                    this.image = image;
                    const {naturalWidth, naturalHeight} = image;
                    // 如果没有设置宽高，使用图片原始尺寸
                    if (!this.width && !this.height) {
                        this.width = naturalWidth;
                        this.height = naturalHeight;
                    }
                    // 如果只设置了宽度，按比例计算高度
                    else if (this.width && !this.height) {
                        this.height = this.width * naturalHeight / naturalWidth;
                    }
                    // 如果只设置了高度，按比例计算宽度
                    else if (this.height && !this.width) {
                        this.width = this.height * naturalWidth / naturalHeight;
                    }
                    resolve()
                }).catch(err => {
                    reject(new Error(`Failed to load image from URL: ${source}. ${err && err.message}`))
                })
            }
        })
    }

    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width * this.scale && y >= this.y && y <= this.y + this.height * this.scale;
        }

        // 将点相对于中心点平移
        const translatedX = x - this.centerX;
        const translatedY = y - this.centerY;

        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;

        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

        // 将点平移回原坐标系
        const localX = rotatedX + this.centerX;
        const localY = rotatedY + this.centerY;

        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        // 与外层 globalAlpha 相乘而非覆盖（组合隔离模式对子树外内容降维依赖外层 alpha）
        ctx.globalAlpha = this.alpha * ctx.globalAlpha;

        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        const transformScale = getTransformScale(ctx);

        if (this.angle !== 0) {
            // 首次绘制时初始化中心点（centerX/centerY 默认为 0）
            if (!this.centerX && !this.centerY) {
                this.centerX = this.x + width / 2;
                this.centerY = this.y + height / 2;
            }
            // 旋转时中心点不变：缩放导致宽高变化时，由中心点反推 x、y
            this.x = this.centerX - width / 2;
            this.y = this.centerY - height / 2;
            // 绕中心点旋转
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        } else {
            // 未旋转：x、y 为左上角基准（缩放锚点），中心点由其派生
            this.centerX = this.x + width / 2;
            this.centerY = this.y + height / 2;
        }

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur * transformScale;
            ctx.shadowOffsetX = shadowOffsetX * transformScale;
            ctx.shadowOffsetY = shadowOffsetY * transformScale;
        }

        if (this.radius && this.radius > 0) {
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.fill();
            // 创建圆角路径并裁剪
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.clip();
        }

        // 如果有背景模糊效果
        if (this.blur && this.blur > 0) {
            const blurAmount = this.blur * transformScale;
            // pad 环 ≥ 4σ 覆盖高斯有效范围；垫图中心等距放原图，回贴后几何零变形且边缘不透明
            const pad = Math.ceil(blurAmount * 2);
            ctx.save();
            ctx.filter = `blur(${blurAmount}px)`;
            ctx.drawImage(blurPadSource(this.image, width * transformScale, height * transformScale, pad), this.x - pad, this.y - pad, width + 2 * pad, height + 2 * pad);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // 大倍率缩小先降采样到最近 mipmap 层级，最终重采样比 ≤ 2x 才无走样
            ctx.drawImage(mipmapSource(this.image, width * transformScale, height * transformScale), this.x, this.y, width, height);
        }

        ctx.restore();
    }

    // 修改后的通用圆角矩形路径方法
    _createRoundedRectPath(ctx, x, y, width, height, radius) {
        if (radius <= 0) {
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            return;
        }
        radius = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 选中包围盒需按 scale 缩放
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        return {x: this.x, y: this.y, w: this.width * this.scale, h: this.height * this.scale};
    }

}
