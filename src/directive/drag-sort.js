// 拖拽排序指令（容器级事件委托版）
//
// 旧实现把 dragover / dragenter / drop / dragend 监听器逐个挂在子元素上，
// 而 drop 回调里同步更新 store 会触发 Vue 重渲染，令指令的 updated 钩子
// 抢在 dragend 之前把这些监听器摘掉，导致 dragend 的样式清理永远不执行，
// 「over / dragging」样式残留在卡片上。
//
// 现在所有监听器只挂在容器上（事件委托），Vue 重渲染不会移除它们；
// 同时在拖拽结束后短暂拦截 click，避免落点卡片被误触发选中态。
const CLICK_MOVE_THRESHOLD = 5

const dragSort = {
    mounted(el, binding) {
        initDragSort(el, binding);
    },
    updated(el, binding) {
        initDragSort(el, binding);
    },
    unmounted(el) {
        destroyDragSort(el);
    }
};

// 向上找到 target 所属的直接子元素（不在容器内则返回 null）
const findChild = (el, node) => {
    while (node && node.parentElement !== el) {
        node = node.parentElement;
    }
    return node;
};

const clearOver = (el) => {
    if (el._overElement) {
        el._overElement.classList.remove('over');
        el._overElement = null;
    }
};

const clearDragging = (el) => {
    Array.from(el.children).forEach(child => {
        child.classList.remove('dragging');
        child.classList.remove('over');
    });
};

// 拖拽结束的统一收尾：清样式、清状态、复位点击拦截标记
const finishDrag = (el) => {
    clearDragging(el);
    clearOver(el);
    delete el._dragElement;
    delete el._overElement;
    // click 若紧跟在拖拽结束后触发，_dragActive 仍为 true，会被 handleClick 拦下；
    // 之后由下一次 mousedown 或这个兜底定时器复位
    setTimeout(() => {
        el._dragActive = false;
    }, 0);
};

const initDragSort = (el, binding) => {
    // 回调可能随渲染更新，每次同步
    if (typeof binding.value === 'function') {
        el._dragSortCallback = binding.value;
    }

    // 新增的子元素也要可拖拽（其余监听器都走容器委托，无需逐个绑定）
    Array.from(el.children).forEach(child => {
        child.setAttribute('draggable', 'true');
    });

    if (el._dragSortBound) return;
    el._dragSortBound = true;

    el._dragSortHandlers = {
        // 捕获阶段拦截：拖拽刚结束时抑制落点卡片上的 click（选中框误触发）
        mousedown: handleMouseDown,
        click: handleClick,
        dragstart: handleDragStart,
        dragover: handleDragOver,
        dragleave: handleDragLeave,
        drop: handleDrop,
        dragend: handleDragEnd
    };

    // 全部用捕获阶段：click / mousedown 需要抢在卡片自身监听器之前，其余事件在捕获阶段同样可用
    Object.entries(el._dragSortHandlers).forEach(([type, handler]) => {
        el.addEventListener(type, handler, true);
    });
};

const destroyDragSort = (el) => {
    if (!el._dragSortHandlers) return;
    Object.entries(el._dragSortHandlers).forEach(([type, handler]) => {
        el.removeEventListener(type, handler, true);
    });
    delete el._dragSortHandlers;
    delete el._dragSortCallback;
    delete el._dragSortBound;
    delete el._dragElement;
    delete el._overElement;
    delete el._dragActive;
    delete el._mouseDownInfo;
};

// 记录按下位置，用于判断 click 前指针是否发生过明显位移（即拖拽意图）
const handleMouseDown = function (e) {
    this._mouseDownInfo = { x: e.clientX, y: e.clientY };
    // 上一次拖拽的标记在这里作废，保证后续正常点击不受影响
    this._dragActive = false;
};

const handleClick = function (e) {
    const down = this._mouseDownInfo;
    const movedFar = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_MOVE_THRESHOLD;
    // 拖拽刚结束（click 紧跟在 dragend 之后）或指针位移明显：视为拖拽副产物，不当作点击
    if (!this._dragActive && !movedFar) return;
    e.preventDefault();
    e.stopPropagation();
};

const handleDragStart = function (e) {
    const child = findChild(this, e.target);
    if (!child) return;

    this._dragElement = child;
    this._dragActive = true;
    clearOver(this);

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');

    // 异步加样式，避免 dragging 态被画进拖拽预览图
    setTimeout(() => child.classList.add('dragging'), 0);
};

const handleDragOver = function (e) {
    if (!this._dragElement) return;
    const child = findChild(this, e.target);
    if (!child) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this._overElement !== child) {
        clearOver(this);
        this._overElement = child;
        child.classList.add('over');
    }
};

const handleDragLeave = function (e) {
    if (!this._dragElement) return;
    // 只在真正离开容器（relatedTarget 已不在容器内）时清掉悬浮高亮
    if (!this.contains(e.relatedTarget)) {
        clearOver(this);
    }
};

const handleDrop = function (e) {
    const dragElement = this._dragElement;
    if (!dragElement) return;

    e.preventDefault();

    const target = findChild(this, e.target);
    if (target && target !== dragElement) {
        const children = Array.from(this.children);
        const draggedIndex = children.indexOf(dragElement);
        const targetIndex = children.indexOf(target);

        if (draggedIndex < targetIndex) {
            this.insertBefore(dragElement, target.nextElementSibling);
        } else {
            this.insertBefore(dragElement, target);
        }

        // 拖拽排序结束后按 DOM 顺序通知外部重排数据
        if (typeof this._dragSortCallback === 'function') {
            this._dragSortCallback(this, dragElement, target);
        }
    }

    // 关键：drop 里移动了源节点（insertBefore + Vue 重渲染）时，部分环境下
    // dragend 不会触发，导致 dragging / over 样式残留、点击拦截标记不复位。
    // 所以清理必须在 drop 内完成，dragend 只兜底「未 drop 的取消拖拽」。
    finishDrag(this);
};

const handleDragEnd = function () {
    if (!this._dragElement) return;
    finishDrag(this);
};

export default dragSort;
