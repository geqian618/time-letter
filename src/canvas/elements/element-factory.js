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
    text: (data) => new Text(data.text, data),

    image: async (data, context) => {
        const image = context.enableCache ? context.cache.get(data.src) : null;
        const instance = image ? new Image(image, data) : await Image.fromURL(data.src, data);
        if (context.enableCache && instance.cacheable && !context.cache.has(data.src)) {
            context.cache.set(instance.src, instance.image);
        }
        return instance;
    },

    rect: (data) => new Rect(data),

    group: async (data, context) => {
        const children = [];
        for (const child of data.children || []) {
            const instance = await createElement(child, context);
            if (instance) children.push(instance);
        }
        return new Group({...data, children});
    },
};

/**
 * 按类型构造单个元素实例（图片异步解码；组合递归构造子元素），未知类型返回 null
 * @param {Object} data - 元素裸数据
 * @param {{enableCache: boolean, cache: Map}} context - 宿主资源（图片缓存）
 * @returns {Promise<Object|null>} 元素实例
 */
export async function createElement(data, context) {
    const creator = data && CREATORS[data.type];
    return creator ? creator(data, context) : null;
}
