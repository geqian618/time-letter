const SELECTION_OBJECT = 'selection:object'

const MOVE_OBJECT = 'move:object'

const ADD_OBJECT = 'add:object'

const UPDATE_OBJECT = 'update:object'

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
        this.handleInput = this.handleInput.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        // this.handleKeyUp = this.handleKeyUp.bind(this);
        // this.handleBlur = this.handleBlur.bind(this);

        // 初始化
        this.init();
    }


    /**
     * 初始化编辑器
     */
    init() {

        //设置高质量渲染选项
        this.ctx.patternQuality = 'best';
        this.ctx.quality = 'best'
        this.ctx.antialias = 'subpixel'
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high'
        this.ctx.fontHinting = false

        this.setupCanvas();

        // 仅浏览器环境生效
        if (this.isBrowser) {
            this.canvas.addEventListener('mousedown', this.handleMouseDown);
            this.createHiddenInput();
        }

        this.resetElements([]);
    }


    /**
     * 设置 Canvas 尺寸和缩放
     */
    setupCanvas() {

        const dpr = this.isBrowser ? (window.devicePixelRatio || 1) : 1;

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

        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);
    }


    /**
     * 绑定 canvas 相关事件
     * @param event
     * @param callback
     */
    on(event, callback) {
        let callbacks = this.eventCallbacks.get(event);
        if (!callbacks) {
            callbacks = new Set();
            this.eventCallbacks.set(event, callbacks);
        }
        callbacks.add(callback);
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
        this.cursorEnd = this.cursorStart = textObj.text.length;
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
     * 添加元素
     * @returns {number} 新添加元素的索引
     * @param element
     */
    addElement(element) {
        this.elements.push(element);
        if (element.type === 'image' && this.enableCache && element.cacheable) {
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
        this.resetElements(this.elements.filter(element => !targets.has(element.id)))
        // 同时删除激活元素
        this.activeElements = this.activeElements.filter(element => !targets.has(element.id));
    }


    /**
     * 移除全部元素
     */
    clearElements() {
        this.resetElements([])
        this.activeElements = [];
    }


    /**
     * 重置元素
     */
    resetElements(array) {
        if (!this.isBrowser) {
            this.elements = array;
            return;
        }
        this.elements = new ReactiveObserver(array, (value) => {
            const {target, property} = value;
            if (['chars', 'ascent', 'descent', 'centerX', 'centerY', 'status'].includes(property)) return;
            const callbacks = this.eventCallbacks.get(UPDATE_OBJECT);
            if (callbacks && callbacks.size) {
                callbacks.forEach(callback => callback(target))
            }
            if (property === 'order') {
                this.elements.sort((a, b) => a.order - b.order);
            }
        }, {
            deep: true
        })
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
        if (this.isBrowser) {
            this.isEditing && this.finishEditing();
            this.activeElements = [];
        }
        this.resetElements([])
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
     * @param {Text} textObj - 测量的文本
     * @returns {TextMetrics} 文本度量
     */
    getTextMetrics(textObj) {
        const lines = textObj.lines && textObj.lines.length
            ? textObj.lines
            : textObj.splitTextLines();
        let width = 0;
        let charCount = 0;
        let textWidth = 0;
        let spacingWidth = 0;

        for (const line of lines) {
            const metrics = this.getSubTextMetrics(textObj, line.startIndex, line.endIndex);
            width = Math.max(width, metrics.width);
            charCount += metrics.charCount;
            textWidth += metrics.textWidth;
            spacingWidth += metrics.spacingWidth;
        }

        return {width, charCount, spacingWidth, textWidth};
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
        let spacingWidth = 0;
        let previousCharWasBreak = true;

        // 使用与 drawText 相同的逻辑测量每个字符
        for (let i = safeStart; i < safeEnd; i++) {
            const char = text[i];
            if (char === '\n' || char === '\r') {
                previousCharWasBreak = true;
                continue;
            }
            textWidth += this.ctx.measureText(char).width;
            charCount++;
            if (!previousCharWasBreak) {
                spacingWidth += spacing;
            }
            previousCharWasBreak = false;
        }

        // 返回一个包含宽度信息的对象
        return {
            width: textWidth + (charCount > 0 ? spacingWidth : 0),
            charCount: charCount,
            spacingWidth,
            textWidth,
        };
    }


    /**
     * 根据点击位置计算光标位置
     * @param {Object} textObj - 文本对象
     * @param {number} clickX - 点击X坐标
     * @param {number} clickY - 点击Y坐标
     * @returns {number} 光标索引
     */
    getCursorIndexFromText(textObj, clickX, clickY) {

        const {text, x, y, width, fontSize: rawHeight, spacing, height, direction, angle = 0} = textObj;
        const lines = textObj.lines || [];

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
            if (!lines.length) return 0;

            const lineHeight = lines[0].height || rawHeight * (textObj.lineHeight || 1.5);
            if (transformedY <= y) return 0;
            if (transformedY >= y + height) return text.length;

            let lineIndex = Math.floor((transformedY - y) / lineHeight);
            lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
            const line = lines[lineIndex];
            const lineChars = line.chars || [];

            if (lineChars.length === 0) return line.startIndex;

            const first = lineChars[0];
            const last = lineChars[lineChars.length - 1];
            if (transformedX < line.x + first.width / 2) return line.startIndex;
            if (transformedX > line.x + line.width - last.width / 2) return line.endIndex;

            for (let i = 0; i < lineChars.length - 1; i++) {
                const before = lineChars[i];
                const next = lineChars[i + 1];
                if (transformedX >= before.x + before.width / 2 && transformedX <= next.x + next.width / 2) {
                    return line.startIndex + i + 1;
                }
            }

            return line.endIndex;
        }

        if (!lines.length) return 0;

        const columnWidth = lines[0].width || rawHeight;
        if (transformedX <= x) return 0;
        if (transformedX >= x + width) return text.length;

        let lineIndex = Math.floor((transformedX - x) / columnWidth);
        lineIndex = Math.max(0, Math.min(lineIndex, lines.length - 1));
        const line = lines[lineIndex];
        const lineChars = line.chars || [];

        if (lineChars.length === 0) return line.startIndex;

        if (transformedY < line.top + rawHeight / 2) return line.startIndex;
        if (transformedY > line.top + line.height - rawHeight / 2) return line.endIndex;

        const rowStep = rawHeight + spacing;
        for (let i = 0; i < lineChars.length - 1; i++) {
            const before = line.top + rowStep * i;
            const next = line.top + rowStep * (i + 1);
            if (transformedY >= before + rawHeight / 2 && transformedY <= next + rawHeight / 2) {
                return line.startIndex + i + 1;
            }
        }

        return line.endIndex;
    }


    /**
     * 计算上下键移动后的光标索引
     */
    getVerticalMoveCursorIndex(textObj, direction) {
        const lines = textObj.lines || [];
        if (textObj.direction !== 'horizontal' || lines.length <= 1) return this.cursorEnd;

        const activeIndex = this.cursorEnd;
        let currentLineIndex = lines.findIndex(line => activeIndex <= line.endIndex);
        if (currentLineIndex === -1) currentLineIndex = lines.length - 1;

        const targetLineIndex = currentLineIndex + direction;
        if (targetLineIndex < 0 || targetLineIndex >= lines.length) return activeIndex;

        const cursorRect = textObj.getCursorPosition(activeIndex);
        const targetLine = lines[targetLineIndex];
        const targetChars = targetLine.chars || [];
        if (targetChars.length === 0) return targetLine.startIndex;

        const targetX = cursorRect.x;
        if (targetX <= targetChars[0].x) return targetLine.startIndex;

        for (let i = 0; i < targetChars.length; i++) {
            const char = targetChars[i];
            const nextChar = targetChars[i + 1];
            const charEnd = char.x + char.width;
            const boundary = nextChar ? (charEnd + nextChar.x) / 2 : charEnd + textObj.spacing / 2;
            if (!nextChar || targetX <= boundary) {
                return targetLine.startIndex + i + 1;
            }
        }

        return targetLine.endIndex;
    }


    getTextCursorLineInfo(textObj, index) {
        const lines = textObj.lines || [];
        let lineIndex = lines.findIndex(line => index <= line.endIndex);
        if (lineIndex === -1) lineIndex = Math.max(0, lines.length - 1);

        const line = lines[lineIndex];
        const lineChars = line.chars || [];
        const offset = Math.max(0, Math.min(index - line.startIndex, lineChars.length));
        return {lineIndex, offset};
    }


    getVerticalColumnMoveCursorIndex(textObj, direction) {
        const lines = textObj.lines || [];
        if (textObj.direction !== 'vertical') return this.cursorEnd;
        if (!lines.length) return this.cursorEnd;

        const {lineIndex, offset} = this.getTextCursorLineInfo(textObj, this.cursorEnd);
        const targetLineIndex = lineIndex + direction;
        if (targetLineIndex < 0 || targetLineIndex >= lines.length) return this.cursorEnd;

        const targetLine = lines[targetLineIndex];
        const targetOffset = Math.min(offset, (targetLine.chars || []).length);
        return targetLine.startIndex + targetOffset;
    }


    getVerticalRowMoveCursorIndex(textObj, direction) {
        const lines = textObj.lines || [];
        if (textObj.direction !== 'vertical') return this.cursorEnd;
        if (!lines.length) return this.cursorEnd;

        const {lineIndex, offset} = this.getTextCursorLineInfo(textObj, this.cursorEnd);
        const line = lines[lineIndex];
        const lineChars = line.chars || [];

        if (direction < 0) {
            if (offset > 0) return line.startIndex + offset - 1;

            const targetLineIndex = lineIndex - 1;
            if (targetLineIndex < 0) return this.cursorEnd;
            const targetLine = lines[targetLineIndex];
            return targetLine.startIndex + (targetLine.chars || []).length;
        }

        if (offset < lineChars.length) return line.startIndex + offset + 1;

        const targetLineIndex = lineIndex + 1;
        if (targetLineIndex >= lines.length) return this.cursorEnd;
        return lines[targetLineIndex].startIndex;
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
        this.ctx.clearRect(0, 0, this.width, this.height);
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
    handleMouseDown(event) {
        if (event.button !== 0) return;
        const startTime = Date.now();
        const {x: startX, y: startY} = this.getCanvasPosition(event);
        const element = this.getElementAt(startX, startY, element => element.selectable);

        let lastMoveX = startX;
        let lastMoveY = startY;

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
                const elements = this.getElements();
                const left = Math.min(startX, moveX)
                const right = Math.max(startX, moveX)
                const top = Math.min(startY, moveY)
                const bottom = Math.max(startY, moveY)
                for (let el of elements) {
                    if (el.x >= left && el.y >= top && el.x + el.width <= right && el.y + el.height <= bottom) {
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
            } else if (interval > 200 && moved && element.draggable && (element.status === Element.NONE || this.hasActiveElement(element))) {
                this.canvas.style.cursor = 'move';
                // 计算偏移量
                const offsetX = moveX - lastMoveX;
                const offsetY = moveY - lastMoveY;
                // 确定要拖拽的元素列表
                const targetElements = element.status === Element.NONE
                    ? [element]
                    : Array.from(this.activeElements).filter(el => el.draggable);
                // 拖拽所有选中的元素
                for (let el of targetElements) {
                    el.x += offsetX;
                    el.y += offsetY;
                    el.centerX += offsetX;
                    el.centerY += offsetY;
                    // 触发回调
                    const callbacks = this.eventCallbacks.get(MOVE_OBJECT);
                    if (callbacks && callbacks.size) {
                        callbacks.forEach(callback => callback({x: moveX, y: moveY, target: el}));
                    }
                }
                // 更新最后移动位置并重新渲染
                lastMoveX = moveX;
                lastMoveY = moveY;
                if (element.status === Element.NONE) {
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
            this.renderAll();
            this.canvas.removeEventListener('mousemove', handleMousemove);
            document.removeEventListener('mouseup', handleMouseup);
        };

        this.canvas.addEventListener('mousemove', handleMousemove);
        document.addEventListener('mouseup', handleMouseup);
    }


    /**
     * 激活元素
     * @param event
     */
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
    }

    /**
     * 销毁编辑器，清理事件监听
     */
    destroy() {
        if (this.isBrowser) {
            // 移除事件监听
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            // 移除隐藏输入框
            this.removeHiddenInput();
            // 清除定时器
            clearInterval(this.cursorBlinkInterval);

            this.eventCallbacks.clear();
        }

        this.ctx = null;
        this.canvas = null;
        this.cache.clear();
    }

    /**
     * 调整 Canvas 大小
     * @param {number} width - 新宽度
     * @param {number} height - 新高度
     */
    resizeCanvas(width, height) {
        this.width = width;
        this.height = height;
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
            const {width, height, zoom, elements} = object;
            this.zoom = zoom;
            this.clearCanvas();
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
            const {width, height, elements, zoom} = JSON.parse(json);
            this.zoom = zoom;
            this.clearCanvas();
            this.resizeCanvas(width, height);
            for (let element of elements) {
                if (element.type === 'text') {
                    this.elements.push(new Text(element.text, element))
                }
                if (element.type === 'image') {
                    const image = this.enableCache ? this.cache.get(element.src) : null;
                    const instance = image ? new Image(image, element) : await Image.fromURL(element.src, element);
                    this.elements.push(instance)
                    if (this.enableCache && instance.cacheable && !this.cache.has(element.src)) {
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

        this.order = options.order || 0;

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

    #lines = []

    constructor(text, options = {}) {
        super(options);
        // 元素类型
        this.type = 'text';
        // 文本内容
        this.text = (text === null || text === undefined) ? '' : String(text);
        // 文本排列方向
        this.direction = options.direction || 'horizontal';
        // 可编辑
        this.editable = options.editable !== undefined ? options.editable : false;
        // 文字间距
        this.spacing = options.spacing || 0;
        // 垂直文本列宽
        this.columnWidth = options.columnWidth || 1;

        this.lineHeight = options.lineHeight || 1;

        // 旋转角度
        this.angle = options.angle || 0;

        // 字体属性
        this.fontSize = options.fontSize || 16;
        this.fontStyle = options.fontStyle || 'normal';
        this.fontFamily = options.fontFamily || 'Microsoft YaHei';
        this.fontWeight = options.fontWeight || 400;


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
    get width() {
        return this.#width;
    }

    // 外部可访问
    get height() {
        return this.#height;
    }


    set width(value) {
        this.#width = value;
    }


    set height(value) {
        this.#height = value;
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


    // 外部可访问
    set chars(value) {
        this.#chars = value;
    }

    // 外部可访问的行布局
    get lines() {
        return this.#lines;
    }

    // 外部可访问的行布局
    set lines(value) {
        this.#lines = value;
    }

    splitTextLines(text = this.text) {
        const lines = [];
        let start = 0;
        let index = 0;

        while (index < text.length) {
            const char = text[index];
            if (char === '\n' || char === '\r') {
                const endIndex = index;
                const breakIndex = char === '\r' && text[index + 1] === '\n' ? index + 2 : index + 1;
                lines.push({
                    text: text.slice(start, endIndex),
                    startIndex: start,
                    endIndex,
                    breakIndex
                });
                start = breakIndex;
                index = breakIndex;
            } else {
                index++;
            }
        }

        lines.push({
            text: text.slice(start),
            startIndex: start,
            endIndex: text.length,
            breakIndex: null
        });

        return lines;
    }

    getCursorPosition(index) {
        const lines = this.lines || [];
        const cursorWidth = 0.08 * this.fontSize;
        if (lines.length === 0) {
            return this.direction === 'horizontal'
                ? {
                    x: this.x,
                    y: this.y + ((this.height || this.fontSize * (this.lineHeight || 1.5)) - this.fontSize) / 2,
                    width: cursorWidth,
                    height: this.fontSize
                }
                : {x: this.x, y: this.y, width: this.fontSize, height: cursorWidth};
        }

        let line = lines[0];
        for (let i = 0; i < lines.length; i++) {
            line = lines[i];
            if (index <= line.endIndex) break;
        }

        const lineChars = line.chars || [];
        const offsetInLine = Math.max(0, Math.min(index - line.startIndex, lineChars.length));

        if (this.direction === 'horizontal') {
            let x;
            if (offsetInLine >= lineChars.length) {
                x = line.x + line.width;
            } else {
                const char = lineChars[offsetInLine];
                x = char.x - (offsetInLine > 0 ? this.spacing / 2 : 0);
            }
            const cursorHeight = line.textHeight || this.fontSize;
            const y = line.textHeight
                ? (line.textTop !== undefined ? line.textTop : line.top + (line.height - cursorHeight) / 2)
                : line.top + (line.height - cursorHeight) / 2;
            return {x, y, width: cursorWidth, height: cursorHeight};
        }

        const rowStep = this.fontSize + this.spacing;
        let y;
        if (offsetInLine === 0) {
            y = line.top;
        } else if (offsetInLine >= lineChars.length) {
            y = line.top + line.height - cursorWidth / 2;
        } else {
            const previousCharEnd = line.top + (offsetInLine - 1) * rowStep + this.fontSize;
            const gapCenter = previousCharEnd + this.spacing / 2;
            y = gapCenter - cursorWidth / 2;
        }
        const cursorBarWidth = line.textWidth || this.fontSize;
        return {
            x: line.x + (line.width - cursorBarWidth) / 2,
            y,
            width: cursorBarWidth,
            height: cursorWidth
        };
    }

    getSelectionRects(start, end) {
        const normalizedStart = Math.min(start, end);
        const normalizedEnd = Math.max(start, end);
        const rects = [];
        const lines = this.lines || [];
        const spacing = this.spacing;
        const rowStep = this.fontSize + spacing;

        for (const line of lines) {
            const lineEnd = line.breakIndex !== null ? line.breakIndex : line.endIndex;
            const selectionStart = Math.max(normalizedStart, line.startIndex);
            const selectionEnd = Math.min(normalizedEnd, lineEnd);
            if (selectionStart >= selectionEnd) continue;

            const lineChars = line.chars || [];
            const startOffset = Math.max(0, selectionStart - line.startIndex);
            const endOffset = Math.min(lineChars.length, selectionEnd - line.startIndex);

            if (this.direction === 'horizontal') {
                const x0 = startOffset <= 0 ? line.x : startOffset >= lineChars.length ? line.x + line.width : lineChars[startOffset].x - spacing / 2;
                const x1 = endOffset <= 0 ? line.x : endOffset >= lineChars.length ? line.x + line.width : lineChars[endOffset].x - spacing / 2;
                if (x1 > x0) {
                    rects.push({x: x0, y: line.top, width: x1 - x0, height: line.height});
                }
            } else {
                const y0 = startOffset <= 0 ? line.top : startOffset >= lineChars.length ? line.top + line.height : line.top + startOffset * rowStep - spacing / 2;
                const y1 = endOffset <= 0 ? line.top : endOffset >= lineChars.length ? line.top + line.height : line.top + endOffset * rowStep - spacing / 2;
                if (y1 > y0) {
                    rects.push({x: line.x, y: y0, width: line.width, height: y1 - y0});
                }
            }
        }

        return rects;
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


    /**
     * 测量文字宽高
     *
     * @param ctx
     * @returns {{width: (number|*|number), height: (*|number|number)}}
     */
    measureText(ctx) {
        ctx.save();
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        // 字体设置
        ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", "Microsoft YaHei", sans-serif`;
        // 字体颜色
        ctx.fillStyle = this.fontColor;
        const {height, width} = this.direction === 'vertical'
            ? this.parseVerticalChars(ctx)
            : this.parseHorizontalChars(ctx)
        return {
            width: width || (this.direction === 'horizontal' ? this.fontSize / 10 : this.fontSize),
            height: height || (this.direction === 'horizontal' ? this.fontSize : this.fontSize / 10)
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        // 字体设置
        ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", "Microsoft YaHei", sans-serif`;
        // 字体颜色
        ctx.fillStyle = this.fontColor;

        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

        // 默认不透明黑色
        ctx.shadowColor = this.shadow.color;
        // 默认模糊 0 像素
        ctx.shadowBlur = this.shadow.blur * avgScale;
        // 默认X偏移
        ctx.shadowOffsetX = this.shadow.offsetX * avgScale;
        // 默认Y偏移
        ctx.shadowOffsetY = this.shadow.offsetY * avgScale;

        let layout = this.direction === 'vertical'
            ? this.parseVerticalChars(ctx)
            : this.parseHorizontalChars(ctx)
        let {chars, height, width, lines} = layout

        if (!this.centerX || !this.centerY || this.angle === 0) {
            // 计算文本中心点
            this.centerX = this.x + width / 2;
            this.centerY = this.y + height / 2;
        }

        if (this.angle !== 0) {
            if (this.width !== width || this.height !== height) {
                // 根据新的宽高和原中心点重新计算位置
                this.x = this.centerX - width / 2
                this.y = this.centerY - height / 2
                layout = this.direction === 'vertical' ? this.parseVerticalChars(ctx) : this.parseHorizontalChars(ctx)
                chars = layout.chars
                lines = layout.lines
                width = layout.width
                height = layout.height
            }
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }


        // 绘制每个字符
        for (const char of chars) {
            if (!char.lineBreak) {
                ctx.fillText(char.char, char.x, char.y);
            }
        }

        this.width = width || (this.direction === 'horizontal' ? this.fontSize / 10 : this.fontSize)
        this.height = height || (this.direction === 'horizontal' ? this.fontSize : this.fontSize / 10)
        this.chars = chars;
        this.lines = lines;

        ctx.restore();
    }


    parseHorizontalChars(ctx) {
        const segments = this.splitTextLines();
        const chars = [];
        const lines = [];
        let maxCharHeight = 0;
        let maxAscent = 0;

        for (const segment of segments) {
            for (let i = segment.startIndex; i < segment.endIndex; i++) {
                const char = this.text[i];
                const {actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: descent} = ctx.measureText(char);
                const charHeight = ascent + descent;
                maxCharHeight = Math.max(maxCharHeight, charHeight);
                maxAscent = Math.max(maxAscent, ascent);
            }
        }

        const lineHeight = Math.max(this.fontSize * this.lineHeight, maxCharHeight);
        let maxLineWidth = 0;

        for (let lineIndex = 0; lineIndex < segments.length; lineIndex++) {
            const segment = segments[lineIndex];
            const top = this.y + lineIndex * lineHeight;
            const textTop = top + (lineHeight - maxCharHeight) / 2;
            const baselineY = textTop + maxAscent;
            const lineChars = [];
            let currentX = this.x;

            for (let i = segment.startIndex; i < segment.endIndex; i++) {
                const char = this.text[i];
                const {
                    width: charWidth,
                    actualBoundingBoxAscent: ascent,
                    actualBoundingBoxDescent: descent
                } = ctx.measureText(char);
                const charHeight = ascent + descent;
                const charInfo = {
                    char,
                    x: currentX,
                    y: baselineY,
                    width: charWidth,
                    height: charHeight,
                    lineIndex,
                    lineBreak: false
                };
                chars.push(charInfo);
                lineChars.push(charInfo);
                currentX += charWidth + (i < segment.endIndex - 1 ? this.spacing : 0);
            }

            const lineWidth = currentX - this.x;
            maxLineWidth = Math.max(maxLineWidth, lineWidth);
            lines.push({
                ...segment,
                x: this.x,
                top,
                textTop,
                y: baselineY,
                width: lineWidth,
                height: lineHeight,
                textHeight: maxCharHeight,
                chars: lineChars
            });

            if (segment.breakIndex !== null) {
                chars.push({
                    char: '\n',
                    x: this.x + lineWidth,
                    y: baselineY,
                    width: 0,
                    height: lineHeight,
                    lineIndex,
                    lineBreak: true
                });
            }
        }

        return {
            width: maxLineWidth,
            height: segments.length * lineHeight,
            chars,
            lines
        };
    }

    parseVerticalChars(ctx) {
        const segments = this.splitTextLines();
        const chars = [];
        const lines = [];
        let maxCharWidth = 0;

        for (const segment of segments) {
            for (let i = segment.startIndex; i < segment.endIndex; i++) {
                const char = this.text[i];
                const {
                    width,
                    actualBoundingBoxAscent: ascent,
                    actualBoundingBoxDescent: descent
                } = ctx.measureText(char);
                maxCharWidth = Math.max(maxCharWidth, width);
            }
        }

        const columnWidth = Math.max((this.columnWidth || 0) * this.fontSize, maxCharWidth || this.fontSize);
        const rowStep = this.fontSize + this.spacing;
        const maxRows = segments.reduce((max, segment) => Math.max(max, Math.max(1, segment.text.length)), 1);
        const totalHeight = maxRows * this.fontSize + (maxRows - 1) * this.spacing;

        for (let lineIndex = 0; lineIndex < segments.length; lineIndex++) {
            const segment = segments[lineIndex];
            const lineRowCount = Math.max(1, segment.text.length);
            const lineHeight = lineRowCount * this.fontSize + (lineRowCount - 1) * this.spacing;
            const columnX = this.x + lineIndex * columnWidth;
            const lineChars = [];
            let currentY = this.y;

            for (let i = segment.startIndex; i < segment.endIndex; i++) {
                const char = this.text[i];
                const {
                    width,
                    actualBoundingBoxAscent: ascent,
                    actualBoundingBoxDescent: descent
                } = ctx.measureText(char);
                const cellTop = currentY;
                const cellBottom = cellTop + this.fontSize;
                const cellCenterY = (cellTop + cellBottom) / 2;
                const charInfo = {
                    char,
                    x: columnX + (columnWidth - width) / 2,
                    y: cellCenterY - descent + (ascent + descent) / 2,
                    width,
                    height: ascent + descent,
                    lineIndex,
                    lineBreak: false
                };
                chars.push(charInfo);
                lineChars.push(charInfo);
                currentY += rowStep;
            }

            lines.push({
                ...segment,
                x: columnX,
                top: this.y,
                y: this.y,
                width: columnWidth,
                height: lineHeight,
                textWidth: maxCharWidth,
                chars: lineChars
            });

            if (segment.breakIndex !== null) {
                chars.push({
                    char: '\n',
                    x: columnX,
                    y: this.y + lineHeight,
                    width: 0,
                    height: lineHeight,
                    lineIndex,
                    lineBreak: true
                });
            }
        }

        return {
            width: columnWidth * segments.length,
            height: totalHeight,
            chars,
            lines
        };
    }

    selection(ctx) {
        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
        const color = 'red', lineCap = 'butt'
        const lineWidth = 2 / avgScale;
        ctx.save();
        ctx.setLineDash([8 / avgScale, 5 / avgScale]);
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
        const cursorRect = this.getCursorPosition(start);
        ctx.save()
        ctx.fillStyle = this.fontColor;
        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }
        ctx.fillRect(cursorRect.x, cursorRect.y, cursorRect.width, cursorRect.height);
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
        const {x, y, height, width, highlightColor} = this
        const lines = this.lines || [];
        const singleLineSize = this.direction === 'horizontal'
            ? (lines[0]?.textHeight || this.fontSize)
            : (lines[0]?.width || this.fontSize);
        const margin = 0.3 * singleLineSize;
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
            const rowCount = Math.max(1, lines.length);
            const rowHeight = lines[0]?.height || Math.max(this.fontSize * (this.lineHeight || 1.5), this.fontSize);
            ctx.fillRect(x - margin, y - margin, width + 2 * margin, rowHeight * rowCount + 2 * margin);
        } else {
            let textLeft = x;
            let textRight = x + (width || this.fontSize);
            if (lines.length) {
                textLeft = lines[0].x;
                textRight = lines[lines.length - 1].x + lines[lines.length - 1].width;
            }
            ctx.fillRect(textLeft - margin, y - margin, textRight - textLeft + 2 * margin, height + 2 * margin);
        }
        if (start !== end) {
            const selectionRects = this.getSelectionRects(start, end);
            ctx.fillStyle = 'rgb(59,103,225,0.5)';
            for (const rect of selectionRects) {
                ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
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

    #centerX = 0;

    #centerY = 0;

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
        // 模糊强度
        this.blur = options.blur || 0;

        // 图片阴影
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


    set centerX(value) {
        this.#centerX = value;
    }


    set centerY(value) {
        this.#centerY = value;
    }

    get centerX() {
        return this.#centerX;
    }


    get centerY() {
        return this.#centerY;
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
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

        if (!this.centerX || !this.centerY || this.angle === 0) {
            // 计算文本中心点
            this.centerX = this.x + width / 2;
            this.centerY = this.y + height / 2;
        }

        // 设置变换
        if (this.angle !== 0) {
            // 根据新的宽高和原中心点重新计算位置
            this.x = this.centerX - width / 2;
            this.y = this.centerY - height / 2;
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur * avgScale;
            ctx.shadowOffsetX = shadowOffsetX * avgScale;
            ctx.shadowOffsetY = shadowOffsetY * avgScale;
        }

        if (this.radius && this.radius > 0) {
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.fill();
            // 创建圆角路径并裁剪
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.clip();
        }

        // 如果有背景模糊效果
        if (this.blur && this.blur > 0) {
            // 计算模糊扩展区域（防止边缘半透明）
            const blurAmount = this.blur * avgScale;
            // 扩展区域，通常是模糊半径的2倍
            const expansion = Math.ceil(blurAmount * 2);
            // 保存当前上下文状态
            ctx.save();
            // 应用模糊滤镜
            ctx.filter = `blur(${blurAmount}px)`;
            // 在扩展区域内绘制图像
            ctx.drawImage(this.image, this.x - expansion, this.y - expansion, width + 2 * expansion, height + 2 * expansion);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this.image, this.x, this.y, width, height);
        }
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
        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
        const color = 'red', lineCap = 'butt'
        const lineWidth = 2 / avgScale
        ctx.save();
        ctx.setLineDash([8 / avgScale, 5 / avgScale]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;

        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
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

    #centerX = 0;

    #centerY = 0;

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
        // 模糊强度
        this.blur = blur || 0;

        // 图片阴影
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    set centerX(value) {
        this.#centerX = value;
    }


    set centerY(value) {
        this.#centerY = value;
    }

    get centerX() {
        return this.#centerX;
    }


    get centerY() {
        return this.#centerY;
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
        return localX >= this.x && localX <= this.x + this.width * this.scale && localY >= this.y && localY <= this.y + this.height * this.scale;
    }

    draw(ctx) {
        if (!this.image) {
            console.error(`Failed to load image: ${this.src}`)
            return
        }
        ctx.save();
        ctx.globalAlpha = this.alpha;

        const width = this.width * this.scale;
        const height = this.height * this.scale;
        const radius = Math.min(this.radius, width / 2, height / 2);
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        const hasShadow = shadowColor && (shadowBlur > 0 || shadowOffsetX !== 0 || shadowOffsetY !== 0);

        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

        if (!this.centerX || !this.centerY || this.angle === 0) {
            // 计算文本中心点
            this.centerX = this.x + width / 2;
            this.centerY = this.y + height / 2;
        }

        // 设置变换
        if (this.angle !== 0) {
            // 根据新的宽高和原中心点重新计算位置
            this.x = this.centerX - width / 2;
            this.y = this.centerY - height / 2;

            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
        }

        // 先绘制阴影（如果存在）
        if (hasShadow) {
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur * avgScale;
            ctx.shadowOffsetX = shadowOffsetX * avgScale;
            ctx.shadowOffsetY = shadowOffsetY * avgScale;
        }

        if (this.radius && this.radius > 0) {
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.fill();
            // 创建圆角路径并裁剪
            this._createRoundedRectPath(ctx, this.x, this.y, width, height, radius);
            ctx.clip();
        }

        // 如果有背景模糊效果
        if (this.blur && this.blur > 0) {
            // 计算模糊扩展区域（防止边缘半透明）
            const blurAmount = this.blur * avgScale;
            // 扩展区域，通常是模糊半径的2倍
            const expansion = Math.ceil(blurAmount * 2);
            // 保存当前上下文状态
            ctx.save();
            // 应用模糊滤镜
            ctx.filter = `blur(${blurAmount}px)`;
            // 在扩展区域内绘制图像
            ctx.drawImage(this.image, this.x - expansion, this.y - expansion, width + 2 * expansion, height + 2 * expansion);
            // 恢复上下文状态（这会清除filter）
            ctx.restore();
        } else {
            // 设置图像平滑质量
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(this.image, this.x, this.y, width, height);
        }

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
        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
        const color = 'red', lineCap = 'butt'
        const lineWidth = 2 / avgScale
        ctx.save();
        ctx.setLineDash([8 / avgScale, 5 / avgScale]);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = lineCap;

        if (this.angle !== 0) {
            // 平移到文本中心点，旋转，再平移回来
            ctx.translate(this.centerX, this.centerY);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
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

    #centerX = 0;

    #centerY = 0;

    constructor(options) {
        super(options);
        this.type = 'rect'
        this.width = options.width || 0
        this.height = options.height || 0
        this.fill = options.fill || 'rgba(255,255,255,0)'
        this.radius = options.radius || 0
        this.stroke = options.stroke || 'rgba(0,0,0,1)'
        this.strokeWidth = options.strokeWidth || 1
        this.angle = options.angle || 0
        this.radius = options.radius || 0
        this.lineDash = options.lineDash || [1, 1]
        this.lineCap = options.lineCap || 'butt'
        // 图片阴影 - 需要处理嵌套对象
        this.shadow = {
            color: 'rgba(0,0,0,1)',
            blur: 0,
            offsetX: 0,
            offsetY: 0,
            ...options.shadow
        };
    }


    set centerX(value) {
        this.#centerX = value;
    }


    set centerY(value) {
        this.#centerY = value;
    }

    get centerX() {
        return this.#centerX;
    }


    get centerY() {
        return this.#centerY;
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

    selection(ctx) {
        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
        const color = 'red', lineCap = 'butt'
        const lineWidth = 2 / avgScale
        ctx.save();
        ctx.setLineDash([8 / avgScale, 5 / avgScale]);
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

    draw(ctx) {
        // 保存当前画布状态
        ctx.save();
        // 获取当前变换矩阵的缩放比例
        const currentTransform = ctx.getTransform();
        const scaleX = currentTransform.a; // 水平缩放
        const scaleY = currentTransform.d; // 垂直缩放
        const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
        const {color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY} = this.shadow;
        ctx.fillStyle = this.fill;
        ctx.strokeStyle = this.stroke;
        ctx.lineWidth = this.strokeWidth / avgScale;
        ctx.lineCap = this.lineCap;
        ctx.setLineDash([this.lineDash[0] / avgScale, this.lineDash[1] / avgScale]);

        // 设置阴影颜色（支持RGBA格式）
        ctx.shadowColor = shadowColor || 'rgba(0, 0, 0, 1)';
        // 设置阴影模糊度（像素）
        ctx.shadowBlur = shadowBlur || 0;
        // 设置阴影偏移（像素）
        ctx.shadowOffsetX = shadowOffsetX || 0;
        ctx.shadowOffsetY = shadowOffsetY || 0;

        if (!this.centerX || !this.centerY || this.angle === 0) {
            // 计算文本中心点
            this.centerX = this.x + this.width / 2;
            this.centerY = this.y + this.height / 2;
        }

        if (this.angle !== 0) {
            // 根据新的宽高和原中心点重新计算位置
            this.x = this.centerX - this.width / 2;
            this.y = this.centerY - this.height / 2;

            ctx.translate(this.centerX, this.centerY);
            // 旋转画布
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.translate(-this.centerX, -this.centerY);
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


class ReactiveObserver {
    /**
     *
     * @param target
     * @param callback
     * @param options ① deep 深度监听  ② shouldProxy 代理条件函数
     * @returns {*}
     */
    constructor(target, callback, options = {}) {
        this.callback = callback;
        this.proxyToRaw = new WeakMap();
        this.rawToProxy = new WeakMap();
        this.deep = options.deep === true;
        this.shouldProxy = options.shouldProxy || this.defaultShouldProxy.bind(this);

        // 创建代理并返回
        const proxy = this.createProxy(target);

        // 保存根代理
        this.rootProxy = proxy;

        return proxy;
    }

    // 深度比较两个值是否相等
    deepEqual(a, b) {
        if (a === b) return true;
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
            return false;
        }
        if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
            return false;
        }
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key) || !this.deepEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }

    // 默认的代理检查函数
    defaultShouldProxy(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        const type = Object.prototype.toString.call(value).slice(8, -1);
        const excludedTypes = [
            'HTMLImageElement',
            'HTMLCanvasElement',
            'HTMLVideoElement',
            'HTMLAudioElement',
            'File',
            'Blob',
            'Image',
            'ImageData',
            'ImageBitmap',
            'OffscreenCanvas',
            'CanvasRenderingContext2D',
            'WebGLRenderingContext',
            'Date',
            'RegExp',
            'Error',
            'Promise',
            'Map',
            'Set',
            'WeakMap',
            'WeakSet',
            'ArrayBuffer',
            'DataView',
            'Int8Array',
            'Uint8Array',
            'Uint8ClampedArray',
            'Int16Array',
            'Uint16Array',
            'Int32Array',
            'Uint32Array',
            'Float32Array',
            'Float64Array'
        ];
        if (excludedTypes.includes(type)) {
            return false;
        }
        if (value.nodeType !== undefined) {
            return false;
        }
        return type === 'Object' || type === 'Array';
    }

    createProxy(target) {
        // 如果传入的是代理，尝试获取原始对象
        let rawTarget = target;
        if (this.proxyToRaw.has(target)) {
            rawTarget = this.proxyToRaw.get(target);
        }

        // 如果原始对象已经有代理，返回代理
        if (this.rawToProxy.has(rawTarget)) {
            return this.rawToProxy.get(rawTarget);
        }

        // 检查是否需要代理这个对象
        if (!this.shouldProxy(rawTarget)) {
            return target; // 直接返回原对象，不创建代理
        }

        const handler = {
            get: (obj, prop) => {
                const value = obj[prop];
                // 只在开启深度代理时，对需要代理的对象递归创建代理
                if (this.deep && value && typeof value === 'object') {
                    // 使用shouldProxy检查是否需要代理
                    if (this.shouldProxy(value)) {
                        return this.createProxy(value);
                    }
                }
                return value;
            },

            set: (obj, prop, value) => {
                const oldValue = obj[prop];

                // 检查新旧值是否相等
                const isEqual = this.deepEqual(oldValue, value);

                // 只有在值实际改变时才更新和触发回调
                if (!isEqual) {
                    // 只在开启深度代理时，对新值是对象/数组进行代理
                    if (this.deep && value && typeof value === 'object') {
                        // 使用shouldProxy检查是否需要代理
                        if (this.shouldProxy(value)) {
                            obj[prop] = this.createProxy(value);
                        } else {
                            obj[prop] = value;
                        }
                    } else {
                        obj[prop] = value;
                    }

                    // 触发回调，添加根对象属性
                    const proxy = this.rawToProxy.get(obj);
                    this.callback({
                        target: proxy || obj, // 优先使用代理对象
                        root: this.rootProxy, // 添加根代理对象
                        property: prop,
                        oldValue,
                        newValue: value,
                        type: 'set'
                    });
                }
                return true;
            },

            deleteProperty: (obj, prop) => {
                const oldValue = obj[prop];
                const success = delete obj[prop];
                if (success) {
                    // 触发回调，添加根对象属性
                    const proxy = this.rawToProxy.get(obj);
                    this.callback({
                        target: proxy || obj, // 优先使用代理对象
                        root: this.rootProxy, // 添加根代理对象
                        property: prop,
                        oldValue,
                        newValue: undefined,
                        type: 'delete'
                    });
                }
                return success;
            }
        };

        // 处理数组方法
        if (Array.isArray(rawTarget)) {
            handler.get = (obj, prop) => {
                // 拦截数组变异方法
                if (typeof prop === 'string' && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(prop)) {
                    return (...args) => {
                        const oldArray = [...obj];
                        const result = Array.prototype[prop].apply(obj, args);

                        // 只在开启深度代理时，对新添加的对象元素进行代理
                        if (this.deep && ['push', 'unshift', 'splice'].includes(prop)) {
                            const startIndex = prop === 'push' ? obj.length - args.length :
                                prop === 'unshift' ? 0 : args[0];

                            for (let i = 0; i < args.length; i++) {
                                const arg = args[i];
                                if (arg && typeof arg === 'object' && this.shouldProxy(arg)) {
                                    const index = startIndex + i;
                                    obj[index] = this.createProxy(arg);
                                }
                            }
                        }

                        // 检查数组是否实际改变
                        const isArrayChanged = !this.deepEqual(oldArray, obj);

                        if (isArrayChanged) {
                            // 触发回调，添加根对象属性
                            const proxy = this.rawToProxy.get(obj);
                            this.callback({
                                target: proxy || obj, // 优先使用代理对象
                                root: this.rootProxy, // 添加根代理对象
                                property: prop,
                                oldValue: oldArray,
                                newValue: [...obj],
                                type: 'array-mutation',
                                args
                            });
                        }
                        return result;
                    };
                }
                const value = obj[prop];
                // 只在开启深度代理时，对需要代理的对象进行递归代理
                if (this.deep && value && typeof value === 'object' && this.shouldProxy(value)) {
                    return this.createProxy(value);
                }
                return value;
            };
        }

        const proxy = new Proxy(rawTarget, handler)
        // 建立双向映射
        this.rawToProxy.set(rawTarget, proxy);
        this.proxyToRaw.set(proxy, rawTarget);

        // 如果这是根代理，保存它
        if (!this.rootProxy) {
            this.rootProxy = proxy;
        }

        return proxy;
    }

    // 可选：提供方法来动态改变深度代理设置
    setDeep(deep) {
        this.deep = deep;
    }

    // 可选：提供方法获取根代理
    getRoot() {
        return this.rootProxy;
    }
}

module.exports = {CanvasEditor, Text, EditableText, Image, Rect, LazyImage, ReactiveObserver};
