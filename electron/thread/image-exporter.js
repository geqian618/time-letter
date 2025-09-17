const path = require('path');
const {Piscina} = require('piscina');
const {dialog} = require('electron');
const os = require("os");

// 创建一个 SharedArrayBuffer 用于中断信号,  4字节，用于一个32位整数
const sab = new SharedArrayBuffer(4);
// 初始值为0
const interrupt = new Int32Array(sab);
// 初始值为0（未中断）
Atomics.store(interrupt, 0, 0);

let threadPool;


const createThreadPool = async (threads) => {
    if (threadPool) {
        await threadPool.destroy()
    }
    const maxThreads = threads === -1 ? os.cpus().length : threads;
    // 初始化线程池，指向工作线程脚本
    threadPool = new Piscina({
        filename: path.resolve(__dirname, 'worker.js'),
        maxThreads: maxThreads, // 设置最大线程数
        minThreads: 2, // 设置核心线程数（最小线程数）
        idleTimeout: 30000, // 线程空闲超时销毁时间（毫秒）
    });
    console.log('thread pool created, max threads: ' + maxThreads)
}


const exportImages = (dataList, progressCallback) => {
    // 重置中断标志为0（未中断）
    Atomics.store(interrupt, 0, 0);

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
            border,
            texts,
            images
        };

        options.interrupt = interrupt

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
        // 创建视图来访问共享内存
        const interruptView = new Int32Array(interrupt);
        progressCallback({
            total,
            completed,
            errors,
            percentage: Atomics.load(interruptView, 0) === 0 ? Math.round((completed / total) * 100) : 0
        });
    }
};

const stopSaveFiles = () => {
    // 重置中断标志为0（未中断）
    Atomics.store(interrupt, 0, 1);
}

module.exports = {createThreadPool, exportImages, stopSaveFiles}
