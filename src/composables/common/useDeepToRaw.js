import {toRaw} from 'vue'

// 深度解包响应式代理：解决 toRaw 只解一层，无法处理嵌套元素仍是代理的情况
const deepToRaw = (value) => {
    const raw = toRaw(value)
    if (Array.isArray(raw)) return raw.map(deepToRaw)
    // 原生引用类型按引用返回（结构化克隆本身支持），展开成 {} 反而会丢数据
    if (raw instanceof Date || raw instanceof RegExp) return raw
    if (raw instanceof Map) return new Map([...raw].map(([key, item]) => [deepToRaw(key), deepToRaw(item)]))
    if (raw instanceof Set) return new Set([...raw].map(deepToRaw))
    if (raw && typeof raw === 'object') {
        const result = {}
        for (const key of Object.keys(raw)) result[key] = deepToRaw(raw[key])
        return result
    }
    return raw
}

const useDeepToRaw = () => deepToRaw

export default useDeepToRaw
