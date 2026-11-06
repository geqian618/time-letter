/**
 * 矩形元素：填充 / 描边 / 圆角 / 线型 / 阴影
 */
import {Element, getTransformScale} from './Element.js';

export class Rect extends Element {

    constructor(options) {
        super(options);
        this.type = 'rect'
        this.width = options.width || 0
        this.height = options.height || 0
        this.fill = options.fill || 'rgba(255,255,255,0)'
        this.radius = options.radius || 0
        this.stroke = options.stroke || 'rgba(0,0,0,1)'
        this.strokeWidth = options.strokeWidth || 0
        this.radius = options.radius || 0
        this.lineDash = options.lineDash || [1, 1]
        this.lineCap = options.lineCap || 'butt'
        // 图片阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    contains(x, y) {
        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
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
        return localX >= this.x && localX <= this.x + this.width && localY >= this.y && localY <= this.y + this.height;
    }


    /**
     * 选中包围盒（矩形基于 width/height）
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        return {x: this.x, y: this.y, w: this.width, h: this.height};
    }

    draw(ctx) {
        // 保存当前画布状态
        ctx.save();
        const transformScale = getTransformScale(ctx);
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth / transformScale;
        ctx.lineCap = this.lineCap;
        ctx.setLineDash([this.lineDash[0] / transformScale, this.lineDash[1] / transformScale]);

        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 1)';
        // 阴影模糊与偏移是设备空间属性，不受变换矩阵缩放，需按渲染缩放补偿
        ctx.shadowBlur = (shadowBlur || 0) * transformScale;
        ctx.shadowOffsetX = (shadowOffsetX || 0) * transformScale;
        ctx.shadowOffsetY = (shadowOffsetY || 0) * transformScale;

        if (this.angle !== 0) {
            // 首次绘制时初始化中心点（centerX/centerY 默认为 0）
            if (!this.centerX && !this.centerY) {
                this.centerX = this.x + this.width / 2;
                this.centerY = this.y + this.height / 2;
            }
            // 旋转时中心点不变：缩放导致宽高变化时，由中心点反推 x、y
            this.x = this.centerX - this.width / 2;
            this.y = this.centerY - this.height / 2;
            // 绕中心点旋转
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        } else {
            // 未旋转：x、y 为左上角基准（缩放锚点），中心点由其派生
            this.centerX = this.x + this.width / 2;
            this.centerY = this.y + this.height / 2;
        }

        // 绘制圆角
        this._drawRoundedClip(ctx)

        // 先填充，后描边
        ctx.fillRect(this.x, this.y, this.width, this.height);
        if (this.strokeWidth) {
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // 恢复画布到之前保存的状态
        ctx.restore();
    }


    // 创建圆角裁剪区域
    _drawRoundedClip(ctx) {
        if (this.radius <= 0) return;
        const x = this.x;
        const y = this.y;
        const width = this.width;
        const height = this.height;
        const radius = Math.min(this.radius, width / 2, height / 2);
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
        ctx.clip();
    }
}
