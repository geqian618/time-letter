import Element from './Element.js'

const IMAGE_SYMBOL = Symbol('image');

class Image extends Element {

    constructor(src, options = {}) {
        super(options);
        this[IMAGE_SYMBOL] = null
        this.type = 'image'
        this.src = src || ''
        this.width = options.width || 0
        this.height = options.height || 0
        this.alpha = options.alpha || 1
        this.angle = options.angle || 0
        this.crossOrigin = 'anonymous'

        // 图片阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    static fromURL(src, options) {
        return new Promise((resolve, reject) => {
            const instance = new Image(src, options);
            if (!instance.src) {
                reject(`Failed to load image: ${instance.src}`);
            }
            const image = new window.Image();
            image.crossOrigin = instance.crossOrigin;
            image.onload = () => {
                const {naturalWidth, naturalHeight} = image;
                // 如果 instance 没有设置宽高，使用图片原始尺寸
                if (!instance.width && !instance.height) {
                    instance.width = naturalWidth;
                    instance.height = naturalHeight;
                }
                // 如果 instance 设置了宽高，直接使用
                else if (instance.width && instance.height) {
                    image.width = instance.width;
                    image.height = instance.height;
                }
                // 如果只设置了宽度，按比例计算高度
                else if (instance.width && !instance.height) {
                    image.width = instance.width;
                    image.height = instance.height = instance.width * naturalHeight / naturalWidth;
                }
                // 如果只设置了高度，按比例计算宽度
                else if (instance.height && !instance.width) {
                    image.height = instance.height;
                    image.width = instance.width = instance.height * naturalWidth / naturalHeight;
                }
                instance[IMAGE_SYMBOL] = image
                resolve(instance);
            };
            image.onerror = () => {
                reject(`Failed to load image: ${instance.src}`);
            };
            image.src = instance.src;
        })
    }


    contains(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }

    draw(ctx) {
        if (!this[IMAGE_SYMBOL]) {
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
        ctx.drawImage(this[IMAGE_SYMBOL], -this.width / 2, -this.height / 2, this.width, this.height);
        // 恢复画布到之前保存的状态
        ctx.restore();
    }
}

export default Image;
