import {getDate, getDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {projectSettings} from "@/config/project-settings";

import CanvasManager from "@/object/CanvasManager";

import Text from '../canvas/Text.js'

import EditableText from '../canvas/EditableText.js'

import Image from '../canvas/Image.js'

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
                return getDate();
            case 'datetime':
                return getDateTime();
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
            const {data: {zoom}} = CanvasManager.getCurrentCanvas();
            // 对于非图片元素（如div），直接返回
            if (this.settings.tagName === 'div') {
                const {fontSize} = this.settings.options;
                const context = this.#getText();
                const text = new EditableText(context, {
                    fontSize: fontSize / zoom,
                    draggable: true
                });
                resolve(text);
                return;
            }

            // 对于图片元素，检查加载状态
            if (this.settings.tagName === 'img') {
                const {url, width, height} = this.settings
                Image.fromURL(url, {width: width / zoom, height: height / zoom, draggable: true})
                    .then(image => {
                        resolve(image);
                    })
                    .catch(error => {
                        reject(error);
                    });
                return;
            }
            resolve(null)
        });
    }
}


export default DraggableElementFactory
