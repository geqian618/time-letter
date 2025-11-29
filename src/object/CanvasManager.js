import {ref} from 'vue'

const canvases = ref(new Map())

const selectedObject = ref({
    path: '',
    previewElement: null,
    previewElementList: [],
    draggableElement: null
});


const getSelectedObject = () => {
    return selectedObject.value
}

const getSelectedPath = () => {
    return selectedObject.value.path
}


const setSelectedObject = (newSelectedObject) => {
    selectedObject.value = {...selectedObject.value, ...newSelectedObject}
}

const getCanvas = (key) => {
    return canvases.value.get(key);
}

const getCurrentCanvas = () => {
    return canvases.value.get(selectedObject.value.path);
}

const getCanvases = () => {
    return canvases.value;
}

const setCanvas = (key, value) => {
    return canvases.value.set(key, value);
}

const hasCanvas = (key) => {
    return canvases.value.has(key);
}

const deleteCanvas = (key) => {
    return canvases.value.delete(key);
}

const getAvailableCanvases = (filterType) => {
    if (filterType === 0) {
        return canvases.value
    } else if (filterType === 1) {
        return new Map(Array.from(canvases.value).filter(([path, {metadata}]) => metadata.width >= metadata.height))
    } else {
        return new Map(Array.from(canvases.value).filter(([path, {metadata}]) => metadata.width < metadata.height))
    }
}

const getSettingsFromCurrentCanvas = (element) => {
    if (element) {
        if (element instanceof HTMLDivElement) {
            return getCanvas(selectedObject.value.path).settings.texts.get(element)
        }
        if (element instanceof HTMLImageElement) {
            return getCanvas(selectedObject.value.path).settings.images.get(element)
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
    return canvases.value.get(key).settings.texts;
}


const getImages = (key) => {
    return canvases.value.get(key).settings.images;
}

const clearTexts = (key) => {
    return canvases.value.get(key).settings.texts.clear()
}

const clearImages = (key) => {
    return canvases.value.get(key).settings.images.clear()
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
            getCanvas(selectedObject.value.path).settings.texts.delete(element)
        }
        if (element instanceof HTMLImageElement) {
            getCanvas(selectedObject.value.path).settings.images.delete(element)
        }
    }
}

const isNotEmpty = () => {
    return canvases.value.size > 0;
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
    getSettingsFromCurrentCanvas
}
