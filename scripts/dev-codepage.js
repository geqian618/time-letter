// 开发环境控制台 UTF-8：Windows 控制台默认 GBK 代码页，切换到 65001 保证
// 主进程中文日志不乱码；macOS / Linux 终端默认 UTF-8，无需处理。
// 原来 chcp 65001 直接写在 npm scripts 里，非 Windows 平台没有 chcp 命令会导致启动中断。
'use strict'

if (process.platform === 'win32') {
    try {
        require('child_process').spawnSync('chcp', ['65001'], {stdio: 'inherit', shell: true})
    } catch (e) {
        // 切换代码页失败不阻塞开发启动
    }
}
process.exit(0)
