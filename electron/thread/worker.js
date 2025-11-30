const imageEditor = require("../utils/image-editor");

module.exports = async (data) => {
    try {
        return await imageEditor.addBorderAndText(data);
    } catch (error) {
        throw error;
    }
};

