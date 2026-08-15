// electron-builder-encryptor 配置
// 该文件在打包时（afterPack）被 electron-builder-encryptor 读取并编译：
//   - 渲染进程（dist/）会被 AES 加密打包为 resources/renderer.pkg
//   - 主进程入口（electron/main-loader.js）会被编译为 bytenode 字节码 main-c.jsc
// 运行时由注入的 preload 辅助模块解密并通过自定义协议 myclient:// 加载渲染进程。
import { defineConfig } from 'electron-builder-encryptor'

export default defineConfig({
  /**
   * 加密密钥：用于 AES-256-CBC 加密渲染进程包（renderer.pkg），
   * 以及 app.asar 的完整性校验（app.yml）。请妥善保管，勿泄露。
   */
  key: '171b3a3347ab11f40c1b64e6b36af2c5',

  /**
   * 渲染进程自定义协议 scheme（生产环境加载地址：myclient://apps/index.html）
   * @default 'myclient'
   */
  protocol: 'myclient',

  /**
   * 渲染进程 preload 脚本（相对主进程入口目录 electron/）。
   * 本项目 preload 已通过 scripts/compile.js 编译为 .jsc 字节码保护，
   * 因此不在此重复交给 encryptor 编译（默认 preload.js 在 electron/ 下不存在，跳过）。
   */
  preload: 'preload/index',

  renderer: {
    /**
     * 渲染进程目录（相对主进程入口目录 electron/）。
     * vite 构建产物位于项目根目录 dist/，即 electron/ 的上一级。
     */
    entry: '../dist',
    /**
     * 加密后的渲染进程包输出位置（相对 win-unpacked 程序目录），
     * 最终位于 resources/renderer.pkg，运行时由 myclient:// 协议解密加载。
     * @default 'resources/renderer.pkg'
     */
    output: 'resources/renderer.pkg'
  }
})
