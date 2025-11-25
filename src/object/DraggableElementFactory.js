import {getDate, getDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

class DraggableElementFactory {

    constructor(data, metadataOptions, projectSettings) {
        this.data = data
        this.metadataOptions = metadataOptions;
        this.projectSettings = projectSettings;
        this.dragElement = document.createElement(data.tagName);
        this.#setDefaultStyle()
    }


    // 设置默认样式
    #setDefaultStyle() {
        this.#setBasicStyle();
        this.#setCommonStyle();
        this.#setContent();
    }

    // 设置基础样式
    #setBasicStyle() {
        if (this.data.tagName === 'img') {
            this.dragElement.style.width = this.data.width;
            this.dragElement.style.height = this.data.Height;
            return;
        }
        this.dragElement.style.width = 'fit-content';
        this.dragElement.style.height = 'fit-content';
        this.dragElement.style.fontSize = '14px';
        this.dragElement.style.lineHeight = '1';
        this.dragElement.style.whiteSpace = 'nowrap';
        this.dragElement.style.fontStyle = 'normal';
        this.dragElement.style.fontWeight = '400';
    }

    // 设置内容
    #setContent() {
        if (this.data.tagName === 'img') {
            this.dragElement.src = this.data.src
            return
        }
        const type = this.data.dataType;
        const text = this.data.text;
        switch (type) {
            case 'date':
                this.dragElement.innerHTML = getDate();
                break;
            case 'datetime':
                this.dragElement.innerHTML = getDateTime();
                break;
            case 'script':
                this.dragElement.innerHTML = executeFunctionScript(text);
                break;
            case 'text':
                this.dragElement.innerHTML = text;
                break;
            case 'metadata':
                this.#setMetadataContent(text);
                break;
        }
    }

    // 设置元数据内容
    #setMetadataContent(attribute) {
        if (!this.metadataOptions || !this.projectSettings) {
            console.warn('Metadata dependencies not set');
            return;
        }
        let content = this.metadataOptions[attribute];
        const format = this.projectSettings.metadata.formats[attribute];
        if (format) {
            content = format.replace('${' + attribute + '}', content);
        }
        this.dragElement.innerHTML = content;
    }

    // 设置通用样式
    #setCommonStyle() {
        this.dragElement.style.outline = 'none';
        this.dragElement.style.cursor = 'move';
        this.dragElement.style.userSelect = 'none';
        this.dragElement.setAttribute('tabindex', '0');
        this.dragElement.setAttribute('copy', '');
        this.dragElement.setAttribute('path', this.data.path);
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
