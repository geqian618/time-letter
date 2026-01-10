class Element {

    constructor(options) {

        // 文本对象 id
        this.id = Date.now() + Math.random();
        // 坐标
        this.x = options.x || 0;

        this.y = options.y || 0;

        // 是否可选中
        this.selectable = options.selectable !== undefined ? options.selectable : true;

        // 是否可拖拽
        this.draggable = options.draggable !== undefined ? options.draggable : false;
    }

    contains(x, y) {
        return false
    }

    selection(ctx, zoom) {

    }

}


export default Element
