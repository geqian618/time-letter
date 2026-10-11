import {getCurrentDate, getCurrentDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {useProjectSettingsStore} from '@/stores/project-settings'

import CanvasManager from "@/object/canvas-manager";

import {Image, Text} from '@/canvas/CanvasEditor'

class DraggableElementFactory {

    constructor(settings, metadataOptions) {
        this.settings = settings
        this.metadataOptions = metadataOptions;
    }

    // 设置内容
    #getText() {
        const {type, content, expression} = this.settings
        switch (type) {
            case 'date':
                return getCurrentDate();
            case 'datetime':
                return getCurrentDateTime();
            case 'script':
                return executeFunctionScript(expression);
            case 'text':
                return content;
            case 'metadata':
                return this.#getMetadataContent(expression);
        }
    }

    // 设置元数据内容
    #getMetadataContent(attribute) {
        if (!this.metadataOptions) {
            console.warn('Metadata dependencies not set');
            return '';
        }
        return this.metadataOptions[attribute] || '';
    }


    getElement() {
        return new Promise((resolve, reject) => {
            const {zoom} = CanvasManager.getCurrentCanvas();
            // 对于非图片元素（如div），直接返回
            if (this.settings.tagName === 'div') {
                const {type, content, expression, fontSize = 14} = this.settings
                const context = this.#getText();
                const text = new Text(context, {
                    fontSize: Math.floor(fontSize / zoom),
                    draggable: true,
                    editable: type === 'text',
                    meta: {
                        type,
                        content,
                        expression
                    }
                });
                resolve(text);
            }
            // 对于图片元素，检查加载状态
            else if (this.settings.tagName === 'img') {
                const {url, width, height, path} = this.settings
                // 卡片格子是固定比例格子，宽高都传会按格子比例落图导致变形；
                // 改为携带原图尺寸按比例适配进格子：取 min(格子宽/原图宽, 格子高/原图高)，
                // 得到等比铺满格子的初始尺寸（与原视觉占位接近，比例与原图一致）
                let fitWidth = width
                if (this.settings.naturalWidth && this.settings.naturalHeight) {
                    const scale = Math.min(width / this.settings.naturalWidth, height / this.settings.naturalHeight)
                    fitWidth = this.settings.naturalWidth * scale
                }
                Image.fromURL(url, {
                    width: fitWidth / zoom,
                    draggable: true,
                    cacheable: true,
                    meta: {path}
                }).then(image => {
                    resolve(image);
                }).catch(error => {
                    reject(error);
                });
            } else {
                resolve(null)
            }
        });
    }
}


export default DraggableElementFactory
