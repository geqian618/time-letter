const saveTemplates = (templates) => {
    window.localStorage.setItem('templates', JSON.stringify(templates))
}

const getTemplates = () => {
    try {
        const json = window.localStorage.getItem('templates');
        if (json === null || json === 'undefined') {
            return null;
        }
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

const saveTextLabels = (textLabels) => {
    window.localStorage.setItem('textLabels', JSON.stringify(textLabels))
}

const getTextLabels = () => {
    try {
        const json = window.localStorage.getItem('textLabels');
        if (json === null || json === 'undefined') {
            return null;
        }
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

const saveProjectSettings = (settings) => {
    window.localStorage.setItem('projectSettings', JSON.stringify(settings))
}


const getProjectSettings = () => {
    try {
        const json = window.localStorage.getItem('projectSettings');
        if (json === null || json === 'undefined') {
            return null;
        }
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}


export default {
    saveTemplates,
    getTemplates,
    saveTextLabels,
    getTextLabels,
    saveProjectSettings,
    getProjectSettings
}
