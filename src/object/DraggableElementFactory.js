import {getCurrentDate, getCurrentDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {useProjectSettingsStore} from '@/stores/project-settings'

import CanvasManager from "@/object/CanvasManager";

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
        if (!this.metadataOptions || !useProjectSettingsStore().settings) {
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
                Image.fromURL(url, {
                    width: width / zoom,
                    height: height / zoom,
                    draggable: true,
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
