import {Image, classRegistry} from 'fabric'
import * as fabric from 'fabric'

class FixedImage extends Image {

    static type = 'FixedImage'

    constructor(element, options) {
        super(element, options);
        this.selectable = false;
        this.evented = false
        this.path = ''
    }

    /**
     * 重写 toObject 方法以包含自定义属性
     */
    toObject(propertiesToInclude = []) {
        return super.toObject(
            propertiesToInclude.concat([
                'selectable',
                'evented',
                'type',
                'path'
            ])
        )
    }
}

// 使得从序列化数据中恢复成为可能
classRegistry.setClass(FixedImage, 'FixedImage');

export default FixedImage
