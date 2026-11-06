/**
 * 对齐 / 分布策略（策略模式）：以参考包围盒为基准的纯几何计算，与编辑器状态解耦。
 * 未知对齐模式与原实现一致：不移动任何元素
 */

// 对齐模式 → 「元素包围盒 + 参考包围盒 → 位移」的策略映射
export const ALIGN_MODES = {
    'left': (b, r) => ({dx: r.x - b.x, dy: 0}),
    'center-h': (b, r) => ({dx: r.x + r.w / 2 - (b.x + b.w / 2), dy: 0}),
    'right': (b, r) => ({dx: r.x + r.w - (b.x + b.w), dy: 0}),
    'top': (b, r) => ({dx: 0, dy: r.y - b.y}),
    'center-v': (b, r) => ({dx: 0, dy: r.y + r.h / 2 - (b.y + b.h / 2)}),
    'bottom': (b, r) => ({dx: 0, dy: r.y + r.h - (b.y + b.h)}),
};

/**
 * 位移应用到元素：同步作用到 x/y 与旋转基准 centerX/centerY（与拖拽移动保持一致）
 * @param {Object} el - 元素
 * @param {number} dx - X 位移
 * @param {number} dy - Y 位移
 */
export function moveElement(el, dx, dy) {
    el.x += dx;
    el.y += dy;
    el.centerX += dx;
    el.centerY += dy;
}

/**
 * 对齐元素到参考包围盒
 * @param {Array} targets - 目标元素
     * @param {'left'|'center-h'|'right'|'top'|'center-v'|'bottom'} mode - 对齐模式
 * @param {{x: number, y: number, w: number, h: number}} refBounds - 参考包围盒
 */
export function alignToReference(targets, mode, refBounds) {
    const strategy = ALIGN_MODES[mode];
    // 未知模式：与原实现一致，不移动任何元素且不触发重绘（返回 false）
    if (!strategy) return false;
    for (const el of targets) {
        const b = el.getSelectionBounds();
        const {dx, dy} = strategy(b, refBounds);
        if (!dx && !dy) continue;
        moveElement(el, dx, dy);
    }
    return true;
}

/**
 * 分布元素：以首尾元素为基准，中间元素沿分布方向按边缘间隙等距排布（参考 PS 分布间距）
 * @param {Array} targets - 目标元素（≥3）
 * @param {'horizontal'|'vertical'} mode - 分布方向
 */
export function distributeByEdges(targets, mode) {
    const horizontal = mode === 'horizontal';
    // 无提前返回路径：只要走到这里就与原实现一样执行重绘
    // 按分布方向上的边缘排序，确定首尾基准
    const sorted = [...targets].sort((a, b) => {
        const ba = a.getSelectionBounds();
        const bb = b.getSelectionBounds();
        return horizontal ? ba.x - bb.x : ba.y - bb.y;
    });
    const first = sorted[0].getSelectionBounds();
    const last = sorted[sorted.length - 1].getSelectionBounds();
    // 间隙等距：首尾元素不动，可分配总间隙 = 首尾内边缘距离 - 中间元素占宽（高）
    const span = horizontal
        ? last.x - (first.x + first.w)
        : last.y - (first.y + first.h);
    const middleSize = sorted.slice(1, -1).reduce((sum, el) => {
        const b = el.getSelectionBounds();
        return sum + (horizontal ? b.w : b.h);
    }, 0);
    const gap = (span - middleSize) / (sorted.length - 1);
    let cursor = horizontal ? first.x + first.w + gap : first.y + first.h + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
        const el = sorted[i];
        const b = el.getSelectionBounds();
        let dx = 0, dy = 0;
        if (horizontal) {
            dx = cursor - b.x;
            cursor += b.w + gap;
        } else {
            dy = cursor - b.y;
            cursor += b.h + gap;
        }
        if (!dx && !dy) continue;
        moveElement(el, dx, dy);
    }
    return true;
}

/**
 * 分布元素：以首尾元素为基准，中间元素沿分布方向按中心点等距排布（参考 PS 分布中心）
 * @param {Array} targets - 目标元素（≥3）
 * @param {'horizontal'|'vertical'} mode - 分布方向
 */
export function distributeByCenters(targets, mode) {
    const horizontal = mode === 'horizontal';
    // 按分布方向上的中心点排序，确定首尾基准
    const sorted = [...targets].sort((a, b) => {
        const ba = a.getSelectionBounds();
        const bb = b.getSelectionBounds();
        return horizontal
            ? (ba.x + ba.w / 2) - (bb.x + bb.w / 2)
            : (ba.y + ba.h / 2) - (bb.y + bb.h / 2);
    });
    const first = sorted[0].getSelectionBounds();
    const last = sorted[sorted.length - 1].getSelectionBounds();
    const start = horizontal ? first.x + first.w / 2 : first.y + first.h / 2;
    const end = horizontal ? last.x + last.w / 2 : last.y + last.h / 2;
    // 首尾中心重合无可分布：与原实现一致，不触发重绘（返回 false）
    if (start === end) return false;
    const step = (end - start) / (sorted.length - 1);
    for (let i = 1; i < sorted.length - 1; i++) {
        const el = sorted[i];
        const b = el.getSelectionBounds();
        let dx = 0, dy = 0;
        if (horizontal) dx = start + step * i - (b.x + b.w / 2);
        else dy = start + step * i - (b.y + b.h / 2);
        if (!dx && !dy) continue;
        moveElement(el, dx, dy);
    }
    return true;
}
