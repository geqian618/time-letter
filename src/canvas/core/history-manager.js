/**
 * 撤销 / 恢复历史栈：通用的快照进栈 / 回退机制，不感知元素与画布。
 * 快照的生成（capture）与应用（restore）由宿主编入，本类只负责栈纪律：
 * 容量上限、重做栈失效、结构变更立即入栈、连续属性变更防抖合并、恢复与载入期间抑制记录
 */
export class HistoryManager {

    // 结构性变更对应的数组变异方法名（响应式数组回调以方法名作为 property 传入），此类变更立即记录历史
    static ARRAY_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']

    // 属性连续变更（拖拽 / 连续输入 / 面板调参）合并为一条历史的防抖间隔（毫秒）
    static DEBOUNCE = 400

    // 渲染派生 / 编辑临时的属性：width、height、lines 由每次绘制自动重算（如文本首次绘制测量回写），
    // oldText 是编辑态的暂存值。它们的变化不代表用户编辑，不记录历史（快照本身会携带这些值，
    // 真正的用户编辑如 text / fontSize 均由各自属性触发记录）
    static DERIVED_PROPS = ['width', 'height', 'lines', 'oldText']

    /**
     * @param {Object} options
     * @param {() => *} options.capture - 生成当前状态快照
     * @param {(snapshot: *) => void} options.restore - 应用快照
     * @param {() => void} [options.beforeApply] - 撤销 / 恢复应用快照前的宿主收尾（如提交编辑中的文本）
     * @param {('push'|'undo'|'redo') => void} [options.onChange] - 历史变化回调
     * @param {boolean} [options.enabled=true] - 关闭后不记录，undo / redo 也不再响应
     * @param {number} [options.maxSize=50] - 撤销栈容量上限
     */
    constructor(options = {}) {

        this.capture = options.capture;

        this.restore = options.restore;

        this.beforeApply = options.beforeApply || null;

        this.onChange = options.onChange || null;

        this.enabled = options.enabled !== false;

        this.maxSize = options.maxSize || 50;

        // 撤销栈：每项为一次变更后的快照，栈底为基线快照
        this.undoStack = [];

        // 重做栈：撤销时弹出的快照，产生新变更后清空
        this.redoStack = [];

        // 恢复快照 / 载入数据期间抑制记录
        this.restoring = false;

        // 同一手势的中间态（如 Alt 拷贝入列）抑制立即记录，由随后的属性变更防抖合并记录
        this.suppressed = false;

        // 属性连续变更的防抖定时器
        this.pendingTimer = null;
    }

    /**
     * 记录当前状态快照：结构变更与防抖合并后的属性变更都会走到这里
     */
    push() {
        if (!this.enabled || this.restoring || this.suppressed) return;
        this.undoStack.push(this.capture());
        if (this.undoStack.length > this.maxSize) this.undoStack.shift();
        // 产生新变更后不可再重做
        this.redoStack.length = 0;
        this.onChange && this.onChange('push');
    }

    /**
     * 属性连续变更防抖：拖拽 / 连续输入 / 面板调参只在停止变更后记录一条历史
     */
    schedule(delay = HistoryManager.DEBOUNCE) {
        if (!this.enabled) return;
        if (this.pendingTimer) clearTimeout(this.pendingTimer);
        this.pendingTimer = setTimeout(() => {
            this.pendingTimer = null;
            this.push();
        }, delay);
    }

    /**
     * 立即落盘防抖中的属性变更（undo / redo 前调用）
     */
    flush() {
        if (!this.pendingTimer) return;
        this.cancelPending();
        this.push();
    }

    /**
     * 丢弃防抖中未入栈的属性变更（结构变更已立即入栈时调用，避免随后产生内容相同的重复快照）
     */
    cancelPending() {
        if (!this.pendingTimer) return;
        clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
    }

    /**
     * 撤销：回退到上一条快照，刚落盘的当前状态转入重做栈
     * @returns {boolean} 是否执行了撤销
     */
    undo() {
        if (!this.enabled) return false;
        // 先落盘防抖中未入栈的属性变更，保证刚做的修改可被撤销
        this.flush();
        // 栈内需同时存在当前状态与上一状态才可撤销
        if (this.undoStack.length < 2) return false;
        this.beforeApply && this.beforeApply();
        this.redoStack.push(this.undoStack.pop());
        this.#apply(this.undoStack[this.undoStack.length - 1]);
        this.onChange && this.onChange('undo');
        return true;
    }

    /**
     * 恢复：重新应用最近一次被撤销的快照
     * @returns {boolean} 是否执行了恢复
     */
    redo() {
        if (!this.enabled) return false;
        // 撤销后若又有新变更，flush 已清空重做栈，此处自然不可恢复
        this.flush();
        if (!this.redoStack.length) return false;
        this.beforeApply && this.beforeApply();
        const next = this.redoStack.pop();
        this.undoStack.push(next);
        if (this.undoStack.length > this.maxSize) this.undoStack.shift();
        this.#apply(next);
        this.onChange && this.onChange('redo');
        return true;
    }

    canUndo() {
        return this.enabled && this.undoStack.length > 1;
    }

    canRedo() {
        return this.enabled && this.redoStack.length > 0;
    }

    /**
     * 清空历史并以当前状态为基线（载入数据 / 切换画布后调用，跨载入的操作不可互相撤销）
     */
    reset() {
        if (this.pendingTimer) {
            clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.push();
    }

    /**
     * 销毁：清除防抖定时器与栈
     */
    destroy() {
        clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
        this.undoStack.length = 0;
        this.redoStack.length = 0;
    }

    /**
     * 应用快照：抑制记录期间执行宿主恢复逻辑，恢复引发的属性写入不再入栈
     * @param {*} snapshot
     */
    #apply(snapshot) {
        this.restoring = true;
        try {
            this.restore(snapshot);
        } finally {
            this.restoring = false;
        }
    }
}
