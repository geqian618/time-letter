const path = require('path');

const getResourcePath = () => {

    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'resources')
        : path.join(process.resourcesPath, 'resources')

}

const getFontPath = () => {
    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'fonts')
        : path.join(process.resourcesPath, 'fonts')

}

module.exports = {getResourcePath, getFontPath}
