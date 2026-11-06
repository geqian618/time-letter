/**
 * 组合元素（参考 AI 组合）：持有子元素的复合元素。
 * 子元素以组内局部坐标存储（组合原点为 x/y），组合的移动 / 对齐 / 吸附只需
 * 操作组合自身，与普通元素走完全相同的路径；命中任意子元素即命中整个组合
 */
import {Element} from './Element.js';

export class Group extends Element {

    constructor(options = {}) {
        super(options);
        this.type = 'group';
        this.children = Array.isArray(options.children) ? options.children : [];
    }

    /**
     * 工厂：把一组元素合成为组合。子元素坐标由画布绝对坐标转入组内局部坐标系
     * （原点取联合包围盒左上角），并继承最上层成员的层级与可拖拽性。
     * 调用方需保证 targets 为堆叠顺序且至少两个元素
     * @param {Array} targets - 待组合元素
     * @returns {Group}
     */
    static fromElements(targets) {
        let minX = Infinity, minY = Infinity;
        for (const el of targets) {
            const b = el.getSelectionBounds();
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
        }
        for (const el of targets) {
            el.x -= minX;
            el.y -= minY;
            // 旋转基准同步转入组内坐标系（与拖拽移动保持一致）
            el.centerX -= minX;
            el.centerY -= minY;
            el.status = Element.NONE;
        }
        const group = new Group({x: minX, y: minY, children: targets});
        group.order = targets[targets.length - 1].order;
        group.draggable = targets.some(el => el.draggable);
        return group;
    }

    /**
     * 解散组合：子元素由组内局部坐标恢复为画布绝对坐标（含旋转基准），
     * 继承组合的层级位置并复位状态；组合本体由调用方负责从文档移除
     * @returns {Array} 还原后的子元素
     */
    release() {
        for (const child of this.children) {
            child.x += this.x;
            child.y += this.y;
            child.centerX += this.x;
            child.centerY += this.y;
            // 继承组合的层级位置（等值排序为稳定排序，保持当前堆叠）
            child.order = this.order;
            child.status = Element.NONE;
        }
        return [...this.children];
    }

    /**
     * 联合包围盒（子元素包围盒的并集，组内局部坐标 + 组合原点）
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const child of this.children) {
            const b = child.getSelectionBounds();
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        }
        if (minX === Infinity) return {x: this.x, y: this.y, w: 0, h: 0};
        return {x: this.x + minX, y: this.y + minY, w: maxX - minX, h: maxY - minY};
    }

    // 联合包围盒尺寸（只读派生，面板与吸附可直接读取）
    get width() {
        return this.getSelectionBounds().w;
    }

    get height() {
        return this.getSelectionBounds().h;
    }

    contains(x, y) {
        return this.children.some(child => child.contains(x - this.x, y - this.y));
    }

    draw(ctx) {
        ctx.save();
        // 子元素为组内局部坐标，绘制前平移到组合原点
        ctx.translate(this.x, this.y);
        for (const child of this.children) {
            child.draw(ctx);
        }
        ctx.restore();
    }

    /**
     * 克隆组合：子元素逐个克隆（基类深拷贝不处理元素实例，会产生共享引用）
     * @returns {Group}
     */
    clone() {
        const copy = super.clone();
        copy.children = this.children.map(child => child.clone());
        return copy;
    }

}
