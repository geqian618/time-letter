export class CanvasSettings {
    constructor() {
        this.metadata = null;
        this.completed = false;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.zoom = 1;
        this.imageElement = null;
        this.path = '';
        this.url = '';
        this.filename = '';
        this.extname = '';
    }

    getImageElement() {
        if (!this.imageElement) {
            this.imageElement = document.getElementById(this.path);
        }
        return this.imageElement;
    }

    getPreviewElement(previewList) {
        const escapedPath = this.path.replace(/\\/g, '\\\\');
        return previewList.querySelector(`[path="${escapedPath}"]`);
    }
}

// 基础阴影类
export class ShadowSettings {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.blur = 0;
        this.color = 'rgb(0,0,0,1)';
    }
}

// 图片选项类
export class ImageOptions {
    constructor() {
        this.scale = 1;
        this.angle = 0;
        this.alpha = 1;
        this.zIndex = 0;
        this.shadow = new ShadowSettings();
    }
}

// 图片选项类
export class PhotographOptions {
    constructor() {
        this.borderRadius = 0;
        this.shadow = new ShadowSettings();
    }
}

// 文本选项类
export class TextOptions {
    constructor() {
        this.fontSize = 14;
        this.fontFamily = 'Microsoft YaHei';
        this.fontStyle = 'normal';
        this.fontWeight = 400;
        this.fontColor = 'rgb(0,0,0,1)';
        this.direction = 'horizontal';
        this.angle = 0;
        this.zIndex = 0;
        this.spacing = 0;
        this.lineHeight = 1;
        this.shadow = new ShadowSettings();
    }
}

// 元数据类
export class Metadata {
    constructor() {
        this.cameraBrand = '';
        this.cameraModel = '';
        this.lensModel = '';
        this.focalLength = '';
        this.iso = '';
        this.shutter = '';
        this.aperture = '';
        this.shootingTime = '';
        this.width = null;
        this.height = null;
    }
}


// 边框设置类
export class BorderOptions {
    constructor() {
        this.borderType = 0;
        this.borderLeft = 0;
        this.borderRight = 0;
        this.borderTop = 0;
        this.borderBottom = 0;
        this.borderBlur = 15;
        this.borderRadius = 0;
        this.borderColor = 'rgba(255, 255, 255, 1)';
    }
}

export class FontSettings {
    constructor() {
        this.family = '';
        this.familyAlias = '';
        this.url = '';
        this.path = '';
        this.editable = false;
    }
}


export class TextLabel {
    constructor() {
        this.id = '';
        this.tips = '';
        this.type = 'text';
        this.content = '';
        this.script = 'function extendScript() {\n' +
            '  return Date.now();\n' +
            '}';
    }
}


// 主设置类
export class Configuration {
    constructor() {
        this.outputDirectory = '';
        this.files = [];
        this.metadata = new Metadata();
        this.image = new ImageSettings();
        this.text = new TextSettings();
    }
}



