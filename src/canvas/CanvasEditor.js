const SELECTION_OBJECT = 'selection:object'

const MOVE_OBJECT = 'move:object'

const ADD_OBJECT = 'add:object'


/**
 * Canvas 文本编辑器类
 * 封装 Canvas 文本编辑功能
 */
class CanvasEditor {
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

        this.ctx = this.canvas.getContext('2d');

        // 元素数据存储
        this.elements = [];

        this.activeElements = [];

        this.width = options.width || 0;

        this.height = options.height || 0;

        this.zoom = options.zoom || 1;

        this.dpr = window.devicePixelRatio || 1;

        this.backgroundColor = options.backgroundColor || 'rgba(255,255,255,0)';

        this.showGrid = options.showGrid || false;

        this.gridSize = options.gridSize || 20;

        this.gridColor = options.gridColor || '#e3e0e0';

        // 编辑状态
        this.editingText = null;
        this.isEditing = false;
        this.cursorStart = 0;
        this.cursorEnd = 0

        this.cursorBlinkInterval = null;

        this.isCursorVisible = true;

        // 动态创建的输入框
        this.hiddenInput = null;

        // 事件回调
        this.eventCallbacks = new Map();

        // 绑定事件处理函数
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);

        // 初始化
        this.initCanvas();
    }

    /**
     * 初始化编辑器
     */
    initCanvas() {

        this.canvas.width = this.width * this.dpr;

        this.canvas.height = this.height * this.dpr;

        //设置高质量渲染选项
        this.ctx.patternQuality = 'best';
        this.ctx.quality = 'best'
        this.ctx.antialias = 'subpixel'
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high'

        // 添加事件监听
        this.isBrowser && this.canvas.addEventListener('mousedown', this.handleMouseDown);
    }


    /**
     * 绑定 canvas 相关事件
     * @param event
     * @param callback
     */
    on(event, callback) {
        let events = this.eventCallbacks.get(event);
        if (!events) {
            events = new Set();
            this.eventCallbacks.set(event, events);
        }
        events.add(callback);
    }


    /**
     * 创建隐藏输入框
     */
    createHiddenInput() {
        // 如果已存在输入框，先移除
        if (this.hiddenInput) {
            this.removeHiddenInput();
        }
        // 创建新的输入框
        this.hiddenInput = document.createElement('input');
        this.hiddenInput.type = 'text';
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

        // 添加到body
        document.body.appendChild(this.hiddenInput);

        // 添加事件监听
        this.hiddenInput.addEventListener('keydown', this.handleKeyDown);
        this.hiddenInput.addEventListener('keyup', this.handleKeyUp);
        this.hiddenInput.addEventListener('input', this.handleInput);
        this.hiddenInput.addEventListener('blur', this.handleBlur);

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
            this.renderAll();
            this.updateInputSelection();
            return;
        }
        textObj.status = Element.EDITING
        this.editingText = textObj;
        this.isEditing = true;
        this.isCursorVisible = true;
        this.cursorEnd = this.cursorStart = index;

        this.canvas.style.cursor = textObj.direction === 'horizontal' ? 'text' : 'vertical-text';

        // 动态创建隐藏输入框
        this.createHiddenInput();

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
            this.hiddenInput.removeEventListener('keyup', this.handleKeyUp);
            this.hiddenInput.removeEventListener('input', this.handleInput);
            this.hiddenInput.removeEventListener('blur', this.handleBlur);

            // 从DOM中移除
            if (this.hiddenInput.parentNode) {
                this.hiddenInput.parentNode.removeChild(this.hiddenInput);
            }
            this.hiddenInput = null;
        }
    }

    /**
     * 添加元素
     * @returns {number} 新添加元素的索引
     * @param element
     */
    addElement(element) {
        this.elements.push(element);
        if (element.type === 'image' && element.cacheable) {
            this.cache.set(element.src, element.image)
        }
        const callbacks = this.eventCallbacks.get(ADD_OBJECT);
        if (callbacks && callbacks.size) {
            callbacks.forEach(callback => callback({x: element.x, y: element.y, target: element}))
        }
        return this.elements.length - 1;
    }


    hasElement(element) {
        return this.elements.findIndex(item => item.id === element.id) !== -1;
    }


    /**
     * 移除元素
     * @param {number} element - 元素
     */
    removeElement(element) {
        let index = this.elements.findIndex(item => item.id === element.id);
        while (index !== -1) {
            this.elements.splice(index, 1);
            index = this.elements.findIndex(item => item.id === element.id);
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
        this.elements = this.elements.filter(element => !targets.has(element.id));
        // 同时删除激活元素
        this.activeElements = this.activeElements.filter(element => !targets.has(element.id));
    }


    /**
     * 移除全部元素
     */
    clearElements() {
        this.elements = [];
        this.activeElements = [];
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
            const removeObj = this.activeElements.splice(index, 1);
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
        const targets = new Set(elementArray.map(element => element.id));
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
     * 清理画布
     */
    clearCanvas() {
        this.elements = [];
        this.activeElements = [];
        this.isEditing && this.finishEditing();
    }

    /**
     * 切换网格背景显示
     */
    toggleGrid() {
        this.showGrid = !this.showGrid;
    }

    /**
     * 获取文本度量信息
     * @param {Text} textObj - 测量的文本
     * @returns {TextMetrics} 文本度量
     */
    getTextMetrics(textObj) {
        const text = textObj.text;
        return this.getSubTextMetrics(textObj, 0, text.length)
    }

    /**
     * 获取部分文本宽度
     * @param {string} textObj - 完整文本
     * @param {number} startIndex - 开始索引
     * @param {number} endIndex - 结束索引
     * @returns {TextMetrics} 截取文本度量
     */
    getSubTextMetrics(textObj, startIndex, endIndex) {

        const {text, spacing, fontStyle, fontWeight, fontSize, fontFamily} = textObj;
        // 设置字体（与 drawText 保持一致）
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", "Microsoft YaHei", sans-serif`;

        // 参数边界检查
        const safeStart = Math.max(0, Math.min(startIndex, endIndex));
        const safeEnd = Math.min(text.length, Math.max(startIndex, endIndex));

        let textWidth = 0;
        let charCount = 0;

        // 使用与 drawText 相同的逻辑测量每个字符
        for (let i = safeStart; i < safeEnd; i++) {
            const char = text[i];
            textWidth += this.ctx.measureText(char).width;
            charCount++;
        }

        // 添加间距（字符数 -1 ）* spacing
        const spacingWidth = charCount > 0 ? (charCount - 1) * spacing : 0;

        // 返回一个包含宽度信息的对象
        return {
            width: textWidth + spacingWidth,
            charCount: charCount,
            spacingWidth,
            textWidth,
        };
    }


    getRangeByIndex(textObj, startIndex, endIndex) {
        const {x, text, spacing, fontStyle, fontWeight, fontSize, fontFamily} = textObj;
        // 设置字体（与 drawText 保持一致）
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", "Microsoft YaHei", sans-serif`;
        let startX = x;
        let endX = x;
        const minIndex = Math.max(0, Math.min(startIndex, endIndex));
        const maxIndex = Math.min(text.length, Math.max(startIndex, endIndex));
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = this.ctx.measureText(char).width;
            if (i < minIndex) {
                startX += charWidth + spacing;
            }
            if (i < maxIndex) {
                endX += charWidth + spacing;
            }
        }
        startX = Math.max(0, startX - spacing)
        endX = Math.max(0, endX - spacing)
        return {startX, endX}
    }

    /**
     * 根据点击位置计算光标位置
     * @param {Object} textObj - 文本对象
     * @param {number} clickX - 点击X坐标
     * @param {number} clickY - 点击Y坐标
     * @returns {number} 光标索引
     */
    getCursorIndexFromText(textObj, clickX, clickY) {

        const {text, chars, x, y, width, fontSize: rawHeight, spacing, height, direction, angle = 0} = textObj;

        // 如果有旋转角度，需要对点击坐标进行反向旋转
        let transformedX = clickX;
        let transformedY = clickY;

        if (angle !== 0) {
            // 计算文本中心点
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            // 将点击坐标转换到以文本中心为原点的坐标系
            const dx = clickX - centerX;
            const dy = clickY - centerY;

            // 反向旋转角度（负角度）
            const rad = -angle * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // 计算反向旋转后的坐标
            transformedX = dx * cos - dy * sin + centerX;
            transformedY = dx * sin + dy * cos + centerY;
        }

        // 使用转换后的坐标进行光标索引计算
        if (direction === 'horizontal') {
            // 计算文本的实际绘制区域
            const left = x;
            const right = x + width;

            // 如果文本是空的，直接返回0
            if (!chars || chars.length === 0) return 0;

            const first = chars[0];
            const last = chars[chars.length - 1];

            // 如果点击在文本左侧，光标在开头
            if (transformedX < left + first.width / 2) return 0;
            // 如果点击在文本右侧，光标在末尾
            if (transformedX > right - last.width / 2) return text.length;

            // 遍历查找光标位置
            for (let i = 0; i < chars.length - 1; i++) {
                const before = chars[i];
                const next = chars[i + 1];
                if (transformedX >= before.x + before.width / 2 && transformedX <= next.x + next.width / 2) {
                    return i + 1;
                }
            }
        } else {
            // 计算文本的实际绘制区域
            const top = y;
            const bottom = top + height;

            // 如果点击在文本上方，光标在开头
            if (transformedY < top + rawHeight / 2) return 0;
            // 如果点击在文本下方，光标在末尾
            if (transformedY > bottom - rawHeight / 2) {
                return text.length;
            }

            // 遍历查找光标位置
            for (let i = 0; i < chars.length - 1; i++) {
                const before = top + rawHeight * i + (i === 0 ? 0 : spacing);
                const next = top + (rawHeight + spacing) * (i + 1);
                if (transformedY >= before + rawHeight / 2 && transformedY <= next + rawHeight / 2) {
                    return i + 1;
                }
            }
        }
        // 如果没有找到匹配（理论上不应该到这里），返回0
        return -1;
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
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;
        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }


    /**
     * 绘制所有内容
     */
    renderAll() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 绘制背景
        this.drawBackgroundColor()
        // 绘制网格背景
        this.drawGrid();
        // 绘制元素
        this.drawElements()
    }


    /**
     * 绘制背景
     */
    drawBackgroundColor() {
        this.drawFillRect(0, 0, this.canvas.width, this.canvas.height, this.backgroundColor)
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
    setCenterZoom(zoom) {
        if (zoom > 0) {
            this.zoom = zoom
            this.canvas.style.transform = `scale(${zoom})`
            this.canvas.style.transformOrigin = 'center center';
        }
    }

    /**
     * 通过指定点设置缩放
     * @param zoom
     * @param pointX
     * @param pointY
     */
    setZoom(zoom, pointX, pointY) {
        if (zoom > 0) {
            this.zoom = zoom
            this.canvas.style.transform = `scale(${zoom})`
            this.canvas.style.transformOrigin = `${pointX}px ${pointY}px`;
        }
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
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        }
    }

    /**
     * 绘制元素到 canvas 上
     */
    drawElements() {
        // 绘制所有文本
        for (const element of this.elements) {
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
        const {offsetX: x, offsetY: y} = event;
        if (element && element.editable) {
            this.clearActiveElements()
            if (this.isEditing && this.editingText !== element) {
                this.finishEditing()
                return
            }
            // 计算点击位置对应的光标索引
            const index = this.getCursorIndexFromText(element, x, y);

            console.log(index)
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
        return {
            x: event.offsetX,
            y: event.offsetY
        }
    }


    /**
     * 处理 canvas 内鼠标相关事件
     * @param event
     */
    handleMouseDown(event) {
        const startTime = Date.now();
        const {offsetX: startX, offsetY: startY} = event;
        const element = this.getElementAt(startX, startY, element => element.selectable);
        if (!element) {
            this.handleCancelActive()
            return
        }
        let beforeMoveX = startX;
        let beforeMoveY = startY
        const handleMousemove = (e) => {
            const interval = Date.now() - startTime;
            const {offsetX: moveX, offsetY: moveY} = e;
            if (interval > 200 && (startX !== moveX || startY !== moveY)) {
                if (element.type === 'text' && element.status === Element.EDITING) {
                    // 选中文本
                    this.cursorEnd = this.getCursorIndexFromText(element, moveX, moveY);
                    if (this.cursorEnd !== this.cursorStart) {
                        this.updateInputSelection()
                        this.renderAll()
                    }
                } else if (element.draggable) {
                    this.removeActiveElement(element)
                    this.canvas.style.cursor = 'move';
                    element.x += moveX - beforeMoveX;
                    element.y += moveY - beforeMoveY;
                    element.centerX += moveX - beforeMoveX
                    element.centerY += moveY - beforeMoveY
                    beforeMoveX = moveX;
                    beforeMoveY = moveY
                    const callbacks = this.eventCallbacks.get(MOVE_OBJECT);
                    if (callbacks && callbacks.size) {
                        callbacks.forEach(callback => callback({x: moveX, y: moveY, target: element}))
                    }
                    this.renderAll()
                }
            }
        }
        const handleMouseup = (e) => {
            const {offsetX: endX, offsetY: endY} = e;
            if (startX === endX && startY === endY) {
                if (element.type === 'text' && (element.status === Element.SELECTED || element.status === Element.EDITING)) {
                    this.handleEditText({event, element})
                } else {
                    this.editingText && this.finishEditing()
                    this.handleActiveElement({x: endX, y: endY, target: element})
                }
            }
            !this.isEditing && (this.canvas.style.cursor = '');
            this.canvas.removeEventListener('mousemove', handleMousemove)
            document.removeEventListener('mouseup', handleMouseup)
        }
        this.canvas.addEventListener('mousemove', handleMousemove)
        document.addEventListener('mouseup', handleMouseup)
    }

    handleActiveElement(event) {
        const target = event.target;
        this.activeElements.push(event.target)
        target.status = Element.SELECTED
        const callbacks = this.eventCallbacks.get(SELECTION_OBJECT);
        if (callbacks && callbacks.size) {
            callbacks.forEach(callback => callback(event))
        }
        this.renderAll()
    }


    /**
     * 更新输入框的光标位置
     */
    updateInputSelection() {
        if (!this.editingText || !this.hiddenInput) return;
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
        if (!this.editingText || !this.hiddenInput) return;
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
        if (!this.editingText) return;
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                this.finishEditing();
                break;
            case 'Escape':
                event.preventDefault();
                this.cancelEditing();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (this.cursorStart > 0) {
                    this.cursorStart--;
                    this.cursorEnd--;
                    this.updateInputSelection();
                    this.renderAll();
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (this.cursorStart < this.editingText.text.length) {
                    this.cursorStart++;
                    this.cursorEnd++;
                    this.updateInputSelection();
                    this.renderAll();
                }
                break;
            case 'Home':
                event.preventDefault();
                this.cursorEnd = this.cursorStart = 0;
                this.updateInputSelection();
                this.renderAll();
                break;
            case 'End':
                event.preventDefault();
                this.cursorEnd = this.cursorStart = this.editingText.text.length;
                this.updateInputSelection();
                this.renderAll();
                break;
            case 'Delete':
                break;
        }
    }


    /**
     * 取消元素选择状态
     *
     */
    handleCancelActive() {
        if (this.activeElements.length > 0) {
            this.clearActiveElements()
            this.renderAll();
        }
        if (this.editingText) {
            this.finishEditing()
        }
    }


    /**
     * 处理键盘松开事件
     */
    handleKeyUp() {
        if (!this.editingText || !this.hiddenInput) return;
        // 更新光标位置
        this.cursorEnd = this.cursorStart = this.hiddenInput.selectionStart;
        this.renderAll();
    }

    /**
     * 处理失去焦点事件
     */
    handleBlur() {
        setTimeout(() => {
            if (this.editingText && this.hiddenInput && document.activeElement !== this.hiddenInput) {
                // this.finishEditing();
            }
        }, 100);
    }

    /**
     * 完成编辑
     */
    finishEditing() {
        if (this.editingText && this.hiddenInput) {
            this.canvas.style.cursor = '';
            this.editingText.status = Element.NONE
            // 更新文本
            this.editingText.text = this.hiddenInput.value;
            if (!this.editingText.text) {
                this.removeElement(this.editingText)
            }
            this.removeActiveElement(this.editingText)
            this.cleanup();
            this.renderAll();
        }
    }

    /**
     * 取消编辑
     */
    cancelEditing() {
        if (this.editingText) {
            this.canvas.style.cursor = '';
            this.editingText.status = Element.NONE
            // 如果文本为空，移除它
            if (!this.hiddenInput.value) {
                this.removeElement(this.editingText)
            }
            this.removeActiveElement(this.editingText)
            this.cleanup();
            this.renderAll();
        }
    }

    /**
     * 清理编辑状态
     */
    cleanup() {
        // 移除隐藏输入框
        this.removeHiddenInput();
        this.editingText = null;
        this.isEditing = false;
        this.cursorEnd = this.cursorStart = 0;
        clearInterval(this.cursorBlinkInterval);
    }

    /**
     * 销毁编辑器，清理事件监听
     */
    destroy() {
        // 移除事件监听
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        // 移除隐藏输入框
        this.removeHiddenInput();
        // 清除定时器
        clearInterval(this.cursorBlinkInterval);
    }

    /**
     * 调整 Canvas 大小
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     */
    resizeCanvas(width, height) {
        this.canvas.width = this.width = width;
        this.canvas.height = this.height = height;
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
            width: this.canvas.width,
            height: this.canvas.height,
            elements: this.elements
        }
    }


    /**
     * 从 object 导入数据
     * @param {Object} object - JSON 格式的文本数据
     */
    async loadFromObject(object) {
        if (!object) return;
        try {
            this.clearCanvas();
            const {width, height, elements} = object;
            this.resizeCanvas(width, height)
            this.elements = elements;
        } catch (e) {
            console.error('导入失败:', e);
        }
    }


    /**
     * 从 JSON 导入文本数据
     * @param {string} json - JSON 格式的文本数据
     */
    async loadFromJSON(json) {
        try {
            this.clearCanvas();
            const {width, height, elements} = JSON.parse(json);
            this.resizeCanvas(width, height)
            for (let element of elements) {
                if (element.type === 'text') {
                    this.elements.push(new Text(element.text, element))
                }
                if (element.type === 'image') {
                    const image = this.cache.get(element.src);
                    const instance = image ? new Image(image, element) : await Image.fromURL(element.src, element);
                    this.elements.push(instance)
                    if (instance.cacheable && !this.cache.has(element.src)) {
                        this.cache.set(instance.src, instance.image);
                    }
                }
                if (element.type === 'rect') {
                    this.elements.push(new Rect(element));
                }
            }
        } catch (e) {
            console.error('导入失败:', e);
        }
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


class Element {

    static NONE = 'none'

    static SELECTED = 'selected'

    static EDITING = 'editing'

    constructor(options) {

        // 文本对象 id
        this.id = Date.now() + Math.random();
        // 坐标
        this.x = options.x || 0;

        this.y = options.y || 0;

        this.status = 'none'

        // 是否可选中
        this.selectable = options.selectable !== undefined ? options.selectable : true;

        // 是否可拖拽
        this.draggable = options.draggable !== undefined ? options.draggable : false;

        this.meta = options.meta || null

    }

}


/**
 * 可编辑文本
 */
class Text extends Element {

    #width = 0;

    #height = 0;

    #centerX = 0;

    #centerY = 0;

    #chars = []

    #ascent = 0;

    #descent = 0;

    constructor(text, options = {}) {
        super(options);
        // 元素类型
        this.type = 'text';
        // 文本内容
        this.text = text || '';
        // 文本排列方向
        this.direction = options.direction || 'horizontal';
        // 可编辑
        this.editable = options.editable !== undefined ? options.editable : false;
        // 文字间距
        this.spacing = options.spacing || 0;

        // 旋转角度
        this.angle = options.angle || 0;

        // 字体属性
        this.fontSize = options.fontSize || 16;
        this.fontStyle = options.fontStyle || 'normal';
        this.fontFamily = options.fontFamily || 'Microsoft YaHei';
        this.fontWeight = options.fontWeight || 400;
        this.lineHeight = options.lineHeight || 1.5;

        // 颜色
        this.fontColor = options.fontColor || 'black';

        this.highlightColor = options.highlightColor || 'rgba(255,255,255,0.2)';

        // 文本阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    // 外部可访问
    get ascent() {
        return this.#ascent;
    }

    // 外部可访问
    get descent() {
        return this.#descent;
    }


    // 外部可访问
    get width() {
        return this.#width;
    }

    // 外部可访问
    get height() {
        return this.#height;
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


    // 外部可访问
    get chars() {
        return this.#chars;
    }


    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
        }

        // 将点相对于中心点平移
        const translatedX = x - this.centerX;
        const translatedY = y - this.centerY;

        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;

        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

        // 将点平移回原坐标系
        const localX = rotatedX + this.centerX;
        const localY = rotatedY + this.centerY;

        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width && localY >= this.y && localY <= this.y + this.height;
    }


    draw(ctx) {
        ctx.save();
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        // 字体设置
        ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", "Microsoft YaHei", sans-serif`;
        // 字体颜色
        ctx.fillStyle = this.fontColor;

        // 默认不透明黑色
        ctx.shadowColor = this.shadow.color;
        // 默认模糊 0 像素
        ctx.shadowBlur = this.shadow.blur;
        // 默认X偏移
        ctx.shadowOffsetX = this.shadow.offsetX;
        // 默认Y偏移
        ctx.shadowOffsetY = this.shadow.offsetY;

        const metrics = ctx.measureText(this.text);
        this.#ascent = metrics.actualBoundingBoxAscent;
        this.#descent = metrics.actualBoundingBoxDescent;

        let {chars, height, width} = this.direction === 'vertical'
            ? this.parseVerticalChars(ctx)
            : this.parseHorizontalChars(ctx)

        if (!this.centerX || !this.centerY || this.angle === 0) {
            // 计算文本中心点
            this.#centerX = this.x + width / 2;
            this.#centerY = this.y + height / 2;
        }

        if (this.angle !== 0) {
            if (this.width !== width || this.height !== height) {
                // 根据新的宽高和原中心点重新计算位置
                this.x = this.centerX - width / 2
                this.y = this.centerY - height / 2
                chars = this.direction === 'vertical' ? this.parseVerticalChars(ctx).chars : this.parseHorizontalChars(ctx).chars
            }
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }


        // 绘制每个字符
        for (const char of chars) {
            ctx.fillText(char.char, char.x, char.y);
        }

        this.#width = width || (this.direction === 'horizontal' ? this.fontSize / 10 : this.fontSize)
        this.#height = height || (this.direction === 'horizontal' ? this.fontSize : this.fontSize / 10)
        this.#chars = chars;

        ctx.restore();
    }


    parseHorizontalChars(ctx) {
        let currentX = this.x;
        let currentY = this.y + this.ascent;
        const chars = [];
        let maxCharHeight = 0;
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const {
                width: charWidth,
                actualBoundingBoxAscent: ascent,
                actualBoundingBoxDescent: descent
            } = ctx.measureText(char);
            const charHeight = ascent + descent
            maxCharHeight = Math.max(maxCharHeight, charHeight);
            chars.push({char, x: currentX, y: currentY, width: charWidth, height: charHeight});
            currentX += charWidth + (i < this.text.length - 1 ? this.spacing : 0);
        }
        return {
            width: currentX - this.x,
            height: maxCharHeight,
            chars
        };
    }

    parseVerticalChars(ctx) {
        let currentY = this.y + this.ascent;
        const chars = [];
        let maxCharWidth = 0;
        // 先测量所有字符的宽度，找出最大宽度
        for (let i = 0; i < this.text.length; i++) {
            const char = this.text[i];
            const {
                width,
                actualBoundingBoxAscent: ascent,
                actualBoundingBoxDescent: descent
            } = ctx.measureText(char);
            const height = ascent + descent
            chars.push({width, char, height, ascent, descent});
            maxCharWidth = Math.max(maxCharWidth, width);
        }
        // 根据居中对齐方式计算x坐标
        for (let i = 0; i < this.text.length; i++) {
            const char = chars[i];
            // 计算当前字符在最大宽度内居中的x坐标
            char.x = this.x + (maxCharWidth - char.width) / 2;
            const rowCenterY = currentY + this.fontSize / 2;
            char.y = rowCenterY + (char.height / 2 - char.ascent);
            currentY += this.fontSize + (i < this.text.length - 1 ? this.spacing : 0);
        }
        return {
            width: maxCharWidth,
            height: currentY - (this.y + this.ascent),
            chars
        };
    }

    selection(ctx) {
        const color = 'red', lineCap = 'butt'
        const lineWidth = 0.08 * this.fontSize;
        ctx.save();
        ctx.setLineDash([0.3 * this.fontSize, 0.2 * this.fontSize]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;
        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }
        ctx.beginPath();
        ctx.rect(this.x - lineWidth, this.y - lineWidth, this.width + 2 * lineWidth, this.height + 2 * lineWidth);
        ctx.stroke();
        ctx.restore();
    }


    /**
     * 绘制光标
     * @param ctx
     * @param start
     * @param end
     */
    drawCursor(ctx, start, end) {
        if (start !== end) return
        const {fontColor, fontSize, spacing, chars} = this;
        const cursorWidth = 0.08 * fontSize;
        const char = chars[end];
        const offset = Math.abs((spacing - cursorWidth) / 2)
        ctx.save()
        ctx.fillStyle = fontColor;
        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }
        if (this.direction === 'horizontal') {
            const startX = !char ? this.x + this.width + offset : char.x - offset;
            ctx.fillRect(startX, this.y, cursorWidth, this.height);
        } else {
            const startY = !char ? this.y + this.height + offset : this.y + this.descent + (this.fontSize + this.spacing) * end - offset;
            ctx.fillRect(this.x, startY, this.width, cursorWidth);
        }
        ctx.restore();
    }

    /**
     * 绘制文本编辑状态背景颜色
     * @param ctx
     * @param start
     * @param end
     * @param start
     * @param end
     */
    drawEditBackground(ctx, start, end) {
        const {x, y, height, width, highlightColor, fontSize: rawHeight, spacing, text, chars} = this
        ctx.save()
        // 绘制高亮背景
        ctx.fillStyle = highlightColor;
        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }
        if (this.direction === 'horizontal') {
            const margin = 0.3 * height;
            ctx.fillRect(x - margin, y - margin, width + 2 * margin, height + 2 * margin);
            if (start !== end) {
                const startIndex = Math.max(0, Math.min(start, end));
                const endIndex = Math.min(text.length, Math.max(start, end));
                const startX = startIndex === 0 ? x : chars[startIndex].x - spacing / 2;
                const endX = endIndex < text.length ? chars[endIndex].x - spacing / 2 : x + width;
                ctx.fillStyle = 'rgb(59,103,225,0.5)';
                ctx.fillRect(startX, y, endX - startX, height);
            }
        } else {
            const margin = 0.3 * width;
            ctx.fillRect(x - margin, y - margin, width + 2 * margin, height + 2 * margin);
            if (start !== end) {
                const startIndex = Math.max(0, Math.min(start, end));
                const endIndex = Math.min(text.length, Math.max(start, end));
                const startY = startIndex === 0 ? y : y + this.descent + startIndex * (rawHeight + spacing) - spacing / 2;
                const endY = endIndex === text.length ? y + height : y + this.descent + endIndex * (rawHeight + spacing) - spacing / 2;
                ctx.fillStyle = 'rgb(59,103,225,0.5)';
                ctx.fillRect(x, startY, width, endY - startY);
            }
        }
        ctx.restore();
    }
}


class EditableText extends Text {
    constructor(text, options = {}) {
        super(text, {...options, editable: true});
    }
}


class Image extends Element {

    constructor(image, options = {}) {
        if (!image) {
            throw new Error('Failed to load image, image is null');
        }
        super(options);
        this.type = 'image'
        this.image = image
        this.src = image?.src
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.cacheable = options.cacheable || false
        this.scale = options.scale || 1
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        this.angle = options.angle || 0
        // 圆角属性
        this.radius = options.radius || 0;

        // 图片阴影
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };

        // backdrop-filter 效果配置
        this.backdropFilter = options.backdropFilter || false;  // 是否启用背景模糊
        this.backdropBlur = options.backdropBlur || 0;  // 模糊强度
        this.backdropBrightness = options.backdropBrightness || 1.0;  // 亮度
        this.backdropSaturation = options.backdropSaturation || 1.0;  // 饱和度
        this.backdropOpacity = options.backdropOpacity || 0.3;  // 模糊层不透明度

        // 缓存模糊效果的 canvas
        this._backdropCache = null;
        this._lastBackdropConfig = null;

        const {naturalWidth, naturalHeight} = image;
        const {width, height} = options;

        // 如果没有设置宽高，使用图片原始尺寸
        if (!width && !height) {
            this.width = naturalWidth;
            this.height = naturalHeight;
        }
        // 如果只设置了宽度，按比例计算高度
        else if (width && !height) {
            this.height = width * naturalHeight / naturalWidth;
        }
        // 如果只设置了高度，按比例计算宽度
        else if (height && !width) {
            this.width = height * naturalWidth / naturalHeight;
        }

    }

    static fromURL(src, options = {}) {
        return new Promise((resolve, reject) => {
            if (!src) {
                return reject(`Failed to load image: src is null`);
            }
            if (typeof window !== 'undefined') {
                const image = new window.Image();
                image.onload = () => {
                    const instance = new Image(image, options);
                    resolve(instance);
                };
                image.onerror = () => {
                    reject(`Failed to load image: ${src}`);
                };
                image.src = src;
                image.crossOrigin = options.crossOrigin;

            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(src).then(image => {
                    resolve(new Image(image, options))
                }).catch(err => {
                    reject(`Failed to load image from URL: ${src}. ${err.message}`)
                })
            }
        })
    }

    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width * this.scale && y >= this.y && y <= this.y + this.height * this.scale;
        }

        // 对于旋转的文本，将点击点反向旋转回文本的局部坐标系
        // 计算文本中心点（旋转中心）
        const centerX = this.x + this.width * this.scale / 2;
        const centerY = this.y + this.height * this.scale / 2;

        // 将点相对于中心点平移
        const translatedX = x - centerX;
        const translatedY = y - centerY;

        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;

        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

        // 将点平移回原坐标系
        const localX = rotatedX + centerX;
        const localY = rotatedY + centerY;

        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const x = this.x;
        const y = this.y;
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);

        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;

            this._createRoundedRectPath(ctx, x, y, width, height, radius);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();

            // 重要：清除阴影设置，避免影响后续绘制
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // 设置变换
        if (this.angle !== 0) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        if (this.backdropBlur) {
            ctx.filter = `blur(${this.backdropBlur}px)`;
        }

        // 创建圆角裁剪区域并绘制图像
        this._createRoundedRectPath(ctx, x, y, width, height, radius);

        ctx.clip();

        ctx.drawImage(this.image, x, y, width, height);

        ctx.restore();
    }

    // 修改后的通用圆角矩形路径方法
    _createRoundedRectPath(ctx, x, y, width, height, radius) {
        if (radius <= 0) {
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            return;
        }
        radius = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    selection(ctx) {
        const color = 'red', lineCap = 'butt'
        const baseWidth = Math.max(this.width, this.height) * this.scale;
        const lineWidth = 0.02 * baseWidth
        ctx.save();
        ctx.setLineDash([0.06 * baseWidth, 0.03 * baseWidth]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;

        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width * this.scale / 2;
            const centerY = this.y + this.height * this.scale / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 如果设置了圆角，绘制圆角选择框
        if (this.radius > 0) {
            const x = this.x - lineWidth;
            const y = this.y - lineWidth;
            const width = this.width * this.scale + 2 * lineWidth;
            const height = this.height * this.scale + 2 * lineWidth;
            const radius = Math.min(this.radius, width / 2, height / 2);

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        } else {
            // 绘制直角选择框
            ctx.beginPath();
            ctx.rect(this.x - lineWidth, this.y - lineWidth,
                this.width * this.scale + 2 * lineWidth,
                this.height * this.scale + 2 * lineWidth);
        }

        ctx.stroke();
        ctx.restore();
    }

}


class LazyImage extends Element {

    constructor(src, options = {}) {
        super(options);
        this.type = 'image'
        this.image = null
        this.src = src
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.cacheable = options.cacheable || false
        this.scale = options.scale || 1
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        this.angle = options.angle || 0
        // 圆角属性
        this.radius = options.radius || 0;

        // 图片阴影
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };

        // backdrop-filter 效果配置
        this.backdropFilter = options.backdropFilter || false;  // 是否启用背景模糊
        this.backdropBlur = options.backdropBlur || 0;  // 模糊强度
        this.backdropBrightness = options.backdropBrightness || 1.0;  // 亮度
        this.backdropSaturation = options.backdropSaturation || 1.0;  // 饱和度
        this.backdropOpacity = options.backdropOpacity || 0.3;  // 模糊层不透明度

        // 缓存模糊效果的 canvas
        this._backdropCache = null;
        this._lastBackdropConfig = null;

    }

    load() {
        return new Promise((resolve, reject) => {
            if (!this.src) {
                return reject(`Failed to load image: src is null`);
            }
            if (typeof window !== 'undefined') {
                const image = new window.Image();
                image.onload = () => {
                    const {naturalWidth, naturalHeight} = image;
                    // 如果没有设置宽高，使用图片原始尺寸
                    if (!this.width && !this.height) {
                        this.width = naturalWidth;
                        this.height = naturalHeight;
                    }
                    // 如果只设置了宽度，按比例计算高度
                    else if (this.width && !this.height) {
                        this.height = this.width * naturalHeight / naturalWidth;
                    }
                    // 如果只设置了高度，按比例计算宽度
                    else if (this.height && !this.width) {
                        this.width = this.height * naturalWidth / naturalHeight;
                    }
                    resolve();
                };
                image.onerror = () => {
                    reject(`Failed to load image: ${this.src}`);
                };
                image.src = this.src;
                image.crossOrigin = this.crossOrigin;
                this.image = image;
            } else {
                const {loadImage} = require('@napi-rs/canvas')
                loadImage(this.src).then(image => {
                    this.image = image;
                    const {naturalWidth, naturalHeight} = image;
                    // 如果没有设置宽高，使用图片原始尺寸
                    if (!this.width && !this.height) {
                        this.width = naturalWidth;
                        this.height = naturalHeight;
                    }
                    // 如果只设置了宽度，按比例计算高度
                    else if (this.width && !this.height) {
                        this.height = this.width * naturalHeight / naturalWidth;
                    }
                    // 如果只设置了高度，按比例计算宽度
                    else if (this.height && !this.width) {
                        this.width = this.height * naturalWidth / naturalHeight;
                    }
                    resolve()
                }).catch(err => {
                    reject(`Failed to load image from URL: ${this.src}. ${err.message}`)
                })
            }
        })
    }

    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width * this.scale && y >= this.y && y <= this.y + this.height * this.scale;
        }

        // 对于旋转的文本，将点击点反向旋转回文本的局部坐标系
        // 计算文本中心点（旋转中心）
        const centerX = this.x + this.width * this.scale / 2;
        const centerY = this.y + this.height * this.scale / 2;

        // 将点相对于中心点平移
        const translatedX = x - centerX;
        const translatedY = y - centerY;

        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;

        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

        // 将点平移回原坐标系
        const localX = rotatedX + centerX;
        const localY = rotatedY + centerY;

        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const x = this.x;
        const y = this.y;
        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);

        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = shadowOffsetX;
            ctx.shadowOffsetY = shadowOffsetY;

            this._createRoundedRectPath(ctx, x, y, width, height, radius);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.fill();

            // 重要：清除阴影设置，避免影响后续绘制
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // 设置变换
        if (this.angle !== 0) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        if (this.backdropBlur) {
            ctx.filter = `blur(${this.backdropBlur}px)`;
        }

        // 创建圆角裁剪区域并绘制图像
        this._createRoundedRectPath(ctx, x, y, width, height, radius);

        ctx.clip();

        ctx.drawImage(this.image, x, y, width, height);

        ctx.restore();
    }

    // 修改后的通用圆角矩形路径方法
    _createRoundedRectPath(ctx, x, y, width, height, radius) {
        if (radius <= 0) {
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            return;
        }
        radius = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    selection(ctx) {
        const color = 'red', lineCap = 'butt'
        const baseWidth = Math.max(this.width, this.height) * this.scale;
        const lineWidth = 0.02 * baseWidth
        ctx.save();
        ctx.setLineDash([0.06 * baseWidth, 0.03 * baseWidth]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;

        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width * this.scale / 2;
            const centerY = this.y + this.height * this.scale / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 如果设置了圆角，绘制圆角选择框
        if (this.radius > 0) {
            const x = this.x - lineWidth;
            const y = this.y - lineWidth;
            const width = this.width * this.scale + 2 * lineWidth;
            const height = this.height * this.scale + 2 * lineWidth;
            const radius = Math.min(this.radius, width / 2, height / 2);

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
        } else {
            // 绘制直角选择框
            ctx.beginPath();
            ctx.rect(this.x - lineWidth, this.y - lineWidth,
                this.width * this.scale + 2 * lineWidth,
                this.height * this.scale + 2 * lineWidth);
        }

        ctx.stroke();
        ctx.restore();
    }

}

class Rect extends Element {
    constructor(options) {
        super(options);
        this.type = 'rect'
        this.width = options.width || 0
        this.height = options.height || 0
        this.fill = options.fill || 'rgba(255,255,255,1)'
        this.radius = options.radius || 0
        this.stroke = options.stroke || 'rgba(0,0,0,1)'
        this.strokeWidth = options.strokeWidth || 0
        this.angle = options.angle || 0
        this.radius = options.radius || 0
        // 图片阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }

    contains(x, y) {
        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
        }
        // 对于旋转的文本，将点击点反向旋转回文本的局部坐标系
        // 计算文本中心点（旋转中心）
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        // 将点相对于中心点平移
        const translatedX = x - centerX;
        const translatedY = y - centerY;
        // 计算反向旋转角度（弧度）
        const angleRad = -this.angle * Math.PI / 180;
        // 反向旋转点（绕中心点反向旋转）
        const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
        const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);
        // 将点平移回原坐标系
        const localX = rotatedX + centerX;
        const localY = rotatedY + centerY;
        // 检查反向旋转后的点是否在原始（未旋转）的边界框内
        return localX >= this.x && localX <= this.x + this.width && localY >= this.y && localY <= this.y + this.height;
    }

    selection(ctx) {
        const color = 'red', lineCap = 'butt'
        const baseWidth = Math.max(this.width, this.height);
        const lineWidth = 0.02 * baseWidth
        ctx.save();
        ctx.setLineDash([0.06 * baseWidth, 0.03 * baseWidth]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;
        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        ctx.beginPath();
        ctx.rect(this.x - lineWidth, this.y - lineWidth, this.width + 2 * lineWidth, this.height + 2 * lineWidth);
        ctx.stroke();
        ctx.restore();
    }

    draw(ctx) {
        // 保存当前画布状态
        ctx.save();
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;

        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth;

        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 1)';
        // 设置阴影模糊度（像素）
        ctx.shadowBlur = shadowBlur || 0;
        // 设置阴影偏移（像素）
        ctx.shadowOffsetX = shadowOffsetX || 0;
        ctx.shadowOffsetY = shadowOffsetY || 0;

        if (this.angle !== 0) {
            // 将画布原点移动到图片中心点
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            ctx.translate(centerX, centerY);
            // 旋转画布
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 绘制圆角
        this._drawRoundedClip(ctx)

        // 先填充，后描边
        ctx.fillRect(this.x, this.y, this.width, this.height);
        if (this.strokeWidth) {
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // 恢复画布到之前保存的状态
        ctx.restore();
    }


    // 创建圆角裁剪区域
    _drawRoundedClip(ctx) {
        if (this.radius <= 0) return;
        const x = this.x;
        const y = this.y;
        const width = this.width;
        const height = this.height;
        const radius = Math.min(this.radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.clip();
    }
}

// 支持 ES6 模块
export {CanvasEditor, Text, EditableText, Image, Rect, LazyImage};
