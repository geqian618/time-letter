// 将主进程源码整体打包为单个 bundle（供 bytenode 编译为单个 .jsc 字节码），
// 实现“主进程只保留一个字节码文件”的打包目标：
//   electron/main.js           -> node_modules/.cache/electron-bundle/main.bundle.js
//       （含 components/utils/runtime/constant/thread 等全部内部模块）
//   electron/thread/worker.js -> node_modules/.cache/electron-bundle/worker.bundle.js
//       （导出子进程入口，含 canvas/NodeCanvasEditor、utils/ImageMetadataHelper）
//
// 加密配置（key / protocol / renderer.output）从项目根 encryptor.config.js 读取，
// 通过 esbuild define 注入到 main 包（renderer-loader 内使用），
// 密钥只需在 encryptor.config.js 维护一份。
'use strict'

const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')

const CACHE_DIR = path.join('node_modules', '.cache', 'electron-bundle')
const MAIN_BUNDLE = path.join(CACHE_DIR, 'main.bundle.js')
const WORKER_BUNDLE = path.join(CACHE_DIR, 'worker.bundle.js')

function loadEncryptorConfig() {
  // Node >= 22.12 可直接 require(ESM)；失败则退回 esbuild 转译后加载
  try {
    const mod = require('../encryptor.config.js')
    const cfg = mod.default || mod
    if (cfg && cfg.key) return cfg
  } catch (e) {
    // ignore, fallback below
  }
  const out = path.join(CACHE_DIR, 'encryptor.config.cjs')
  esbuild.buildSync({
    entryPoints: ['encryptor.config.js'],
    outfile: out,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    logLevel: 'silent'
  })
  const mod = require(out)
  const cfg = mod.default || mod
  if (!cfg || !cfg.key) {
    throw new Error('[bundle] 无法从 encryptor.config.js 读取 key，请检查该文件')
  }
  return cfg
}

async function main() {
  fs.rmSync(CACHE_DIR, { recursive: true, force: true })
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  const cfg = loadEncryptorConfig()

  await esbuild.build({
    entryPoints: ['electron/main.js'],
    outfile: MAIN_BUNDLE,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external', // node_modules 与内置模块不打包
    target: 'node18',
    sourcemap: false,
    minify: false,
    logLevel: 'warning',
    define: {
      __ENCRYPTOR_KEY__: JSON.stringify(cfg.key),
      __ENCRYPTOR_PROTOCOL__: JSON.stringify(cfg.protocol || 'myclient'),
      __ENCRYPTOR_PKG_PATH__: JSON.stringify((cfg.renderer && cfg.renderer.output) || 'resources/renderer.pkg')
    }
  })

  await esbuild.build({
    entryPoints: ['electron/thread/worker.js'],
    outfile: WORKER_BUNDLE,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    target: 'node18',
    sourcemap: false,
    minify: false,
    logLevel: 'warning'
  })

  console.log(`[bundle] ${MAIN_BUNDLE} + ${WORKER_BUNDLE} generated (config injected)`)
}

main().catch((err) => {
  console.error('[bundle] failed:', err)
  process.exit(1)
})
