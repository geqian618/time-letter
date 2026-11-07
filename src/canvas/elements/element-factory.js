/**
 * 元素工厂（工厂模式）：按裸数据的 type 构造元素实例。
 * 编辑器不感知具体元素构造，新增元素类型 = 新增类 + 一条注册项
 */
import {Text} from './TextElement.js';
import {Image} from './ImageElement.js';
import {Rect} from './RectElement.js';
import {Group} from './GroupElement.js';

// 类型 → 构造器注册表；context 携带图片缓存等宿主资源，避免工厂反向依赖编辑器
const CREATORS = {
    
    text: (options) => new Text(options.text, options),

    image: async (options, context) => {
        const image = context.enableCache ? context.cache.get(options.src) : null;
        const instance = image ? new Image(image, options) : await Image.fromURL(options);
        if (context.enableCache && instance.cacheable && !context.cache.has(options.src)) {
            context.cache.set(instance.src, instance.image);
        }
        return instance;
    },

    rect: (options) => new Rect(options),

    group: async (options, context) => {
        const children = [];
        for (const child of options.children || []) {
            const instance = await createElement(child, context);
            if (instance) children.push(instance);
        }
        return new Group({...options, children});
    },
};

/**
 * 按类型构造单个元素实例（图片异步解码；组合递归构造子元素），未知类型返回 null
 * @param {Object} options - 元素裸数据
 * @param {{enableCache: boolean, cache: Map}} context - 宿主资源（图片缓存）
 * @returns {Promise<Object|null>} 元素实例
 */
export async function createElement(options, context) {
    const creator = options && CREATORS[options.type];
    return creator ? creator(options, context) : null;
}
