// 应用性能指标采集（仅在 Electron 主进程中使用，数据源均在本模块内获取）
// 内存口径按平台分流到各自的原生来源，对齐各系统自带监控工具：
// - win32：系统性能计数器「私有工作集」(Working Set - Private) 求和 = 任务管理器「内存」列（已实测一致）。
//   通过 PID 精确筛选本应用进程（避免匹配到其他 Electron 程序），冷启动较慢时复用在途查询。
// - linux：/proc/<pid>/smaps_rollup 的 Pss 求和 —— 按比例分摊共享页，避免多进程求和时共享内存被重复计入，
//   为系统监视器 / smem 等同等口径；内核较老无 smaps_rollup 时退回 /proc/<pid>/status 的 VmRSS。
// - darwin：Chromium 在 macOS 报告的物理内存（workingSetSize）求和 —— 活动监视器「内存」列同为物理占用口径，
//   Electron 未提供更细的原生字段，这是公开 API 中口径最接近的实现。
// 各平台查询失败时统一退回 Electron 内存字段（win32 优先 privateBytes），保证任何环境都有值。

const fs = require('fs')
const os = require('os')
const {execFile} = require('child_process')
const {app} = require('electron')

// Windows：性能计数器「私有工作集」求和（单位 KB）
let privateWorkingSetPending = null

const queryWindowsMemoryKB = (metrics) => {
    if (privateWorkingSetPending) return privateWorkingSetPending
    const pids = metrics.map(metric => metric.pid)
    if (!pids.length) return Promise.resolve(null)
    const filter = pids.map(pid => `IDProcess=${pid}`).join(' OR ')
    const script = `$ErrorActionPreference='SilentlyContinue';` +
        `(Get-CimInstance Win32_PerfFormattedData_PerfProc_Process -Filter "${filter}" |` +
        ` Measure-Object -Property WorkingSetPrivate -Sum).Sum`
    privateWorkingSetPending = new Promise((resolve) => {
        execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script],
            {timeout: 4000, windowsHide: true}, (error, stdout) => {
                privateWorkingSetPending = null
                const bytes = Number.parseInt(String(stdout).trim(), 10)
                resolve(!error && Number.isFinite(bytes) ? Math.round(bytes / 1024) : null)
            })
    })
    return privateWorkingSetPending
}

// Linux：直接读 /proc 取各进程内存（优先 smaps_rollup 的 Pss，退回 status 的 VmRSS），单位 KB
const queryLinuxMemoryKB = (metrics) => {
    let total = 0
    let matched = 0
    for (const {pid} of metrics) {
        try {
            const pss = fs.readFileSync(`/proc/${pid}/smaps_rollup`, 'utf8').match(/^Pss:\s+(\d+)\s+kB/m)
            if (pss) {
                total += Number(pss[1])
                matched++
                continue
            }
        } catch {
            // 内核不支持 smaps_rollup 时继续尝试 VmRSS
        }
        try {
            const rss = fs.readFileSync(`/proc/${pid}/status`, 'utf8').match(/^VmRSS:\s+(\d+)\s+kB/m)
            if (rss) {
                total += Number(rss[1])
                matched++
            }
        } catch {
            // 进程已退出或无权限，跳过
        }
    }
    return matched ? total : null
}

// macOS：Chromium 报告的物理内存求和（单位 KB）
const queryDarwinMemoryKB = (metrics) => {
    let total = 0
    for (const metric of metrics) total += metric.memory?.workingSetSize ?? 0
    return total
}

// 系统内存占用百分比：free 为未被应用与磁盘缓存占用的内存（与 total 同单位 KB）
const querySystemMemoryPercent = (systemMemoryInfo) => {
    const total = systemMemoryInfo?.total
    const free = systemMemoryInfo?.free
    if (!total || free == null) return null
    return Math.min(100, Math.max(0, Math.round((total - free) / total * 100)))
}

// GPU 加速状态：合成或 WebGL 走硬件时视为已启用（featureStatus 来自 app.getGPUFeatureStatus()）
const queryGpuAccelerated = (featureStatus) => {
    if (!featureStatus) return null
    return featureStatus.gpu_compositing === 'enabled' || featureStatus.webgl === 'enabled'
}

// 系统 CPU 占用百分比：os.cpus() 前后两次采样差值（整机 0-100%，与任务管理器「性能」页同口径，跨平台）；
// 首次调用没有历史快照，返回 null，5 秒轮询的第二次起即有值（数值为采样窗平均值，会平滑瞬间尖峰）
let lastSystemCpuSnapshot = null

const querySystemCpuPercent = () => {
    let idle = 0
    let total = 0
    for (const cpu of os.cpus()) {
        for (const value of Object.values(cpu.times)) total += value
        idle += cpu.times.idle
    }
    const prev = lastSystemCpuSnapshot
    lastSystemCpuSnapshot = {idle, total}
    if (!prev) return null
    const totalDelta = total - prev.total
    const idleDelta = idle - prev.idle
    if (totalDelta <= 0) return null
    return Math.min(100, Math.max(0, Math.round((totalDelta - idleDelta) / totalDelta * 100)))
}

// 兜底：Electron 内存字段求和（win32 优先 privateBytes，其余平台自动落回 workingSetSize）
const sumElectronMemoryKB = (metrics) => {
    let total = 0
    for (const metric of metrics) {
        total += metric.memory?.privateBytes ?? metric.memory?.workingSetSize ?? 0
    }
    return total
}

/**
 * 汇总应用性能指标：内存（按平台原生口径查询，失败自动兜底）+ CPU + 系统内存 + 系统 CPU + GPU 加速状态
 * @returns {Promise<{memoryKB: number, cpuPercent: number, systemMemoryPercent: number|null, systemCpuPercent: number|null, gpuAccelerated: boolean|null}>}
 */
const getMetrics = async () => {
    const metrics = app.getAppMetrics()
    let memoryKB = null
    if (process.platform === 'win32') {
        memoryKB = await queryWindowsMemoryKB(metrics)
    } else if (process.platform === 'linux') {
        memoryKB = queryLinuxMemoryKB(metrics)
    } else if (process.platform === 'darwin') {
        memoryKB = queryDarwinMemoryKB(metrics)
    }
    if (memoryKB === null) memoryKB = sumElectronMemoryKB(metrics)

    let cpuPercent = 0
    for (const metric of metrics) cpuPercent += metric.cpu?.percentCPUUsage ?? 0
    return {
        memoryKB,
        cpuPercent,
        systemMemoryPercent: querySystemMemoryPercent(process.getSystemMemoryInfo()),
        systemCpuPercent: querySystemCpuPercent(),
        gpuAccelerated: queryGpuAccelerated(app.getGPUFeatureStatus()),
    }
}

module.exports = {
    getMetrics,
    queryWindowsMemoryKB,
    queryLinuxMemoryKB,
    queryDarwinMemoryKB,
    querySystemMemoryPercent,
    querySystemCpuPercent,
    queryGpuAccelerated,
}