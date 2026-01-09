import Element from './Element.js'

class Image extends Element {

    constructor(image, options = {}) {
        if (!image) {
            throw new Error('Failed to load image, image is null');
        }
        super(options);
        this.type = 'image'
        this.image = image
        this.cacheable = options.cacheable || false
        this.src = image?.src
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        this.angle = options.angle || 0
        // 图片阴影 - 需要处理嵌套对象
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
                reject(`Failed to load image: src is null`);
            }
            const image = new window.Image();
            image.onload = () => {
                const instance = new Image(image, options);
                resolve(instance);
            };
            image.onerror = () => {
                reject(`Failed to load image: ${src}`);
            };
            image.src = src;
            image.crossOrigin = options.crossOrigin;
        })
    }


    contains(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        // 保存当前画布状态
        ctx.save();
        ctx.globalAlpha = this.alpha

        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 1)';
        // 设置阴影模糊度（像素）
        ctx.shadowBlur = shadowBlur || 0;
        // 设置阴影偏移（像素）
        ctx.shadowOffsetX = shadowOffsetX || 0;
        ctx.shadowOffsetY = shadowOffsetY || 0;

        // 将画布原点移动到图片中心点
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        ctx.translate(centerX, centerY);

        // 旋转画布
        ctx.rotate(this.angle * Math.PI / 180);
        // 绘制图片（注意坐标已偏移到中心点）
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        // 恢复画布到之前保存的状态
        ctx.restore();
    }
}

export default Image;
