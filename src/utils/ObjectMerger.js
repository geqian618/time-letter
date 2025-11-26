/**
 * 对象合并工具类 - 实现原始对象与更新对象的深度合并
 * 基本原则：原始对象值优先，相同路径下的基本属性以原始对象值为准
 */
class ObjectMerger {

    /**
     * 深度合并两个对象
     * @param {*} sourceObj 原始对象
     * @param {*} updatedObj 更新对象
     * @param options 可选项
     * @returns {*} 合并后的对象
     */
    static merge(sourceObj, updatedObj, options = {keepExistingAttributes: true, KeepExistingValues: false}) {

        // 处理 null 或 undefined 的情况
        if (sourceObj == null && updatedObj == null) {
            return null;
        }

        // 如果原始对象为空，直接返回更新对象的深拷贝
        if (sourceObj == null) {
            return this.deepClone(updatedObj);
        }

        // 如果更新对象为空，直接返回原始对象的深拷贝
        if (updatedObj == null) {
            return this.deepClone(sourceObj);
        }

        // 如果原始对象与更新对象都不为空
        return this.#mergeValues(sourceObj, updatedObj, options)
    }


    /**
     * 合并两个值，根据类型采用不同的合并策略
     * @param {*} sourceVal 原始值
     * @param {*} updatedVal 更新值
     * @param options 可选项
     * @returns {*} 合并后的值
     */
    static #mergeValues(sourceVal, updatedVal, options = {keepExistingAttributes: true, KeepExistingValues: false}) {

        const keepVal = options.KeepExistingValues ? sourceVal : updatedVal;

        // 处理 null 和 undefined
        if (sourceVal == null && updatedVal == null) {
            // 原始值优先
            return this.deepClone(keepVal);
        }

        // 获取值的实际类型
        const sourceType = this.getValueType(sourceVal);
        const updatedType = this.getValueType(updatedVal);

        // 类型不同，直接返回 keepVal
        if (sourceType !== updatedType) {
            return this.deepClone(keepVal);
        }

        // 根据类型采用不同的合并策略
        switch (sourceType) {

            case 'object':
                // 普通对象：递归合并
                return this.mergeObjects(sourceVal, updatedVal, options);

            case 'array':
                // 数组：特殊处理，可以自定义数组合并策略
                // 如果需要其他数组合并策略，可以在这里扩展
                return this.#mergeArrays(sourceVal, updatedVal, options);

            case 'date':
                // 日期对象
                return new Date(keepVal.getTime());

            case 'regexp':
                // 正则表达式
                return new RegExp(keepVal);

            case 'function':
                // 函数
                return keepVal;

            case 'map':
                // Map：递归合并 Map 中的值
                return this.mergeMaps(sourceVal, updatedVal, options);

            case 'set':
                // Set：使用原始 Set
                return this.#mergeSets(sourceVal, updatedVal, options);

            default:
                // 基本类型（string, number, boolean, symbol, bigint等）
                return this.deepClone(keepVal);
        }
    }


    /**
     * 递归合并两个普通对象
     * @param {Object} source 原始对象
     * @param {Object} updated 更新对象
     * @param options ① preserveUnique 是否保留原始对象中独有的属性（默认true）
     * @returns {Object} 合并后的对象
     */
    static mergeObjects(source, updated, options = {keepExistingAttributes: true, KeepExistingValues: false}) {

        const result = {};

        // 获取所有需要处理的键
        const allKeys = new Set([
            ...Object.keys(source || {}),
            ...Object.keys(updated || {})
        ]);

        // 遍历所有键进行合并
        for (const key of allKeys) {

            const sourceVal = source?.[key];
            const updatedVal = updated?.[key];

            // 如果原始对象中存在该键
            if (source && key in source) {
                // 如果更新对象中也存在该键
                if (updated && key in updated) {
                    // 两者都存在，递归合并
                    result[key] = this.merge(sourceVal, updatedVal, options);
                } else {
                    // 只有原始对象有，根据选项决定是否保留
                    if (options.keepExistingAttributes) {
                        result[key] = this.deepClone(sourceVal);
                    }
                    // 如果 keepExistingAttributes 为 false，则不保留该属性
                }
            } else {
                // 只有更新对象有，使用更新值（深拷贝）
                result[key] = this.deepClone(updatedVal);
            }
        }

        return result;
    }


    /**
     * 合并两个Map对象
     * @param {Map} sourceMap 原始 Map
     * @param {Map} updatedMap 更新 Map
     * @param options ① preserveUnique 是否保留原始 Map 中独有的键值对（默认true）
     * @returns {Map} 合并后的 Map
     */
    static mergeMaps(sourceMap, updatedMap, options) {

        const result = new Map();

        // 如果保留原始对象，先添加原始 Map 的所有条目
        if (options.keepExistingAttributes) {
            for (const [key, value] of sourceMap) {
                result.set(key, this.deepClone(value));
            }
        }

        // 处理更新 Map 的条目
        for (const [key, value] of updatedMap) {
            if (!sourceMap.has(key)) {
                // 没有该键，直接添加
                result.set(key, this.deepClone(value));
            } else {
                // 两者都存在相同 key，继续合并 value
                result.set(key, this.merge(sourceMap.get(key), value, options));
            }
        }

        return result;
    }


    /**
     * 合并两个数组
     * @param {Array} sourceArray 原始数组
     * @param {Array} updatedArray 更新数组
     * @param options
     * @returns {Array} 合并后的数组
     */
    static #mergeArrays(sourceArray, updatedArray, options) {
        // 可以根据需要扩展其他策略，如：合并、追加等
        return this.deepClone(options.KeepExistingValues ? sourceArray : updatedArray);
    }


    /**
     * 合并两个Set对象
     * @param {Set} sourceSet 原始 Set
     * @param {Set} updatedSet 更新 Set
     * @param options
     * @returns {Set} 合并后的 Set
     */
    static #mergeSets(sourceSet, updatedSet, options) {
        return this.deepClone(options.KeepExistingValues ? sourceSet : updatedSet);
    }


    /**
     * 获取值的详细类型
     * @param {*} value 要检测的值
     * @returns {string} 类型字符串
     */
    static getValueType(value) {

        if (value === null) return 'null';

        if (value === undefined) return 'undefined';

        const type = typeof value;

        if (type !== 'object') return type;
        // 对象的具体类型判断
        if (Array.isArray(value)) return 'array';
        if (value instanceof Date) return 'date';
        if (value instanceof RegExp) return 'regexp';
        if (value instanceof Map) return 'map';
        if (value instanceof Set) return 'set';

        return 'object';
    }


    /**
     * 深拷贝对象 - 完整版本，支持所有常见数据类型
     * @param {*} obj 要拷贝的对象
     * @param {WeakMap} visited 用于检测循环引用的已访问对象映射
     * @returns {*} 拷贝后的对象
     */
    static deepClone(obj, visited = new WeakMap()) {

        // 处理基本类型和 null
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // 处理循环引用
        if (visited.has(obj)) {
            return visited.get(obj);
        }

        let cloned;

        // 处理 Date 对象
        if (obj instanceof Date) {
            cloned = new Date(obj.getTime());
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 RegExp 对象
        if (obj instanceof RegExp) {
            cloned = new RegExp(obj);
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 Array 对象
        if (Array.isArray(obj)) {
            cloned = [];
            visited.set(obj, cloned);
            cloned.push(...obj.map(item => this.deepClone(item, visited)));
            return cloned;
        }

        // 处理 Map 对象
        if (obj instanceof Map) {
            cloned = new Map();
            visited.set(obj, cloned);
            for (const [key, value] of obj) {
                cloned.set(
                    this.deepClone(key, visited),
                    this.deepClone(value, visited)
                );
            }
            return cloned;
        }

        // 处理 Set 对象
        if (obj instanceof Set) {
            cloned = new Set();
            visited.set(obj, cloned);
            for (const value of obj) {
                cloned.add(this.deepClone(value, visited));
            }
            return cloned;
        }

        // 处理 ArrayBuffer
        if (obj instanceof ArrayBuffer) {
            cloned = obj.slice(0);
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 TypedArray (Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array)
        if (ArrayBuffer.isView(obj)) {
            const buffer = this.deepClone(obj.buffer, visited);
            if (obj instanceof DataView) {
                cloned = new DataView(buffer, obj.byteOffset, obj.byteLength);
            } else {
                cloned = new obj.constructor(buffer, obj.byteOffset, obj.length);
            }
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 Promise 对象（注意：无法克隆 pending 状态，只能保持引用）
        if (obj instanceof Promise) {
            // 对于 Promise，我们无法真正克隆，只能保持引用
            cloned = obj;
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 Error 对象
        if (obj instanceof Error) {
            cloned = new obj.constructor(obj.message);
            cloned.stack = obj.stack;
            cloned.name = obj.name;
            // 拷贝自定义属性
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key], visited);
                }
            }
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理 Function（通常直接返回引用，因为函数通常是静态的）
        if (typeof obj === 'function') {
            // 注意：函数无法真正克隆，只能保持引用
            cloned = obj;
            visited.set(obj, cloned);
            return cloned;
        }

        // 处理普通对象（包括自定义类的实例）
        if (obj instanceof Object) {

            // 获取对象的原型
            const proto = Object.getPrototypeOf(obj);

            // 创建新对象，保持原型链
            if (proto === null) {
                cloned = Object.create(null);
            } else {
                cloned = Object.create(proto);
            }

            visited.set(obj, cloned);

            // 拷贝所有属性（包括可枚举的Symbol属性）
            const allKeys = [
                ...Object.getOwnPropertyNames(obj),
                ...Object.getOwnPropertySymbols(obj)
            ];

            for (const key of allKeys) {

                // 跳过构造函数属性
                if (key === 'constructor') continue;

                const descriptor = Object.getOwnPropertyDescriptor(obj, key);

                if (descriptor) {
                    if (descriptor.get || descriptor.set) {
                        // 对于访问器属性，直接拷贝属性描述符
                        Object.defineProperty(cloned, key, {
                            get: descriptor.get,
                            set: descriptor.set,
                            enumerable: descriptor.enumerable,
                            configurable: descriptor.configurable
                        });
                    } else {
                        // 对于数据属性，递归拷贝值
                        cloned[key] = this.deepClone(obj[key], visited);
                    }
                }
            }
            return cloned;
        }

        // 对于其他未知类型，直接返回（如DOM元素、Window对象等）
        return obj;
    }

    /**
     * 安全深拷贝的简化版本 - 适用于纯数据对象
     * 这个版本只处理 JSON 安全的数据类型，性能更好
     * @param {*} obj 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    static deepCloneSafe(obj) {

        // 处理基本类型和 null
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // 处理 Date 对象
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        // 处理 Array 对象
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepCloneSafe(item));
        }

        // 处理普通对象
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepCloneSafe(obj[key]);
                }
            }
            return cloned;
        }

        // 其他类型返回原对象
        return obj;
    }

    /**
     * 检查对象是否为纯数据对象（可安全序列化）
     * @param {*} obj 要检查的对象
     * @returns {boolean} 是否为纯数据对象
     */
    static isPlainObject(obj) {

        if (obj === null || typeof obj !== 'object') {
            return false;
        }

        const proto = Object.getPrototypeOf(obj);

        return proto === null || proto === Object.prototype;
    }


    /**
     * 性能优化的深拷贝 - 对于纯数据对象使用 JSON 方式，其他使用递归方式
     * @param {*} obj 要拷贝的对象
     * @returns {*} 拷贝后的对象
     */
    static deepCloneOptimized(obj) {
        // 如果是纯数据对象，使用JSON方式（性能更好）
        if (this.isPlainObject(obj) || Array.isArray(obj)) {
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch (e) {
                // 如果JSON方式失败，回退到递归方式
                return this.deepClone(obj);
            }
        }

        // 对于非纯数据对象，使用完整的深拷贝
        return this.deepClone(obj);
    }

    /**
     * 检查两个对象是否在结构上兼容（具有相同的键结构）
     * @param {Object} config1 对象1
     * @param {Object} config2 对象2
     * @returns {boolean} 是否兼容
     */
    static areConfigsCompatible(config1, config2) {

        if (typeof config1 !== 'object' || typeof config2 !== 'object') {
            return false;
        }

        const keys1 = this.#getAllKeys(config1);
        const keys2 = this.#getAllKeys(config2);

        // 简单的兼容性检查：检查是否有共同的键
        return keys1.some(key => keys2.includes(key));
    }


    /**
     * 获取对象的所有嵌套键（用于调试和兼容性检查）
     * @param {Object} obj 对象
     * @param {string} prefix 前缀
     * @returns {string[]} 所有键的数组
     */
    static #getAllKeys(obj, prefix = '') {

        if (!obj || typeof obj !== 'object') {
            return [];
        }

        let keys = [];

        for (const key in obj) {

            if (obj.hasOwnProperty(key)) {

                const fullKey = prefix ? `${prefix}.${key}` : key;

                keys.push(fullKey);

                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    keys = keys.concat(this.getAllKeys(obj[key], fullKey));
                }
            }
        }
        return keys;
    }

    /**
     * 比较两个值是否相等（深度比较）
     * @param {*} a 第一个值
     * @param {*} b 第二个值
     * @returns {boolean} 是否相等
     */
    static isEqual(a, b) {
        // 处理基本类型和引用相等
        if (a === b) return true;

        // 处理 null 和 undefined
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;

        // 处理类型不同
        if (typeof a !== typeof b) return false;

        const type = this.getValueType(a);

        // 根据类型采用不同的比较策略
        switch (type) {
            case 'object':
                return this.#isEqualObject(a, b);

            case 'array':
                return this.#isEqualArray(a, b);

            case 'map':
                return this.#isEqualMap(a, b);

            case 'set':
                return this.#isEqualSet(a, b);

            case 'date':
                return a.getTime() === b.getTime();

            case 'regexp':
                return a.toString() === b.toString();

            default:
                return a === b;
        }
    }

    /**
     * 深度比较两个对象
     * @param {Object} a 第一个对象
     * @param {Object} b 第二个对象
     * @returns {boolean} 是否相等
     */
    static #isEqualObject(a, b) {

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
            if (!keysB.includes(key)) return false;
            if (!this.isEqual(a[key], b[key])) return false;
        }
        return true;
    }

    /**
     * 深度比较两个数组
     * @param {Array} a 第一个数组
     * @param {Array} b 第二个数组
     * @returns {boolean} 是否相等
     */
    static #isEqualArray(a, b) {

        if (a.length !== b.length) return false;

        for (let i = 0; i < a.length; i++) {
            if (!this.isEqual(a[i], b[i])) return false;
        }

        return true;
    }

    /**
     * 深度比较两个Map
     * @param {Map} a 第一个Map
     * @param {Map} b 第二个Map
     * @returns {boolean} 是否相等
     */
    static #isEqualMap(a, b) {

        if (a.size !== b.size) return false;

        for (const [key, value] of a) {
            if (!b.has(key)) return false;
            if (!this.isEqual(value, b.get(key))) return false;
        }

        return true;
    }

    /**
     * 深度比较两个Set
     * @param {Set} a 第一个Set
     * @param {Set} b 第二个Set
     * @returns {boolean} 是否相等
     */
    static #isEqualSet(a, b) {

        if (a.size !== b.size) return false;

        for (const value of a) {
            let found = false;
            for (const bValue of b) {
                if (this.isEqual(value, bValue)) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }

        return true;
    }


}

// CommonJS
module.exports = ObjectMerger;
// ES6
// export default ConfigMerger;

