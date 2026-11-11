// 从 README.md 的「更新日志」提取指定版本的段落，作为 GitHub Release 正文。
//
// 背景：本项目直接向 master 推送、不走 PR，GitHub 自动生成的 release notes
// 抓不到任何变更条目（只剩一个 Full Changelog 链接）。更新日志统一维护在
// README.md，发布时由本脚本转成 Release 正文，避免两处各写一份。
//
// 用法：node scripts/extract-changelog.js <tag> [输出文件]
//   tag 形如 v2.0.2；输出文件默认 release-body.md
'use strict'

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const projectDir = path.resolve(__dirname, '..')
const tag = (process.argv[2] || '').trim()
const outFile = path.resolve(projectDir, process.argv[3] || 'release-body.md')

if (!tag) {
  console.error('[release-notes] 用法：node scripts/extract-changelog.js <tag> [输出文件]')
  process.exit(1)
}

const version = tag.replace(/^v/i, '')

/** 取指定版本的更新日志段落（标题形如 `### v2.0.2（2026-11 · ...）`） */
function extractSection(markdown) {
  const lines = markdown.split(/\r?\n/)
  // 精确匹配版本号，避免 v2.0.2 命中 v2.0.20
  const headerRe = new RegExp(`^###\\s+v?${version.replace(/\./g, '\\.')}(?![\\d.])(.*)$`)
  const start = lines.findIndex((line) => headerRe.test(line))
  if (start < 0) return ''

  const body = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    // 下一个同级 / 更高级标题即为段落结束
    if (/^#{2,3}\s/.test(line)) break
    body.push(line)
  }
  return body.join('\n').trim()
}

/** 上一个 tag，用于拼接 compare 链接；取不到时退回 commits 链接 */
function findPreviousTag() {
  try {
    return execFileSync('git', ['describe', '--tags', '--abbrev=0', `${tag}^`], {
      cwd: projectDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
  } catch (e) {
    return ''
  }
}

function main() {
  const readmePath = path.join(projectDir, 'README.md')
  if (!fs.existsSync(readmePath)) {
    console.error(`[release-notes] 找不到 ${readmePath}`)
    process.exit(1)
  }

  const section = extractSection(fs.readFileSync(readmePath, 'utf-8'))
  if (!section) {
    console.warn(`[release-notes] README 中没有 v${version} 的更新日志段落，正文将只含变更对比链接`)
  }

  const repo = process.env.GITHUB_REPOSITORY || 'geqian618/time-letter'
  const prev = findPreviousTag()
  const compare = prev
    ? `https://github.com/${repo}/compare/${prev}...${tag}`
    : `https://github.com/${repo}/commits/${tag}`

  const parts = []
  // 段落与分隔线之间必须留空行，否则紧贴列表的 `---` 会被当成 setext 标题下划线
  if (section) parts.push(`## 📜 更新日志 · ${tag}`, '', section, '')
  parts.push('---', '', `**Full Changelog**: ${compare}`)

  const body = `${parts.join('\n')}\n`
  fs.writeFileSync(outFile, body, 'utf-8')
  console.log(`[release-notes] ${path.basename(outFile)} 已生成（${body.length} 字符，上一版本：${prev || '无'}）`)
}

main()
