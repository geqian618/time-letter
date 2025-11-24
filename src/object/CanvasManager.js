import {ref} from 'vue'

const canvases = ref(new Map())

const getCanvas = (key) => {
    return canvases.value.get(key);
}

const getCanvases = () => {
    return canvases.value;
}

const getTextSettings = (key, element) => {
    return canvases.value.get(key).settings.texts.get(element);
}

const getTexts = (key) => {
    return canvases.value.get(key).settings.texts;
}

const getImageSettings = (key, element) => {
    return canvases.value.get(key).settings.images.get(element);
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

const deleteCanvas = (key) => {
    return canvases.value.delete(key);
}

const setCanvas = (key, value) => {
    return canvases.value.set(key, value);
}

const hasCanvas = (key) => {
    return canvases.value.has(key);
}

const isNotEmpty = () => {
    return canvases.value.size > 0;
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

export default {
    getCanvas,
    getCanvases,
    getAvailableCanvases,
    getTexts,
    getImages,
    getImageSettings,
    getTextSettings,
    deleteCanvas,
    setCanvas,
    hasCanvas,
    isNotEmpty,
    clearTexts,
    clearImages
}
