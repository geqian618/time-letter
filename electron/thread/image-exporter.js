const path = require('path');
const {Piscina} = require('piscina');
const {dialog} = require('electron');

// 初始化线程池，指向工作线程脚本
const threadPool = new Piscina({
    filename: path.resolve(__dirname, 'worker.js'),
    // maxThreads: 4, // 最大线程数（默认=CPU核心数）
    idleTimeout: 30000, // 线程空闲超时销毁时间（毫秒）
});


const exportImages = (dataList, progressCallback) => {
    const total = dataList.length;
    let completed = 0;
    let errors = 0;
    // 如果没有回调则使用默认的进度打印函数
    progressCallback = progressCallback || ((progress) => {
        console.log(`进度: ${progress.completed}/${progress.total} 错误: ${progress.errors}`);
    });

    for (let data of dataList) {

        const {outputDirectory, path, projectSettings, settings: {border, texts, images}} = data;
        const options = {
            inputPath: path,
            projectSettings,
            outputDirectory,
            border: {...border, percentage: true},
            texts,
            images
        };

        // 执行任务并更新进度
        threadPool.run(options)
            .then(() => {
                completed++;
                updateProgress();
            }).catch(err => {
            completed++;
            errors++;
            updateProgress();
            dialog.showErrorBox('文件读取异常', err.message)
            console.error(`处理图片 ${path} 失败:`, err);
        });
    }

    // 进度更新函数
    function updateProgress() {
        progressCallback({
            total,
            completed,
            errors,
            percentage: Math.round((completed / total) * 100)
        });
    }
};

module.exports = {exportImages}
