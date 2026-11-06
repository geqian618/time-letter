/**
 * 图片元素：即时图片（Image）与懒加载图片（LazyImage），支持缩放 / 圆角 / 阴影 / 背景模糊
 */
import {Element, getTransformScale} from './Element.js';


export class Image extends Element {

    constructor(image, options = {}) {
        if (!image) {
            throw new Error('Failed to load image, image is null');
        }
        super(options);
        this.type = 'image'
        this.image = image
        this.src = image?.src
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


    static fromURL(src, options = {}) {
        return new Promise((resolve, reject) => {
            if (!src) {
                return reject(`Failed to load image: src is null`);
            }
            if (typeof window !== 'undefined') {
                const image = new window.Image();
                image.onload = () => {
                    const instance = new Image(image, options);
                    resolve(instance);
                };
                image.onerror = () => {
                    reject(`Failed to load image: ${src}`);
                };
                // crossOrigin 必须在赋 src 之前设置才生效：后设等于没设，跨域图片会污染画布，exportPNG/JPEG 直接抛 SecurityError
                image.crossOrigin = options.crossOrigin || 'anonymous';
                image.src = src;
            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(src).then(image => {
                    resolve(new Image(image, options))
                }).catch(err => {
                    reject(`Failed to load image from URL: ${src}. ${err.message}`)
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
            // 计算模糊扩展区域（防止边缘半透明）
            const blurAmount = this.blur * transformScale;
            // 扩展区域，通常是模糊半径的2倍
            const expansion = Math.ceil(blurAmount * 2);
            // 保存当前上下文状态
            ctx.save();
            // 应用模糊滤镜
            ctx.filter = `blur(${blurAmount}px)`;
            // 在扩展区域内绘制图像
            ctx.drawImage(this.image, this.x - expansion, this.y - expansion, width + 2 * expansion, height + 2 * expansion);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this.image, this.x, this.y, width, height);
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

    constructor(src, options = {}) {
        super(options);
        this.type = 'image'
        this.image = null
        this.src = src
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
            if (!this.src) {
                return reject(`Failed to load image: src is null`);
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
                    reject(`Failed to load image: ${this.src}`);
                };
                // crossOrigin 必须在赋 src 之前设置才生效（同 Image.fromURL）
                image.crossOrigin = this.crossOrigin;
                image.src = this.src;
                this.image = image;
            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(this.src).then(image => {
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
                    reject(`Failed to load image from URL: ${this.src}. ${err.message}`)
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
            // 计算模糊扩展区域（防止边缘半透明）
            const blurAmount = this.blur * transformScale;
            // 扩展区域，通常是模糊半径的2倍
            const expansion = Math.ceil(blurAmount * 2);
            // 保存当前上下文状态
            ctx.save();
            // 应用模糊滤镜
            ctx.filter = `blur(${blurAmount}px)`;
            // 在扩展区域内绘制图像
            ctx.drawImage(this.image, this.x - expansion, this.y - expansion, width + 2 * expansion, height + 2 * expansion);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this.image, this.x, this.y, width, height);
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
