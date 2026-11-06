/**
 * 磁性吸附引擎（策略 / 引擎抽取）：对齐吸附的纯几何计算，与元素树、画布 DOM 解耦。
 * 宿主每次计算注入配置快照（开关 / 阈值 / 缩放 / 画布尺寸 / 候选元素）与
 * 「元素 → 画布绝对包围盒」访问器，本类可独立单测
 */

/**
 * 获取作为吸附目标的锚点集合
 * 旋转元素仅提供中心锚点，避免绘制误导性的边线
 * @param {Object} el - 元素
 * @param {(el: Object) => {x: number, y: number, w: number, h: number}} boundsOf - 元素画布绝对包围盒
 * @returns {{left: number|null, right: number|null, top: number|null, bottom: number|null, cx: number, cy: number}}
 */
function targetAnchors(el, boundsOf) {
    // 组合内子元素为组内局部坐标，统一换算为画布绝对坐标参与吸附
    const {x, y, w, h} = boundsOf(el);
    const cx = x + w / 2;
    const cy = y + h / 2;
    if (el.angle) {
        return {left: null, right: null, top: null, bottom: null, cx, cy};
    }
    return {left: x, right: x + w, top: y, bottom: y + h, cx, cy};
}

/**
 * 根据自由位置计算被拖元素组的轴对齐包围盒
 * 被拖组含旋转元素时仅以中心点参与（边锚点为 null）
 * @param {Array} targetElements - 被拖元素
 * @param {Map} freePositions - 自由位置 Map<el, {x,y,cx,cy}>
 * @param {(el: Object) => {x: number, y: number, w: number, h: number}} boundsOf - 元素画布绝对包围盒
 * @returns {{left: number|null, right: number|null, top: number|null, bottom: number|null, cx: number, cy: number, hasRotated: boolean}}
 */
function draggedBounds(targetElements, freePositions, boundsOf) {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    let sumCx = 0, sumCy = 0;
    let hasRotated = false;
    for (const el of targetElements) {
        if (el.angle) hasRotated = true;
        const fp = freePositions.get(el);
        const {w, h} = boundsOf(el);
        // 隔离模式下被拖子元素为组内局部坐标，换算为画布绝对坐标参与吸附计算
        const x = fp.x + (fp.offX || 0), y = fp.y + (fp.offY || 0);
        sumCx += x + w / 2;
        sumCy += y + h / 2;
        left = Math.min(left, x);
        right = Math.max(right, x + w);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y + h);
    }
    const count = targetElements.length || 1;
    return {
        left: hasRotated ? null : left,
        right: hasRotated ? null : right,
        top: hasRotated ? null : top,
        bottom: hasRotated ? null : bottom,
        cx: sumCx / count,
        cy: sumCy / count,
        hasRotated
    };
}

export class SnapEngine {

    /**
     * @param {Object} config
     * @param {boolean} config.enabled - 吸附开关
     * @param {number} config.threshold - 画布坐标吸附阈值
     * @param {number} config.zoom - 当前缩放
     * @param {number} config.width - 画布逻辑宽度
     * @param {number} config.height - 画布逻辑高度
     * @param {Array} config.candidates - 候选吸附元素（不含被拖元素；画布候选由引擎补充）
     * @param {(el: Object) => {x: number, y: number, w: number, h: number}} config.boundsOf - 元素画布绝对包围盒
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * 计算磁性吸附偏移量与待绘制对齐线
     * @param {Array} targetElements - 被拖元素
     * @param {Map} freePositions - 自由位置 Map<el, {x,y,cx,cy}>
     * @returns {{dx: number, dy: number, guides: Array}}
     */
    compute(targetElements, freePositions) {
        const {enabled, threshold, zoom, width, height, candidates, boundsOf} = this.config;
        if (!enabled || !targetElements || !targetElements.length) {
            return {dx: 0, dy: 0, guides: []};
        }
        const snapThreshold = threshold / (zoom || 1);
        const drag = draggedBounds(targetElements, freePositions, boundsOf);

        // 被拖组的 X / Y 锚点（旋转时仅中心）
        const dragX = drag.hasRotated
            ? [{key: 'cx', val: drag.cx}]
            : [{key: 'left', val: drag.left}, {key: 'cx', val: drag.cx}, {key: 'right', val: drag.right}];
        const dragY = drag.hasRotated
            ? [{key: 'cy', val: drag.cy}]
            : [{key: 'top', val: drag.top}, {key: 'cy', val: drag.cy}, {key: 'bottom', val: drag.bottom}];

        // 候选目标：隔离模式取当前组合的直接子元素（AI：隔离内对齐组合内部），
        // 否则取全部顶层元素；被拖元素本身排除。组合自身不可为候选：
        // 其包围盒含被拖子元素的上一帧位置，会形成自我吸附反馈（吸附线跟随元素乱跳）
        const anchors = [];
        for (const el of candidates) {
            if (targetElements.includes(el)) continue;
            anchors.push(targetAnchors(el, boundsOf));
        }
        anchors.push({
            left: 0, right: width, top: 0, bottom: height,
            cx: width / 2, cy: height / 2, isCanvas: true
        });

        // 候选锚点键：旋转目标仅中心，画布与轴对齐目标提供全部
        const tarKeysX = ['left', 'cx', 'right'];
        const tarKeysY = ['top', 'cy', 'bottom'];

        // X 轴
        let bestDx = 0, bestDxGap = snapThreshold;
        let bestX = null; // {val, target}
        for (const d of dragX) {
            for (const c of anchors) {
                for (const tk of tarKeysX) {
                    const tv = c[tk];
                    if (tv === null || tv === undefined) continue;
                    const gap = Math.abs(d.val - tv);
                    if (gap < bestDxGap) {
                        bestDxGap = gap;
                        bestDx = tv - d.val;
                        bestX = {val: tv, target: c, dragKey: d.key};
                    }
                }
            }
        }

        // Y 轴
        let bestDy = 0, bestDyGap = snapThreshold;
        let bestY = null;
        for (const d of dragY) {
            for (const c of anchors) {
                for (const tk of tarKeysY) {
                    const tv = c[tk];
                    if (tv === null || tv === undefined) continue;
                    const gap = Math.abs(d.val - tv);
                    if (gap < bestDyGap) {
                        bestDyGap = gap;
                        bestDy = tv - d.val;
                        bestY = {val: tv, target: c, dragKey: d.key};
                    }
                }
            }
        }

        // 构造对齐线
        const guides = [];
        if (bestX) {
            const t = bestX.target;
            const y1 = t.isCanvas ? 0 : Math.min(drag.top ?? drag.cy, t.top ?? t.cy);
            const y2 = t.isCanvas ? height : Math.max(drag.bottom ?? drag.cy, t.bottom ?? t.cy);
            guides.push({orient: 'v', x: bestX.val, y1, y2});
        }
        if (bestY) {
            const t = bestY.target;
            const x1 = t.isCanvas ? 0 : Math.min(drag.left ?? drag.cx, t.left ?? t.cx);
            const x2 = t.isCanvas ? width : Math.max(drag.right ?? drag.cx, t.right ?? t.cx);
            guides.push({orient: 'h', y: bestY.val, x1, x2});
        }

        return {dx: bestDx, dy: bestDy, guides};
    }
}
