const saveTemplates = (templates) => {
    window.localStorage.setItem('templates', JSON.stringify(templates))
}

const getTemplates = () => {
    const json = window.localStorage.getItem('templates');
    if (json === null || json === 'undefined') {
        return [];
    }
    try {
        return JSON.parse(json);
    } catch (e) {
        return [];
    }
}

const saveTextResources = (textResources) => {
    window.localStorage.setItem('textResources', JSON.stringify(textResources))
}

const getTextResources = () => {
    const json = window.localStorage.getItem('textResources');
    if (json === null || json === 'undefined') {
        return [];
    }
    try {
        return JSON.parse(json);
    } catch (e) {
        return [];
    }
}

const saveProjectSettings = (settings) => {
    window.localStorage.setItem('projectSettings', JSON.stringify(settings))
}


const getProjectSettings = () => {
    const json = window.localStorage.getItem('projectSettings');
    if (json === null || json === 'undefined') {
        return null;
    }
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}


export default {
    saveTemplates,
    getTemplates,
    saveTextResources,
    getTextResources,
    saveProjectSettings,
    getProjectSettings
}
