const bytenode = require('bytenode');
const glob = require('glob'); // 需要先安装: npm install glob
const path = require('path');

// 使用 glob 模式匹配所有需要编译的 JS 文件
const files = glob.sync('./electron/**/*.js'); // 例如，编译 src 目录下所有 JS

files.forEach(file => {

    // 指定输出路径，这里示例将 .jsc 文件输出到 dist 目录
    const output = path.join(file).replace(/\.js$/, '.jsc');

    console.log(`Compiling ${file} -> ${output}`);

    bytenode.compileFile({
        filename: file,
        output: output,
        electronPath: require('electron'),
        electron: true, // 关键！指定为 Electron 编译
        compileAsModule: true,

    }).then(() => {
        console.log(`Success: ${file}`);
    }).catch(err => {
        console.error(`Error compiling ${file}:`, err);
    });





});
