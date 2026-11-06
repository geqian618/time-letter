/**
 * 可编辑文本元素：布局解析（横排 / 竖排）、逐字符绘制、小字形超采样与编辑态装饰
 */
import {Element, getTransformScale} from './Element.js';


export class Text extends Element {

    // ----------------------------------小字形超采样 ----------------------------------
    // 字形实际光栅尺寸（fontSize × zoom × dpr）低于该阈值（设备像素）时，Windows 的
    // 字形 hinting 会把细笔画吸附到像素网格，CJK 横竖笔画整条塌缩，且随缩放的亚像素
    // 相位变化「时有时无」。低于阈值改走「离屏放大光栅化 + 高质量重采样回贴」，笔画只被柔化、不会缺失
    static TEXT_MIN_GLYPH_PX = 12;

    // 超采样离屏画布单边上限（物理像素），防止极端小缩放下离屏尺寸爆炸
    static TEXT_SUPERSAMPLE_MAX_PX = 4096;

    // 模块级复用的离屏画布（按需扩容，避免每次绘制重新分配）
    static #supersampleCanvas = null;

    #width = 0;

    #height = 0;

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
     * 选中包围盒（矩形文本基于 width/height）
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getSelectionBounds() {
        return {x: this.x, y: this.y, w: this.width, h: this.height};
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
        ctx.restore();
        return {
            width: width || (this.direction === 'horizontal' ? this.fontSize / 10 : this.fontSize),
            height: height || (this.direction === 'horizontal' ? this.fontSize : this.fontSize / 10)
        }
    }

    draw(ctx) {
        ctx.save();
        const transformScale = getTransformScale(ctx);
        // 小字形超采样判定：字形实际光栅尺寸 = fontSize × 总变换缩放（zoom × dpr）
        const glyphPx = this.fontSize * transformScale;
        if (glyphPx > 0 && glyphPx < Text.TEXT_MIN_GLYPH_PX) {
            // 注意：元素在画布中以 Vue 响应式 Proxy 形态调用 draw，私有方法（#）会因
            // 品牌检查失败抛错，因此这里必须使用普通方法
            this._drawSupersampled(ctx, Text.TEXT_MIN_GLYPH_PX / glyphPx);
        } else {
            this._drawContent(ctx);
        }
        ctx.restore();
    }

    /**
     * canvas font 简写（布局测量与内容绘制共用，保证两者使用同一字体）
     * @returns {string}
     * @private
     */
    _fontSpec() {
        return `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px "${this.fontFamily}", "Microsoft YaHei", sans-serif`;
    }

    /**
     * 解析字符布局并派生旋转中心：旋转文本首次绘制时初始化中心点，缩放导致宽高变化时由中心点反推 x、y 并重新解析。ctx 需已设置字体
     * @param ctx
     * @returns {{width, height: number, chars: *[], lines: *[]}|{width: number, height, chars: *[], lines: *[]}}
     * @private
     */
    _resolveLayout(ctx) {
        let layout = this.direction === 'vertical' ? this.parseVerticalChars(ctx) : this.parseHorizontalChars(ctx)
        if (this.angle !== 0) {
            // 首次绘制时初始化中心点（centerX/centerY 默认为 0）
            if (!this.centerX && !this.centerY) {
                this.centerX = this.x + layout.width / 2;
                this.centerY = this.y + layout.height / 2;
            }
            // 旋转时中心点不变：缩放导致宽高变化时，由中心点反推 x、y
            const newX = this.centerX - layout.width / 2;
            const newY = this.centerY - layout.height / 2;
            if (newX !== this.x || newY !== this.y) {
                this.x = newX;
                this.y = newY;
                // x、y 变化后重新解析字符位置
                layout = this.direction === 'vertical' ? this.parseVerticalChars(ctx) : this.parseHorizontalChars(ctx)
            }
        } else {
            // 未旋转：x、y 为左上角基准（缩放锚点），中心点由其派生
            this.centerX = this.x + layout.width / 2;
            this.centerY = this.y + layout.height / 2;
        }
        return layout
    }

    /**
     * 文本内容绘制：阴影、布局解析、旋转变换、逐字符填充，并更新宽高 / 字符布局状态。
     * 可作用于主画布 ctx 或超采样离屏 ctx（ctx 的变换决定字形光栅化分辨率）
     * @param ctx
     * @private
     */
    _drawContent(ctx) {
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        // 字体设置
        ctx.font = this._fontSpec();
        // 字体颜色
        ctx.fillStyle = this.fontColor;

        const transformScale = getTransformScale(ctx);

        // 默认不透明黑色
        ctx.shadowColor = this.shadow.color;
        // 默认模糊 0 像素
        ctx.shadowBlur = this.shadow.blur * transformScale;
        // 默认X偏移
        ctx.shadowOffsetX = this.shadow.offsetX * transformScale;
        // 默认Y偏移
        ctx.shadowOffsetY = this.shadow.offsetY * transformScale;

        const {chars, height, width, lines} = this._resolveLayout(ctx)

        if (this.angle !== 0) {
            // 绕中心点旋转
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
    }

    /**
     *  小字形离屏超采样：以 k 倍尺寸在离屏画布上光栅化文本（字形在足够大的尺寸下光栅化，hinting 不会吞笔画），再 drawImage 高质量重采样回目标逻辑区域。
     *  阴影 / 旋转与正常路径完全一致（_drawContent 直接复用在离屏 ctx 上）
     * @param ctx
     * @param k
     * @private
     */
    _drawSupersampled(ctx, k) {
        if (!Text.#supersampleCanvas) {
            try {
                if (typeof document !== 'undefined') {
                    Text.#supersampleCanvas = document.createElement('canvas');
                } else {
                    const {createCanvas} = require('@napi-rs/canvas');
                    Text.#supersampleCanvas = createCanvas(1, 1);
                }
            } catch (e) {
                this._drawContent(ctx);
                return;
            }
        }
        const offscreenCanvas = Text.#supersampleCanvas;
        const offscreenCtx = offscreenCanvas.getContext('2d');
        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        // 先解析布局得到未旋转内容宽高（旋转中心在此派生，与正常路径一致）；
        // 测量不受变换影响，需先设置字体
        offscreenCtx.font = this._fontSpec();
        const layout = this._resolveLayout(offscreenCtx);
        const width = layout.width || (this.direction === 'horizontal' ? this.fontSize / 10 : this.fontSize);
        const height = layout.height || (this.direction === 'horizontal' ? this.fontSize : this.fontSize / 10);

        // 旋转后的内容包围盒（绕中心旋转），外扩阴影影响范围避免离屏裁切
        const rad = this.angle * Math.PI / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const shadowPad = (this.shadow.blur || 0)
            + Math.max(Math.abs(this.shadow.offsetX || 0), Math.abs(this.shadow.offsetY || 0)) + 2;
        const bw = width * cos + height * sin + shadowPad * 2;
        const bh = width * sin + height * cos + shadowPad * 2;
        const bx = this.centerX - bw / 2;
        const by = this.centerY - bh / 2;

        // 离屏分辨率上限保护：极端小缩放下限制放大倍数，退化为可接受的近似超采样
        k = Math.min(k, Text.TEXT_SUPERSAMPLE_MAX_PX / Math.max(bw, bh, 1));
        if (k <= 1) {
            this._drawContent(ctx);
            return;
        }

        const pw = Math.ceil(bw * k);
        const ph = Math.ceil(bh * k);
        if (offscreenCanvas.width < pw) offscreenCanvas.width = pw;
        if (offscreenCanvas.height < ph) offscreenCanvas.height = ph;
        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0);
        offscreenCtx.clearRect(0, 0, pw, ph);

        // 光栅化：逻辑坐标 ×k 映射到离屏物理像素，包围盒左上角对齐离屏原点
        offscreenCtx.setTransform(k, 0, 0, k, -bx * k, -by * k);
        this._drawContent(offscreenCtx);

        // 回贴：目标 ctx 处于逻辑坐标系，按 bw×bh 逻辑尺寸绘制 k 倍分辨率位图，
        // 等效「放大光栅化 + 重采样缩小」，笔画不会被 hinting 吞掉
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreenCanvas, 0, 0, pw, ph, bx, by, bw, bh);
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


export class EditableText extends Text {
    constructor(text, options = {}) {
        super(text, {...options, editable: true});
    }
}
