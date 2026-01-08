import Element from './Element.js'

/**
 * 可编辑文本
 */
class Text extends Element {

    constructor(text, options = {}) {

        super(options);

        // 元素类型
        this.type = 'text';

        this.width = options.width || 0

        this.height = options.height || 0

        // 文本内容
        this.text = text || '';

        // 可编辑
        this.editable = options.editable !== undefined ? options.editable : false;

        // 文字间距
        this.spacing = options.spacing || 0;

        this.angle = 0;

        // 字体属性
        this.fontSize = options.fontSize || 16;
        this.fontStyle = options.fontStyle || 'normal';
        this.fontFamily = options.fontFamily || 'Microsoft YaHei';
        this.fontWeight = options.fontWeight || 400;
        this.lineHeight = options.lineHeight || 1.5;
        // 颜色
        this.fontColor = options.fontColor || 'black';
        this.highlightColor = options.highlightColor || 'rgba(180,179,179,0.2)';
        // 文本阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height
    }


    draw(ctx) {

        ctx.save();

        ctx.textBaseline = 'top';

        ctx.textAlign = 'left'

        // 字体设置
        ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", "Microsoft YaHei", sans-serif`;
        // 字体颜色
        ctx.fillStyle = this.fontColor;

        // 默认不透明黑色
        ctx.shadowColor = this.shadowColor || 'rgba(0,0,0,1)';
        // 默认模糊 0 像素
        ctx.shadowBlur = this.shadowBlur || 0;
        // 默认X偏移
        ctx.shadowOffsetX = this.shadowOffsetX || 0;
        // 默认Y偏移
        ctx.shadowOffsetY = this.shadowOffsetY || 0;

        let currentX = this.x;

        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            ctx.fillText(char, currentX, this.y);
            if (i === this.text.length - 1) {
                currentX += ctx.measureText(char).width
                break
            }
            currentX += ctx.measureText(char).width + this.spacing;
        }
        this.width = currentX - this.x;
        this.height = this.fontSize;
        ctx.restore();
    }
}

export default Text
