const imageEditor = require("../utils/image-editor");

module.exports = async (parameters) => {
    try {
        return await imageEditor.addBorderAndText(parameters);
    } catch (error) {
        // 错误会自动传递给线程池的调用方
        throw error;
    }
}


