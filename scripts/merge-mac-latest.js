// 合并两个 macOS 架构的 electron-updater 元数据。
//
// 背景：electron-builder 为每个 mac 构建各生成一份 latest-mac.yml，其中 files
// 只包含该架构的 zip/dmg。工作流让 mac-x64 与 mac-arm64 各自改名上传
// （latest-mac-x64.yml / latest-mac-arm64.yml），在发布前合并成唯一一份
// latest-mac.yml —— 否则同名文件在汇总时互相覆盖，只有一个架构能收到自动更新。
//
// 用法：node scripts/merge-mac-latest.js <artifactsDir>
'use strict'

const fs = require('fs')
const path = require('path')

const dir = path.resolve(process.argv[2] || 'artifacts')

/** 取出 yml 中 files: 列表的每一项（含缩进，可直接拼回原文） */
function extractFileItems(text) {
  const lines = text.split(/\r?\n/)
  const start = lines.findIndex((l) => /^files:\s*$/.test(l))
  if (start < 0) return []

  const items = []
  let current = null
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^\S/.test(line)) break // 下一个顶层键，列表结束
    if (/^\s*-\s/.test(line)) {
      if (current) items.push(current)
      current = [line]
    } else if (current) {
      current.push(line)
    }
  }
  if (current) items.push(current)
  return items.map((item) => item.join('\n'))
}

/** 从 files 列表项里取出 url，用于去重 */
function itemUrl(item) {
  const m = item.match(/^\s*-\s*url:\s*(\S+)/m)
  return m ? m[1] : null
}

function main() {
  if (!fs.existsSync(dir)) {
    console.log(`[merge-mac] 目录不存在，跳过：${dir}`)
    return
  }

  const candidates = fs
    .readdirSync(dir)
    .filter((f) => /^latest-mac-.+\.yml$/.test(f))
    .sort()
  if (candidates.length === 0) {
    console.log('[merge-mac] 未找到分架构的 latest-mac-*.yml，跳过')
    return
  }

  const docs = candidates.map((file) => ({
    file,
    text: fs.readFileSync(path.join(dir, file), 'utf-8')
  }))

  // 以 arm64 为基底（Apple Silicon 用户占多数），顶层 path/sha512 保留其指向
  const base = docs.find((d) => d.file.includes('arm64')) || docs[0]
  const baseItems = extractFileItems(base.text)
  const known = new Set(baseItems.map(itemUrl).filter(Boolean))

  const extra = []
  for (const doc of docs) {
    if (doc === base) continue
    for (const item of extractFileItems(doc.text)) {
      const url = itemUrl(item)
      if (!url || known.has(url)) continue
      known.add(url)
      extra.push(item)
    }
  }

  let merged = base.text
  if (extra.length > 0) {
    // 紧跟 files: 行插入其余架构条目，仍属于同一个列表
    merged = base.text.replace(/^files:\s*$/m, (line) => `${line}\n${extra.join('\n')}`)
  }
  if (!merged.endsWith('\n')) merged += '\n'

  const outFile = path.join(dir, 'latest-mac.yml')
  fs.writeFileSync(outFile, merged, 'utf-8')

  // 分架构文件不再作为发布资产上传
  for (const doc of docs) fs.rmSync(path.join(dir, doc.file), { force: true })

  const urls = extractFileItems(merged).map(itemUrl).filter(Boolean)
  console.log(`[merge-mac] 已合并 ${docs.length} 份元数据 -> latest-mac.yml`)
  for (const u of urls) console.log(`  - ${u}`)
}

try {
  main()
} catch (err) {
  // 合并失败不应阻断整个发布：其余平台产物仍然有效
  console.error('[merge-mac] 合并失败，已保留原始文件：', err && err.message)
  process.exitCode = 0
}
