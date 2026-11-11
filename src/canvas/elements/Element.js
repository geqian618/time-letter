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

    // 缩放手柄边长（屏幕像素，绘制与命中共用）
    static HANDLE_SIZE = 8

    // Node 端 SHADOW_BLUR 偏差比例：Node 环境构造时阴影模糊按此系数衰减，使导出渲染的阴影观感与屏幕一致
    static NODE_SHADOW_BLUR_RATIO = 0.7

    constructor(options) {

        // Node 环境构造时阴影模糊按 NODE_SHADOW_BLUR_RATIO 衰减（原 worker 导出预处理逻辑
        // 随环境判定下沉到元素层，工厂递归构造天然覆盖组合子元素）
        if (typeof window === 'undefined' && options.shadow?.blur) {
            options.shadow.blur *= Element.NODE_SHADOW_BLUR_RATIO;
        }

        // 文本对象 id
        this.id = Date.now() + Math.random();
        // 坐标
        this.x = options.x || 0;

        this.y = options.y || 0;

        // 中心点（渲染派生值，普通属性保证对 Proxy 观察层可写，导出由 toJSON 排除）
        this.centerX = 0;

        this.centerY = 0;

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

        // 是否可旋转（组合不支持旋转：绘制仅平移，命中与包围盒均未适配旋转变换）
        this.rotatable = options.rotatable !== undefined ? options.rotatable : true;

    }

    // 派生字段不进 JSON 导出（原私有访问器不可枚举行为的等价实现）
    toJSON() {
        const {centerX, centerY, ...rest} = this;
        return rest;
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
     * 必须经构造函数创建实例（如 LazyImage 的 image 引用需按构造语义重置），
     * 实例自身的可枚举属性整体作为 options 传入，构造后逐键覆盖默认值
     * @returns {Element}
     */
    clone() {
        let copy;
        // 实例自身的可枚举属性即各子类的构造参数，整体作为 options 传入
        const options = this;
        if (this.type === 'text') {
            copy = new this.constructor(this.text, options);
        } else if (this.type === 'image') {
            // Image 首参为图片对象；LazyImage 无首参，从 options（元素自身属性，已含 src/path）取源
            copy = this.image ? new this.constructor(this.image, options) : new this.constructor(options);
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
        // 新 id：hasElement / removeElement 均按 id 匹配，复用 id 会误伤原元素
        copy.id = Date.now() + Math.random();
        copy.status = Element.NONE;
        return copy;
    }

    /**
     * 选框与手柄几何（绘制与拖拽命中共用，保证两者永远一致）。
     * 坐标为元素自身坐标系（含旋转前的选框），调用方负责旋转换算；
     * 旋转无专用手柄，命中逻辑（角外热区）在编辑器，是否可旋转看 rotatable
     * @param {number} transformScale - 画布变换缩放（屏幕像素 → 画布单位换算用）
     * @returns {{sx, sy, sw, sh, handles: number[][]}}
     */
    getSelectionFrame(transformScale) {
        const {x, y, w, h} = this.getSelectionBounds();
        // 应用偏移量：选框向四周扩展 selectionOffset 像素
        const offset = (this.selectionOffset || 1) / transformScale;
        const sx = x - offset;
        const sy = y - offset;
        const sw = w + offset * 2;
        const sh = h + offset * 2;
        return {
            sx, sy, sw, sh,
            // 8 个缩放手柄中心：4 个角 + 4 个边中点
            handles: [
                [sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh],
                [sx + sw / 2, sy], [sx + sw / 2, sy + sh], [sx, sy + sh / 2], [sx + sw, sy + sh / 2]
            ],
        };
    }

    /**
     * 绕锚点等比缩放：尺寸模型为 width/height × scale 的类型（Image / LazyImage）直接可用。
     * 锚点坐标与元素 x/y 同一坐标系（组合内子元素为组内局部坐标）；
     * x/y 与 centerX/centerY 同步缩放，与绘制时"旋转由中心反推 x/y、未旋转由 x/y 派生中心"的约定保持一致
     * @param {number} f - 缩放系数（相对当前尺寸）
     * @param {number} ax - 锚点 X
     * @param {number} ay - 锚点 Y
     */
    scaleAt(f, ax, ay) {
        this.scale = (this.scale || 1) * f;
        this.x = ax + (this.x - ax) * f;
        this.y = ay + (this.y - ay) * f;
        this.centerX = ax + (this.centerX - ax) * f;
        this.centerY = ay + (this.centerY - ay) * f;
    }

    /**
     * 绘制选中效果（实线包围盒 + 8 个方形缩放控制点）
     * 旋转无专用手柄：鼠标悬浮在选框角部外侧热区即出现旋转光标（命中逻辑在编辑器）
     * @param ctx
     */
    selection(ctx) {
        const transformScale = getTransformScale(ctx);
        const lineWidth = 1 / transformScale;
        const frame = this.getSelectionFrame(transformScale);
        const {sx, sy, sw, sh} = frame;
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
        const handleSize = Element.HANDLE_SIZE / transformScale;
        const half = handleSize / 2;
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 1 / transformScale;
        for (const [hx, hy] of frame.handles) {
            ctx.beginPath();
            ctx.rect(hx - half, hy - half, handleSize, handleSize);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

}
