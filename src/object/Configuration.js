// 基础阴影类
export class ShadowSettings {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.offsetXRatio = 0;
        this.offsetYRatio = 0;
        this.blur = 0;
        this.blurRatio = 0;
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
        this.borderRadiusRatio = 0;
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
        this.shadow = new ShadowSettings();
    }
}

// 图片设置类
export class ImageSettings {
    constructor() {
        this.tagName = '';
        this.path = '';
        this.url = '';
        this.offsetLeft = 0;
        this.offsetLeftRatio = 0;
        this.offsetRight = 0;
        this.offsetRightRatio = 0;
        this.offsetTop = 0;
        this.offsetTopRatio = 0;
        this.offsetBottom = 0;
        this.offsetBottomRatio = 0;
        this.width = 0;
        this.height = 0;
        this.originalWidth = 0;
        this.originalHeight = 0;
        this.references = [];
        this.synchronousMode = 0;
        this.options = new ImageOptions();
    }
}

// 文本设置类
export class TextSettings {
    constructor() {
        this.tagName = '';
        this.type = 'text';
        this.expression = '';
        this.content = '';
        this.offsetLeft = 0;
        this.offsetLeftRatio = 0;
        this.offsetRight = 0;
        this.offsetRightRatio = 0;
        this.offsetTop = 0;
        this.offsetTopRatio = 0;
        this.offsetBottom = 0;
        this.offsetBottomRatio = 0;
        this.references = [];
        this.synchronousMode = 0;
        this.options = new TextOptions();
    }
}

// 文本设置类
export class PhotographSettings {
    constructor() {
        this.options = new PhotographOptions();
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
export class BorderSettings {
    constructor() {
        this.borderLeftRatio = 0;
        this.borderRightRatio = 0;
        this.borderTopRatio = 0;
        this.borderBottomRatio = 0;
        this.borderBlurRatio = 0;
        this.borderRadiusRatio = 0;
        this.options = new BorderOptions()
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
        this.border = new BorderSettings();
    }
}



