/**
 * 响应式观察者（观察者模式）：基于 Proxy 的深层数据监听，
 * 拦截属性写入 / 删除与数组变异方法，值未实际变化不触发回调
 */
export class ReactiveObserver {
    /**
     *
     * @param target
     * @param callback
     * @param options ① deep 深度监听  ② shouldProxy 代理条件函数
     * @returns {*}
     */
    constructor(target, callback, options = {}) {

        this.callback = callback;
        this.proxyToRaw = new WeakMap();
        this.rawToProxy = new WeakMap();
        this.deep = options.deep === true;
        this.shouldProxy = options.shouldProxy || this.defaultShouldProxy.bind(this);

        // 创建代理并返回
        const proxy = this.createProxy(target);

        // 保存根代理
        this.rootProxy = proxy;

        return proxy;
    }

    // 深度比较两个值是否相等
    deepEqual(a, b, visited = new WeakSet()) {
        if (a === b) return true;
        if (Number.isNaN(a) && Number.isNaN(b)) return true;
        if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
            return false;
        }
        if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
            return false;
        }
        if (visited.has(a)) return true;
        visited.add(a);
        if (Array.isArray(a)) {
            if (a.length !== b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!this.deepEqual(a[i], b[i], visited)) return false;
            }
            return true;
        }
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (const key of keysA) {
            if (!keysB.includes(key) || !this.deepEqual(a[key], b[key], visited)) {
                return false;
            }
        }
        return true;
    }

    // 默认的代理检查函数
    defaultShouldProxy(value) {
        if (!value || typeof value !== 'object') {
            return false;
        }
        const type = Object.prototype.toString.call(value).slice(8, -1);
        const excludedTypes = [
            'HTMLImageElement',
            'HTMLCanvasElement',
            'HTMLVideoElement',
            'HTMLAudioElement',
            'File',
            'Blob',
            'Image',
            'ImageData',
            'ImageBitmap',
            'OffscreenCanvas',
            'CanvasRenderingContext2D',
            'WebGLRenderingContext',
            'Date',
            'RegExp',
            'Error',
            'Promise',
            'Map',
            'Set',
            'WeakMap',
            'WeakSet',
            'ArrayBuffer',
            'DataView',
            'Int8Array',
            'Uint8Array',
            'Uint8ClampedArray',
            'Int16Array',
            'Uint16Array',
            'Int32Array',
            'Uint32Array',
            'Float32Array',
            'Float64Array'
        ];
        if (excludedTypes.includes(type)) {
            return false;
        }
        if (value.nodeType !== undefined) {
            return false;
        }
        return type === 'Object' || type === 'Array';
    }

    createProxy(target) {
        // 如果传入的是代理，尝试获取原始对象
        let rawTarget = target;
        if (this.proxyToRaw.has(target)) {
            rawTarget = this.proxyToRaw.get(target);
        }

        // 如果原始对象已经有代理，返回代理
        if (this.rawToProxy.has(rawTarget)) {
            return this.rawToProxy.get(rawTarget);
        }

        // 检查是否需要代理这个对象
        if (!this.shouldProxy(rawTarget)) {
            return target; // 直接返回原对象，不创建代理
        }

        const handler = {
            get: (obj, prop) => {
                const value = obj[prop];
                // 只在开启深度代理时，对需要代理的对象递归创建代理
                if (this.deep && value && typeof value === 'object') {
                    // 使用shouldProxy检查是否需要代理
                    if (this.shouldProxy(value)) {
                        return this.createProxy(value);
                    }
                }
                return value;
            },

            set: (obj, prop, value) => {

                const oldValue = obj[prop];

                // 检查新旧值是否相等
                const isEqual = this.deepEqual(oldValue, value);

                // 只有在值实际改变时才更新和触发回调
                if (!isEqual) {
                    // 只在开启深度代理时，对新值是对象/数组进行代理
                    if (this.deep && value && typeof value === 'object') {
                        // 使用shouldProxy检查是否需要代理
                        if (this.shouldProxy(value)) {
                            obj[prop] = this.createProxy(value);
                        } else {
                            obj[prop] = value;
                        }
                    } else {
                        obj[prop] = value;
                    }

                    // 触发回调，添加根对象属性
                    const proxy = this.rawToProxy.get(obj);
                    this.callback({
                        target: proxy || obj, // 优先使用代理对象
                        root: this.rootProxy, // 添加根代理对象
                        property: prop,
                        oldValue,
                        newValue: value,
                        type: 'set'
                    });
                }
                return true;
            },

            deleteProperty: (obj, prop) => {
                const hadOwn = Object.prototype.hasOwnProperty.call(obj, prop);
                const oldValue = obj[prop];
                const success = delete obj[prop];
                if (success && hadOwn) {
                    // 触发回调，添加根对象属性
                    const proxy = this.rawToProxy.get(obj);
                    this.callback({
                        target: proxy || obj, // 优先使用代理对象
                        root: this.rootProxy, // 添加根代理对象
                        property: prop,
                        oldValue,
                        newValue: undefined,
                        type: 'delete'
                    });
                }
                return success;
            }
        };

        // 处理数组方法
        if (Array.isArray(rawTarget)) {
            handler.get = (obj, prop) => {
                // 拦截数组变异方法
                if (typeof prop === 'string' && ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'].includes(prop)) {
                    return (...args) => {
                        const oldArray = [...obj];
                        const result = Array.prototype[prop].apply(obj, args);

                        // 只在开启深度代理时，对新添加的对象元素进行代理
                        if (this.deep && ['push', 'unshift', 'splice'].includes(prop)) {
                            // splice 的 args 为 [start, deleteCount, ...items]，需跳过前两项
                            const items = prop === 'splice' ? args.slice(2) : args;
                            let startIndex;
                            if (prop === 'push') {
                                startIndex = obj.length - args.length;
                            } else if (prop === 'unshift') {
                                startIndex = 0;
                            } else {
                                const start = args[0];
                                startIndex = start < 0 ? Math.max(0, oldArray.length + start) : Math.min(start, oldArray.length);
                            }
                            for (let i = 0; i < items.length; i++) {
                                const arg = items[i];
                                if (arg && typeof arg === 'object' && this.shouldProxy(arg)) {
                                    obj[startIndex + i] = this.createProxy(arg);
                                }
                            }
                        }

                        // 检查数组是否实际改变
                        const isArrayChanged = !this.deepEqual(oldArray, obj);

                        if (isArrayChanged) {
                            // 触发回调，添加根对象属性
                            const proxy = this.rawToProxy.get(obj);
                            this.callback({
                                target: proxy || obj, // 优先使用代理对象
                                root: this.rootProxy, // 添加根代理对象
                                property: prop,
                                oldValue: oldArray,
                                newValue: [...obj],
                                type: 'array-mutation',
                                args
                            });
                        }
                        return result;
                    };
                }
                const value = obj[prop];
                // 只在开启深度代理时，对需要代理的对象进行递归代理
                if (this.deep && value && typeof value === 'object' && this.shouldProxy(value)) {
                    return this.createProxy(value);
                }
                return value;
            };
        }

        const proxy = new Proxy(rawTarget, handler)
        // 建立双向映射
        this.rawToProxy.set(rawTarget, proxy);
        this.proxyToRaw.set(proxy, rawTarget);

        // 如果这是根代理，保存它
        if (!this.rootProxy) {
            this.rootProxy = proxy;
        }

        return proxy;
    }

    // 可选：提供方法来动态改变深度代理设置
    setDeep(deep) {
        this.deep = deep;
    }

    // 可选：提供方法获取根代理
    getRoot() {
        return this.rootProxy;
    }
}
