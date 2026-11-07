/**
 * Canvas 编辑器：状态与交互编排（选中 / 拖拽 / 吸附 / 文本编辑 / 隔离模式 / 历史集成 / 导入导出）。
 *
 * 模块划分（本文件只保留编辑器编排，职责单一的可复用逻辑下沉到子模块）：
 * - core/history-manager.js  撤销 / 恢复栈纪律（策略注入 capture / restore）
 * - core/reactive-observer.js 响应式数据监听（观察者）
 * - core/event-emitter.js    事件总线（观察者）
 * - core/snap-engine.js      磁性吸附纯几何计算
 * - core/align-strategies.js 对齐 / 分布策略
 * - core/text-caret.js       文本光标与度量纯计算
 * - elements/*               元素体系与元素工厂（工厂模式）
 */
import {Element, getTransformScale} from './elements/Element.js';
import {Text, EditableText} from './elements/TextElement.js';
import {Image, LazyImage} from './elements/ImageElement.js';
import {Rect} from './elements/RectElement.js';
import {Group} from './elements/GroupElement.js';
import {createElement} from './elements/element-factory.js';
import {EventEmitter} from './core/event-emitter.js';
import {HistoryManager} from './core/history-manager.js';
import {ReactiveObserver} from './core/reactive-observer.js';
import {SnapEngine} from './core/snap-engine.js';
import {alignToReference, distributeByEdges, distributeByCenters} from './core/align-strategies.js';
import * as textCaret from './core/text-caret.js';

/**
 * 生成角部朝向的旋转光标（CSS 光标图无法动态旋转，四个角各预生成一个方向）：
 * 一段 96° 弧线两端各一个反向切向箭头，白色主体黑色描边（与系统箭头 / 缩放手柄同风格），
 * rotation 使弧的凸面朝向所抓的角（0°=凸向左上 NW，顺时针每角 +90°），热点取弧心与抓取角重合
 */
const rotateCursor = (rotation) => {
    const C = 16;
    const R = 5.5;
    const rad = (d) => d * Math.PI / 180;
    const round = (n) => +n.toFixed(2);
    const pt = (a) => [C + R * Math.cos(rad(a)), C + R * Math.sin(rad(a))];
    // 弧自北偏东(-80°)逆时针画到西偏南(-176°)，跨度 96°，中点 -128° 即凸面朝角方向，旋转角叠加
    const a1 = -80 + rotation;
    const a2 = -176 + rotation;
    const [ax, ay] = pt(a1);
    const [bx, by] = pt(a2);
    // 箭头：tip 沿切向伸出 4.5，底边沿径向 ±2.8；A 端顺时针切向、B 端逆时针切向（反向）
    const head = (a, tan) => {
        const [px, py] = pt(a);
        const n = [Math.cos(rad(a)), Math.sin(rad(a))];
        return `M${round(px + 4.5 * tan[0])} ${round(py + 4.5 * tan[1])} `
            + `${round(px + 2.8 * n[0])} ${round(py + 2.8 * n[1])} `
            + `${round(px - 2.8 * n[0])} ${round(py - 2.8 * n[1])}Z`;
    };
    const arc = `M${round(ax)} ${round(ay)}A${R} ${R} 0 0 0 ${round(bx)} ${round(by)}`;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">'
        // 黑色垫底仅比白芯宽 0.8，露出约 0.4px 描边
        + `<path d="${arc}" fill="none" stroke="black" stroke-width="2.8" stroke-linecap="round"/>`
        + `<path d="${arc}" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>`
        + `<path d="${head(a1, [-Math.sin(rad(a1)), Math.cos(rad(a1))])}" fill="white" stroke="black" stroke-width="0.4" stroke-linejoin="round"/>`
        + `<path d="${head(a2, [Math.sin(rad(a2)), -Math.cos(rad(a2))])}" fill="white" stroke="black" stroke-width="0.4" stroke-linejoin="round"/>`
        + '</svg>';
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 16 16, auto`;
};

class CanvasEditor {

    // 事件名：选中 / 移动 / 添加 / 属性更新 / 历史变化
    static SELECTION_OBJECT = 'selection:object'

    static MOVE_OBJECT = 'move:object'

    static ADD_OBJECT = 'add:object'

    static UPDATE_OBJECT = 'update:object'

    static HISTORY_CHANGE = 'history:change'

    // 隔离模式下组合外部内容的降维透明度（参考 AI 隔离模式的半透明效果）
    static ISOLATION_DIM_ALPHA = 0.35

    // 缩放手柄的对位映射：0-3 为四角（NW/NE/SW/SE）对应对角，4-7 为边中点（上/下/左/右）对应对边
    static HANDLE_MIRROR = [3, 2, 1, 0, 5, 4, 7, 6]

    // 缩放手柄悬浮光标（与 HANDLE_MIRROR 同序），拖拽与悬浮共用
    static HANDLE_CURSORS = ['nwse-resize', 'nesw-resize', 'nesw-resize', 'nwse-resize', 'ns-resize', 'ns-resize', 'ew-resize', 'ew-resize']

    // 旋转光标：CSS 光标图无法动态旋转，15° 一档预生成 24 个朝向，
    // 按触发角的基准朝向 + 元素当前旋转角取最接近一档，使弧的凸面始终包住所抓的角
    static ROTATE_CURSORS = Array.from({length: 24}, (_, i) => rotateCursor(i * 15))

    // 触发角的基准朝向（角序 0=NW/1=NE/2=SW/3=SE → 凸面朝向 0°/90°/270°/180°）
    static CORNER_CURSOR_BASE = [0, 90, 270, 180]

    /**
     * 取触发角在元素当前旋转下应使用的旋转光标（15° 一档就近匹配）
     * @param {number} corner - 触发角序号（0=NW/1=NE/2=SW/3=SE）
     * @param {number} angle - 元素当前旋转角（度，顺时针为正）
     * @returns {string} CSS cursor 值
     */
    static getRotateCursor(corner, angle) {
        const deg = ((this.CORNER_CURSOR_BASE[corner] + (angle || 0)) % 360 + 360) % 360;
        return this.ROTATE_CURSORS[Math.round(deg / 15) % 24];
    }

    // 角部旋转热区半径（屏幕像素）：选框角点（含选框外沿）周围一圈，缩放方块手柄优先命中
    static ROTATE_CORNER_REACH = 18

    /**
     * 构造函数
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {Object} options - 配置选项
     */
    constructor(canvas, options = {}) {

        // 是否为浏览器环境
        this.isBrowser = typeof window !== 'undefined'

        // 缓存图片
        this.cache = new Map();

        // 获取 Canvas 元素和上下文
        this.canvas = canvas;

        // 事件触发作用域
        this.eventScope = options.eventScope || this.canvas;

        this.ctx = this.canvas.getContext('2d');

        // 元素数据存储
        this.elements = [];

        this.activeElements = [];

        // 隔离模式：进入其内部单独编辑的组合 id（按 id 解析，撤销 / 恢复重建实例后仍有效）
        this.isolationGroupId = null;

        // 默认不开启图片缓存
        this.enableCache = options.enableCache || false;

        // canvas 宽高是否必须为整数值
        this.strictIntegerDimensions = options.strictIntegerDimensions || false;

        this.width = options.width || this.canvas.width || 0;

        this.height = options.height || this.canvas.height || 0;

        this.zoom = options.zoom || 1;

        this.backgroundColor = options.backgroundColor || 'rgba(255,255,255,0)';

        this.showGrid = options.showGrid || false;

        this.gridSize = options.gridSize || 20;

        this.gridColor = options.gridColor || '#e3e0e0';

        // 对齐吸附配置
        this.snapEnabled = options.snapEnabled !== false;

        this.snapThreshold = options.snapThreshold || 6;

        // 对齐线颜色，默认参考 Photoshop 智能参考线的洋红色
        this.guideColor = options.guideColor || '#FF00FF';

        // 当前帧待绘制的对齐线
        this.activeGuides = [];

        // 编辑状态
        this.editingText = null;
        this.isEditing = false;
        this.cursorStart = 0;
        this.cursorEnd = 0

        this.cursorBlinkInterval = null;

        // 动态创建的输入框
        this.hiddenInput = null;


        // 事件回调（观察者：Set 保序、同步触发）
        this.events = new EventEmitter();

        // 标记是否处于 order 变更触发的内部排序中
        this._sorting = false;

        // 撤销 / 恢复：栈纪律由 HistoryManager 负责，快照语义（生成 / 应用）留在编辑器
        this.history = new HistoryManager({
            capture: () => this._createSnapshot(),
            restore: (snapshot) => this._applySnapshot(snapshot),
            beforeApply: () => this.isEditing && this.finishEditing(),
            onChange: (type) => this._emitHistoryChange(type),
            enabled: options.enableHistory !== false,
            maxSize: options.maxHistory || 50,
        });

        // 绑定事件处理函数
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        // this.handleKeyUp = this.handleKeyUp.bind(this);
        // this.handleBlur = this.handleBlur.bind(this);

        // 初始化
        this.init();
    }


    /**
     * 初始化编辑器
     */
    init() {

        this.applyContextQuality();

        this.setupCanvas();

        // 仅浏览器环境生效
        if (this.isBrowser) {
            this.eventScope.addEventListener('mousedown', this.handleMouseDown);
            this.eventScope.addEventListener('mousemove', this.handleMouseMove);
            this.eventScope.addEventListener('dblclick', this.handleDoubleClick);
            this.createHiddenInput();
            // 设置响应式
            this.elements = new ReactiveObserver([], (value) => {
                const {target, property} = value;
                if (['chars', 'ascent', 'descent', 'centerX', 'centerY', 'status'].includes(property)) return;
                // 跳过 order 变更内部排序触发的冗余回调
                if (property === 'sort' && this._sorting) return;
                this.events.emit(CanvasEditor.UPDATE_OBJECT, target);
                if (property === 'order') {
                    this._sorting = true;
                    this.elements.sort((a, b) => a.order - b.order);
                    this._sorting = false;
                }
                // 历史记录：结构变更（增删清排序）立即入栈，属性变更防抖合并为一条；
                // 渲染派生属性（如首次绘制测量回写的 width/height/lines）不算编辑，跳过
                if (HistoryManager.ARRAY_METHODS.includes(property)) {
                    this.history.push();
                } else if (!HistoryManager.DERIVED_PROPS.includes(property)) {
                    this.history.schedule();
                }
            }, {
                deep: true
            })

            // 以初始空状态为基线快照，首个变更可通过 undo 回退到空画布
            this.history.push();
        }
    }

    /**
     * 应用高质量渲染选项。
     * 注意：setupCanvas 中重设 canvas.width 会把 2D 上下文状态整体重置为默认值
     * （imageSmoothing / fontHinting 等全部丢失），因此每次尺寸变更后都必须重新应用，
     * 否则缩放或加载预设后文字平滑与字形提示设置静默失效
     */
    applyContextQuality() {
        const ctx = this.ctx;
        if (!ctx) return;
        ctx.patternQuality = 'best';
        ctx.quality = 'best'
        ctx.antialias = 'subpixel'
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high'
        ctx.fontHinting = false
    }


    /**
     * 设置 Canvas 尺寸和缩放
     */
    setupCanvas() {

        const dpr = this.isBrowser ? (window.devicePixelRatio || 1) : 1;

        // 防御：非法尺寸/缩放会让 canvas.width 经 WebIDL 转成巨值无符号数（直接 OOM 崩溃），
        // NaN 则得到 0 宽高的空白画布；此时保持上一次有效状态
        if (![this.width, this.height, this.zoom].every(v => Number.isFinite(v) && v > 0)) {
            console.warn(`[CanvasEditor] 忽略非法尺寸/缩放: width=${this.width}, height=${this.height}, zoom=${this.zoom}`);
            return;
        }

        // 重新计算缩放因子，使逻辑坐标精确对应物理像素
        let scaleX = this.zoom * dpr;
        let scaleY = this.zoom * dpr;

        // 计算尺寸
        let physicalWidth = this.width * this.zoom * dpr;
        let physicalHeight = this.height * this.zoom * dpr;

        // canvas 宽高是否必须为整数值
        if (this.strictIntegerDimensions) {
            physicalWidth = Math.round(physicalWidth);
            physicalHeight = Math.round(physicalHeight);
            scaleX = physicalWidth / this.width;
            scaleY = physicalHeight / this.height;
        }

        // 设置物理尺寸
        this.canvas.width = physicalWidth;
        this.canvas.height = physicalHeight;

        // 浏览器环境设置样式
        if (this.isBrowser && this.canvas.style) {
            const cssWidth = this.width * this.zoom;
            const cssHeight = this.height * this.zoom;
            this.canvas.style.width = `${cssWidth}px`;
            this.canvas.style.height = `${cssHeight}px`;
        }

        // 重置并应用变换
        this.ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

        // 重设 canvas.width 已把上下文状态重置为默认值，重新应用高质量渲染选项
        this.applyContextQuality();

        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);
    }


    /**
     * 绑定 canvas 相关事件
     * @param event
     * @param callback
     */
    on(event, callback) {
        this.events.on(event, callback);
    }


    /**
     * 创建隐藏输入框
     */
    createHiddenInput() {
        // 创建不显示的输入框
        this.hiddenInput = document.createElement('textarea');
        this.hiddenInput.wrap = 'off';
        this.hiddenInput.style.position = 'fixed';
        this.hiddenInput.style.opacity = '0';
        this.hiddenInput.style.pointerEvents = 'none';
        this.hiddenInput.style.width = '1px';
        this.hiddenInput.style.height = '1px';
        this.hiddenInput.style.border = 'none';
        this.hiddenInput.style.outline = 'none';
        this.hiddenInput.style.padding = '0';
        this.hiddenInput.style.margin = '0';
        this.hiddenInput.style.left = '-10000px'; // 移到屏幕外很远的地方
        this.hiddenInput.style.top = '-10000px'; // 移到屏幕外很远的地方
        this.hiddenInput.style.zIndex = '-1000'; // 确保在底层
        this.hiddenInput.style.overflow = 'hidden';
        this.hiddenInput.style.clip = 'rect(0, 0, 0, 0)';
        this.hiddenInput.style.whiteSpace = 'pre';
        this.hiddenInput.style.resize = 'none';

        // 添加到 body
        document.body.appendChild(this.hiddenInput);

        // 添加事件监听
        this.hiddenInput.addEventListener('keydown', this.handleKeyDown);
        this.hiddenInput.addEventListener('input', this.handleInput);
        // this.hiddenInput.addEventListener('keyup', this.handleKeyUp);
        // this.hiddenInput.addEventListener('blur', this.handleBlur);

        return this.hiddenInput;
    }

    /**
     * 开始编辑文本
     * @param {Object} textObj - 要编辑的文本对象
     * @param {number} index - 光标位置
     */
    startEditing(textObj, index) {

        if (textObj.status === Element.EDITING) {
            // 如果已经在编辑同一文本，只更新光标位置
            this.cursorEnd = this.cursorStart = index;
            this.updateInputSelection();
            this.renderAll();
            return;
        }

        textObj.status = Element.EDITING
        textObj.oldText = textObj.text;
        this.editingText = textObj;
        this.isEditing = true;
        this.isCursorVisible = true;
        // 调用方传入的光标位置（由点击位置换算而来）；未传入时落到文本末尾
        this.cursorEnd = this.cursorStart = Math.min(Math.max(index ?? textObj.text.length, 0), textObj.text.length);
        this.canvas.style.cursor = textObj.direction === 'horizontal' ? 'text' : 'vertical-text';

        // 设置隐藏输入框的值
        this.hiddenInput.value = textObj.text;

        // 延迟一下再聚焦，避免立即触发滚动
        setTimeout(() => {
            if (this.hiddenInput) {
                // 设置输入框的光标位置
                this.updateInputSelection();
            }
        }, 10);

        // 开始光标闪烁
        this.startCursorBlink();

        this.renderAll();
    }

    /**
     * 移除隐藏输入框
     */
    removeHiddenInput() {
        if (this.hiddenInput) {
            // 移除事件监听
            this.hiddenInput.removeEventListener('keydown', this.handleKeyDown);
            this.hiddenInput.removeEventListener('input', this.handleInput);
            // this.hiddenInput.removeEventListener('keyup', this.handleKeyUp);
            // this.hiddenInput.removeEventListener('blur', this.handleBlur);

            // 从DOM中移除
            if (this.hiddenInput.parentNode) {
                this.hiddenInput.parentNode.removeChild(this.hiddenInput);
            }
            this.hiddenInput = null;
        }
    }

    /**
     * 添加元素到当前编辑作用域：隔离模式下加入当前组合的 children，否则加入顶层元素数组。
     * 隔离中入组元素携带画布绝对坐标，需沿祖先组合与组合自身变换换算为组内局部坐标
     * @param element
     * @returns {number} 元素在目标容器中的索引
     */
    addElement(element) {
        const isolation = this._getIsolationGroup();
        const container = isolation ? isolation.children : this.elements;
        if (isolation) {
            // 画布坐标 → 组合父系坐标 → 组内局部坐标
            const parent = this._canvasToParent(isolation, element.x, element.y);
            const local = isolation._toLocal(parent.x, parent.y);
            element.x = local.x;
            element.y = local.y;
        }
        container.push(element);
        if (element.type === 'image' && this.enableCache && element.cacheable) {
            this.cache.set(element.src, element.image)
        }
        this.events.emit(CanvasEditor.ADD_OBJECT, {x: element.x, y: element.y, target: element});
        return container.length - 1;
    }


    hasElement(element) {
        return this.elements.findIndex(item => item.id === element.id) !== -1;
    }


    /**
     * 移除元素
     * @param {number} element - 元素
     */
    removeElement(element) {
        let removed = false;
        let index = this.elements.findIndex(item => item.id === element.id);
        while (index !== -1) {
            this.elements.splice(index, 1);
            removed = true;
            index = this.elements.findIndex(item => item.id === element.id);
        }
        // 顶层未命中：组合内部子元素，从所属组合中移除（children 为响应式嵌套数组，正常记录历史）
        if (!removed) {
            const parent = this._findParentGroup(element);
            const childIndex = parent ? parent.children.findIndex(child => child.id === element.id) : -1;
            if (childIndex !== -1) parent.children.splice(childIndex, 1);
        }
        this.removeActiveElement(element);
    }


    /**
     * 移除元素
     * @param {Array<Object>|Object} elements - 元素或元素数组
     */
    removeElements(elements) {
        if (!elements || (Array.isArray(elements) && elements.length === 0)) {
            return;
        }
        // 统一转换为数组
        const elementArray = Array.isArray(elements) ? elements : [elements];
        // 获取要删除的id集合
        const targets = new Set(elementArray.map(element => element.id));
        // 过滤掉匹配id的元素
        this.resetElements(this.elements.filter(element => !targets.has(element.id)))
        // 顶层未命中的为组合内部子元素：从所属组合中移除（响应式嵌套数组，正常记录历史）
        for (const element of elementArray) {
            const parent = this._findParentGroup(element);
            const index = parent ? parent.children.findIndex(child => child.id === element.id) : -1;
            if (index !== -1) parent.children.splice(index, 1);
        }
        // 同时删除激活元素
        this.activeElements = this.activeElements.filter(element => !targets.has(element.id));
    }


    /**
     * 移除全部元素
     */
    clearElements() {
        this.resetElements()
        this.activeElements = [];
    }


    /**
     * 重置元素
     * @param {Array | undefined} [array] - 新数组，不传或传入非数组则重置为空数组
     */
    resetElements(array) {
        // 规范化参数：确保是真正的数组，防止展开运算符报错
        const newArray = Array.isArray(array) ? array : [];
        // 非浏览器环境（如SSR）直接赋值，无需响应式
        if (!this.isBrowser) {
            this.elements = newArray;
            return;
        }
        // 从索引 0 开始，删除现有全部长度，并插入新数据，保持响应式代理不变
        this.elements.splice(0, this.elements.length, ...newArray);
    }


    // ---------------- 撤销 / 恢复（栈纪律在 HistoryManager，快照语义在此） ----------------

    /**
     * 撤销：回退到上一条快照，刚落盘的当前状态转入重做栈
     * @returns {boolean} 是否执行了撤销
     */
    undo() {
        return this.history.undo();
    }

    /**
     * 恢复：重新应用最近一次被撤销的快照
     * @returns {boolean} 是否执行了恢复
     */
    redo() {
        return this.history.redo();
    }

    canUndo() {
        return this.history.canUndo();
    }

    canRedo() {
        return this.history.canRedo();
    }

    /**
     * 生成当前编辑状态快照：克隆全部元素（图片共享底层位图引用，开销可控），并保持元素 id 稳定
     * @returns {{elements: Array, activeIds: Array}}
     */
    _createSnapshot() {
        return {
            activeIds: this.activeElements.map(el => el.id),
            elements: this.elements.map(el => this._cloneElement(el)),
        };
    }

    /**
     * 克隆元素并保持 id 稳定（快照记录与恢复共用）：组合内嵌套子元素的 id 一并还原，
     * 撤销 / 恢复后的选中态恢复与按 id 增删都依赖整棵树 id 稳定
     * @param {Object} el - 元素
     * @returns {Object} 克隆元素
     */
    _cloneElement(el) {
        const clone = el.clone();
        this._restoreIds(el, clone);
        return clone;
    }

    /**
     * 按 clone 的结构顺序把源元素树 id 还原到克隆树上（clone 保序，按下标一一对应）
     * @param {Object} source - 源元素
     * @param {Object} target - 克隆元素
     */
    _restoreIds(source, target) {
        target.id = source.id;
        if (source.type !== 'group') return;
        source.children.forEach((child, index) => {
            if (target.children[index]) this._restoreIds(child, target.children[index]);
        });
    }

    /**
     * 应用快照：整体替换元素并按 id 恢复选中态（由 HistoryManager 在抑制记录期间调用）
     * @param {{elements: Array, activeIds: Array}} snapshot
     */
    _applySnapshot(snapshot) {
        this.clearActiveElements();
        // 灌入快照元素的工作副本而非快照本体：恢复后这些实例会成为活动元素被后续编辑原地改写，
        // 若直接使用快照持有的实例，栈内历史会被污染（撤销丢失真实旧状态）
        this.resetElements(snapshot.elements.map(el => this._cloneElement(el)));
        const activeIds = new Set(snapshot.activeIds);
        this.activeElements = this.elements.filter(el => activeIds.has(el.id));
        this.activeElements.forEach(el => el.status = Element.SELECTED);
        this.renderAll();
    }

    /**
     * 派发历史变化事件，供外部同步持久化数据与刷新按钮状态
     * @param {'push'|'undo'|'redo'} type
     */
    _emitHistoryChange(type) {
        this.events.emit(CanvasEditor.HISTORY_CHANGE, {type, canUndo: this.canUndo(), canRedo: this.canRedo()});
    }


    hasActiveElement(element) {
        return this.activeElements.findIndex(item => item.id === element.id) !== -1;
    }

    /**
     * 移除元素
     * @param {number} element - 元素
     */
    removeActiveElement(element) {
        let index = this.activeElements.findIndex(item => item.id === element.id);
        while (index !== -1) {
            const removeObj = this.activeElements.splice(index, 1)[0];
            removeObj.status = Element.NONE
            index = this.activeElements.findIndex(item => item.id === element.id);
        }
    }


    /**
     * 移除元素
     * @param {Array<Object>|Object} elements - 元素或元素数组
     */
    removeActiveElements(elements) {
        if (!elements || (Array.isArray(elements) && elements.length === 0)) {
            return;
        }
        // 统一转换为数组
        const elementArray = Array.isArray(elements) ? elements : [elements];
        // 获取要删除的id集合
        const targets = new Set(elementArray.map(element => {
            element.status = Element.NONE;
            return element.id;
        }));
        // 过滤掉匹配id的元素
        this.activeElements = this.activeElements.filter(element => !targets.has(element.id));
    }

    /**
     * 移除全部激活元素
     */
    clearActiveElements() {
        this.activeElements.forEach(item => item.status = Element.NONE)
        this.activeElements = [];
    }


    // ---------------- 组合隔离模式（参考 AI：进入组合内部单独编辑） ----------------

    /**
     * 进入组合内部单独编辑：此后命中 / 框选仅作用于该组合的直接子元素
     * （嵌套组合作为整体选中，可继续双击深入）；组合按 id 记录，撤销 / 恢复重建实例后仍有效
     * @param {Object} group - 组合元素
     */
    enterIsolation(group) {
        if (!group || group.type !== 'group') return;
        this.isolationGroupId = group.id;
        this.clearActiveElements();
        this.renderAll();
    }

    /**
     * 退出隔离：逐层退出并重新选中当前组合，已是最外层时完全退出
     */
    exitIsolation() {
        const group = this._getIsolationGroup();
        if (!group) return;
        this.clearActiveElements();
        this.isolationGroupId = this._findParentGroup(group)?.id || null;
        group.status = Element.SELECTED;
        this.activeElements.push(group);
        this.renderAll();
    }

    /**
     * 解析当前隔离组合（按 id 查找；组合已不存在如被撤销时自动视为退出）
     * @returns {Object|null}
     */
    _getIsolationGroup() {
        if (!this.isolationGroupId) return null;
        const found = this._findById(this.isolationGroupId, this.elements);
        if (!found) this.isolationGroupId = null;
        return found;
    }

    /**
     * 隔离模式下激活元素所在的容器：隔离中为当前组合的 children，否则为顶层元素数组
     * @returns {Array}
     */
    _activeContainer() {
        const isolation = this._getIsolationGroup();
        return isolation ? isolation.children : this.elements;
    }

    /**
     * 命中测试：隔离中仅命中当前组合的直接子元素，否则命中顶层元素
     * @param {number} x - 画布 X 坐标
     * @param {number} y - 画布 Y 坐标
     * @returns {Object|null}
     */
    _hitTest(x, y) {
        const isolation = this._getIsolationGroup();
        if (!isolation) {
            return this.getElementAt(x, y, element => element.selectable);
        }
        return this._childAt(isolation, x, y, element => element.selectable);
    }

    /**
     * 在组合的直接子元素中按画布坐标命中：先减祖先组合原点，再经组合自身的
     * 原点平移与旋转变换（_toLocal）换算到组内局部坐标
     * @param {Object} group - 组合元素
     * @param {number} x - 画布 X 坐标
     * @param {number} y - 画布 Y 坐标
     * @param {(el: Object) => boolean} [filter]
     * @returns {Object|null}
     */
    _childAt(group, x, y, filter) {
        const off = this._originOffset(group) || {x: 0, y: 0};
        const local = group._toLocal(x - off.x, y - off.y);
        const children = [...group.children].reverse();
        for (const child of children) {
            if (child.contains(local.x, local.y) && (!filter || filter(child))) return child;
        }
        return null;
    }

    /**
     * 按 id 在元素树中查找（含组合嵌套）
     * @param {number} id - 元素 id
     * @param {Array} list - 搜索范围
     * @returns {Object|null}
     */
    _findById(id, list) {
        for (const item of list) {
            if (item.id === id) return item;
            if (item.type !== 'group') continue;
            const found = this._findById(id, item.children);
            if (found) return found;
        }
        return null;
    }

    /**
     * 查找元素的直接所属组合（顶层元素返回 null）
     * @param {Object} el - 元素
     * @param {Array} [list] - 搜索范围（递归用）
     * @returns {Object|null}
     */
    _findParentGroup(el, list = this.elements) {
        for (const item of list) {
            if (item.type !== 'group') continue;
            if (item.children.some(child => child.id === el.id)) return item;
            const nested = this._findParentGroup(el, item.children);
            if (nested) return nested;
        }
        return null;
    }

    /**
     * 元素的画布原点偏移：祖先组合原点之和（顶层元素为 0,0），未在元素树中返回 null。
     * 组合不旋转，祖先变换均为平移，因此位移增量在局部系与画布系相等，仅包围盒类查询需要换算
     * @param {Object} el - 元素
     * @param {Array} [list] - 搜索范围（递归用）
     * @returns {{x: number, y: number}|null}
     */
    _originOffset(el, list = this.elements) {
        for (const item of list) {
            if (item.id === el.id) return {x: 0, y: 0};
            if (item.type !== 'group') continue;
            const nested = this._originOffset(el, item.children);
            if (nested) return {x: nested.x + item.x, y: nested.y + item.y};
        }
        return null;
    }

    /**
     * 元素的画布绝对包围盒：组合内子元素在其局部包围盒上累加祖先原点（框选 / 吸附用）
     * @param {Object} el - 元素
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    _absoluteBounds(el) {
        const b = el.getSelectionBounds();
        const off = this._originOffset(el) || {x: 0, y: 0};
        return {x: b.x + off.x, y: b.y + off.y, w: b.w, h: b.h};
    }

    /**
     * 查找元素经组合嵌套的祖先链（外层 → 直接父级），未找到返回 null
     * @param {Object} el - 元素
     * @param {Array} [list] - 搜索范围（递归用）
     * @param {Array} [chain] - 已累计的祖先（递归用）
     * @returns {Array|null}
     */
    _ancestorChain(el, list = this.elements, chain = []) {
        for (const item of list) {
            if (item.id === el.id) return chain;
            if (item.type !== 'group') continue;
            const found = this._ancestorChain(el, item.children, [...chain, item]);
            if (found) return found;
        }
        return null;
    }

    /**
     * 在元素所属坐标系下绘制（沿祖先组合原点逐级平移）：组合内部子元素的选框与编辑装饰用
     * @param {Object} el - 组合内子元素
     * @param {(ctx: CanvasRenderingContext2D) => void} draw - 绘制回调
     */
    _drawDeep(el, draw) {
        const chain = this._ancestorChain(el);
        if (!chain || !chain.length) return;
        const ctx = this.ctx;
        ctx.save();
        for (const g of chain) {
            // 沿祖先链施加与 Group.draw 一致的变换：原点平移 + 绕组内局部中心的旋转，
            // 组合自身带旋转时子元素选框 / 编辑装饰才能落对位置
            ctx.translate(g.x, g.y);
            if (g.angle) {
                const c = g._localCenter();
                ctx.translate(c.x, c.y);
                ctx.rotate(g.angle * Math.PI / 180);
                ctx.translate(-c.x, -c.y);
            }
        }
        draw(ctx);
        ctx.restore();
    }

    /**
     * 隔离模式下需降维绘制的顶层元素 id 集合：隔离子树（祖先链 + 当前组合）之外的顶层元素。
     * 嵌套组合的祖先链正常显示（其内部承载着被编辑内容）
     * @returns {Set|null} 非隔离模式返回 null
     */
    _dimmedElementIds() {
        const isolation = this._getIsolationGroup();
        if (!isolation) return null;
        const keep = new Set((this._ancestorChain(isolation) || []).map(el => el.id));
        keep.add(isolation.id);
        return new Set(this.elements.filter(el => !keep.has(el.id)).map(el => el.id));
    }

    /**
     * 处理双击事件：双击组合进入其内部单独编辑，隔离中双击嵌套组合继续深入；
     * 双击文本交给文本编辑流程
     * @param event
     */
    handleDoubleClick(event) {
        if (this.isEditing) return;
        const {x, y} = this.getCanvasPosition(event);
        const isolation = this._getIsolationGroup();
        const groupFilter = element => element.selectable && element.type === 'group';
        const target = isolation
            ? this._childAt(isolation, x, y, groupFilter)
            : this.getElementAt(x, y, groupFilter);
        if (target) this.enterIsolation(target);
    }


    updateElement(element) {
        for (let item of this.elements) {
            if (element.id === item.id) {
                Object.assign(item, element);
            }
        }
    }

    /**
     * 获取所有元素
     * @returns {Array} 文本对象数组
     */
    getElements(filter) {
        return filter && typeof filter === 'function'
            ? this.elements.filter(filter)
            : this.elements;
    }

    /**
     * 获取所有选中元素
     * @returns {Array} 文本对象数组
     */
    getActiveElements(filter) {
        return filter && typeof filter === 'function'
            ? this.activeElements.filter(filter)
            : this.activeElements;
    }

    /**
     * 对齐选中元素：多选时以选区联合包围盒为基准，单选时以画布为基准
     * @param {'left'|'center-h'|'right'|'top'|'center-v'|'bottom'} mode - 对齐模式
     */
    alignElements(mode) {
        const targets = this.activeElements;
        if (!targets || targets.length === 0) return;
        // 参考边界：多选取所有选中元素的联合包围盒，单选对齐整张画布
        let refBounds;
        if (targets.length === 1) {
            // 组合内部子元素坐标为组内局部系，没有画布对齐基准，跳过
            if (!this.hasElement(targets[0])) return;
            refBounds = {x: 0, y: 0, w: this.width, h: this.height};
        } else {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const el of targets) {
                const b = el.getSelectionBounds();
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                maxX = Math.max(maxX, b.x + b.w);
                maxY = Math.max(maxY, b.y + b.h);
            }
            refBounds = {x: minX, y: minY, w: maxX - minX, h: maxY - minY};
        }
        // 未知模式与原实现一致：无位移且不重绘
        if (!alignToReference(targets, mode, refBounds)) return;
        this.renderAll();
    }

    /**
     * 分布选中元素：以首尾元素为基准，中间元素沿分布方向按边缘间隙等距排布（参考 PS 分布间距）
     * @param {'horizontal'|'vertical'} mode - 分布方向
     */
    distributeElements(mode) {
        const targets = this.activeElements;
        if (!targets || targets.length < 3) return;
        distributeByEdges(targets, mode);
        this.renderAll();
    }

    /**
     * 分布选中元素：以首尾元素为基准，中间元素沿分布方向按中心点等距排布（参考 PS 分布中心）
     * @param {'horizontal'|'vertical'} mode - 分布方向
     */
    distributeElementsByCenter(mode) {
        const targets = this.activeElements;
        if (!targets || targets.length < 3) return;
        // 首尾中心重合无可分布：与原实现一致，不触发重绘
        if (!distributeByCenters(targets, mode)) return;
        this.renderAll();
    }

    /**
     * 组合选中元素（参考 AI 组合 Ctrl+G）：组合作为一个整体元素占据最上层成员的
     * 层级位置，组合后整体处于选中态。移动 / 对齐 / 吸附只操作组合自身，
     * 与普通元素走完全相同的路径
     * @returns {Object|null} 组合元素，选中不足两个时返回 null
     */
    groupElements() {
        // 隔离模式：在当前组合内部建组；选中项必同属一个容器（隔离语义保证）
        const container = this._activeContainer();
        const isTopLevel = container === this.elements;
        // 按容器顺序（堆叠）取选中元素，保证组内层叠关系不变
        const targets = container.filter(el => this.hasActiveElement(el));
        if (targets.length < 2) return null;
        // 坐标局部化与层级/可拖拽性继承是组合的内部表示，由 Group 工厂负责
        const group = Group.fromElements(targets);
        // 整体替换产生单次结构变更（只记录一条历史）；组合插入到最上层成员原位置
        const next = container.filter(el => !this.hasActiveElement(el));
        const topId = targets[targets.length - 1].id;
        let insertIndex = 0;
        for (const el of container) {
            if (el.id === topId) break;
            if (!targets.includes(el)) insertIndex++;
        }
        next.splice(insertIndex, 0, group);
        if (isTopLevel) {
            this.resetElements(next);
        } else {
            // 组合内部 children 为响应式嵌套数组：整体替换同样只触发一次结构变更记录
            container.splice(0, container.length, ...next);
        }
        this.history.cancelPending();
        // 取回响应式代理实例（非浏览器环境 resetElements 会整体换数组，需从最新引用查找）
        const groupProxy = (isTopLevel ? this.elements : container).find(el => el.id === group.id);
        this.clearActiveElements();
        groupProxy.status = Element.SELECTED;
        this.activeElements.push(groupProxy);
        this.renderAll();
        return groupProxy;
    }

    /**
     * 取消组合（参考 AI 取消组合 Ctrl+Shift+G）：每次解散一层，子元素恢复画布
     * 绝对坐标并继承组合的层级位置，取消后原成员整体处于选中态；嵌套组合保留内层
     * @returns {Array|null} 释放出的子元素，未选中组合时返回 null
     */
    ungroupElements() {
        const container = this._activeContainer();
        const groups = this.activeElements.filter(el => el.type === 'group');
        if (!groups.length) return null;
        const next = [...container];
        const released = [];
        for (const group of groups) {
            const index = next.findIndex(el => el.id === group.id);
            if (index === -1) continue;
            // 坐标还原与层级继承是组合的内部表示，由 Group.release 负责
            const children = group.release();
            next.splice(index, 1, ...children);
            released.push(...children);
        }
        if (!released.length) return null;
        if (container === this.elements) {
            this.resetElements(next);
        } else {
            container.splice(0, container.length, ...next);
        }
        this.history.cancelPending();
        this.clearActiveElements();
        for (const el of released) {
            el.status = Element.SELECTED;
            this.activeElements.push(el);
        }
        this.renderAll();
        return released;
    }

    /**
     * 清理画布
     */
    clearCanvas() {
        if (this.isBrowser) {
            this.isEditing && this.finishEditing();
            this.activeElements = [];
        }
        this.resetElements()
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 切换网格背景显示
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
    }

    /**
     * 获取文本度量信息
     * @param {Object} textObj - 测量的文本
     * @returns {TextMetrics} 文本度量
     */
    getTextMetrics(textObj) {
        return textCaret.getTextMetrics(this.ctx, textObj);
    }

    /**
     * 获取部分文本宽度
     * @param {string} textObj - 完整文本
     * @param {number} startIndex - 开始索引
     * @param {number} endIndex - 结束索引
     * @returns {TextMetrics} 截取文本度量
     */
    getSubTextMetrics(textObj, startIndex, endIndex) {
        return textCaret.getSubTextMetrics(this.ctx, textObj, startIndex, endIndex);
    }


    /**
     * 根据点击位置计算光标位置
     * @param {Object} textObj - 文本对象
     * @param {number} clickX - 点击X坐标
     * @param {number} clickY - 点击Y坐标
     * @returns {number} 光标索引
     */
    getCursorIndexFromText(textObj, clickX, clickY) {
        return textCaret.getCursorIndexFromText(textObj, clickX, clickY);
    }


    /**
     * 计算上下键移动后的光标索引
     */
    getVerticalMoveCursorIndex(textObj, direction) {
        return textCaret.getVerticalMoveCursorIndex(textObj, direction, this.cursorEnd);
    }


    getTextCursorLineInfo(textObj, index) {
        return textCaret.getTextCursorLineInfo(textObj, index);
    }


    getVerticalColumnMoveCursorIndex(textObj, direction) {
        return textCaret.getVerticalColumnMoveCursorIndex(textObj, direction, this.cursorEnd);
    }


    getVerticalRowMoveCursorIndex(textObj, direction) {
        return textCaret.getVerticalRowMoveCursorIndex(textObj, direction, this.cursorEnd);
    }


    /**
     * 获取点击区域文本元素
     *
     * @param {number} x - 点击 X 坐标
     * @param {number} y - 点击 Y 坐标
     * @returns {Object|null} 点击的文本对象或null
     */
    getTextAtPosition(x, y) {
        return this.getElementAt(x, y, (element) => {
            return element.type === 'text'
        })
    }


    /**
     * 获取点击区域元素
     *
     * @param {number} x - 点击 X 坐标
     * @param {number} y - 点击 Y 坐标
     * @param filter 过滤条件
     * @returns {Object|null} 点击的元素对象或null
     */
    getElementAt(x, y, filter) {
        // 将 Set 转为数组后反向遍历
        const reversedArray = Array.from(this.elements).reverse();
        for (const element of reversedArray) {
            if (element.contains(x, y) && (!filter || filter(element))) {
                return element
            }
        }
        return null;
    }

    /**
     * 开始光标闪烁
     */
    startCursorBlink() {
        clearInterval(this.cursorBlinkInterval);
        this.cursorBlinkInterval = setInterval(() => {
            // 有文本被选中，因此光标闪烁
            if (this.cursorStart !== this.cursorEnd && !this.isCursorVisible) return;
            this.isCursorVisible = !this.isCursorVisible;
            if (this.isEditing && this.editingText) {
                this.renderAll();
            }
        }, 800);
    }

    /**
     * 绘制网格背景
     */
    drawGrid() {
        if (!this.showGrid) return;
        const scale = this.getTransformScale(this.ctx);
        this.ctx.save();
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1 / scale;
        const offset = 0.5 / scale;
        this.ctx.beginPath();
        // 绘制垂直线
        for (let x = offset; x <= this.width; x += this.gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
        }
        // 绘制水平线
        for (let y = offset; y <= this.height; y += this.gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
        }
        // 全部网格线合并为一次 stroke，避免每线一次光栅化调用
        this.ctx.stroke();
        this.ctx.restore();
    }


    /**
     * 绘制所有内容
     */
    renderAll() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        // 绘制背景
        this.drawBackgroundColor()
        // 绘制网格背景
        this.drawGrid();
        // 绘制元素
        this.drawElements()
        // 绘制对齐线
        this.drawGuides()
    }


    /**
     * 绘制背景
     */
    drawBackgroundColor() {
        this.drawFillRect(0, 0, this.width, this.height, this.backgroundColor)
    }


    /**
     * 设置背景
     * @param color
     */
    setBackgroundColor(color) {
        this.backgroundColor = color
    }

    /**
     * 通过中心点设置缩放
     * @param zoom
     */
    setZoom(zoom) {
        if (zoom <= 0) return
        this.zoom = zoom
        this.setupCanvas();
        this.renderAll();
    }

    /**
     * 获取当前缩放
     * @returns {number}
     */
    getZoom() {
        return this.zoom
    }


    /**
     * 获取 canvas 中心点
     * @returns {{x: number, y: number}}
     */
    getCenterPoint() {
        return {
            x: this.width / 2,
            y: this.height / 2
        }
    }

    /**
     * 计算磁性吸附偏移量与待绘制对齐线（纯几何计算下沉到 SnapEngine，
     * 此处仅注入当前配置快照与候选元素）
     * @param {Array} targetElements - 被拖元素
     * @param {Map} freePositions - 自由位置 Map<el, {x,y,cx,cy}>
     * @returns {{dx: number, dy: number, guides: Array}}
     */
    computeSnap(targetElements, freePositions) {
        return new SnapEngine({
            enabled: this.snapEnabled,
            threshold: this.snapThreshold,
            zoom: this.zoom,
            width: this.width,
            height: this.height,
            // 候选目标：隔离模式取当前组合的直接子元素（AI：隔离内对齐组合内部），否则取全部顶层元素
            candidates: this._activeContainer(),
            // 组合内子元素为组内局部坐标，统一换算为画布绝对坐标参与吸附
            boundsOf: el => this._absoluteBounds(el),
        }).compute(targetElements, freePositions);
    }

    /**
     * 绘制对齐线
     */
    drawGuides() {
        if (!this.activeGuides || !this.activeGuides.length) return;
        const transformScale = this.getTransformScale(this.ctx);
        const lineWidth = 1 / transformScale;
        this.ctx.save();
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = this.guideColor;
        for (const g of this.activeGuides) {
            this.ctx.beginPath();
            if (g.orient === 'v') {
                this.ctx.moveTo(g.x, g.y1);
                this.ctx.lineTo(g.x, g.y2);
            } else {
                this.ctx.moveTo(g.x1, g.y);
                this.ctx.lineTo(g.x2, g.y);
            }
            this.ctx.stroke();
        }
        this.ctx.restore();
    }


    getTransformScale(ctx) {
        return getTransformScale(ctx);
    }


    /**
     * 设置对齐吸附开关
     * @param {boolean} enabled
     */
    setSnapEnabled(enabled) {
        this.snapEnabled = !!enabled;
    }

    /**
     * 获取对齐吸附是否开启
     * @returns {boolean}
     */
    isSnapping() {
        return this.snapEnabled;
    }

    /**
     * 设置对齐线颜色
     * @param {string} color - 颜色值，如 '#FF007F' / 'rgba(255,0,127,0.9)'
     */
    setGuideColor(color) {
        this.guideColor = color;
    }

    /**
     * 获取当前对齐线颜色
     * @returns {string}
     */
    getGuideColor() {
        return this.guideColor;
    }

    /**
     * 绘制元素到 canvas 上
     */
    drawElements() {
        // 隔离模式（参考 AI）：隔离子树正常绘制，其余内容半透明降维
        const dimIds = this._dimmedElementIds();
        // 绘制所有文本
        for (const element of this.elements) {
            const dimmed = dimIds && dimIds.has(element.id);
            if (dimmed) {
                this.ctx.save();
                this.ctx.globalAlpha = CanvasEditor.ISOLATION_DIM_ALPHA;
            }
            // 绘制元素
            element.draw(this.ctx);
            if (element.type === 'text') {
                // 如果是正在编辑的文本，绘制背景颜色
                if (element.status === Element.EDITING) {
                    element.drawEditBackground(this.ctx, this.cursorStart, this.cursorEnd)
                    // 如果是正在编辑的文本，绘制光标
                    if (this.isCursorVisible) {
                        element.drawCursor(this.ctx, this.cursorStart, this.cursorEnd)
                    }
                }
            }
            if (this.hasActiveElement(element)) {
                element.selection(this.ctx)
            }
            if (dimmed) {
                this.ctx.restore();
            }
        }
        // 组合内部被选中 / 编辑中的子元素：沿祖先链平移后绘制选框与编辑装饰
        for (const el of this.activeElements) {
            if (this.hasElement(el)) continue;
            this._drawDeep(el, ctx => el.selection(ctx));
        }
        if (this.isEditing && this.editingText && !this.hasElement(this.editingText)) {
            const el = this.editingText;
            this._drawDeep(el, ctx => {
                el.drawEditBackground(ctx, this.cursorStart, this.cursorEnd)
                if (this.isCursorVisible) {
                    el.drawCursor(ctx, this.cursorStart, this.cursorEnd)
                }
            })
        }
    }


    /**
     * 填充矩形
     * @param x
     * @param y
     * @param width
     * @param height
     * @param fillColor
     */
    drawFillRect(x, y, width, height, fillColor) {
        this.ctx.save();
        // 绘制高亮背景
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.restore();
    }


    /**
     * 处理 Canvas 点击事件
     * @param params
     */
    handleEditText(params) {
        const {event, element} = params;
        const {x, y} = this.getCanvasPosition(event);
        if (element && element.editable) {
            this.clearActiveElements()
            if (this.isEditing && this.editingText !== element) {
                this.finishEditing()
                return;
            }
            // 计算点击位置对应的光标索引
            const index = this.getCursorIndexFromText(element, x, y);
            // 如果是双击，直接进入编辑模式
            this.startEditing(element, index);
        }
    }


    /**
     * 通过鼠标事件获取触发位置在 canvas 内部的坐标
     * @param event
     * @returns {x: number, y: number}
     */
    getCanvasPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        // 计算相对于Canvas元素的坐标
        const clientX = event.clientX - rect.left;
        const clientY = event.clientY - rect.top;
        // 转换为Canvas内部坐标（考虑缩放）
        const canvasX = (clientX / (this.width * this.zoom)) * this.width;
        const canvasY = (clientY / (this.height * this.zoom)) * this.height;
        return {
            x: Math.max(0, Math.min(canvasX, this.width)),
            y: Math.max(0, Math.min(canvasY, this.height))
        };
    }


    /**
     * 处理 canvas 内鼠标相关事件
     * @param event
     */
    /**
     * 元素的父系坐标 → 画布坐标：沿祖先组合链逐级"绕组内中心旋转 + 平移"，
     * 与 Group.draw 的嵌套变换严格互逆（祖先带旋转时不可只加原点偏移）
     * @param {Object} el - 元素
     * @param {number} x - 父系 X（直接父组合的局部坐标）
     * @param {number} y - 父系 Y
     * @returns {{x: number, y: number}}
     */
    _parentToCanvas(el, x, y) {
        const chain = this._ancestorChain(el) || [];
        let px = x, py = y;
        for (let i = chain.length - 1; i >= 0; i--) {
            const g = chain[i];
            if (g.angle) {
                const c = g._localCenter();
                const rad = g.angle * Math.PI / 180;
                const vx = px - c.x, vy = py - c.y;
                px = c.x + vx * Math.cos(rad) - vy * Math.sin(rad);
                py = c.y + vx * Math.sin(rad) + vy * Math.cos(rad);
            }
            px += g.x;
            py += g.y;
        }
        return {x: px, y: py};
    }

    /**
     * 画布坐标 → 元素的父系坐标：_parentToCanvas 的逆变换（外层组合先逆）
     */
    _canvasToParent(el, x, y) {
        const chain = this._ancestorChain(el) || [];
        let px = x, py = y;
        for (const g of chain) {
            px -= g.x;
            py -= g.y;
            if (g.angle) {
                const c = g._localCenter();
                const rad = -g.angle * Math.PI / 180;
                const vx = px - c.x, vy = py - c.y;
                px = c.x + vx * Math.cos(rad) - vy * Math.sin(rad);
                py = c.y + vx * Math.sin(rad) + vy * Math.cos(rad);
            }
        }
        return {x: px, y: py};
    }

    /**
     * 元素选框坐标系（父系坐标、未含元素自身旋转）→ 画布坐标：
     * 先绕旋转中心（元素中心 / 组合基准点）施加元素自身角度，再沿祖先组合链变换。
     * 选框手柄 / 旋转支点等选框系坐标由此落到画布
     */
    _selectionToCanvas(el, x, y) {
        let px, py;
        if (el.angle) {
            const rad = el.angle * Math.PI / 180;
            const vx = x - el.centerX, vy = y - el.centerY;
            px = el.centerX + vx * Math.cos(rad) - vy * Math.sin(rad);
            py = el.centerY + vx * Math.sin(rad) + vy * Math.cos(rad);
        } else {
            px = x;
            py = y;
        }
        return this._parentToCanvas(el, px, py);
    }

    /**
     * 画布坐标 → 元素选框坐标系：_selectionToCanvas 的逆变换
     */
    _canvasToSelection(el, x, y) {
        const p = this._canvasToParent(el, x, y);
        if (!el.angle) return p;
        const rad = -el.angle * Math.PI / 180;
        const vx = p.x - el.centerX, vy = p.y - el.centerY;
        return {x: el.centerX + vx * Math.cos(rad) - vy * Math.sin(rad), y: el.centerY + vx * Math.sin(rad) + vy * Math.cos(rad)};
    }

    /**
     * 祖先组合旋转角之和：画布位移换算到元素父系位移用（旋转方向逐层叠加）
     */
    _ancestorAngle(el) {
        const chain = this._ancestorChain(el) || [];
        return chain.reduce((sum, g) => sum + (g.angle || 0), 0);
    }

    /**
     * 命中选中框手柄（8 个缩放方块或角外旋转热区）：倒序遍历激活元素，顶层优先。
     * 鼠标先经祖先组合逆变换到父系，再绕元素中心反旋转自身角度，换算到未旋转
     * 选框坐标系后与手柄中心求距离；旋转无专用手柄，命中选框角点外围热区
     * （含选框外沿，与参考编辑器逐帧比对确认的触发位置）
     * @param {number} x - 画布 X 坐标
     * @param {number} y - 画布 Y 坐标
     * @returns {{element: Object, handle: number|'rotate', corner?: number}|null}
     */
    _hitSelectionHandle(x, y) {
        const transformScale = this.getTransformScale(this.ctx);
        // 命中半径：手柄半宽外扩 2 屏幕像素容差
        const radius = (Element.HANDLE_SIZE / 2 + 2) / transformScale;
        const reach = CanvasEditor.ROTATE_CORNER_REACH / transformScale;
        for (const el of [...this.activeElements].reverse()) {
            if (!el.draggable || el.status !== Element.SELECTED) continue;
            const frame = el.getSelectionFrame(transformScale);
            if (!frame) continue;
            const local = this._canvasToSelection(el, x, y);
            const lx = local.x;
            const ly = local.y;
            for (let i = 0; i < frame.handles.length; i++) {
                const [hx, hy] = frame.handles[i];
                if (Math.hypot(lx - hx, ly - hy) <= radius) {
                    return {element: el, handle: i};
                }
            }
            // 旋转热区：角点外围（选框外沿，到最近角点的距离）。不可旋转的元素如组合跳过；
            // corner 记录触发角（0=NW/1=NE/2=SW/3=SE）供选择朝向光标
            if (el.rotatable !== false) {
                const {sx, sy, sw, sh} = frame;
                const inBox = lx >= sx && lx <= sx + sw && ly >= sy && ly <= sy + sh;
                if (!inBox) {
                    // 到最近垂直边 / 水平边距离的合成即到最近角点的距离
                    const dx = Math.min(Math.abs(lx - sx), Math.abs(lx - (sx + sw)));
                    const dy = Math.min(Math.abs(ly - sy), Math.abs(ly - (sy + sh)));
                    if (Math.hypot(dx, dy) <= reach) {
                        const corner = (Math.abs(lx - (sx + sw)) < Math.abs(lx - sx) ? 1 : 0)
                            + (Math.abs(ly - (sy + sh)) < Math.abs(ly - sy) ? 2 : 0);
                        return {element: el, handle: 'rotate', corner};
                    }
                }
            }
        }
        return null;
    }

    /**
     * 手柄拖拽变换（缩放 / 旋转）：与 handleMouseDown 的移动拖拽同为 document 级闭包手势，
     * 结束时重发 selection:object 让属性面板同步缩放 / 角度，避免后续面板写回旧值
     * @param {{element: Object, handle: number|'rotate'}} hit - _hitSelectionHandle 的命中结果
     * @param {number} startX - 起始画布 X
     * @param {number} startY - 起始画布 Y
     */
    _startTransformDrag({element, handle, corner = 0}, startX, startY) {
        const transformScale = this.getTransformScale(this.ctx);

        const finish = () => {
            if (!this.isEditing) {
                this.canvas.style.cursor = ''
            }
            this.events.emit(CanvasEditor.SELECTION_OBJECT, {target: element});
            this.renderAll();
            document.removeEventListener('mousemove', handleMousemove);
            document.removeEventListener('mouseup', handleMouseup);
        };

        let handleMousemove;
        let handleMouseup;

        // ---------- 旋转：绕元素中心 / 组合基准点，角度 = 起始角 + 指向角增量（绝对写入，无累积误差） ----------
        if (handle === 'rotate') {
            let pivot;
            if (element.type === 'group') {
                // 组合每次旋转手势重取联合盒中心为基准点，并补偿组合原点使换点瞬间内容不动
                const c = element._localCenter();
                if (element.pivotX !== c.x || element.pivotY !== c.y) {
                    const r = (element.angle || 0) * Math.PI / 180;
                    const cos = Math.cos(r), sin = Math.sin(r);
                    element.x += element.pivotX - c.x - (element.pivotX * cos - element.pivotY * sin) + (c.x * cos - c.y * sin);
                    element.y += element.pivotY - c.y - (element.pivotX * sin + element.pivotY * cos) + (c.x * sin + c.y * cos);
                    element.pivotX = c.x;
                    element.pivotY = c.y;
                }
                pivot = this._parentToCanvas(element, element.x + element.pivotX, element.y + element.pivotY);
            } else {
                const b = element.getSelectionBounds();
                pivot = this._selectionToCanvas(element, b.x + b.w / 2, b.y + b.h / 2);
            }
            const cx = pivot.x;
            const cy = pivot.y;
            const startAngle = element.angle || 0;
            const startRad = Math.atan2(startY - cy, startX - cx);
            // 光标凸面朝向所抓的角在当前旋转下的实际方向，拖拽全程保持
            this.canvas.style.cursor = CanvasEditor.getRotateCursor(corner, element.angle);
            handleMousemove = (e) => {
                const {x, y} = this.getCanvasPosition(e);
                const rad = Math.atan2(y - cy, x - cx);
                // 归一化到 [-180, 180)：属性面板角度滑杆量程即此区间，超界值会在选中同步时
                // 被滑杆钳制并经深度监听写回旧值，表现为旋转过半圈后自动弹回
                element.angle = ((startAngle + (rad - startRad) * 180 / Math.PI + 180) % 360 + 360) % 360 - 180;
                this.renderAll();
            };
        } else {
            // ---------- 缩放：锚点为手柄对位点，累计系数 = 鼠标到锚点距离 / 起始距离 ----------
            const frame = element.getSelectionFrame(transformScale);
            const anchorLocal = frame.handles[CanvasEditor.HANDLE_MIRROR[handle]];
            // 锚点绕旋转中心（元素中心 / 组合基准点的父系位置）转到可视位置，scaleAt 以该点为固定点
            let ax, ay;
            if (element.angle) {
                const px = element.type === 'group' ? element.x + element.pivotX : element.centerX;
                const py = element.type === 'group' ? element.y + element.pivotY : element.centerY;
                const rad = element.angle * Math.PI / 180;
                const vx = anchorLocal[0] - px, vy = anchorLocal[1] - py;
                ax = px + vx * Math.cos(rad) - vy * Math.sin(rad);
                ay = py + vx * Math.sin(rad) + vy * Math.cos(rad);
            } else {
                ax = anchorLocal[0];
                ay = anchorLocal[1];
            }
            // 锚点的画布位置：沿祖先组合变换
            const anchorCanvas = this._parentToCanvas(element, ax, ay);
            const {w: w0, h: h0} = element.getSelectionBounds();
            // 元素几何异常（空包围盒）不参与缩放
            if (!w0 || !h0) return;
            // 最小 2 画布单位：防止拖过锚点后系数转负导致元素镜像翻转
            const minFactor = 2 / Math.min(w0, h0);
            const startDist = Math.hypot(startX - anchorCanvas.x, startY - anchorCanvas.y) || 1;
            // scaleAt 按当前尺寸乘系数，这里换算为本帧增量（target / 已应用），避免逐帧连乘漂移
            let applied = 1;
            this.canvas.style.cursor = CanvasEditor.HANDLE_CURSORS[handle];
            handleMousemove = (e) => {
                const {x, y} = this.getCanvasPosition(e);
                const target = Math.max(Math.hypot(x - anchorCanvas.x, y - anchorCanvas.y) / startDist, minFactor);
                element.scaleAt(target / applied, ax, ay);
                applied = target;
                this.renderAll();
            };
        }

        handleMouseup = finish;
        document.addEventListener('mousemove', handleMousemove);
        document.addEventListener('mouseup', handleMouseup);
    }

    /**
     * 悬浮光标提示（参考 AI）：缩放手柄显示方向缩放光标、角外旋转热区显示弧形箭头光标。
     * 元素本体不接管光标，移动光标仅在真正拖拽时由拖拽手势设置；
     * 拖拽中（有按键按下，光标由拖拽手势接管）与文本编辑态不接管光标
     * @param {MouseEvent} event
     */
    handleMouseMove(event) {
        if (event.buttons !== 0 || this.isEditing) return;
        const {x, y} = this.getCanvasPosition(event);
        const hit = this._hitSelectionHandle(x, y);
        let cursor = '';
        if (hit) {
            cursor = hit.handle === 'rotate'
                ? CanvasEditor.getRotateCursor(hit.corner || 0, hit.element.angle)
                : CanvasEditor.HANDLE_CURSORS[hit.handle];
        }
        if (this.canvas.style.cursor !== cursor) {
            this.canvas.style.cursor = cursor;
        }
    }

    handleMouseDown(event) {
        if (event.button !== 0) return;
        const startTime = Date.now();
        const {x: startX, y: startY} = this.getCanvasPosition(event);

        // 选中框手柄命中（缩放 / 旋转）优先于元素命中与框选：手柄浮于选框之上
        const handleHit = this._hitSelectionHandle(startX, startY);
        if (handleHit) {
            this._startTransformDrag(handleHit, startX, startY);
            return;
        }

        const element = this._hitTest(startX, startY);

        // 实际参与拖拽的对象：Alt 拷贝后切换为副本，原元素保持原位
        let dragElement = element;

        let lastMoveX = startX;
        let lastMoveY = startY;
        // 拖拽过程中的自由（未吸附）位置，按元素记录，避免吸附后离开时跳变
        let freePositions = null;

        if (!element) {
            this.handleCancelActive();
        }

        if (element && element.type === 'text' && element.status === Element.EDITING) {
            this.cursorStart = this.cursorEnd = this.getCursorIndexFromText(element, startX, startY);
            this.updateInputSelection();
        }

        const handleMousemove = (e) => {
            const interval = Date.now() - startTime;
            const {x: moveX, y: moveY} = this.getCanvasPosition(e);
            const moved = startX !== moveX || startY !== moveY;
            if (!element) {
                // 隔离模式仅在当前组合内部框选；子元素包围盒换算为画布绝对坐标参与判定
                const elements = this._activeContainer();
                const left = Math.min(startX, moveX)
                const right = Math.max(startX, moveX)
                const top = Math.min(startY, moveY)
                const bottom = Math.max(startY, moveY)
                for (let el of elements) {
                    const {x: bx, y: by, w, h} = this._absoluteBounds(el);
                    // 统一「完全包含」语义：元素可能部分位于画布外，而框选矩形受，getCanvasPosition 钳制无法超出画布，直接判定原包围盒会永远选不中。
                    // 这里将元素包围盒先裁剪到画布范围，取其在画布内的可见部分，要求框选矩形完整覆盖该可见部分才触发选中
                    const visLeft = Math.max(bx, 0);
                    const visTop = Math.max(by, 0);
                    const visRight = Math.min(bx + w, this.width);
                    const visBottom = Math.min(by + h, this.height);
                    const selected = visRight > visLeft && visBottom > visTop && visLeft >= left && visTop >= top && visRight <= right && visBottom <= bottom;
                    if (selected) {
                        if (el.status === Element.SELECTED) continue
                        el.status = Element.SELECTED;
                        this.activeElements.push(el)
                    } else {
                        el.status = Element.NONE;
                        this.removeActiveElement(el)
                    }
                }
                this.renderAll();
                const rect = new Rect({
                    x: startX,
                    y: startY,
                    width: moveX - startX,
                    height: moveY - startY,
                    stroke: '#383737',
                    strokeWidth: 2,
                    lineDash: [8, 5]
                });
                rect.draw(this.ctx)
            } else if (moved && element.type === 'text' && element.status === Element.EDITING) {
                const nextIndex = this.getCursorIndexFromText(element, moveX, moveY);
                if (nextIndex !== this.cursorEnd) {
                    this.cursorEnd = nextIndex;
                    this.updateInputSelection();
                    this.renderAll();
                }
            } else if (interval > 200 && moved && dragElement.draggable && (dragElement.status === Element.NONE || this.hasActiveElement(dragElement))) {
                this.canvas.style.cursor = 'move';
                // 计算偏移量
                const offsetX = moveX - lastMoveX;
                const offsetY = moveY - lastMoveY;
                // 确定要拖拽的元素列表
                let targetElements = dragElement.status === Element.NONE
                    ? [dragElement]
                    : Array.from(this.activeElements).filter(el => el.draggable);
                // Alt + 拖拽拷贝：仅在拖拽首帧判定（freePositions 尚未捕获时按下 Alt 才生效，
                // 拖拽中途再按 Alt 不拷贝），克隆被拖元素并改为拖拽副本，原元素保持原位
                // Alt + 拖拽拷贝仅在顶层可用：隔离中副本应落回所属组合，而非顶层元素数组
                if (e.altKey && !freePositions && targetElements.length && !this._getIsolationGroup()) {
                    const clones = targetElements.map(el => {
                        // Alt 拷贝属同一拖拽手势的中间态：抑制 addElement 的立即记录，与随后的位移合并为一条历史
                        this.history.suppressed = true;
                        this.addElement(el.clone());
                        this.history.suppressed = false;
                        // 取回数组代理包装后的实例，保持与既有元素一致的响应式代理身份
                        return this.elements[this.elements.length - 1];
                    });
                    // 选中态整体移交给副本，避免无关选中元素被卷入后续拖拽
                    this.clearActiveElements();
                    clones.forEach(clone => {
                        clone.status = Element.SELECTED;
                        this.activeElements.push(clone);
                    });
                    targetElements = clones;
                    dragElement = clones[clones.length - 1];
                }
                // 首次进入拖拽时，捕获各元素的自由（未吸附）起始位置与祖先原点偏移
                if (!freePositions) {
                    freePositions = new Map();
                    for (const el of targetElements) {
                        const off = this._originOffset(el) || {x: 0, y: 0};
                        freePositions.set(el, {x: el.x, y: el.y, cx: el.centerX, cy: el.centerY, offX: off.x, offY: off.y});
                    }
                }
                // 用鼠标增量推进自由位置（不写入元素，避免吸附状态污染）；
                // 画布位移按 -Σ祖先组合角 反旋转到父系坐标（祖先带旋转时拖拽方向才与鼠标一致）
                for (const el of targetElements) {
                    const fp = freePositions.get(el);
                    const aa = -this._ancestorAngle(el) * Math.PI / 180;
                    const dx = offsetX * Math.cos(aa) - offsetY * Math.sin(aa);
                    const dy = offsetX * Math.sin(aa) + offsetY * Math.cos(aa);
                    fp.x += dx;
                    fp.y += dy;
                    fp.cx += dx;
                    fp.cy += dy;
                }
                // 计算磁性吸附偏移量与对齐线
                const snap = this.computeSnap(targetElements, freePositions);
                // 将「自由位置 + 吸附修正」一次性写入元素（单次赋值，与原有写入频率一致）
                for (const el of targetElements) {
                    const fp = freePositions.get(el);
                    el.x = fp.x + snap.dx;
                    el.y = fp.y + snap.dy;
                    el.centerX = fp.cx + snap.dx;
                    el.centerY = fp.cy + snap.dy;
                    // 触发回调
                    this.events.emit(CanvasEditor.MOVE_OBJECT, {x: moveX, y: moveY, target: el});
                }
                this.activeGuides = snap.guides;
                // 更新最后移动位置并重新渲染
                lastMoveX = moveX;
                lastMoveY = moveY;
                if (dragElement.status === Element.NONE) {
                    this.removeActiveElements(this.activeElements);
                }
                this.renderAll();
            }
        };

        const handleMouseup = (e) => {
            // 如果是左键抬起，执行点击逻辑
            if (element && e.button === 0) {
                const {x: endX, y: endY} = this.getCanvasPosition(e);
                if (element.type === 'text' && element.status === Element.EDITING) {
                    const endIndex = this.getCursorIndexFromText(element, endX, endY);
                    if (this.cursorEnd !== endIndex) {
                        this.cursorEnd = endIndex;
                        this.updateInputSelection();
                    }
                }
                if (startX === endX && startY === endY) {
                    if (element.type === 'text' && (element.status === Element.SELECTED || element.status === Element.EDITING)) {
                        this.handleEditText({event: e, element});
                    } else {
                        this.isEditing && this.finishEditing();
                        if (!event.ctrlKey && !event.metaKey) {
                            this.removeActiveElements(this.activeElements);
                        }
                        this.handleActiveElement({x: endX, y: endY, target: element});
                    }
                }
            }
            if (!this.isEditing) {
                this.canvas.style.cursor = ''
            }
            this.activeGuides = [];
            this.renderAll();
            document.removeEventListener('mousemove', handleMousemove);
            document.removeEventListener('mouseup', handleMouseup);
        };

        document.addEventListener('mousemove', handleMousemove);
        document.addEventListener('mouseup', handleMouseup);
    }


    /**
     * 激活元素
     * @param event
     */
    handleActiveElement(event) {
        const target = event.target;
        if (this.hasActiveElement(target)) {
            this.removeActiveElement(target);
        } else {
            this.activeElements.push(target);
            target.status = Element.SELECTED;
        }
        this.events.emit(CanvasEditor.SELECTION_OBJECT, event);
        this.renderAll()
    }


    /**
     * 更新输入框的光标位置
     */
    updateInputSelection() {
        if (!this.hiddenInput) return;
        // 设置输入框的光标位置
        setTimeout(() => {
            this.hiddenInput.focus()
            const start = Math.min(this.cursorStart, this.cursorEnd);
            const end = Math.max(this.cursorStart, this.cursorEnd);
            this.hiddenInput.setSelectionRange(start, end);
        }, 0);
    }

    /**
     * 处理输入事件
     * @param {Event} event - 输入事件
     */
    handleInput(event) {
        if (!this.isEditing || !this.editingText || !this.hiddenInput) return;
        const newText = event.target.value;
        // 更新文本
        this.editingText.text = newText;
        // 获取输入框当前的光标位置
        const inputCursorPos = this.hiddenInput.selectionStart;
        // 更新 Canvas 光标位置
        this.cursorEnd = this.cursorStart = Math.max(0, Math.min(inputCursorPos, newText.length));
        this.renderAll();
    }

    /**
     * 处理键盘按下事件
     * @param {Event} event - 键盘事件
     */
    handleKeyDown(event) {
        if (!this.isEditing || !this.editingText || !this.hiddenInput) return;
        const lowerCaseKey = event.key.toLowerCase();
        switch (lowerCaseKey) {
            case 'enter':
                event.preventDefault();
                if (event.ctrlKey || event.metaKey) {
                    this.finishEditing();
                } else {
                    const input = this.hiddenInput;
                    const start = input.selectionStart ?? input.value.length;
                    const end = input.selectionEnd ?? start;
                    const nextValue = input.value.slice(0, start) + '\n' + input.value.slice(end);
                    const atLineStart = start === end && (
                        start === 0
                        || input.value[start - 1] === '\n'
                        || input.value[start - 1] === '\r'
                    );
                    const nextCursor = atLineStart ? start : start + 1;
                    input.value = nextValue;
                    input.setSelectionRange(nextCursor, nextCursor);
                    this.editingText.text = nextValue;
                    this.cursorEnd = this.cursorStart = nextCursor;
                    this.renderAll();
                }
                break;
            case 'escape':
                event.preventDefault();
                this.cancelEditing();
                break;
            case 'arrowleft':
                event.preventDefault();
                if (this.editingText.direction === 'vertical') {
                    const nextIndex = this.getVerticalColumnMoveCursorIndex(this.editingText, -1);
                    if (nextIndex !== this.cursorStart || nextIndex !== this.cursorEnd) {
                        this.cursorEnd = this.cursorStart = nextIndex;
                        this.updateInputSelection();
                        this.renderAll();
                    }
                } else {
                    if (this.cursorStart > 0) {
                        this.cursorStart--;
                        this.cursorEnd--;
                        this.updateInputSelection();
                        this.renderAll();
                    }
                }
                break;
            case 'arrowright':
                event.preventDefault();
                if (this.editingText.direction === 'vertical') {
                    const nextIndex = this.getVerticalColumnMoveCursorIndex(this.editingText, 1);
                    if (nextIndex !== this.cursorStart || nextIndex !== this.cursorEnd) {
                        this.cursorEnd = this.cursorStart = nextIndex;
                        this.updateInputSelection();
                        this.renderAll();
                    }
                } else {
                    if (this.cursorStart < this.editingText.text.length) {
                        this.cursorStart++;
                        this.cursorEnd++;
                        this.updateInputSelection();
                        this.renderAll();
                    }
                }
                break;
            case 'arrowup':
            case 'arrowdown':
                event.preventDefault();
            {
                const direction = lowerCaseKey === 'arrowup' ? -1 : 1;
                const nextIndex = this.editingText.direction === 'vertical'
                    ? this.getVerticalRowMoveCursorIndex(this.editingText, direction)
                    : this.getVerticalMoveCursorIndex(this.editingText, direction);
                if (nextIndex !== this.cursorStart || nextIndex !== this.cursorEnd) {
                    this.cursorEnd = this.cursorStart = nextIndex;
                    this.updateInputSelection();
                    this.renderAll();
                }
            }
                break;
            case 'home':
                event.preventDefault();
                this.cursorEnd = this.cursorStart = 0;
                this.updateInputSelection();
                this.renderAll();
                break;
            case 'end':
                event.preventDefault();
                this.cursorEnd = this.cursorStart = this.editingText.text.length;
                this.updateInputSelection();
                this.renderAll();
                break;
            case 'a':
                if ((event.ctrlKey || event.metaKey)) {
                    this.cursorStart = 0;
                    this.cursorEnd = this.editingText.text.length;
                    this.updateInputSelection();
                    this.renderAll();
                }
                break;
            case 'delete':
                break;
        }
    }


    /**
     * 取消元素选择状态
     *
     */
    handleCancelActive() {
        if (this.isEditing) {
            this.finishEditing()
        }
        if (this.activeElements.length > 0) {
            this.clearActiveElements()
            this.renderAll();
        }
    }


    /**
     * 处理键盘松开事件
     */
    handleKeyUp(event) {
    }

    /**
     * 处理失去焦点事件
     */
    handleBlur(event) {
    }

    /**
     * 完成编辑
     */
    finishEditing() {
        if (!this.isEditing || !this.editingText || !this.hiddenInput) return;
        this.canvas.style.cursor = '';
        this.editingText.status = Element.NONE
        // 更新文本
        this.editingText.text = this.hiddenInput.value;
        // 移除旧文本
        delete this.editingText.oldText
        if (!this.editingText.text) {
            this.removeElement(this.editingText)
        }
        this.removeActiveElement(this.editingText)
        this.cleanupEditing();
        this.renderAll();
    }

    /**
     * 取消编辑
     */
    cancelEditing() {
        if (!this.isEditing || !this.editingText || !this.hiddenInput) return;
        this.canvas.style.cursor = '';
        this.editingText.status = Element.NONE
        // 恢复原来的文本
        this.editingText.text = this.editingText.oldText;
        // 移除旧文本
        delete this.editingText.oldText
        // 如果文本为空，移除它
        if (!this.editingText.text) {
            this.removeElement(this.editingText)
        }
        this.removeActiveElement(this.editingText)
        this.cleanupEditing();
        this.renderAll();
    }

    /**
     * 清理编辑状态
     */
    cleanupEditing() {
        this.editingText = null;
        this.isEditing = false;
        this.cursorEnd = this.cursorStart = 0;
        clearInterval(this.cursorBlinkInterval);
        // 释放焦点：避免编辑结束后隐藏输入框仍持有焦点，拦截 Ctrl+Z 等文档级快捷键
        this.hiddenInput && this.hiddenInput.blur();
    }

    /**
     * 销毁编辑器，清理事件监听
     */
    destroy() {
        if (this.isBrowser) {
            // 移除事件监听
            this.eventScope.removeEventListener('mousedown', this.handleMouseDown);
            this.eventScope.removeEventListener('mousemove', this.handleMouseMove);
            this.eventScope.removeEventListener('dblclick', this.handleDoubleClick);
            // 移除隐藏输入框
            this.removeHiddenInput();
            // 清除定时器
            clearInterval(this.cursorBlinkInterval);
            // 清除历史栈与防抖定时器
            this.history.destroy();

            this.events.clear();
        }

        this.ctx = null;
        this.canvas = null;
        this.cache.clear();
    }

    /**
     * 调整 Canvas 大小
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     * @param {number} zoom - 缩放倍数
     */
    resizeCanvas(width, height, zoom) {
        if (Number.isFinite(width) && width > 0) this.width = width;
        if (Number.isFinite(height) && height > 0) this.height = height;
        if (Number.isFinite(zoom) && zoom > 0) this.zoom = zoom;
        this.setupCanvas()
    }

    /**
     * 获取 canvas 尺寸
     * @returns {*}
     */
    getCanvasSize() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        }
    }


    /**
     * 获取 canvas
     * @returns {*}
     */
    getCanvas() {
        return this.canvas;
    }


    /**
     * 导出所有数据为 JSON
     * @returns {string} JSON 格式的文本数据
     */
    exportToJSON() {
        return JSON.stringify(this.exportToObject(), null, 2);
    }


    /**
     * 导出所有数据为 Object
     * @returns {Object} Object
     */
    exportToObject() {
        return {
            zoom: this.zoom,
            width: this.width,
            height: this.height,
            // 返回元素数组的快照拷贝，避免外部持有的引用被后续 clearCanvas 原地清空而丢失
            elements: [...this.elements]
        }
    }


    /**
     * 导入数据并渲染：按数据类型自动分发（object / JSON 字符串）
     * @param {Object | string} data - 数据
     */
    async load(data) {
        const handle = this._createApplyHandle(await this._parse(data))
        handle.apply();
    }

    /**
     * 从 object 导入数据并渲染（仅接受 object 类型，不符抛 unsupported data type）
     * @param {Object} object - 对象类型数据
     */
    async loadFromObject(object) {
        const handle = this._createApplyHandle(this._parseFromObject(object))
        handle.apply();
    }


    /**
     * 从 JSON 导入数据并渲染（仅接受 JSON 字符串，类型不符抛 unsupported data type）
     * @param {string} json - JSON 类型数据
     */
    async loadFromJSON(json) {
        const handle = this._createApplyHandle(await this._parseFromJSON(json))
        handle.apply();
    }


    /**
     * 批量导入多个编辑器的数据并渲染：获取批次句柄后立即触发渲染
     * @param {Array<{editor: CanvasEditor, data: Object|string}>} targets
     * @returns {Promise<void>}
     */
    static async loadAll(targets) {
        const batch = await CanvasEditor.preloadAll(targets);
        batch.apply();
    }


    /**
     * 预加载阶段：解析数据、解码图片并构造元素实例。与 load 的区别：load 获取句柄后立即执行，本方法把执行时机交给调用方
     * @param {Object | string} data - 数据（object 或 JSON 字符串）
     * @returns {Promise<{apply: () => void}>}
     */
    async preload(data) {
        return this._createApplyHandle(await this._parse(data));
    }

    /**
     * 从 object 预加载渲染句柄：仅接受 object 类型，不符抛 unsupported data type。
     * 返回带 apply() 的渲染句柄（与 preload 一致）：apply 一次性完成灌入与渲染上屏
     * @param {Object} object - 对象类型数据
     * @returns {{apply: () => void}}
     */
    preloadFromObject(object) {
        return this._createApplyHandle(this._parseFromObject(object));
    }


    /**
     * 从 JSON 预加载渲染句柄：仅接受 JSON 字符串，类型不符抛 unsupported data type。
     * 返回带 apply() 的渲染句柄（与 preload 一致）：apply 一次性完成灌入与渲染上屏
     * @param {string} json - JSON 类型数据
     * @returns {Promise<{apply: () => void}>}
     */
    async preloadFromJSON(json) {
        return this._createApplyHandle(await this._parseFromJSON(json));
    }


    /**
     * 批量预加载多个编辑器的导入数据：并发解码图片、构造元素，不触发渲染。
     * 与 loadAll 的区别：loadAll 获取句柄后立触发渲染，本方法把执行时机交给调用方
     * @param {Array<{editor: CanvasEditor, data: Object|string}>} targets
     * @returns {Promise<{apply: () => void}>}
     */
    static async preloadAll(targets) {
        const list = Array.isArray(targets) ? targets : [];
        const handles = await Promise.all(
            list.map(({editor, data}) => editor.preload(data))
        );
        return {
            apply() {
                handles.forEach(handle => handle.apply());
            }
        };
    }


    /**
     * 解析阶段的内部分发：按数据类型分发到对应解析方法，产出裸数据（不触碰画布）
     * @param {Object | string} data - 数据
     * @returns {Promise<{width, height, zoom, elements}>}
     */
    async _parse(data) {
        if (data && typeof data === 'object') {
            return this._parseFromObject(data)
        }
        if (typeof data === 'string') {
            return this._parseFromJSON(data)
        }
        throw new Error('unsupported data type');
    }

    /**
     * 从 object 解析裸数据（不触碰画布）
     * @param {Object} object - 对象类型数据
     * @returns {{width, height, zoom, elements}}
     */
    _parseFromObject(object) {
        if (!object || typeof object !== 'object') throw new Error('unsupported data type');
        const {width, height, zoom, elements} = object;
        // 直接透传既有元素实例，由 resetElements 拷入以保留响应式代理身份
        return {width, height, zoom, elements};
    }


    /**
     * 从 JSON 解析裸数据：解析 JSON、解码图片并构造元素（不触碰画布）。
     * 组合元素递归构造子元素（元素构造由 element-factory 按类型分发）
     * @param {string} json - JSON 类型数据
     * @returns {Promise<{width, height, zoom, elements}>}
     */
    async _parseFromJSON(json) {
        if (!json || typeof json !== 'string') throw new Error('unsupported data type');
        try {
            const {width, height, elements, zoom} = JSON.parse(json);
            const preloadElements = [];
            for (let element of elements) {
                const instance = await createElement(element, {enableCache: this.enableCache, cache: this.cache});
                if (instance) preloadElements.push(instance);
            }
            return {width, height, zoom, elements: preloadElements};
        } catch (e) {
            throw new Error(`加载失败: ${e.message}`);
        }
    }


    /**
     * 将裸数据包装为渲染句柄：apply 在同一同步任务内完成清空、灌入、
     * 尺寸调整与重绘，所有句柄语义统一（单编辑器句柄与 preloadAll 批次句柄行为一致）
     * @param {{width, height, zoom, elements}} preload - 预加载阶段产出的数据
     * @returns {{apply: () => void}}
     */
    _createApplyHandle(preload) {
        return {
            apply: () => {
                // 载入是整体替换而非编辑动作：抑制载入期间的历史记录，完成后以载入状态为基线重置历史
                this.history.restoring = true;
                try {
                    const {width, height, zoom, elements} = preload;
                    this.clearCanvas();
                    this.resizeCanvas(width, height, zoom);
                    // 必须先清空再灌入：clearCanvas 内部会 resetElements() 清空元素，顺序颠倒会导致刚塞入的元素被清掉、编辑器恒为空
                    this.resetElements(elements);
                } catch (e) {
                    throw new Error(`加载失败: ${e.message}`);
                } finally {
                    this.history.restoring = false;
                }
                this.renderAll();
                this.history.reset();
            }
        };
    }


    /**
     * 导出 JPEG 图片
     * @param filename
     * @param quality
     */
    exportJPEG(filename, quality = 0.95) {
        const dataURL = this.canvas.toDataURL('image/jpeg', quality);
        this.#downloadFile(dataURL, filename)
    }


    /**
     * 导出 PNG 图片
     * @param filename
     */
    exportPNG(filename) {
        const dataURL = this.canvas.toDataURL('image/png');
        this.#downloadFile(dataURL, filename)
    }


    /**
     * 导出 WEBP 图片
     * @param filename
     * @param quality
     */
    exportWEBP(filename, quality = 0.95) {
        const dataURL = this.canvas.toDataURL('image/webp', quality);
        this.#downloadFile(dataURL, filename)
    }


    /**
     * 下载文件
     * @param filename
     * @param dataURL
     */
    #downloadFile(dataURL, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

}


// 兼容导出：保持既有 `from '@/canvas/CanvasEditor'` 导入不变
export {CanvasEditor, Text, EditableText, Image, Rect, LazyImage, Group, ReactiveObserver};
