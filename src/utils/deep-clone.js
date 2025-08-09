function deepCloneMap(sourceMap) {
    const cloneMap = new Map();
    for (const [key, value] of sourceMap) {
        // 递归克隆键
        const clonedKey = deepClone(key);
        // 递归克隆值
        let clonedValue;
        if (value instanceof Map) {
            clonedValue = deepCloneMap(value);  // 递归处理嵌套 Map
        } else if (value instanceof Set) {
            clonedValue = deepCloneSet(value);  // 处理 Set
        } else if (Array.isArray(value)) {
            clonedValue = value.map(item => deepCloneArray(item));  // 处理数组
        } else if (value && typeof value === 'object') {
            clonedValue = deepCloneObject(value);  // 处理普通对象
        } else {
            clonedValue = value;  // 基本类型直接赋值
        }

        cloneMap.set(clonedKey, clonedValue);
    }

    return cloneMap;
}

// 辅助函数：深拷贝对象
function deepCloneObject(source) {
    const clone = {};
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            clone[key] = deepClone(source[key]);
        }
    }
    return clone;
}

// 辅助函数：深拷贝数组
function deepCloneArray(source) {
    return source.map(item => deepClone(item));
}


// 辅助函数：深拷贝 set
function deepCloneSet(source) {
    const cloneSet = new Set();
    source.forEach(val => {
        cloneSet.add(deepClone(val));
    });
    return cloneSet;
}

// 辅助函数：深拷贝值（入口函数）
function deepClone(value) {
    if (value instanceof Map) return deepCloneMap(value);
    if (value instanceof Set) return deepCloneSet(value);
    if (Array.isArray(value)) return deepCloneArray(value);
    if (value && typeof value === 'object') return deepCloneObject(value);
    return value;  // 基本类型
}


// 辅助函数：深拷贝值（入口函数）
function deepClone(value) {
    if (value instanceof Map) return deepCloneMap(value);
    if (value instanceof Set) return deepCloneSet(value);
    if (Array.isArray(value)) return deepCloneArray(value);
    if (value && typeof value === 'object') return deepCloneObject(value);
    return value;  // 基本类型
}

export {deepClone}
