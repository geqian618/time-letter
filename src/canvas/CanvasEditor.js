import Image from './Image.js'
import Text from './Text.js'
import EditableText from './EditableText.js'

const SELECTION_OBJECT = 'selection:object'

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
        this.cursorIndex = 0;
        this.cursorEndIndex = 0

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

        if (this.isEditing && this.editingText === textObj) {
            // 如果已经在编辑同一文本，只更新光标位置
            this.cursorEndIndex = this.cursorIndex = index;
            this.renderAll();
            this.updateInputSelection();
            return;
        }

        if (this.isEditing && this.editingText !== textObj) {
            this.finishEditing();
        }

        this.editingText = textObj;
        this.isEditing = true;
        this.isCursorVisible = true;
        this.cursorEndIndex = this.cursorIndex = index;
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
            this.activeElements.splice(index, 1);
            index = this.activeElements.findIndex(item => item.id === element.id);
        }
    }


    /**
     * 移除全部激活元素
     */
    removeActiveElements() {
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
    getElements(isClone) {
        return isClone ? this.elements.map(element => ({...element})) : this.elements;
    }

    /**
     * 获取所有选中元素
     * @returns {Array} 文本对象数组
     */
    getActiveElements(isClone) {
        return isClone ? this.activeElements.map(element => ({...element})) : this.activeElements;
    }

    /**
     * 清理画布
     */
    clearCanvas() {
        this.elements = [];
        this.activeElements = [];
        this.isEditing && this.cancelEditing();
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
            if (this.cursorIndex !== this.cursorEndIndex && !this.isCursorVisible) return;
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
            this.canvasConfig.zoom = zoom
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
            this.canvasConfig.zoom = zoom
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
                if (this.editingText === element) {
                    this.drawEditBackground(element)
                    // 如果是正在编辑的文本，绘制光标
                    if (this.isCursorVisible) {
                        this.drawCursor(element, this.canvasConfig.cursorWidth / this.canvasConfig.zoom)
                    }
                }
            } else if (element.type === 'image') {
                if (element.type === 'image') {
                    // 绘制图片
                    element.draw(this.ctx);
                }
            }
            if (this.hasActiveElement(element) && this.editingText !== element) {
                element.selection(this.ctx, this.canvasConfig.zoom)
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
        const cursorX = x + this.getSubTextMetrics(textObj, 0, this.cursorIndex).width;
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
        const {x, y, fontSize, highlightColor} = element
        const metrics = this.getTextMetrics(element);
        const margin = 0.3 * fontSize;
        const width = metrics.width + 2 * margin
        const height = fontSize + 2 * margin
        this.drawFillRect(x - margin, y - margin, width, height, highlightColor)
        if (this.cursorIndex !== this.cursorEndIndex) {
            const {startX, endX} = this.getRangeByIndex(element, this.cursorIndex, this.cursorEndIndex);
            this.drawFillRect(startX, y, endX - startX, fontSize, this.canvasConfig.selectionColor)
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
     * @param {Event} event - 点击事件
     */
    handleEditText(event) {
        const {x, y} = this.getCanvasInternalPosition(event);
        const textObj = this.getTextAtPosition(x, y);
        if (textObj && textObj.editable) {
            this.removeActiveElements()
            // 计算点击位置对应的光标索引
            const index = this.getCursorIndexFromText(textObj, x, y);
            // 如果是双击，直接进入编辑模式
            this.startEditing(textObj, index);
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
            this.handleCancelActive(event)
            return
        }
        const offsetX = startX - element.x
        const offsetY = startY - element.y
        const handleMousemove = (e) => {
            const interval = Date.now() - startTime;
            const {x: moveX, y: moveY} = this.getCanvasInternalPosition(e);
            if (interval > 200 && (startX !== moveX || startY !== moveY)) {
                if (element.type === 'text' && this.isEditing) {
                    // 选中文本
                    this.cursorEndIndex = this.getCursorIndexFromText(element, moveX);
                    if (this.cursorEndIndex !== this.cursorIndex) {
                        this.updateInputSelection()
                        this.renderAll()
                    }
                } else if (element.draggable) {
                    this.removeActiveElement(element)
                    this.canvas.style.cursor = 'move';
                    element.x = moveX - offsetX;
                    element.y = moveY - offsetY;
                    this.renderAll()
                }
            }
        }
        const handleMouseup = (e) => {
            const {x: endX, y: endY} = this.getCanvasInternalPosition(e);
            if (startX === endX && startY === endY) {
                if (this.hasActiveElement(element) || this.editingText === element) {
                    this.handleEditText(event)
                } else {
                    this.isEditing && this.finishEditing()
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
        this.activeElements.push(event.target)
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
            const start = Math.min(this.cursorIndex, this.cursorEndIndex);
            const end = Math.max(this.cursorIndex, this.cursorEndIndex);

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
        this.cursorEndIndex = this.cursorIndex = Math.max(0, Math.min(inputCursorPos, newText.length));
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
                if (this.cursorIndex > 0) {
                    this.cursorIndex--;
                    this.cursorEndIndex--;
                    this.updateInputSelection();
                    this.renderAll();
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (this.cursorIndex < this.editingText.text.length) {
                    this.cursorIndex++;
                    this.cursorEndIndex++;
                    this.updateInputSelection();
                    this.renderAll();
                }
                break;
            case 'Home':
                event.preventDefault();
                this.cursorEndIndex = this.cursorIndex = 0;
                this.updateInputSelection();
                this.renderAll();
                break;
            case 'End':
                event.preventDefault();
                this.cursorEndIndex = this.cursorIndex = this.editingText.text.length;
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
     * @param event
     */
    handleCancelActive(event) {
        const {x, y} = this.getCanvasInternalPosition(event);
        const textObj = this.getTextAtPosition(x, y);
        if (this.isEditing && textObj !== this.editingText) {
            this.finishEditing();
        }
        if (this.activeElements.length > 0) {
            this.activeElements = [];
            this.renderAll();
        }
    }


    /**
     * 处理键盘松开事件
     */
    handleKeyUp() {
        if (!this.editingText || !this.hiddenInput) return;
        // 更新光标位置
        this.cursorEndIndex = this.cursorIndex = this.hiddenInput.selectionStart;
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
        this.cursorEndIndex = this.cursorIndex = 0;
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


export {CanvasEditor, Image, Text, EditableText}
