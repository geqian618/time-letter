// electron-builder afterPack 钩子：集成 electron-builder-encryptor 源码保护。
//
// 1. 清理上次打包遗留的临时目录，避免污染本次 app.asar。
// 2. 执行 electron-builder-encryptor 的 run(context)：
//      - 渲染进程（dist/）被 AES-256-CBC 加密压缩为 resources/renderer.pkg 并从 asar 移除；
//      - 生成 resources/app.yml（app.asar 完整性校验）；
//      - 主进程入口被编译为 main-c.jsc（其中注入了构建机绝对路径的运行时辅助模块）。
// 3. 回退主进程入口链：把 asar 中的 electron/main-loader.js 恢复为项目源文件，并移除
//    electron/main-c.jsc。原因：encryptor 注入的辅助模块通过“构建机绝对路径”require
//    node_modules/electron-builder-encryptor/dist/preload.js，且该模块还依赖
//    yaml/adm-zip/mime 等构建机 node_modules，导致打包产物离开构建机即启动崩溃。
//    渲染进程的加载改由应用自身（electron/runtime/renderer-loader.jsc 字节码）完成，
//    主进程保护由 scripts/compile.js 生成的 .jsc 字节码承担，产物可任意机器运行。
// 4. 因 asar 内容发生变化，按最终 app.asar 重新生成 resources/app.yml。
'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/** 与 electron-builder-encryptor 的 md5Salt 完全一致（用于重新生成 app.yml 的 md5 字段） */
function md5Salt(key, re = 0) {
  key = key.slice(0, key.length / 6) + key + key.slice(key.length / 4)
  if (key.length <= 128 || (key.length % 2 === 0 && re <= 3)) {
    key = md5Salt(key, ++re)
  }
  const res = Buffer.from(key, 'utf8')
  const privateKey = key.length * (955 % 9527) + 996007
  for (let index = 0; index < res.length; index++) {
    res[index] = res[index] ^ ((privateKey >> 20) & 255)
  }
  return crypto.createHash('md5').update(res).digest('hex')
}

function encryptMd5(str, key) {
  return crypto.createHash('md5').update(str + md5Salt(key)).digest('hex')
}

module.exports = async function afterPack(context) {
  const projectDir = context.packager?.projectDir || process.cwd()
  if (!context.appOutDir) {
    console.warn('[encryptor-afterpack] warning: no appOutDir, skip')
    return
  }
  // macOS 布局：asar / renderer.pkg / app.yml 位于 <Product>.app/Contents/Resources，
  // 与 electron-builder-encryptor 内部的 appOutDir 修正保持一致；
  // Windows / Linux 资源目录为可执行文件同级 resources/
  const isMac = context.electronPlatformName === 'darwin' || context.electronPlatformName === 'mas'
  const appOutDir = isMac
    ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents')
    : context.appOutDir
  const resourcesDir = path.join(appOutDir, 'resources')
  const appAsarPath = path.join(resourcesDir, 'app.asar')

  // 1. 清理 encryptor 的临时目录（appOutDir 的兄弟目录）
  fs.rmSync(path.join(appOutDir, '..', 'app'), { recursive: true, force: true })

  // 2. 执行 electron-builder-encryptor
  const { run } = require('electron-builder-encryptor')
  await run(context)

  // 3. 回退主进程入口链（移除构建机绝对路径依赖）
  const asar = require('asar')
  // 关键：asar 模块按归档路径缓存文件系统头。encryptor 在 run() 中多次重写
  // app.asar，缓存里仍是旧头，直接 extractAll 会按旧偏移读取新文件导致内容错位
  // （package.json 等条目内容全部错乱）。必须先清除缓存再提取。
  asar.uncache(appAsarPath)
  asar.uncacheAll()
  const originalLoader = fs.readFileSync(path.join(projectDir, 'electron', 'main-loader.js'), 'utf-8')
  // 临时修复目录放在包外（context.appOutDir 的兄弟目录），避免污染 .app 包体
  const fixDir = path.join(context.appOutDir, '..', 'app-fix')
  fs.rmSync(fixDir, { recursive: true, force: true })
  await asar.extractAll(appAsarPath, fixDir)
  fs.writeFileSync(path.join(fixDir, 'electron', 'main-loader.js'), originalLoader, 'utf-8')
  fs.rmSync(path.join(fixDir, 'electron', 'main-c.jsc'), { force: true })
  // 关键：electron-builder 会把含原生二进制的包智能解包到 app.asar.unpacked
  // （当前项目为 @img（sharp 的 dll/.node）与 exiftool-vendored.*）。
  // exiftool-vendored 为跨平台分发：Windows 是 exiftool-vendored.exe 包，
  // macOS / Linux 是 exiftool-vendored.mac-*/.linux-*/.pl 包，必须整体解包，
  // 否则可执行文件被打进 asar 内无法 spawn（如 exiftool 启动失败）。
  // 重打包时必须保留同样的 unpack 规则，否则 .node/.dll 被打进 asar 内，
  // 运行时 dlopen 失败（如 sharp 报 "Could not load the sharp module"）。
  await asar.createPackageWithOptions(fixDir, appAsarPath, {
    unpack: '**/node_modules/{@img,exiftool-vendored.*}/**'
  })
  fs.rmSync(fixDir, { recursive: true, force: true })
  console.log('[encryptor-afterpack] main-loader.js restored, main-c.jsc removed (unpack preserved)')

  // 4. 重新生成 resources/app.yml（按最终 app.asar 计算）
  const cfgMod = require(path.join(projectDir, 'node_modules', '.electron-builder-encryptor', 'encryptor.config.js'))
  const cfg = cfgMod.default || cfgMod
  const key = cfg.key
  const appPackage = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf-8'))
  const fileMd5 = crypto.createHash('md5').update(fs.readFileSync(appAsarPath)).digest('hex')
  const yamlData = [
    `name: ${appPackage.name}`,
    `version: ${appPackage.version}`,
    `md5: ${encryptMd5(fileMd5, key)}`,
    `file_md5: ${fileMd5}`,
    ''
  ].join('\n')
  fs.writeFileSync(path.join(resourcesDir, 'app.yml'), yamlData, 'utf-8')
  console.log('[encryptor-afterpack] app.yml regenerated for final app.asar')
}
