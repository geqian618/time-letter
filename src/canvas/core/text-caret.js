/**
 * 文本光标与度量计算（纯函数）：点击换算光标索引、方向键移动、文本度量。
 * 原为编辑器方法，此处仅做参数化（ctx / 当前光标位置由调用方传入），算法逐字保留
 */

/**
 * 获取文本度量信息
 * @param {CanvasRenderingContext2D} ctx - 用于测量的 2D 上下文
 * @param {Object} textObj - 测量的文本
 * @returns {{width: number, charCount: number, spacingWidth: number, textWidth: number}}
 */
export function getTextMetrics(ctx, textObj) {

    const lines = textObj.lines && textObj.lines.length ? textObj.lines : textObj.splitTextLines();
    let width = 0;
    let charCount = 0;
    let textWidth = 0;
    let spacingWidth = 0;

    for (const line of lines) {
        const metrics = getSubTextMetrics(ctx, textObj, line.startIndex, line.endIndex);
        width = Math.max(width, metrics.width);
        charCount += metrics.charCount;
        textWidth += metrics.textWidth;
        spacingWidth += metrics.spacingWidth;
    }

    return {width, charCount, spacingWidth, textWidth};
}

/**
 * 获取部分文本度量
 * @param {CanvasRenderingContext2D} ctx - 用于测量的 2D 上下文
 * @param {Object} textObj - 完整文本
 * @param {number} startIndex - 开始索引
 * @param {number} endIndex - 结束索引
 * @returns {{width: number, charCount: number, spacingWidth: number, textWidth: number}} 截取文本度量
 */
export function getSubTextMetrics(ctx, textObj, startIndex, endIndex) {
    const {text, spacing, fontStyle, fontWeight, fontSize, fontFamily} = textObj;
    // 设置字体（与 drawText 保持一致）
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", "Microsoft YaHei", sans-serif`;

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
        textWidth += ctx.measureText(char).width;
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
export function getCursorIndexFromText(textObj, clickX, clickY) {

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
 * 计算上下键移动后的光标索引（横排文本按行，目标 X 对齐字符边界）
 */
export function getVerticalMoveCursorIndex(textObj, direction, cursorEnd) {
    const lines = textObj.lines || [];
    if (textObj.direction !== 'horizontal' || lines.length <= 1) return cursorEnd;

    const activeIndex = cursorEnd;
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


export function getTextCursorLineInfo(textObj, index) {
    const lines = textObj.lines || [];
    let lineIndex = lines.findIndex(line => index <= line.endIndex);
    if (lineIndex === -1) lineIndex = Math.max(0, lines.length - 1);

    const line = lines[lineIndex];
    const lineChars = line.chars || [];
    const offset = Math.max(0, Math.min(index - line.startIndex, lineChars.length));
    return {lineIndex, offset};
}


export function getVerticalColumnMoveCursorIndex(textObj, direction, cursorEnd) {
    const lines = textObj.lines || [];
    if (textObj.direction !== 'vertical') return cursorEnd;
    if (!lines.length) return cursorEnd;

    const {lineIndex, offset} = getTextCursorLineInfo(textObj, cursorEnd);
    const targetLineIndex = lineIndex + direction;
    if (targetLineIndex < 0 || targetLineIndex >= lines.length) return cursorEnd;

    const targetLine = lines[targetLineIndex];
    const targetOffset = Math.min(offset, (targetLine.chars || []).length);
    return targetLine.startIndex + targetOffset;
}


export function getVerticalRowMoveCursorIndex(textObj, direction, cursorEnd) {
    const lines = textObj.lines || [];
    if (textObj.direction !== 'vertical') return cursorEnd;
    if (!lines.length) return cursorEnd;

    const {lineIndex, offset} = getTextCursorLineInfo(textObj, cursorEnd);
    const line = lines[lineIndex];
    const lineChars = line.chars || [];

    if (direction < 0) {
        if (offset > 0) return line.startIndex + offset - 1;

        const targetLineIndex = lineIndex - 1;
        if (targetLineIndex < 0) return cursorEnd;
        const targetLine = lines[targetLineIndex];
        return targetLine.startIndex + (targetLine.chars || []).length;
    }

    if (offset < lineChars.length) return line.startIndex + offset + 1;

    const targetLineIndex = lineIndex + 1;
    if (targetLineIndex >= lines.length) return cursorEnd;
    return lines[targetLineIndex].startIndex;
}
