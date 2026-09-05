const bytenode = require('bytenode');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

// 主进程已被 scripts/bundle-main.js 整体打包为单个 bundle（输出到
// node_modules/.cache/electron-bundle/），这里只编译最终需要随包分发的
// 3 个字节码文件：
//   node_modules/.cache/electron-bundle/main.bundle.js     -> electron/main.jsc          （主进程整体逻辑）
//   node_modules/.cache/electron-bundle/worker.bundle.js -> electron/thread/worker.jsc（导出子进程整体逻辑）
//   electron/preload/index.js                              -> electron/preload/index.jsc（渲染进程 preload）
const TARGETS = [
    ['node_modules/.cache/electron-bundle/main.bundle.js', 'electron/main.jsc'],
    ['node_modules/.cache/electron-bundle/worker.bundle.js', 'electron/thread/worker.jsc'],
    ['electron/preload/index.js', 'electron/preload/index.jsc']
];

(async () => {
    // 清理旧的逐文件 .jsc 产物，确保 asar 中只保留上面 3 个字节码文件
    const stale = glob.sync('./electron/**/*.jsc');
    for (const file of stale) {
        console.log('Removing stale', file);
        fs.rmSync(file, { force: true });
    }

    const CONCURRENCY = 2;
    let index = 0;
    const errors = [];

    const worker = async () => {
        while (index < TARGETS.length) {
            const [input, output] = TARGETS[index++];
            try {
                console.log(`Compiling ${input} -> ${output}`);
                await bytenode.compileFile({
                    filename: input,
                    output: output,
                    electronPath: require('electron'),
                    electron: true, // 指定为 Electron 环境编译，保证字节码 ABI 一致
                    compileAsModule: true,
                });
                console.log(`Success: ${output}`);
            } catch (err) {
                errors.push({ input, err });
            }
        }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    errors.forEach(({ input, err }) => console.error(`Error compiling ${input}:`, err));
    console.log(`\\nCompiled ${TARGETS.length - errors.length}/${TARGETS.length} bundles.`);
    if (errors.length > 0) {
        process.exitCode = 1;
    }
})();
