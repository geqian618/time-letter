const bytenode = require('bytenode');
const path = require('path');
const fs = require('fs').promises;

// 配置：源文件路径和输出路径
const sourceFile = path.join(__dirname, '..', 'electron', 'main.js');
const outputFile = path.join(__dirname, '..', 'electron', 'main.jsc');

async function compileMain() {
    try {
        // 确保源文件存在
        await fs.access(sourceFile);

        console.log(`开始编译: ${sourceFile}`);

        // 使用 compileFile 并设置 electron: true
        await bytenode.compileFile({
            filename: sourceFile,
            output: outputFile,
            electron: true,           // 关键选项：告诉 bytenode 为 Electron 编译
            compileAsModule: true,     // 作为模块编译，这样可以使用 require 引入
            createLoader: true,        // 自动创建加载器文件
            loaderFilename: 'main-loader.js' // 指定加载器文件名
        });

        console.log(`编译成功!`);
        console.log(`字节码文件: ${outputFile}`);

        // 强烈建议：备份或删除原始源代码，以彻底保护源码
        // await fs.rename(sourceFile, `${sourceFile}.bak`);
        // console.log(`原始源码已备份为 ${sourceFile}.bak`);

    } catch (error) {
        console.error('编译失败:', error);
        process.exit(1);
    }
}

compileMain();
