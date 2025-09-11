function getNextValue(map, currentKey) {
    const keys = Array.from(map.keys());
    const currentIndex = keys.indexOf(currentKey);
    // 如果键不存在或已是最后一个元素
    if (currentIndex === -1) return undefined;

    if (keys.length && currentIndex === keys.length - 1) {
        return map.get(keys[0]);
    }
    // 返回下一个键对应的值
    const nextKey = keys[currentIndex + 1];
    return map.get(nextKey);
}

function getBeforeValue(map, currentKey) {

    const keys = Array.from(map.keys());

    const currentIndex = keys.indexOf(currentKey);

    // 如果键不存在或已是最后一个元素
    if (currentIndex === -1) return undefined;

    if (keys.length && currentIndex === 0) {
        return map.get(keys[keys.length - 1]);
    }
    // 返回上一个键对应的值
    const beforeKey = keys[currentIndex - 1];
    return map.get(beforeKey);
}


export default {getNextValue, getBeforeValue}
