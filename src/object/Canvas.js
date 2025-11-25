import {BorderSettings} from '@/object/Configuration'

export class Canvas {
    constructor() {
        this.metadata = null;
        this.visible = false;
        this.completed = false;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.scale = 1;
        this.isUpdate = false;
        this.imageElement = null;
        this.path = '';
        this.url = '';
        this.filename = '';
        this.extname = '';
        this.settings = {
            border: new BorderSettings(),
            texts: new Map(),
            images: new Map(),
        };
    }

    getImageElement() {
        if (!this.imageElement) {
            this.imageElement = document.getElementById(this.path);
        }
        return this.imageElement;
    }

    getTriggerElement(previewList) {
        const escapedPath = this.path.replace(/\\/g, '\\\\');
        return previewList.querySelector(`[path="${escapedPath}"]`);
    }

    // 添加一些实用的方法
    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    isCompleted() {
        return this.completed;
    }


    updateScale(newScale) {
        this.scale = newScale;
    }

    updateScrollPosition(left, top) {
        this.scrollLeft = left;
        this.scrollTop = top;
    }

    // 文本相关方法
    addText(key, textSettings) {
        this.settings.texts.set(key, textSettings);
    }

    getText(key) {
        return this.settings.texts.get(key);
    }

    removeText(key) {
        return this.settings.texts.delete(key);
    }

    // 图片相关方法
    addImage(key, imageSettings) {
        this.settings.images.set(key, imageSettings);
    }

    getImage(key) {
        return this.settings.images.get(key);
    }

    removeImage(key) {
        return this.settings.images.delete(key);
    }

    // 边框设置方法
    updateBorder(borderSettings) {
        this.settings.border = {...this.settings.border, ...borderSettings};
    }

    // 重置方法
    reset() {
        this.visible = false;
        this.completed = false;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.scale = 1;
        this.isUpdate = false;
        this.settings.texts.clear();
        this.settings.images.clear();
        this.settings.border = {
            borderType: 0,
            borderLeft: 0,
            borderRight: 0,
            borderTop: 0,
            borderBottom: 0,
            borderLeftRatio: 0,
            borderRightRatio: 0,
            borderTopRatio: 0,
            borderBottomRatio: 0,
            borderBlur: 15,
            borderBlurRatio: 0,
            borderRadius: 0,
            borderRadiusRatio: 0,
            borderColor: 'rgba(255, 255, 255, 1)',
        };
    }

    // 序列化方法
    toJSON() {
        return {
            metadata: this.metadata,
            visible: this.visible,
            completed: this.completed,
            scrollLeft: this.scrollLeft,
            scrollTop: this.scrollTop,
            scale: this.scale,
            isUpdate: this.isUpdate,
            path: this.path,
            settings: {
                border: this.settings.border,
                texts: Object.fromEntries(this.settings.texts),
                images: Object.fromEntries(this.settings.images),
            }
        };
    }
}

// 默认导出
export default Canvas;
