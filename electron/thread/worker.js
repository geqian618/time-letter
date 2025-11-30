const imageEditor = require("../utils/image-editor");

module.exports = async (data) => {
    try {
        return await imageEditor.addBorderAndText(data);
    } catch (error) {
        throw error;
    } finally {
        // 显式清理大对象引用
        for (let key in data) {
            if (data[key] && typeof data[key] === 'object') {
                data[key] = null;
            }
        }
    }
};

