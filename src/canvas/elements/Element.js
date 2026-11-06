/**
 * 元素基类：所有画布元素的公共状态（坐标 / 旋转 / 选中态 / 命中）与选中框绘制
 */

/**
 * 由变换矩阵求整体缩放（线宽 / 控制点等屏幕像素尺寸的归一化用）
 * @param {CanvasRenderingContext2D} ctx
 * @returns {number}
 */
export function getTransformScale(ctx) {
    const {a, b, c, d} = ctx.getTransform();
    return Math.sqrt(Math.abs(a * d - b * c)) || 1;
}

export class Element {

    static NONE = 'none'

    static SELECTED = 'selected'

    static EDITING = 'editing'

    // 中心点坐标（所有形状通用；私有访问器，不可枚举，不进入 JSON 导出）
    #centerX = 0;

    #centerY = 0;

    constructor(options) {

        // 文本对象 id
        this.id = Date.now() + Math.random();
        // 坐标
        this.x = options.x || 0;

        this.y = options.y || 0;

        // 旋转角度（所有形状通用）
        this.angle = options.angle || 0;

        this.status = 'none'

        this.order = options.order || 0;

        // 是否可选中
        this.selectable = options.selectable !== undefined ? options.selectable : true;

        // 是否可拖拽
        this.draggable = options.draggable !== undefined ? options.draggable : false;

        this.meta = options.meta || null

        // 选中效果颜色，可自行覆盖
        this.selectionColor = options.selectionColor || '#0066FF';

        // 选框偏移量，选框向四周扩展的像素值，可自行覆盖
        this.selectionOffset = options.selectionOffset || 0;

    }

    set centerX(value) {
        this.#centerX = value;
    }

    get centerX() {
        return this.#centerX;
    }

    set centerY(value) {
        this.#centerY = value;
    }

    get centerY() {
        return this.#centerY;
    }

    static getTransformScale(ctx) {
        return getTransformScale(ctx);
    }

    /**
     * 元素的轴对齐包围盒（选中框、控制点、吸附均基于此）
     * 基类不假设具体形状（如圆没有 width/height），故不提供默认实现，
     * 由各子类按自身几何实现
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        throw new Error('getSelectionBounds() must be implemented by subclass');
    }

    /**
     * 克隆元素：生成属性相同、id 不同的独立副本（Alt + 拖拽拷贝用）
     * 必须经构造函数创建实例：私有字段（#centerX / Text 的 #width/#chars 等）
     * 只会在构造时安装，Object.create 出的空壳调用 setter 会因私有品牌检查抛 TypeError
     * @returns {Element}
     */
    clone() {
        let copy;
        // 实例自身的可枚举属性即各子类的构造参数，整体作为 options 传入
        const options = this;
        if (this.type === 'text') {
            copy = new this.constructor(this.text, options);
        } else if (this.type === 'image') {
            // Image 首参为图片对象，LazyImage 首参为 src（加载前 image 为 null）
            copy = this.image ? new this.constructor(this.image, options) : new this.constructor(this.src, options);
        } else {
            copy = new this.constructor(options);
        }
        // 嵌套纯对象（shadow / lineDash 等）深拷贝，避免副本与原元素共享引用
        const deepCopy = (value) => {
            if (Array.isArray(value)) return value.map(deepCopy);
            if (value && typeof value === 'object'
                && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
                const result = {};
                for (const key of Object.keys(value)) {
                    result[key] = deepCopy(value[key]);
                }
                return result;
            }
            return value;
        };
        // 覆盖构造函数写入的默认值（含 LazyImage 被重置为 null 的 image 引用）
        for (const key of Object.keys(this)) {
            copy[key] = deepCopy(this[key]);
        }
        // 访问器背后的私有字段不随自身属性拷贝，显式赋值走 setter
        copy.centerX = this.centerX;
        copy.centerY = this.centerY;
        if (this.type === 'text') {
            copy.width = this.width;
            copy.height = this.height;
            copy.chars = this.chars;
            copy.lines = this.lines;
        }
        // 新 id：hasElement / removeElement 均按 id 匹配，复用 id 会误伤原元素
        copy.id = Date.now() + Math.random();
        copy.status = Element.NONE;
        return copy;
    }

    /**
     * 绘制选中效果（实线包围盒 + 8 个方形控制点）
     * 仅绘制外观，不实现拖拽缩放/旋转交互
     * @param ctx
     */
    selection(ctx) {
        const transformScale = getTransformScale(ctx);
        const lineWidth = 1 / transformScale;
        const {x, y, w, h} = this.getSelectionBounds();
        // 应用偏移量：选框向四周扩展 selectionOffset 像素
        const offset = [this.selectionOffset || 1] / transformScale;
        const sx = x - offset;
        const sy = y - offset;
        const sw = w + offset * 2;
        const sh = h + offset * 2;
        ctx.save();
        ctx.setLineDash([]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.selectionColor;
        ctx.lineCap = 'butt';
        if (this.angle) {
            // 平移到中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }
        // 实线包围盒
        ctx.beginPath();
        ctx.rect(sx, sy, sw, sh);
        ctx.stroke();
        // 8 个控制点：4 个角 + 4 个边中点
        const handleSize = 8 / transformScale;
        const half = handleSize / 2;
        const handles = [
            [sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh],
            [sx + sw / 2, sy], [sx + sw / 2, sy + sh], [sx, sy + sh / 2], [sx + sw, sy + sh / 2]
        ];
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 1 / transformScale;
        for (const [hx, hy] of handles) {
            ctx.beginPath();
            ctx.rect(hx - half, hy - half, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

}
