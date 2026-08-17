const path = require('path');
const Piscina = require('piscina');
const {dialog, app} = require('electron');
const os = require('os');

const sab = new SharedArrayBuffer(4);
const interrupt = new Int32Array(sab);
Atomics.store(interrupt, 0, 0);

const WORKER_PATH = path.join(
    app.getAppPath(),
    'electron',
    'thread',
    app.isPackaged ? 'worker-loader.js' : 'worker.js'
);

const exportFiles = async ({projectSettings, outputDirectory, settings}, progressCallback) => {

    const maxThreads = projectSettings.performance.downloadThreads === -1
        ? os.cpus().length
        : Math.max(1, projectSettings.performance.downloadThreads);

    const reportProgress = typeof progressCallback === 'function'
        ? progressCallback
        : (p) => console.log(`进度: ${p.completed}/${p.total} 错误: ${p.errors}`);

    const threadPool = new Piscina({
        filename: WORKER_PATH,
        maxThreads,
        minThreads: 0,
        idleTimeout: 10000,
    });

    Atomics.store(interrupt, 0, 0);

    const total = settings.length;
    let completed = 0;
    let errors = 0;
    let nextIndex = 0;
    const errorMessages = [];

    function updateProgress() {
        reportProgress({
            total,
            completed,
            errors,
            percentage: Atomics.load(interrupt, 0) === 0
                ? Math.round((completed / total) * 100)
                : 0,
        });
    }

    async function workerLoop() {
        while (nextIndex < settings.length && Atomics.load(interrupt, 0) === 0) {
            const setting = settings[nextIndex++];
            try {
                await threadPool.run({projectSettings, outputDirectory, setting});
            } catch (err) {
                errors++;
                errorMessages.push({path: setting.path, message: err.message});
                console.error(`处理图片 ${setting.path} 失败:`, err);
            } finally {
                completed++;
                updateProgress();
            }
        }
    }

    try {
        const concurrency = Math.min(maxThreads, settings.length);
        const workers = Array(concurrency).fill().map(() => workerLoop());
        await Promise.allSettled(workers);
    } finally {
        await threadPool.destroy();
        console.log('threadPool destroy...');
    }

    if (errorMessages.length > 0) {
        const summary = errorMessages
            .slice(0, 10)
            .map((e) => `[${e.path}] ${e.message}`)
            .join('\n');
        const extra = errorMessages.length > 10
            ? `\n...及其他 ${errorMessages.length - 10} 个错误`
            : '';
        dialog.showErrorBox('文件读取异常', `${summary}${extra}`);
    }
};

const stopExportFiles = () => {
    Atomics.store(interrupt, 0, 1);
};

module.exports = {exportFiles, stopExportFiles};
