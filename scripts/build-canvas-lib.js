// 服务端渲染编辑器构建：将 src/canvas（单一来源，ESM）打包为 CJS 单文件产物
// electron/canvas/NodeCanvasEditor.js，供 electron/thread/worker.js require。
// 必须生成 CJS 的原因：Electron 22 的 Node 16 不支持 require(ESM)，且开发态
// utilityProcess 直接 fork worker.js 源文件，产物必须落盘在 require 路径上。
// 由 bundle:main 在 worker 打包前自动调用（worker.bundle 会内联本产物），
// 也可单独运行 `npm run canvas:lib` 再生。
'use strict'

const esbuild = require('esbuild')

const OUT_FILE = 'electron/canvas/NodeCanvasEditor.js'

async function buildCanvasLib() {
  await esbuild.build({
    entryPoints: ['src/canvas/CanvasEditor.js'],
    outfile: OUT_FILE,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external', // node_modules 不打包（@napi-rs/canvas 运行时 require）
    target: 'node18',
    sourcemap: false,
    minify: false,
    logLevel: 'warning',
    banner: {js: '// 本文件由 scripts/build-canvas-lib.js 从 src/canvas 自动生成，请勿手工修改\n'}
  })
  console.log(`[canvas-lib] ${OUT_FILE} generated`)
}

module.exports = {buildCanvasLib}

if (require.main === module) {
  buildCanvasLib().catch((err) => {
    console.error('[canvas-lib] failed:', err)
    process.exit(1)
  })
}
