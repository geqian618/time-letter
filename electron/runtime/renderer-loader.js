'use strict'

/**
 * 打包后渲染进程加载器。
 * 本模块自身会被 scripts/compile.js 编译为 .jsc 字节码，随主进程一起受保护。
 *
 * 职责：
 *  1. registerPrivilegedSchemes() —— 在 app ready 之前注册 myclient:// 自定义协议权限；
 *  2. verifyAsarIntegrity()        —— 校验 resources/app.asar 与 resources/app.yml 的 md5，检测到篡改立即退出；
 *  3. registerRendererProtocol()   —— 解密 resources/renderer.pkg（AES-256-CBC + zip），并通过 myclient:// 协议提供渲染进程资源。
 *
 * 加密参数（key / protocol / renderer.output）由 scripts/bundle-main.js 构建时
 * 从项目根 encryptor.config.js 注入（esbuild define），密钥只需维护一份。
 */

const crypto = require('crypto')
const fs = require('fs')
// Electron 内置的 original-fs 是未被 asar 补丁修改的原始 fs，
// 读取 app.asar 文件本身（计算 MD5 校验）必须用它，否则会被当成归档解析。
const originalFs = require('original-fs')
const path = require('path')
const AdmZip = require('adm-zip')
const { app, dialog, protocol } = require('electron')

// 加密参数：由 scripts/bundle-main.js 通过 esbuild define 注入（encryptor.config.js 为唯一来源）。
// typeof 兜底仅为避免未打包场景（直接 require 本文件）下报错。
const RENDERER_KEY = typeof __ENCRYPTOR_KEY__ !== 'undefined' ? __ENCRYPTOR_KEY__ : ''
const PROTOCOL = typeof __ENCRYPTOR_PROTOCOL__ !== 'undefined' ? __ENCRYPTOR_PROTOCOL__ : 'myclient'
const PKG_RELATIVE_PATH = typeof __ENCRYPTOR_PKG_PATH__ !== 'undefined' ? __ENCRYPTOR_PKG_PATH__ : 'resources/renderer.pkg'

const MIME_TYPES = {
  html: 'text/html', htm: 'text/html',
  js: 'application/javascript', mjs: 'application/javascript',
  css: 'text/css', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon',
  json: 'application/json', txt: 'text/plain', wasm: 'application/wasm',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  mp3: 'audio/mpeg', mp4: 'video/mp4'
}

/**
 * 与 electron-builder-encryptor 的 md5Salt 完全一致（用于派生 AES 密钥）。
 */
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
  const hash = crypto.createHash('md5')
  hash.update(res)
  return hash.digest('hex')
}

/**
 * 解密 renderer.pkg：前 16 字节为 IV，之后为 AES-256-CBC 密文（内容是 zip）。
 */
function decryptPkg(pkgPath) {
  const buf = fs.readFileSync(pkgPath)
  const iv = buf.subarray(0, 16)
  const encrypted = buf.subarray(16)
  const decipher = crypto.createDecipheriv('aes-256-cbc', md5Salt(RENDERER_KEY), iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

/**
 * 将解密后的 zip 解压为 内存 Map（entryName -> Buffer）。
 */
function buildResourcesMap(pkgPath) {
  const zip = new AdmZip(decryptPkg(pkgPath))
  const map = new Map()
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory === false) {
      map.set(entry.entryName.toString().replaceAll('\\', '/'), entry.getData())
    }
  }
  return map
}

let resourcesMap = null

/**
 * 注册自定义协议 scheme 权限（必须在 app ready 之前调用）。
 */
function registerPrivilegedSchemes() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        bypassCSP: true,
        allowServiceWorkers: true,
        supportFetchAPI: true,
        corsEnabled: true,
        stream: true
      }
    }
  ])
}

/**
 * 解密 renderer.pkg 并注册 myclient:// 协议
 * （在 app ready 之后、创建窗口加载渲染进程之前调用）。
 */
function registerRendererProtocol() {
  if (resourcesMap) return
  const execDir = path.dirname(process.execPath)
  const pkgPath = path.join(execDir, PKG_RELATIVE_PATH)
  resourcesMap = buildResourcesMap(pkgPath)

  protocol.registerBufferProtocol(PROTOCOL, (request, callback) => {
    try {
      let url = request.url.replace(`${PROTOCOL}://apps/`, '')
      url = url.replaceAll('\\', '/')
      url = decodeURIComponent(url)
      url = url.split(/#|\?/)[0]
      const data = resourcesMap.get(url)
      const ext = path.extname(url).slice(1).toLowerCase()
      callback({
        data,
        mimeType: (ext && MIME_TYPES[ext]) || undefined
      })
    } catch (error) {
      console.error('[renderer-loader] 协议处理失败:', error)
      callback({ data: undefined })
    }
  })
  console.log(`[renderer-loader] ${PROTOCOL}:// 协议已注册，共 ${resourcesMap.size} 个资源`)
}

/**
 * 校验 app.asar 是否被篡改：与 resources/app.yml 中的 file_md5 比对，
 * 不一致则弹窗并退出。
 */
function verifyAsarIntegrity() {
  const execDir = path.dirname(process.execPath)
  const asarPath = path.join(execDir, 'resources', 'app.asar')
  const ymlPath = path.join(execDir, 'resources', 'app.yml')
  let expected = null
  try {
    const text = fs.readFileSync(ymlPath, 'utf-8')
    const m = text.match(/file_md5:\s*([0-9a-f]{32})/i)
    expected = m ? m[1] : null
  } catch (e) {
    // app.yml 缺失时不阻塞启动
  }
  if (!expected) return
  const actual = crypto.createHash('md5').update(originalFs.readFileSync(asarPath)).digest('hex')
  if (actual !== expected) {
    console.error('[renderer-loader] app.asar 完整性校验失败，程序即将退出')
    dialog.showErrorBox('程序已被篡改', '检测到程序文件被修改，程序即将退出！')
    app.quit()
  } else {
    console.log('[renderer-loader] app.asar 完整性校验通过')
  }
}

module.exports = { registerPrivilegedSchemes, registerRendererProtocol, verifyAsarIntegrity }
