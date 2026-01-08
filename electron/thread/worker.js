const canvasEditor = require("../utils/canvas-editor");

module.exports = async (data) => {
    try {
        return await canvasEditor.draw(data);
    } catch (error) {
        throw error;
    }
};

