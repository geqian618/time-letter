import {getDate, getDateTime} from '@/utils/datetime'

import {executeFunctionScript} from '@/utils/script-helper'

import {projectSettings} from "@/config/project-settings";

import {IText, Image} from "fabric";

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

            // 对于非图片元素（如div），直接返回
            if (this.settings.tagName === 'div') {
                const {fontSize} = this.settings.options;
                const context = this.#getText();
                const text = new IText(context, {
                    fontSize
                });
                resolve(text);
                return;
            }

            // 对于图片元素，检查加载状态
            if (this.settings.tagName === 'img') {
                const {url} = this.settings
                Image.fromURL(url, {crossOrigin: 'anonymous'})
                    .then(image => {
                        const {width, height} = this.settings;
                        image.scaleToWidth(width)
                        image.scaleToHeight(height)
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
