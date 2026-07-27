import {reactive} from 'vue'
const canvases = new Map()

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

const getAvailableCanvases = (filterType) => {
    if (filterType === 0) {
        return new Map(canvases)
    } else if (filterType === 1) {
        return new Map(Array.from(canvases).filter(([path, {metadata}]) => metadata.width >= metadata.height))
    } else {
        return new Map(Array.from(canvases).filter(([path, {metadata}]) => metadata.width < metadata.height))
    }
}

const getSettingsFromCurrentCanvas = (element) => {
    if (element) {
        if (element instanceof HTMLDivElement) {
            return getCanvas(selectedObject.path).settings.texts.get(element)
        }
        if (element instanceof HTMLImageElement) {
            return getCanvas(selectedObject.path).settings.images.get(element)
        }
    }
    throw new Error('Invalid parameter')
}

const getSettings = (key, element) => {
    if (key && element) {
        if (element instanceof HTMLDivElement) {
            return getCanvas(key).settings.texts.get(element)
        }
        if (element instanceof HTMLImageElement) {
            return getCanvas(key).settings.images.get(element)
        }
    }
    throw new Error('Invalid parameter')
}

const getTexts = (key) => {
    return canvases.get(key).settings.texts;
}


const getImages = (key) => {
    return canvases.get(key).settings.images;
}

const clearTexts = (key) => {
    return canvases.get(key).settings.texts.clear()
}

const clearImages = (key) => {
    return canvases.get(key).settings.images.clear()
}


const deleteElement = (key, element) => {
    if (key && element) {
        if (element instanceof HTMLDivElement) {
            getCanvas(key).settings.texts.delete(element)
        }
        if (element instanceof HTMLImageElement) {
            getCanvas(key).settings.images.delete(element)
        }
    }
}

const deleteElementFromCurrentCanvas = (element) => {
    if (element) {
        if (element instanceof HTMLDivElement) {
            getCanvas(selectedObject.path).settings.texts.delete(element)
        }
        if (element instanceof HTMLImageElement) {
            getCanvas(selectedObject.path).settings.images.delete(element)
        }
    }
}

const isNotEmpty = () => {
    return canvases.size > 0;
}


export default {
    getCanvas,
    getCurrentCanvas,
    getCanvases,
    getAvailableCanvases,
    getTexts,
    getImages,
    getSettings,
    setCanvas,
    deleteCanvas,
    deleteElement,
    deleteElementFromCurrentCanvas,
    hasCanvas,
    isNotEmpty,
    clearTexts,
    clearImages,
    setSelectedObject,
    getSelectedPath,
    getSelectedObject,
    getSettingsFromCurrentCanvas,
}
