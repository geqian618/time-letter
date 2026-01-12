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

        // 缓存图片
        this.cache = new Map();

        // 获取 Canvas 元素和上下文
        this.canvas = canvas;

        this.ctx = this.canvas.getContext('2d');

        // 元素数据存储
        this.elements = [];

        this.activeElements = [];

        // 编辑状态
        this.editingText = null;
        this.isEditing = false;
        this.cursorStart = 0;
        this.cursorEnd = 0

        this.cursorBlinkInterval = null;
        this.isCursorVisible = true;

        // 动态创建的输入框
        this.hiddenInput = null;

        // 默认配置
        this.canvasConfig = {
            width: options.width || canvas.width,
            height: options.height || canvas.height,
            cursorWidth: 1,
            zoom: 1,
            selectionColor: 'rgb(59,103,225,0.5)',
            backgroundColor: options.backgroundColor || 'rgba(255,255,255,0)',
            showGrid: options.showGrid || false,
            gridSize: options.gridSize || 20,
            gridColor: options.gridColor || '#e3e0e0'
        };

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
        const {width, height} = this.canvasConfig;
        if (width && height) {
            this.canvas.width = width
            this.canvas.height = height
        }
        // 添加事件监听
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
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
        this.canvas.style.cursor = 'text';

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
        this.renderAll();
        return this.elements.length - 1;
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

    hasElement(element) {
        return this.elements.findIndex(item => item.id === element.id) !== -1;
    }


    /**
     * 移除全部元素
     */
    removeElements() {
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
     * 移除全部激活元素
     */
    removeActiveElements() {
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
        this.renderAll();
    }

    /**
     * 切换网格背景显示
     */
    toggleGrid() {
        this.canvasConfig.showGrid = !this.canvasConfig.showGrid;
        this.renderAll();
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
        const metrics = this.getTextMetrics(textObj);
        const text = textObj.text;
        // 计算文本的实际绘制区域
        const textLeft = textObj.x;
        const textRight = textObj.x + metrics.width;

        // 如果点击在文本左侧，光标在开头
        if (clickX < textLeft) return 0;

        // 如果点击在文本右侧，光标在末尾
        if (clickX > textRight) return text.length;

        // 计算相对点击位置
        const relativeX = clickX - textLeft;

        // 使用二分法查找最近的光标位置
        let closestIndex = 0;

        let minDistance = Infinity;

        for (let i = 0; i <= text.length; i++) {
            const width = this.getSubTextMetrics(textObj, 0, i).width;
            const distance = Math.abs(width - relativeX);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }
        return closestIndex;
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
        if (!this.canvasConfig.showGrid) return;
        this.ctx.strokeStyle = this.canvasConfig.gridColor;
        this.ctx.lineWidth = 0.5;
        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.canvasConfig.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.canvasConfig.gridSize) {
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
        const {backgroundColor} = this.canvasConfig;
        this.drawFillRect(0, 0, this.canvas.width, this.canvas.height, backgroundColor)
    }


    /**
     * 设置背景
     * @param color
     */
    setBackgroundColor(color) {
        this.canvasConfig.backgroundColor = color
    }

    /**
     * 通过中心点设置缩放
     * @param zoom
     */
    setCenterZoom(zoom) {
        if (zoom > 0) {
            this.ctx.zoom = this.canvasConfig.zoom = zoom
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
            this.ctx.zoom = this.canvasConfig.zoom = zoom
            this.canvas.style.transform = `scale(${zoom})`
            this.canvas.style.transformOrigin = `${pointX}px ${pointY}px`;
        }
    }

    /**
     * 获取当前缩放
     * @returns {number}
     */
    getZoom() {
        return this.canvasConfig.zoom
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
            if (element.type === 'text') {
                // 绘制文本
                element.draw(this.ctx);
                // 如果是正在编辑的文本，绘制背景颜色
                if (element.status === Element.EDITING) {
                    element.drawEditBackground(this.ctx, this.cursorStart, this.cursorEnd)
                    // 如果是正在编辑的文本，绘制光标
                    if (this.isCursorVisible) {
                        element.drawCursor(this.ctx, this.cursorStart, this.cursorEnd)
                    }
                }
            } else if (element.type === 'image') {
                if (element.type === 'image') {
                    // 绘制图片
                    element.draw(this.ctx);
                }
            }
            if (this.hasActiveElement(element)) {
                element.selection(this.ctx)
            }
        }
    }


    /**
     * 绘制光标
     * @param textObj
     * @param cursorWidth
     */
    drawCursor(textObj, cursorWidth) {
        const {x, y, fontColor, fontSize, spacing} = textObj;
        const cursorX = x + this.getSubTextMetrics(textObj, 0, this.cursorStart).width;
        this.ctx.fillStyle = fontColor;
        this.ctx.fillRect(
            cursorX + (spacing - cursorWidth) / 2,
            y,
            cursorWidth,
            fontSize
        );
    }


    /**
     * 绘制文本编辑状态背景颜色
     * @param element
     */
    drawEditBackground(element) {
        const {x, y, height, highlightColor} = element
        const metrics = this.getTextMetrics(element);
        const margin = 0.3 * height;
        const width = metrics.width + 2 * margin
        const {ascent} = element;
        this.drawFillRect(x - margin, y - margin - ascent, width, height, highlightColor)
        if (this.cursorStart !== this.cursorEnd) {
            const {startX, endX} = this.getRangeByIndex(element, this.cursorStart, this.cursorEnd);
            this.drawFillRect(startX, y, endX - startX, height + 2 * margin, this.canvasConfig.selectionColor)
        }
    }


    /**
     * 绘制选中元素状态
     * @param x
     * @param y
     * @param width
     * @param height
     * @param options
     */
    drawActiveRect(x, y, width, height, options = {}) {
        const {dashPattern = [5, 3], lineWidth = 1, color = 'red', lineCap = 'butt'} = options;
        const zoom = this.canvasConfig.zoom;
        this.ctx.save();
        this.ctx.setLineDash([dashPattern[0] / zoom, dashPattern[1] / zoom]);
        this.ctx.lineWidth = lineWidth / zoom;
        this.ctx.strokeStyle = color;
        this.ctx.lineCap = lineCap;

        this.ctx.beginPath();
        this.ctx.rect(x, y, width, height);
        this.ctx.stroke();
        this.ctx.restore();
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
        const {x, y} = this.getCanvasInternalPosition(event);
        if (element && element.editable) {
            this.removeActiveElements()
            if (this.isEditing && this.editingText !== element) {
                this.finishEditing()
                return
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
     * @returns {{scaleX: number, scaleY: number, x: number, y: number}}
     */
    getCanvasInternalPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        // 计算 Canvas 坐标系中的位置
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        return {x, y, scaleX, scaleY}
    }


    /**
     * 处理 canvas 内鼠标相关事件
     * @param event
     */
    handleMouseDown(event) {
        const startTime = Date.now();
        const {x: startX, y: startY} = this.getCanvasInternalPosition(event);
        const element = this.getElementAt(startX, startY, element => element.selectable);
        if (!element) {
            this.handleCancelActive()
            return
        }
        const offsetX = startX - element.x
        const offsetY = startY - element.y
        const handleMousemove = (e) => {
            const interval = Date.now() - startTime;
            const {x: moveX, y: moveY} = this.getCanvasInternalPosition(e);
            if (interval > 200 && (startX !== moveX || startY !== moveY)) {
                if (element.type === 'text' && element.status === Element.EDITING) {
                    // 选中文本
                    this.cursorEnd = this.getCursorIndexFromText(element, moveX);
                    if (this.cursorEnd !== this.cursorStart) {
                        this.updateInputSelection()
                        this.renderAll()
                    }
                } else if (element.draggable) {
                    this.removeActiveElement(element)
                    this.canvas.style.cursor = 'move';
                    element.x = moveX - offsetX;
                    element.y = moveY - offsetY;
                    const callbacks = this.eventCallbacks.get(MOVE_OBJECT);
                    console.log(this.eventCallbacks)
                    if (callbacks && callbacks.size) {
                        callbacks.forEach(callback => callback({x: moveX, y: moveY, target: element}))
                    }
                    this.renderAll()
                }
            }
        }
        const handleMouseup = (e) => {
            const {x: endX, y: endY} = this.getCanvasInternalPosition(e);
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
        const oldText = this.editingText.text;
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
            this.removeActiveElements()
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
        this.canvas.width = this.canvasConfig.width = width;
        this.canvas.height = this.canvasConfig.height = height;
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
     * 导出所有文本数据为 JSON
     * @returns {string} JSON 格式的文本数据
     */
    exportToJSON() {
        return JSON.stringify({
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height,
                elements: this.elements
            }
        }, null, 2);
    }

    /**
     * 从 JSON 导入文本数据
     * @param {string} json - JSON 格式的文本数据
     */
    async loadFromJSON(json) {
        try {
            const {canvas: {width, height, elements}} = JSON.parse(json);
            this.resizeCanvas(width, height)
            for (let element of elements) {
                if (element.type === 'text') {
                    this.elements.push(new Text(element.text, element))
                }
                if (element.type === 'image') {
                    const image = this.cache.get(element.src);
                    const instance = image ? new Image(image, element) : await Image.fromURL(element.src, element);
                    this.elements.push(instance)
                }
            }
            this.renderAll();
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
    }

}


/**
 * 可编辑文本
 */
class Text extends Element {

    constructor(text, options = {}) {
        super(options);
        // 元素类型
        this.type = 'text';
        this.width = options.width || 0
        this.height = options.height || 0
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


        this.hiddenInput = null

        this.ascent = 0;

        this.descent = 0;

        this.chars = []

        this.cursor = {
            start: 0,
            end: 0
        }
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
        this.ascent = metrics.actualBoundingBoxAscent;
        this.descent = metrics.actualBoundingBoxDescent;

        const {chars, height, width} = this.direction === 'vertical'
            ? this.parseVerticalChars(ctx)
            : this.parseHorizontalChars(ctx)

        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + width / 2;
            const centerY = this.y + height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 绘制每个字符
        for (const char of chars) {
            ctx.fillText(char.char, char.x, char.y);
        }

        this.width = width || this.fontSize / 10;
        this.height = height || this.fontSize
        this.chars = chars;

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
        const charWidths = [];
        for (let i = 0; i < this.text.length; i++) {
            const charWidth = ctx.measureText(this.text[i]).width;
            charWidths.push(charWidth);
            maxCharWidth = Math.max(maxCharWidth, charWidth);
        }
        // 根据居中对齐方式计算x坐标
        for (let i = 0; i < this.text.length; i++) {
            // 计算当前字符在最大宽度内居中的x坐标
            const charX = this.x + (maxCharWidth - charWidths[i]) / 2;
            chars.push({
                char: this.text[i],
                x: charX,
                y: currentY,
                width: charWidths[i],
                height: this.fontSize
            });
            currentY += this.fontSize + (i < this.text.length - 1 ? this.spacing : 0);
        }
        return {
            width: maxCharWidth,
            height: currentY - this.y,
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


    /**
     * 绘制光标
     * @param ctx
     * @param start
     * @param end
     */
    drawCursor(ctx, start, end) {
        if (start !== end) return
        const {y, fontColor, fontSize, spacing, chars} = this;
        const cursorWidth = 0.08 * fontSize;
        const char = chars[end];
        ctx.save()
        ctx.fillStyle = fontColor;
        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        const x = !char ? this.x + this.width + (spacing - cursorWidth) / 2 : char.x + (spacing - cursorWidth) / 2;
        ctx.fillRect(x, y, cursorWidth, this.height);
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
        const {x, y, height, width, highlightColor, spacing, text, chars} = this
        const margin = 0.3 * height;
        ctx.save()
        // 绘制高亮背景
        ctx.fillStyle = highlightColor;
        if (this.angle !== 0) {
            // 计算文本中心点
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(centerX, centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }
        ctx.fillRect(x - margin, y - margin, width + 2 * margin, height + 2 * margin);
        if (start !== end) {
            const startIndex = Math.max(0, Math.min(start, end));
            const endIndex = Math.min(text.length, Math.max(start, end));
            const startX = chars[startIndex].x - spacing / 2;
            const endX = endIndex < this.text.length ? chars[endIndex].x + spacing / 2 : this.x + this.width + spacing / 2;
            ctx.fillStyle = 'rgb(59,103,225,0.5)';
            ctx.fillRect(startX, y, endX - startX, height);
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
        this.cacheable = options.cacheable || false
        this.src = image?.src
        this.crossOrigin = options.crossOrigin || 'anonymous'
        this.scale = options.scale || 1
        this.width = options.width
        this.height = options.height
        this.alpha = options.alpha || 1
        this.angle = options.angle || 0
        this.path = options.path
        // 图片阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
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
                reject(`Failed to load image: src is null`);
            }
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
        })
    }


    contains(x, y) {

        // 如果未旋转，使用原来的轴对齐边界框检测
        if (this.angle === 0) {
            return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
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
        // 保存当前画布状态
        ctx.save();
        ctx.globalAlpha = this.alpha

        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 1)';
        // 设置阴影模糊度（像素）
        ctx.shadowBlur = shadowBlur || 0;
        // 设置阴影偏移（像素）
        ctx.shadowOffsetX = shadowOffsetX || 0;
        ctx.shadowOffsetY = shadowOffsetY || 0;

        if (this.angle !== 0) {
            // 将画布原点移动到图片中心点
            const centerX = this.x + this.width * this.scale / 2;
            const centerY = this.y + this.height * this.scale / 2;
            ctx.translate(centerX, centerY);
            // 旋转画布
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-centerX, -centerY);
        }

        // 绘制图片（注意坐标已偏移到中心点）
        ctx.drawImage(this.image, this.x, this.y, this.width * this.scale, this.height * this.scale);
        // 恢复画布到之前保存的状态
        ctx.restore();
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
        ctx.beginPath();
        ctx.rect(this.x - lineWidth, this.y - lineWidth, this.width * this.scale + 2 * lineWidth, this.height * this.scale + 2 * lineWidth);
        ctx.stroke();
        ctx.restore();
    }

}

// 支持 ES6 模块
export {CanvasEditor, Text, EditableText, Image};
