import {reactive} from 'vue'

const canvases = reactive(new Map())

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
