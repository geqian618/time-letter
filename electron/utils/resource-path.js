const path = require('path');

const getResourcePath = () => {

    return process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'resources')
        : path.join(process.resourcesPath, 'resources')

}

module.exports = {getResourcePath}
