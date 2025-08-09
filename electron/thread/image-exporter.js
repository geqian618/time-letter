const path = require('path');
const {Piscina} = require('piscina');

// 初始化线程池，指向工作线程脚本
const threadPool = new Piscina({
    filename: path.resolve(__dirname, 'worker.js'),
    maxThreads: 4, // 最大线程数（默认=CPU核心数）
    idleTimeout: 30000, // 线程空闲超时销毁时间（毫秒）
});


const exportImages = (dataList) => {
    for (let data of dataList) {
        const {outputDirectory, path, settings: {border, texts, images}} = data;
        const options = {
            inputPath: path,      // 原始图片路径
            outputDirectory: outputDirectory,     // 输出图片路径
            border: {...border, percentage: true},
            texts,
            images
        }
        threadPool.run(options).catch(err => {
            console.error(`处理图片 ${file} 失败:`, err);
        });
    }
}

module.exports = {exportImages}
