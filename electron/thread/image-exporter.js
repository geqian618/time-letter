const path = require('path');
const Piscina = require('piscina');
const {dialog, app} = require('electron');
const os = require("os");

// 创建一个 SharedArrayBuffer 用于中断信号,  4字节，用于一个32位整数
const sab = new SharedArrayBuffer(4);
// 初始值为 0
const interrupt = new Int32Array(sab);
// 初始值为 0（未中断）
Atomics.store(interrupt, 0, 0);

const WORKER_PATH = path.join(app.getAppPath(), 'electron', 'thread', app.isPackaged ? 'worker-loader.js' : 'worker.js')

const exportFiles = async ({projectSettings, outputDirectory, settings}, progressCallback) => {

    // 根据设置创建线程池
    const maxThreads = projectSettings.performance.downloadThreads === -1 ? os.cpus().length : Math.max(1, projectSettings.performance.downloadThreads);

    // 创建线程池
    let threadPool = new Piscina({
        filename: WORKER_PATH,
        maxThreads,
        minThreads: 0,
        idleTimeout: 10000,
    });

    // 重置中断标志
    Atomics.store(interrupt, 0, 0);

    const total = settings.length;
    let completed = 0;
    let errors = 0;

    progressCallback = progressCallback || ((progress) => {
        console.log(`进度: ${progress.completed}/${progress.total} 错误: ${progress.errors}`);
    });

    // 并发控制 - 限制同时处理的任务数量
    const concurrency = maxThreads;

    const queue = [...settings];

    async function processNext() {
        if (Atomics.load(interrupt, 0) === 1 || queue.length === 0) {
            return;
        }
        const setting = queue.shift();
        try {
            await threadPool.run({projectSettings, outputDirectory, setting});
        } catch (err) {
            errors++;
            dialog.showErrorBox('文件读取异常', err.message)
            console.error(`处理图片 ${setting.path} 失败:`, err);
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

    // 导出完成后，销毁线程池
    await threadPool.destroy();

    threadPool = null;

    console.log('threadPool destroy...')

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

module.exports = {exportFiles, stopExportFiles}
