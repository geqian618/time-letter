// 优化后的拖拽排序指令
const dragSort = {
    mounted(el, binding) {
        initDragSort(el, binding);
    },
    updated(el, binding) {
        initDragSort(el, binding);
    }
};

// 初始化拖拽排序
const initDragSort = (el, binding) => {
    // 清除现有事件监听器
    removeEventListeners(el);

    // 获取子元素
    const children = Array.from(el.children);

    // 为每个项目添加拖拽属性
    children.forEach((child, index) => {
        // 添加可拖拽属性
        child.setAttribute('draggable', 'true');
        child.setAttribute('data-index', index);

        // 只添加 dragstart 事件
        child.addEventListener('dragstart', handleDragStart);
    });

    // 存储事件处理函数以便后续移除
    el._dragSortHandlers = {
        dragstart: handleDragStart
    };

    // 调用回调函数（如果提供）
    if (binding.value && typeof binding.value === 'function') {
        el._dragSortCallback = binding.value;
    }
};

// 移除事件监听器
const removeEventListeners = (el) => {

    if (!el._dragSortHandlers) return;

    const children = Array.from(el.children);
    const handlers = el._dragSortHandlers;

    children.forEach(child => {

        child.removeEventListener('dragstart', handlers.dragstart);

        // 同时移除可能在拖拽过程中添加的事件
        if (handlers.dragend) {
            child.removeEventListener('dragend', handlers.dragend);
        }
        if (handlers.dragover) {
            child.removeEventListener('dragover', handlers.dragover);
        }
        if (handlers.dragenter) {
            child.removeEventListener('dragenter', handlers.dragenter);
        }
        if (handlers.dragleave) {
            child.removeEventListener('dragleave', handlers.dragleave);
        }
        if (handlers.drop) {
            child.removeEventListener('drop', handlers.drop);
        }
    });

    delete el._dragSortHandlers;
};

// 拖拽开始处理
const handleDragStart = function (e) {
    const el = this.parentElement;
    // 设置拖拽效果
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));

    // 存储拖拽元素
    el._dragElement = this;

    // 添加拖拽过程中需要的事件监听器
    addDragEventListeners(el);

    // 添加拖拽样式
    setTimeout(() => this.classList.add('dragging'), 0);
};

// 添加拖拽过程中的事件监听器
const addDragEventListeners = (el) => {

    const children = Array.from(el.children);

    // 定义事件处理函数
    const dragendHandler = handleDragEnd;
    const dragoverHandler = handleDragOver;
    const dragenterHandler = handleDragEnter;
    const dragleaveHandler = handleDragLeave;
    const dropHandler = handleDrop;

    children.forEach(child => {
        child.addEventListener('dragend', dragendHandler);
        child.addEventListener('dragover', dragoverHandler);
        child.addEventListener('dragenter', dragenterHandler);
        child.addEventListener('dragleave', dragleaveHandler);
        child.addEventListener('drop', dropHandler);
    });

    // 存储这些处理函数以便后续移除
    el._dragSortHandlers.dragend = dragendHandler;
    el._dragSortHandlers.dragover = dragoverHandler;
    el._dragSortHandlers.dragenter = dragenterHandler;
    el._dragSortHandlers.dragleave = dragleaveHandler;
    el._dragSortHandlers.drop = dropHandler;
};

// 拖拽结束处理
const handleDragEnd = function () {
    const el = this.parentElement;
    const children = Array.from(el.children);

    // 移除所有样式
    children.forEach(child => {
        child.classList.remove('dragging');
        child.classList.remove('over');
    });

    // 移除拖拽过程中添加的事件监听器
    removeDragEventListeners(el);

    // 清除拖拽元素引用
    delete el._dragElement;
};

// 移除拖拽过程中的事件监听器
const removeDragEventListeners = (el) => {
    const children = Array.from(el.children);
    const handlers = el._dragSortHandlers;

    if (!handlers) return;

    children.forEach(child => {
        if (handlers.dragend) {
            child.removeEventListener('dragend', handlers.dragend);
        }
        if (handlers.dragover) {
            child.removeEventListener('dragover', handlers.dragover);
        }
        if (handlers.dragenter) {
            child.removeEventListener('dragenter', handlers.dragenter);
        }
        if (handlers.dragleave) {
            child.removeEventListener('dragleave', handlers.dragleave);
        }
        if (handlers.drop) {
            child.removeEventListener('drop', handlers.drop);
        }
    });

    // 只保留 dragstart 事件处理函数
    el._dragSortHandlers = {
        dragstart: handlers.dragstart
    };
};

// 其余事件处理函数保持不变
const handleDragOver = function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
};

const handleDragEnter = function (e) {
    e.preventDefault();
    this.classList.add('over');
    return false;
};

const handleDragLeave = function (e) {
    e.preventDefault();
    this.classList.remove('over');
    return false;
};

const handleDrop = function (e) {

    e.preventDefault();

    const el = this.parentElement;
    const dragElement = el._dragElement;

    if (!dragElement || this === dragElement) return;

    // 获取所有子元素
    const children = Array.from(el.children);

    // 获取拖拽元素和目标元素的索引
    const draggedIndex = children.indexOf(dragElement);
    const targetIndex = children.indexOf(this);

    // 确定插入位置
    if (draggedIndex < targetIndex) {
        el.insertBefore(dragElement, this.nextElementSibling);
    } else {
        el.insertBefore(dragElement, this);
    }

    // 调用回调函数传递索引信息
    if (el._dragSortCallback && typeof el._dragSortCallback === 'function') {
        el._dragSortCallback(el, dragElement, this);
    }

    return false;
};

export default dragSort;
