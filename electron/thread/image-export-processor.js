const path = require('path');
const {dialog, app, utilityProcess} = require('electron');
const os = require('os');
const {getFontPath} = require('../utils/path-helper');

// 中断标志：stopExportFiles 置 true，exportFiles 开头复位为 false。
let interrupt = false;

// 导出统一放到独立子进程（utilityProcess）中执行：@napi-rs/canvas 的原生内存
// （解码图、Skia surface）峰值只出现在子进程，主进程不再参与渲染。此前用 Piscina
// 线程池时，这些原生内存计入主进程，Windows 对已释放的堆页面常不退还提交内存，
// 表现为导出 200+ 张后任务管理器中主进程私有内存停留在 1GB+ 不回落。
// 每批导出结束 kill 全部子进程，其全部内存由操作系统直接回收。
const CHILD_PATH = path.join(
    app.getAppPath(),
    'electron',
    'thread',
    app.isPackaged ? 'worker-loader.js' : 'worker.js'
);

const exportFiles = async ({projectSettings, outputDirectory, settings}, progressCallback) => {

    interrupt = false;

    const maxThreads = projectSettings.performance.downloadThreads === -1
        ? os.cpus().length
        : Math.max(1, projectSettings.performance.downloadThreads);

    const reportProgress = typeof progressCallback === 'function'
        ? progressCallback
        : (p) => console.log(`进度: ${p.completed}/${p.total} 错误: ${p.errors}`);

    const total = settings.length;
    const concurrency = Math.min(Math.max(1, maxThreads), Math.max(1, total));

    let completed = 0;
    let errors = 0;
    let nextIndex = 0;
    const errorMessages = [];

    function updateProgress() {
        reportProgress({
            total,
            completed,
            errors,
            percentage: !interrupt ? Math.round((completed / total) * 100) : 0,
        });
    }

    let taskSeq = 0;
    const pending = new Map();

    function spawnChild() {
        const child = utilityProcess.fork(CHILD_PATH, [], {
            serviceName: 'time-letter-export',
            stdio: 'inherit',
            // 自定义字体目录：GlobalFonts 是进程内字体库，主进程注册的自定义字体对子进程
            // 不可见，fork 时经环境变量传给子进程，由子进程启动时自行扫描注册
            env: {...process.env, TIME_LETTER_FONT_DIR: getFontPath()},
        });
        child.on('message', (msg) => {
            if (!msg || msg.type !== 'done') return;
            const entry = pending.get(msg.taskId);
            if (!entry) return;
            pending.delete(msg.taskId);
            if (msg.error) entry.reject(new Error(msg.error));
            else entry.resolve(msg.result);
        });
        return child;
    }

    function runTask(child, task) {
        const taskId = ++taskSeq;
        return new Promise((resolve, reject) => {
            pending.set(taskId, {resolve, reject});
            child.postMessage({type: 'task', taskId, task});
        });
    }

    async function childLoop(child) {
        while (nextIndex < settings.length && !interrupt) {
            const setting = settings[nextIndex++];
            try {
                await runTask(child, {projectSettings, outputDirectory, setting});
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

    const children = [];

    try {
        for (let i = 0; i < concurrency; i++) {
            const child = spawnChild();
            // 子进程意外退出：让该进程挂起的任务立即失败，任务循环随之结束
            child.on('exit', () => {
                for (const [, entry] of pending) entry.reject(new Error('导出子进程意外退出'));
                pending.clear();
            });
            children.push(child);
        }
        await Promise.allSettled(children.map((child) => childLoop(child)));
    } finally {
        pending.clear();
        for (const child of children) {
            try {
                child.kill();
            } catch (err) {
                console.error('导出子进程关闭失败:', err);
            }
        }
        console.log('export children destroyed...');
    }

    if (errorMessages.length > 0) {
        const summary = errorMessages.slice(0, 10)
            .map((e) => `[${e.path}] ${e.message}`)
            .join('\n');
        const extra = errorMessages.length > 10
            ? `\n...及其他 ${errorMessages.length - 10} 个错误`
            : '';
        dialog.showErrorBox('文件读取异常', `${summary}${extra}`);
    }
};

const stopExportFiles = () => {
    interrupt = true;
};

module.exports = {exportFiles, stopExportFiles};
