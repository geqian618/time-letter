import {getDate, getDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {projectSettings} from "@/config/project-settings";

class DraggableElementFactory {

    constructor(settings, metadataOptions) {
        this.settings = settings
        this.metadataOptions = metadataOptions;
        this.dragElement = document.createElement(settings.tagName);
        this.#setComponentStyle()
    }

    #setComponentStyle() {
        if (this.dragElement instanceof HTMLImageElement) {
            this.#setImageStyle()
        } else {
            this.#setTextStyle()
            this.#setContent()
        }
        this.#setCommonStyle()
    }

    #setImageStyle() {
        const {
            url = '',
            path = '',
            width = 0,
            height = 0,
            options: {
                angle = 0,
                alpha = 10,
                boxShadow: {
                    offsetX = 0,
                    offsetY = 0,
                    blur = 0,
                    shadowColor = '#000000'
                } = {}
            } = {}
        } = this.settings || {};

        this.dragElement.src = url
        this.dragElement.style.width = width + 'px';
        this.dragElement.style.height = height + 'px'
        this.dragElement.style.opacity = alpha

        this.dragElement.style.transformOrigin = 'center center'
        this.dragElement.style.transform = `rotate(${angle}deg)`

        this.dragElement.style.boxShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

        this.dragElement.setAttribute('path', path)
    }


    #setTextStyle() {
        const {
            type,
            expression,
            options: {
                fontSize = 14,
                fontColor = '#000000',
                fontFamily = 'Microsoft YaHei',
                fontStyle = 'normal',
                fontWeight = 'normal',
                angle = 0,
                textDirection = 0,
                textShadow: {
                    offsetX = 0,
                    offsetY = 0,
                    blur = 0,
                    shadowColor = '#000000'
                } = {}
            } = {}
        } = this.settings;

        this.dragElement.style.width = 'fit-content'
        this.dragElement.style.height = 'fit-content'
        this.dragElement.style.lineHeight = '1'
        this.dragElement.style.whiteSpace = 'nowrap'
        this.dragElement.style.fontSize = fontSize + 'px'
        this.dragElement.style.color = fontColor
        this.dragElement.style.fontFamily = fontFamily
        this.dragElement.style.fontStyle = fontStyle
        this.dragElement.style.fontWeight = fontWeight
        this.dragElement.style.backgroundColor = 'transparent'

        this.dragElement.style.transformOrigin = 'center center'
        this.dragElement.style.transform = `rotate(${angle}deg)`

        if (textDirection === 0) {
            this.dragElement.style.writingMode = 'horizontal-tb'
        } else if (textDirection === 1) {
            this.dragElement.style.writingMode = 'vertical-lr'
            this.dragElement.style.textOrientation = 'upright'
        }

        this.dragElement.style.textShadow = `${offsetX + 'px ' + offsetY + 'px ' + blur + 'px ' + shadowColor}`

        this.dragElement.setAttribute('spellcheck', 'false')
        this.dragElement.setAttribute('type', type)
        this.dragElement.setAttribute('expression', expression)
    }


    // 设置通用样式
    #setCommonStyle() {
        if (!this.dragElement) return
        this.dragElement.style.outline = 'none';
        this.dragElement.style.userSelect = 'none';
        this.dragElement.setAttribute('tabindex', '0')
        // 关键：必须设为绝对定位
        this.dragElement.style.position = 'absolute';
        this.dragElement.setAttribute('draggable', 'true')
    }

    // 设置内容
    #setContent() {
        const {type, content, expression} = this.settings
        switch (type) {
            case 'date':
                this.dragElement.innerHTML = getDate();
                break;
            case 'datetime':
                this.dragElement.innerHTML = getDateTime();
                break;
            case 'script':
                this.dragElement.innerHTML = executeFunctionScript(expression);
                break;
            case 'text':
                this.dragElement.innerHTML = content;
                break;
            case 'metadata':
                this.dragElement.innerHTML = this.#getMetadataContent(expression);
                break;
        }
        this.dragElement.innerHTML ? this.settings.content = this.dragElement.innerHTML : this.dragElement = null
    }

    // 设置元数据内容
    #getMetadataContent(attribute) {
        if (!this.metadataOptions || !projectSettings.value) {
            console.warn('Metadata dependencies not set');
            return '';
        }
        let content = this.metadataOptions[attribute];
        if (!content) {
            return '';
        }
        const format = projectSettings.value.metadata.formats[attribute];
        if (format) {
            return format.replace('${' + attribute + '}', content);
        }
    }


    getElement() {
        return new Promise((resolve, reject) => {
            // 对于非图片元素（如div），直接返回
            if (!(this.dragElement instanceof HTMLImageElement)) {
                resolve(this.dragElement);
                return;
            }

            // 对于图片元素，检查加载状态
            if (this.dragElement.complete) {
                resolve(this.dragElement);
                return;
            }

            this.dragElement.onload = () => {
                resolve(this.dragElement);
            };

            this.dragElement.onerror = () => {
                reject(new Error('图片加载失败'));
            };
        });
    }
}


export default DraggableElementFactory
