const imageEditor = require("../utils/image-editor");

module.exports = async (options) => {
    try {
        return imageEditor.addBorderAndText(options);
    } catch (error) {
        // 错误会自动传递给线程池的调用方
        throw error;
    }
}


