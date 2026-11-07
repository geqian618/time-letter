/**
 * 组合元素（参考 AI 组合）：持有子元素的复合元素。
 * 子元素以组内局部坐标存储（组合原点为 x/y），组合的移动 / 对齐 / 吸附只需
 * 操作组合自身，与普通元素走完全相同的路径；命中范围为联合包围盒（选框范围），
 * 子元素之间的空白处同样可命中并拖动整个组合
 */
import {Element} from './Element.js';

export class Group extends Element {

    constructor(options = {}) {
        super(options);
        this.type = 'group';
        // 旋转基准点（组内局部坐标）：angle≠0 时绕该点旋转。仅在旋转手势开始时捕获，
        // 子元素移动不改变基准点与原点，其余子元素不受牵连；scaleAt 时随内容等比缩放
        this.pivotX = options.pivotX || 0;
        this.pivotY = options.pivotY || 0;
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
     * 解散组合：子元素由组内局部坐标恢复为画布绝对坐标。
     * 组合自身的旋转烘入每个子元素：子中心绕组内中心旋转到画布系、子角度叠加组角度
     * （未旋转时与"直接加原点偏移"完全等价）；组合本体由调用方负责从文档移除
     * @returns {Array} 还原后的子元素
     */
    release() {
        // 旋转烘焙绕基准点；angle=0 时基准点取联合盒中心，与旧加法语义等价
        const c = this.angle ? {x: this.pivotX, y: this.pivotY} : this._localCenter();
        const rad = this.angle * Math.PI / 180;
        const cos = Math.cos(rad), sin = Math.sin(rad);
        for (const child of this.children) {
            const vx = child.centerX - c.x, vy = child.centerY - c.y;
            child.centerX = this.centerX + vx * cos - vy * sin;
            child.centerY = this.centerY + vx * sin + vy * cos;
            child.angle = ((child.angle + this.angle + 180) % 360 + 360) % 360 - 180;
            // 子元素外框由自身中心反推（其绘制在 angle=0 时以 x/y 为左上角基准，需同步落位）
            const b = child.getSelectionBounds();
            child.x = child.centerX - b.w / 2;
            child.y = child.centerY - b.h / 2;
            // 继承组合的层级位置（等值排序为稳定排序，保持当前堆叠）
            child.order = this.order;
            child.status = Element.NONE;
        }
        return [...this.children];
    }

    /**
     * 组内联合包围盒（相对组合原点的局部坐标，不含组合原点偏移）
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    _localBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const child of this.children) {
            const b = child.getSelectionBounds();
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        }
        if (minX === Infinity) return {x: 0, y: 0, w: 0, h: 0};
        return {x: minX, y: minY, w: maxX - minX, h: maxY - minY};
    }

    /**
     * 组内局部中心（联合包围盒中心）：绘制旋转与命中反旋转共用
     * @returns {{x: number, y: number}}
     */
    _localCenter() {
        const b = this._localBounds();
        return {x: b.x + b.w / 2, y: b.y + b.h / 2};
    }

    /**
     * 父系坐标 → 组内局部坐标：减组合原点，angle≠0 时再绕旋转基准点反旋转
     * @param {number} x - 父系 X
     * @param {number} y - 父系 Y
     * @returns {{x: number, y: number}}
     */
    _toLocal(x, y) {
        let px = x, py = y;
        if (this.angle) {
            const cx = this.x + this.pivotX, cy = this.y + this.pivotY;
            const rad = -this.angle * Math.PI / 180;
            const vx = x - cx, vy = y - cy;
            px = cx + vx * Math.cos(rad) - vy * Math.sin(rad);
            py = cy + vx * Math.sin(rad) + vy * Math.cos(rad);
        }
        return {x: px - this.x, y: py - this.y};
    }

    /**
     * 联合包围盒（子元素包围盒的并集，组内局部坐标 + 组合原点）。
     * 注意这是未旋转的组合内容盒；组合自身 angle 的旋转变换由选中框绘制 / 命中侧处理
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        const b = this._localBounds();
        if (!b.w && !b.h && !b.x && !b.y) return {x: this.x, y: this.y, w: 0, h: 0};
        return {x: this.x + b.x, y: this.y + b.y, w: b.w, h: b.h};
    }

    // 联合包围盒尺寸（只读派生，面板与吸附可直接读取）
    get width() {
        return this.getSelectionBounds().w;
    }

    get height() {
        return this.getSelectionBounds().h;
    }

    /**
     * 绕锚点等比缩放：组合无自身尺寸，子元素在组内局部坐标各自等比缩放，
     * 组合原点绕画布锚点同步缩放，保证子元素画布位置映射 p → 锚点 + (p - 锚点) × f；
     * 组合自身的旋转是显示期变换，与内容缩放线性可交换，带旋转时该映射仍精确成立
     */
    scaleAt(f, ax, ay) {
        for (const child of this.children) {
            child.scaleAt(f, 0, 0);
        }
        this.x = ax + (this.x - ax) * f;
        this.y = ay + (this.y - ay) * f;
        // 旋转锚定的组合中心同步缩放（未旋转时中心由绘制按 x/y 派生，此处赋值会被覆盖，无害）
        this.centerX = ax + (this.centerX - ax) * f;
        this.centerY = ay + (this.centerY - ay) * f;
        // 旋转基准点属组合内容，随局部缩放同步缩放
        this.pivotX *= f;
        this.pivotY *= f;
    }

    /**
     * 联合包围盒（选框范围）内即命中，子元素之间的空白处也可拖动组合；
     * 点先经 _toLocal 反旋转换算到组内局部坐标，与 _localBounds 同一坐标系
     * @param {number} x - 父系 X 坐标
     * @param {number} y - 父系 Y 坐标
     * @returns {boolean}
     */
    contains(x, y) {
        const b = this._localBounds();
        if (!b.w && !b.h) return false;
        const local = this._toLocal(x, y);
        return local.x >= b.x && local.x <= b.x + b.w && local.y >= b.y && local.y <= b.y + b.h;
    }

    draw(ctx) {
        ctx.save();
        if (this.angle) {
            // 旋转绕固定基准点（组内局部坐标）：原点与基准点不随子元素移动而变化，
            // 移动单个子元素时其余子元素不受牵连；中心维护为基准点的父系位置供选框 / 命中使用
            ctx.translate(this.x, this.y);
            ctx.translate(this.pivotX, this.pivotY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.pivotX, -this.pivotY);
            this.centerX = this.x + this.pivotX;
            this.centerY = this.y + this.pivotY;
        } else {
            // 未旋转：x、y 为左上角基准（缩放锚点），中心由其派生
            const c = this._localCenter();
            this.centerX = this.x + c.x;
            this.centerY = this.y + c.y;
            ctx.translate(this.x, this.y);
        }
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
