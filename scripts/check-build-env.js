// 打包前环境检查：检测工作区目录是否被写入 Low 完整性标签。
//
// 背景：electron-builder 打包 NSIS 目标时，会在 output 目录执行一次刚生成的安装包，
// 用来预先写出卸载器（__uninstaller-*.exe）。若目录带 Low 完整性标签，该 exe 继承
// Low IL，进程无法写入 %TEMP%（Medium），NSIS 启动校验失败并弹出
// “Error writing temporary file. Make sure your temp folder is valid.”，
// 最终以 Exit code 2 结束，表现为打包在 nsis 阶段莫名失败。
//
// 该标签通常由沙箱工具（如 Codex CLI）写入工作区；修复需要管理员权限。
'use strict'

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectDir = path.resolve(__dirname, '..')

// icacls 输出中 Low 完整性标签的两种表现形式：英文名，或低完整性 SID
// （系统语言不同时名称可能变化，SID 始终不变）
const LOW_MARKERS = ['Low Mandatory Level', 'S-1-16-4096']

function hasLowIntegrity(dir) {
  let out
  try {
    out = execFileSync('icacls', [dir], { encoding: 'utf8', windowsHide: true })
  } catch (e) {
    // 目录不存在或 icacls 不可用时不做判定，避免误报
    return false
  }
  return LOW_MARKERS.some((marker) => out.includes(marker))
}

function main() {
  if (process.platform !== 'win32') return

  // 支持传入目录参数（便于单独测试）；默认检查项目目录与产物目录
  const targets = process.argv.slice(2).length > 0
    ? process.argv.slice(2).map((p) => path.resolve(p))
    : [projectDir, path.join(projectDir, 'output')].filter((p) => fs.existsSync(p))

  const bad = targets.filter(hasLowIntegrity)
  if (bad.length === 0) {
    console.log('[check-build-env] 完整性标签正常')
    return
  }

  console.error('')
  console.error('[check-build-env] 构建中止：以下目录带有 Low 完整性标签')
  for (const dir of bad) console.error(`  ${dir}`)
  console.error('')
  console.error('electron-builder 会在 output 目录执行一次刚生成的安装包来预生成卸载器，')
  console.error('低完整性进程无法写入 %TEMP%，NSIS 会报')
  console.error('  Error writing temporary file. Make sure your temp folder is valid.')
  console.error('并以 Exit code 2 结束（表现为打包在 nsis 阶段失败）。')
  console.error('')
  console.error('常见原因：沙箱工具（如 Codex CLI）给工作区目录写入了 Low 完整性标签。')
  console.error('修复方式（管理员权限，会弹 UAC）：')
  console.error(`  icacls "${projectDir}" /setintegritylevel (OI)(CI)Medium`)
  console.error('')
  console.error('注意：在沙箱内启动的打包进程本身也是低完整性，即使标签已修复，')
  console.error('请改用普通终端执行打包。')
  process.exit(1)
}

main()
