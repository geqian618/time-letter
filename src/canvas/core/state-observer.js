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
        // 必须转发 return / throw，否则 for-of 提前 break 时原生迭代器的关闭逻辑丢失
        return(value) {
            return typeof iterator.return === 'function' ? iterator.return(value) : {done: true, value};
        },
        throw(error) {
            if (typeof iterator.throw === 'function') return iterator.throw(error);
            throw error;
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
    // 正在执行自身变异方法（push/sort/splice 等）的原始数组：只屏蔽该数组自身的下标与
    // length 写入（一次调用折叠为一个 method 事件）。不能做成全局深度计数器，
    // 否则 sort 比较器里对元素对象的写入也会被一并吞掉
    const mutatingArrays = new WeakSet();
    // 记录「正由 set trap 处理」的 (target, property)：普通数据属性的写入会被引擎转交给
    // defineProperty trap，两边必须协调，否则同一次写入会重复上报或互相甩锅
    const pendingSets = new WeakMap();

    const flush = () => {
        flushScheduled = false;
        if (!active || pendingEvents.length === 0) return;
        const events = pendingEvents.splice(0);
        callback(events);
    };

    const notify = (event) => {
        if (!active) return;
        if (callbackMode === 'sync') {
            // 与 microtask 模式保持同一签名：回调恒收到事件数组
            callback([event]);
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
    //                          写入被折叠为单个语义事件
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

    const notifyProperty = (target, action, property, oldValue, newValue, allowEqual = false) => {
        // 本数组正在执行自己的变异方法：其下标 / length 写入折叠进随后的 method 事件。
        // 不用全局计数，否则 sort 比较器里对其他对象的写入会被一并吞掉
        if (mutatingArrays.has(target)) return;
        if (!allowEqual && Object.is(oldValue, newValue)) return;
        notify(event({type: 'property', action, target: proxyCache.get(target) ?? target, property, oldValue, newValue}));
    };

    // 标记「该属性正由 set trap 写入」，返回的释放函数必须放在 finally 里调用：
    // setter 抛异常时若不释放，标记会永久残留并把后续 defineProperty 误判成 set
    const markPendingSet = (target, property) => {
        let properties = pendingSets.get(target);
        if (!properties) {
            properties = new Set();
            pendingSets.set(target, properties);
        }
        properties.add(property);
        return () => {
            properties.delete(property);
            if (properties.size === 0) pendingSets.delete(target);
        };
    };

    // 命中说明本次 defineProperty 由 set trap 转交而来，事件已由 set trap 上报，此处不得重复
    const consumePendingSet = (target, property) => {
        const properties = pendingSets.get(target);
        if (!properties || !properties.has(property)) return false;
        properties.delete(property);
        if (properties.size === 0) pendingSets.delete(target);
        return true;
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
            const rawValue = toRaw(value);
            const release = markPendingSet(target, property);
            let succeeded;
            try {
                succeeded = Reflect.set(target, property, rawValue, receiver);
            } finally {
                release();
            }
            // 普通数据属性的写入会先被 defineProperty trap 消费标记（那边不上报），
            // 访问器属性的写入不经过 defineProperty —— 两种情况都统一由这里上报，
            // 保证一次赋值恰好一个 set 事件（含数组 length、含无 value 字段的访问器）
            if (succeeded) notifyProperty(target, 'set', property, oldValue, rawValue);
            return succeeded;
        },
        defineProperty(target, property, descriptor) {
            // 访问器 descriptor 没有 value 字段，旧值只能经 getter 读（旧值可能抛错，降级为 undefined）
            let oldValue;
            try {
                oldValue = Reflect.get(target, property, target);
            } catch {
                oldValue = undefined;
            }
            const succeeded = Reflect.defineProperty(target, property, {
                ...descriptor,
                ...(hasOwn(descriptor, 'value') ? {value: toRaw(descriptor.value)} : {}),
            });
            if (!succeeded) return false;
            // 由 set trap 转交的写入：已上报，此处放行以免重复
            if (consumePendingSet(target, property)) return true;
            // 直接 Object.defineProperty（含定义访问器）属于结构重定义，一律上报。
            // 访问器没有 value 字段，新旧值都是 undefined，必须跳过相等去重，否则整个事件被吞掉
            const newValue = hasOwn(descriptor, 'value') ? toRaw(descriptor.value) : undefined;
            notifyProperty(target, 'define', property, oldValue, newValue, !hasOwn(descriptor, 'value'));
            return true;
        },
        deleteProperty(target, property) {
            if (!hasOwn(target, property)) return Reflect.deleteProperty(target, property);
            const oldValue = Reflect.get(target, property, target);
            const succeeded = Reflect.deleteProperty(target, property);
            if (succeeded && !mutatingArrays.has(target)) {
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
        // 每个代理缓存一份变异方法：热路径上反复取 state.push 不再每次分配新闭包，
        // 同时保证 state.push === state.push
        const mutators = new Map();
        return new Proxy(target, {
            ...baseHandlers,
            get(array, property, receiver) {
                if (property === RAW) return array;
                if (property === OBSERVER) return true;
                if (ARRAY_MUTATORS.has(property)) {
                    let mutator = mutators.get(property);
                    if (mutator) return mutator;
                    mutator = (...args) => {
                        const oldValue = Array.from(array, toRaw);
                        const rawArgs = args.map(toRaw);
                        // 只屏蔽本数组自身的结构写入；sort 比较器里对其他对象的写入必须正常上报
                        mutatingArrays.add(array);
                        let returnValue;
                        try {
                            returnValue = Array.prototype[property].apply(receiver, rawArgs);
                        } finally {
                            mutatingArrays.delete(array);
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
                                // 返回值可能带出元素（splice 的数组、pop/shift 的单个元素）：
                                // 一律 raw 化，与 oldValue 保持同一身份，避免同一事件里两种引用并存。
                                // sort / reverse 返回 receiver 本身，必须在 raw 化之前单独放行，
                                // 否则 toRaw 会顺着 RAW 符号把整个数组也拆成原始对象
                                returnValue: returnValue === receiver
                                    ? returnValue
                                    : (Array.isArray(returnValue)
                                        ? Array.from(returnValue, toRaw)
                                        : toRaw(returnValue)),
                            }));
                        }
                        return returnValue;
                    };
                    mutators.set(property, mutator);
                    return mutator;
                }
                return wrap(Reflect.get(array, property, receiver));
            },
        });
    }

    function createMapProxy(target) {
        return new Proxy(target, {
            // 补齐 set / defineProperty / deleteProperty：Map 的真实数据在内部槽位里不走属性 trap，
            // 但挂在实例上的自定义属性写入同样应当可见
            ...baseHandlers,
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
            // 同 Map：补齐自定义属性的写入 / 删除通知
            ...baseHandlers,
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
 * @param {(events: object[]) => void} callback Mutation callback（sync / microtask 均收到事件数组）
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
            let currentValue = toRaw(source);
            const container = {};
            Object.defineProperty(container, 'value', {
                enumerable: true,
                // 读时包装：.value 装进对象后仍与对象代理一致可观察（wrap 内部按 raw 去重，身份稳定）
                get: () => observer.wrap(currentValue),
                set: (newValue) => {
                    const rawValue = toRaw(newValue);
                    const oldValue = currentValue;
                    if (Object.is(oldValue, rawValue)) return;
                    currentValue = rawValue;
                    observer.notify(observer.event({
                        type: 'value', action: 'replace', target: container,
                        property: 'value', oldValue, newValue: rawValue,
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
