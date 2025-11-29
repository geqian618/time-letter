const saveTemplates = (templates) => {
    window.localStorage.setItem('templates', JSON.stringify(templates))
}

const getTemplates = () => {
    const json = window.localStorage.getItem('templates');
    return json ? JSON.parse(json) : []
}

const saveTextLabels = (textLabels) => {
    window.localStorage.setItem('textLabels', JSON.stringify(textLabels.value))
}

const getTextLabels = () => {
    const json = window.localStorage.getItem('textLabels');
    return json ? JSON.parse(json) : []
}

const saveProjectSettings = (settings) => {
    window.localStorage.setItem('projectSettings', JSON.stringify(settings.value))
}


const getProjectSettings = () => {
    const json = window.localStorage.getItem('projectSettings');
    return json ? JSON.parse(json) : null
}


export default {
    saveTemplates,
    getTemplates,
    saveTextLabels,
    getTextLabels,
    saveProjectSettings,
    getProjectSettings
}
