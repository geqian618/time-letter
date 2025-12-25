const path = require('path');
const {Piscina} = require('piscina');
const {dialog} = require('electron');
const os = require("os");

// 创建一个 SharedArrayBuffer 用于中断信号,  4字节，用于一个32位整数
const sab = new SharedArrayBuffer(4);
// 初始值为 0
const interrupt = new Int32Array(sab);
// 初始值为 0（未中断）
Atomics.store(interrupt, 0, 0);

let threadPool;


/**
 * 创建或重新创建线程池
 * @param {number} threads - 线程数，-1 表示使用 CPU 核心数
 */
const createThreadPool = async (threads) => {

    const maxThreads = threads === -1 ? os.cpus().length : Math.max(1, threads);

    // 如果线程池已存在且线程数相同，无需操作
    if (threadPool && maxThreads === threadPool.options.maxThreads) {
        return;
    }

    const oldThreadPool = threadPool;
    // 立即清空引用，避免竞态条件
    threadPool = null;

    // 先创建新线程池，再销毁旧的（确保服务连续性）
    threadPool = new Piscina({
        filename: path.resolve(__dirname, 'worker.js'),
        maxThreads,
        minThreads: 0,
        idleTimeout: 10000,
    });

    console.log(`Thread pool created with ${maxThreads} max threads`);

    // 异步销毁旧线程池
    if (oldThreadPool) {
        oldThreadPool.destroy().catch(error => {
            console.warn('Failed to destroy old thread pool:', error.message);
        });
    }
};

const exportFiles = async ({projectSettings, outputDirectory, settings}, progressCallback) => {

    // 重置中断标志
    Atomics.store(interrupt, 0, 0);

    const total = settings.length;
    let completed = 0;
    let errors = 0;

    progressCallback = progressCallback || ((progress) => {
        console.log(`进度: ${progress.completed}/${progress.total} 错误: ${progress.errors}`);
    });

    // 并发控制 - 限制同时处理的任务数量
    const concurrency = threadPool.maxThreads;

    const queue = [...settings];

    async function processNext() {
        if (Atomics.load(interrupt, 0) === 1 || queue.length === 0) {
            return;
        }

        const setting = queue.shift();
        const {imagePath, index, settings: {border, photograph, texts, images}} = setting;

        try {
            const params = {
                projectSettings,
                outputDirectory,
                imagePath,
                index,
                border,
                photograph,
                texts,
                images,
            };
            await threadPool.run(params);
        } catch (err) {
            errors++;
            dialog.showErrorBox('文件读取异常', err.message)
            console.error(`处理图片 ${imagePath} 失败:`, err);
        } finally {
            completed++;
            updateProgress();
            // 继续处理下一个
            if (queue.length > 0 && Atomics.load(interrupt, 0) === 0) {
                await processNext();
            }
        }
    }

    // 启动并发任务
    const workers = Array(Math.min(concurrency, settings.length))
        .fill()
        .map(() => processNext());

    await Promise.allSettled(workers);

    // 所有任务完成后，清理线程池
    // setTimeout(() => {
    //     if (threadPool) {
    //         threadPool.destroy();
    //     }
    // }, 10000);

    function updateProgress() {
        progressCallback({
            total,
            completed,
            errors,
            percentage: Atomics.load(interrupt, 0) === 0 ? Math.round((completed / total) * 100) : 0
        });
    }
};

const stopExportFiles = () => {
    // 重置中断标志为 0（未中断）
    Atomics.store(interrupt, 0, 1);
}

module.exports = {createThreadPool, exportFiles, stopExportFiles}
