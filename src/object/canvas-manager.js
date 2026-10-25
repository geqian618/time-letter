import {reactive, shallowReactive} from 'vue'

// 画布 Map 只需要浅层响应式：UI 对它的依赖是键集合的增删换（预览列表 v-for、
// availableCanvases/extnameOptions computed、Index.vue 的快照 watch 都只遍历或读键）。
// 若用 reactive(new Map())，get/iterate 取出的画布条目会被深层代理，条目里的元素树
// （foreground/background 中的活实例）再被编辑器的 ReactiveObserver 包一层，
// 拖拽渲染每帧数百次属性读取要过 2-3 层 trap。取出的值保持原始对象后，
// ReactiveObserver 成为唯一代理层（其 WeakMap 缓存保证代理身份稳定）。
// 例外：metadata 在创建时单独 reactive（见 PreviewPanel 导入流程），模板在订阅其字段。
const canvases = shallowReactive(new Map())

const selectedObject = reactive({
    path: '',
    previewElement: null,
    previewElementList: [],
    draggableElement: null
})


const getSelectedObject = () => {
    return selectedObject
}

const getSelectedPath = () => {
    return selectedObject.path
}


const setSelectedObject = (newSelectedObject) => {
    Object.assign(selectedObject, newSelectedObject)
}

const getCanvas = (key) => {
    return canvases.get(key);
}

const getCurrentCanvas = () => {
    return canvases.get(selectedObject.path);
}

const getCanvases = () => {
    return canvases;
}

const setCanvas = (key, value) => {
    return canvases.set(key, value);
}

const hasCanvas = (key) => {
    return canvases.has(key);
}

const deleteCanvas = (key) => {
    return canvases.delete(key);
}

const getAllCanvases = () => {
    return canvases;
}


const isNotEmpty = () => {
    return canvases.size > 0;
}


export default {
    getCanvas,
    getCurrentCanvas,
    getCanvases,
    getAllCanvases,
    setCanvas,
    deleteCanvas,
    hasCanvas,
    isNotEmpty,
    setSelectedObject,
    getSelectedPath,
    getSelectedObject
}
