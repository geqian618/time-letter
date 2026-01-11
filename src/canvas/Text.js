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
        // 文本排列方向
        this.direction = options.direction || 'horizontal';
        // 可编辑
        this.editable = options.editable !== undefined ? options.editable : false;
        // 文字间距
        this.spacing = options.spacing || 0;
        // 旋转角度
        this.angle = options.angle || 0;

        // 字体属性
        this.fontSize = options.fontSize || 16;
        this.fontStyle = options.fontStyle || 'normal';
        this.fontFamily = options.fontFamily || 'Microsoft YaHei';
        this.fontWeight = options.fontWeight || 400;
        this.lineHeight = options.lineHeight || 1.5;

        // 颜色
        this.fontColor = options.fontColor || 'black';

        this.highlightColor = options.highlightColor || 'rgba(255,255,255,0.2)';

        // 文本阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };


        this.hiddenInput = null

        this.cursor = {
            start: 0,
            end: 0
        }
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
        ctx.shadowColor = this.shadow.color;
        // 默认模糊 0 像素
        ctx.shadowBlur = this.shadow.blur;
        // 默认X偏移
        ctx.shadowOffsetX = this.shadow.offsetX;
        // 默认Y偏移
        ctx.shadowOffsetY = this.shadow.offsetY;

        const {charPositions, height, width} = this.direction === 'vertical'
            ? this.parseVerticalChars(ctx)
            : this.parseHorizontalChars(ctx)

        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + width / 2;
            const centerY = this.y + height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 绘制每个字符
        for (const pos of charPositions) {
            ctx.fillText(pos.char, pos.x, pos.y);
        }

        this.width = width;
        this.height = height

        ctx.restore();
    }


    parseHorizontalChars(ctx) {
        let currentX = this.x;
        const charPositions = [];
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const charWidth = ctx.measureText(char).width;
            charPositions.push({char, x: currentX, y: this.y, width: charWidth, height: this.fontSize});
            currentX += charWidth + (i < this.text.length - 1 ? this.spacing : 0);
        }
        return {
            width: currentX - this.x,
            height: this.fontSize,
            charPositions
        };
    }

    parseVerticalChars(ctx) {
        let currentY = this.y;
        const charPositions = [];
        let maxCharWidth = 0;
        // 先测量所有字符的宽度，找出最大宽度
        const charWidths = [];
        for (let i = 0; i < this.text.length; i++) {
            const charWidth = ctx.measureText(this.text[i]).width;
            charWidths.push(charWidth);
            maxCharWidth = Math.max(maxCharWidth, charWidth);
        }
        // 根据居中对齐方式计算x坐标
        for (let i = 0; i < this.text.length; i++) {
            // 计算当前字符在最大宽度内居中的x坐标
            const charX = this.x + (maxCharWidth - charWidths[i]) / 2;
            charPositions.push({
                char: this.text[i],
                x: charX,
                y: currentY,
                width: charWidths[i],
                height: this.fontSize
            });
            currentY += this.fontSize + (i < this.text.length - 1 ? this.spacing : 0);
        }
        return {
            width: maxCharWidth,
            height: currentY - this.y,
            charPositions
        };
    }

    selection(ctx, zoom) {
        let dashPattern = [5, 3], color = 'red', lineCap = 'butt'
        const lineWidth = 1 / zoom;
        ctx.save();
        ctx.setLineDash([dashPattern[0] / zoom, dashPattern[1] / zoom]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;
        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        ctx.beginPath();
        ctx.rect(this.x - lineWidth, this.y - lineWidth, this.width + 2 * lineWidth, this.height + 2 * lineWidth);
        ctx.stroke();
        ctx.restore();
    }

}

export default Text
