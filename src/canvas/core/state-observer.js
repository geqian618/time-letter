const RAW = Symbol('stateObserver.raw');
const OBSERVER = Symbol('stateObserver.observer');

const ARRAY_MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin',]);


const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);


const toRaw = (value) => value !== null && typeof value === 'object' && value[RAW] ? value[RAW] : value;


function wrapIterator(iterator, transform) {
    return {
        next() {
            const result = iterator.next();
            if (!result.done) result.value = transform(result.value);
            return result;
        },
        [Symbol.iterator]() {
            return this;
        },
    };
}


function isObservableObject(value) {
    if (value === null || typeof value !== 'object') return false;
    return (
        Array.isArray(value) ||
        value instanceof Map ||
        value instanceof Set ||
        Object.prototype.toString.call(value) === '[object Object]'
    );
}

function createObserver(callback, {deep = true, callbackMode = 'sync'} = {}) {
    if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
    }
    if (typeof deep !== 'boolean') {
        throw new TypeError('options.deep must be a boolean');
    }
    if (callbackMode !== 'sync' && callbackMode !== 'microtask') {
        throw new TypeError("options.callbackMode must be 'sync' or 'microtask'");
    }
    const proxyCache = new WeakMap();
    const pendingEvents = [];
    let active = true;
    let flushScheduled = false;
    let mutationDepth = 0;
    const pendingPropertySets = new WeakSet();
    const pendingArrayLengths = new WeakSet();

    const flush = () => {
        flushScheduled = false;
        if (!active || pendingEvents.length === 0) return;
        const events = pendingEvents.splice(0);
        callback(events);
    };

    const notify = (event) => {
        if (!active) return;
        if (callbackMode === 'sync') {
            callback(event);
            return;
        }
        pendingEvents.push(event);
        if (!flushScheduled) {
            flushScheduled = true;
            queueMicrotask(flush);
        }
    };

    const disconnect = () => {
        active = false;
        pendingEvents.length = 0;
    };

    // 变异事件字段与取值一览（各字段按 type 互斥取值，未命中的字段在该事件上保持 undefined）：
    // - type        变异层面（按变异的表达方式区分，互斥；trap 是拦截机制，不参与分类）：
    //               'property' 语法操作：= 赋值 / delete 运算符 / Object.defineProperty，单属性粒度
    //               'method'   具名方法调用：push/splice/set/add 等，一次调用内部的 N 次属性
    //                          写入被 mutationDepth 折叠为单个语义事件
    //               'value'    原始值整体替换
    // - action      具体动作：
    //                 property → 'set' 普通赋值 | 'define' Object.defineProperty 重定义 | 'delete' 删除
    //                 method   → 方法名：数组为 'push'|'pop'|'shift'|'unshift'|'splice'|'sort'|'reverse'|'fill'|'copyWithin'，
    //                            Map 为 'set'|'delete'|'clear'，Set 为 'add'|'delete'|'clear'
    //                 value    → 'replace'
    // - target      变异持有者对应的代理（与从 state 逐层读出的引用身份一致，可直接 === 比较定位变更，
    //               如 event.target === state.a；value 事件为容器对象本身，即 state）
    // - property    仅 property 事件：属性名 / 数组下标（字符串，Proxy 键恒为 string/symbol，如 '0'）/ 容器字段名 'value'
    // - key         仅 method 事件（Map/Set）：本次变动的键或成员（可为任意值，非字符串属性名）
    // - args        仅 method 事件：底层方法实参（数组变异为全部实参，Map.set 为 [key, value]，clear 为 []）
    // - oldValue    property：旧值（新增属性时 undefined，删除时为被删值）
    //               method + Map/Set：该键旧值（clear 为清空前的条目快照数组）
    //               method + 数组：整个数组的前置快照（注意不是单个变更元素）
    // - newValue    property：新值（删除时 undefined）
    //               method + Map/Set：写入的新值（clear 为 []）
    //               method + 数组：整个数组的后置快照
    // - returnValue 仅 method 事件：底层方法返回值（push 返回新长度、splice 返回被删元素数组、Map.set 返回集合代理）
    const event = (details) => ({
        target: undefined,
        type: undefined,
        action: undefined,
        property: undefined,
        key: undefined,
        args: undefined,
        oldValue: undefined,
        newValue: undefined,
        returnValue: undefined,
        ...details,
    });

    const notifyProperty = (target, action, property, oldValue, newValue) => {
        if (mutationDepth || Object.is(oldValue, newValue)) return;
        notify(event({type: 'property', action, target: proxyCache.get(target) ?? target, property, oldValue, newValue}));
    };

    const wrap = (value, force = false) => {
        if ((!deep && !force) || !isObservableObject(value)) return value;
        const rawValue = toRaw(value);
        if (!isObservableObject(rawValue)) return rawValue;
        const cached = proxyCache.get(rawValue);
        if (cached) return cached;

        let proxy;
        if (Array.isArray(rawValue)) {
            proxy = createArrayProxy(rawValue);
        } else if (rawValue instanceof Map) {
            proxy = createMapProxy(rawValue);
        } else if (rawValue instanceof Set) {
            proxy = createSetProxy(rawValue);
        } else {
            proxy = createObjectProxy(rawValue);
        }
        proxyCache.set(rawValue, proxy);
        return proxy;
    };

    const baseHandlers = {
        get(target, property, receiver) {
            if (property === RAW) return target;
            if (property === OBSERVER) return true;
            return wrap(Reflect.get(target, property, receiver));
        },
        set(target, property, value, receiver) {
            const oldValue = Reflect.get(target, property, target);
            const hadProperty = hasOwn(target, property);
            const rawValue = toRaw(value);
            // Ordinary proxy writes delegate to defineProperty; report that one event as set.
            const succeedsThroughDefine = receiver !== target &&
                !(property === 'length' && Array.isArray(target));
            if (succeedsThroughDefine) {
                pendingPropertySets.add(target);
                if (property === 'length' && Array.isArray(target)) pendingArrayLengths.add(target);
            }
            const succeeded = Reflect.set(target, property, rawValue, receiver);
            if (succeedsThroughDefine) pendingPropertySets.delete(target);
            if (succeeded && !succeedsThroughDefine) {
                notifyProperty(
                    target,
                    'set',
                    property,
                    hadProperty ? oldValue : undefined,
                    rawValue,
                );
            }
            return succeeded;
        },
        defineProperty(target, property, descriptor) {
            const oldDescriptor = Reflect.getOwnPropertyDescriptor(target, property);
            const oldValue = oldDescriptor?.value;
            const succeeded = Reflect.defineProperty(target, property, {
                ...descriptor,
                ...(hasOwn(descriptor, 'value') ? {value: toRaw(descriptor.value)} : {}),
            });
            if (succeeded && hasOwn(descriptor, 'value')) {
                const action = pendingPropertySets.delete(target) ? 'set' : 'define';
                if (property !== 'length' || pendingArrayLengths.delete(target)) {
                    notifyProperty(target, action, property, oldValue, toRaw(descriptor.value));
                }
            }
            return succeeded;
        },
        deleteProperty(target, property) {
            if (!hasOwn(target, property)) return Reflect.deleteProperty(target, property);
            const oldValue = Reflect.get(target, property, target);
            const succeeded = Reflect.deleteProperty(target, property);
            if (succeeded && !mutationDepth) {
                notify(event({
                    type: 'property',
                    action: 'delete',
                    target: proxyCache.get(target) ?? target,
                    property,
                    oldValue,
                }));
            }
            return succeeded;
        },
    };

    function createObjectProxy(target) {
        return new Proxy(target, baseHandlers);
    }

    function createArrayProxy(target) {
        return new Proxy(target, {
            ...baseHandlers,
            get(array, property, receiver) {
                if (property === RAW) return array;
                if (property === OBSERVER) return true;
                if (ARRAY_MUTATORS.has(property)) {
                    return (...args) => {
                        const oldValue = Array.from(array, toRaw);
                        const rawArgs = args.map(toRaw);
                        mutationDepth += 1;
                        let returnValue;
                        try {
                            returnValue = Array.prototype[property].apply(receiver, rawArgs);
                        } finally {
                            mutationDepth -= 1;
                        }
                        const newValue = Array.from(array, toRaw);
                        const changed = oldValue.length !== newValue.length ||
                            oldValue.some((value, index) => !Object.is(value, newValue[index]));
                        if (changed) {
                            notify(event({
                                type: 'method',
                                action: property,
                                target: proxyCache.get(array) ?? array,
                                args: rawArgs,
                                oldValue,
                                newValue,
                                returnValue,
                            }));
                        }
                        return returnValue;
                    };
                }
                return wrap(Reflect.get(array, property, receiver));
            },
        });
    }

    function createMapProxy(target) {
        return new Proxy(target, {
            get(map, property) {
                if (property === RAW) return map;
                if (property === OBSERVER) return true;
                if (property === 'size') return map.size;
                if (property === 'set') {
                    return (key, value) => {
                        const rawKey = toRaw(key);
                        const rawValue = toRaw(value);
                        const hadKey = map.has(rawKey);
                        const oldValue = map.get(rawKey);
                        map.set(rawKey, rawValue);
                        if (!hadKey || !Object.is(oldValue, rawValue)) {
                            notify(event({
                                type: 'method', action: 'set', target: proxyCache.get(map) ?? map,
                                key: rawKey, args: [rawKey, rawValue],
                                oldValue, newValue: rawValue, returnValue: proxyCache.get(map),
                            }));
                        }
                        return proxyCache.get(map);
                    };
                }
                if (property === 'delete') {
                    return (key) => {
                        const rawKey = toRaw(key);
                        if (!map.has(rawKey)) return false;
                        const oldValue = map.get(rawKey);
                        const returnValue = map.delete(rawKey);
                        notify(event({
                            type: 'method', action: 'delete', target: proxyCache.get(map) ?? map,
                            key: rawKey, args: [rawKey],
                            oldValue, returnValue,
                        }));
                        return returnValue;
                    };
                }
                if (property === 'clear') {
                    return () => {
                        if (map.size === 0) return undefined;
                        const oldValue = Array.from(map, ([key, value]) => [key, toRaw(value)]);
                        const returnValue = map.clear();
                        notify(event({
                            type: 'method', action: 'clear', target: proxyCache.get(map) ?? map,
                            args: [], oldValue, newValue: [], returnValue,
                        }));
                        return returnValue;
                    };
                }
                if (property === 'get') return (key) => wrap(map.get(toRaw(key)));
                if (property === 'has') return (key) => map.has(toRaw(key));
                if (property === 'keys') return () => map.keys();
                if (property === 'values') {
                    return () => wrapIterator(map.values(), wrap);
                }
                if (property === 'entries' || property === Symbol.iterator) {
                    return () => wrapIterator(map.entries(), ([key, value]) => [key, wrap(value)]);
                }
                if (property === 'forEach') {
                    return (callbackFn, thisArg) => map.forEach((value, key) => {
                        callbackFn.call(thisArg, wrap(value), key, proxyCache.get(map));
                    });
                }
                return wrap(Reflect.get(map, property, map));
            },
        });
    }

    function createSetProxy(target) {
        return new Proxy(target, {
            get(set, property) {
                if (property === RAW) return set;
                if (property === OBSERVER) return true;
                if (property === 'size') return set.size;
                if (property === 'add') {
                    return (value) => {
                        const rawValue = toRaw(value);
                        if (set.has(rawValue)) return proxyCache.get(set);
                        set.add(rawValue);
                        notify(event({
                            type: 'method', action: 'add', target: proxyCache.get(set) ?? set,
                            key: rawValue, args: [rawValue],
                            newValue: rawValue, returnValue: proxyCache.get(set),
                        }));
                        return proxyCache.get(set);
                    };
                }
                if (property === 'delete') {
                    return (value) => {
                        const rawValue = toRaw(value);
                        if (!set.has(rawValue)) return false;
                        const returnValue = set.delete(rawValue);
                        notify(event({
                            type: 'method', action: 'delete', target: proxyCache.get(set) ?? set,
                            key: rawValue, args: [rawValue],
                            oldValue: rawValue, returnValue,
                        }));
                        return returnValue;
                    };
                }
                if (property === 'clear') {
                    return () => {
                        if (set.size === 0) return undefined;
                        const oldValue = Array.from(set, toRaw);
                        const returnValue = set.clear();
                        notify(event({
                            type: 'method', action: 'clear', target: proxyCache.get(set) ?? set,
                            args: [], oldValue, newValue: [], returnValue,
                        }));
                        return returnValue;
                    };
                }
                if (property === 'has') return (value) => set.has(toRaw(value));
                if (property === 'values' || property === 'keys' || property === Symbol.iterator) {
                    return () => wrapIterator(set.values(), wrap);
                }
                if (property === 'forEach') {
                    return (callbackFn, thisArg) => set.forEach((value) => {
                        const wrapped = wrap(value);
                        callbackFn.call(thisArg, wrapped, wrapped, proxyCache.get(set));
                    });
                }
                return wrap(Reflect.get(set, property, set));
            },
        });
    }

    return {wrap, notify, event, flush, disconnect};
}

/**
 * Observe mutations without dependency tracking or rendering.
 *
 * @template T
 * @param {T} source Object, class instance, Array, Map, Set, or primitive.
 * @param {(eventOrEvents: object|object[]) => void} callback Mutation callback.
 * @param {{ deep?: boolean, callbackMode?: 'sync'|'microtask' }} [options]
     * @returns {{ state: T extends object ? T : { value: T }, flush: () => void, disconnect: () => void }}
 */
export function createStateObserver(source, callback, options = {}) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('options must be an object');
    }
    const observer = createObserver(callback, options);
    const state = source !== null && typeof source === 'object'
        ? (() => {
            if (!isObservableObject(source)) {
                throw new TypeError('source type is not supported');
            }
            return observer.wrap(toRaw(source), true);
        })()
        : (() => {
            if (typeof source === 'function') {
                throw new TypeError('source type is not supported');
            }
            let currentValue = source;
            const container = {};
            Object.defineProperty(container, 'value', {
                enumerable: true,
                get: () => currentValue,
                set: (newValue) => {
                    const oldValue = currentValue;
                    if (Object.is(oldValue, newValue)) return;
                    currentValue = newValue;
                    observer.notify(observer.event({
                        type: 'value', action: 'replace', target: container,
                        property: 'value', oldValue, newValue,
                    }));
                },
            });
            return container;
        })();

    return {
        state,
        flush: observer.flush,
        disconnect: observer.disconnect,
    };
}
