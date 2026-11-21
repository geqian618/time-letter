<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="visible" :title="$t('toolbar.checkUpdate')" width="560" align-center
               :close-on-click-modal="false">
      <div class="update" :class="status">{{ message }}</div>
      <template v-if="hasUpdateDetected && notes">
        <div class="update-notes-label">{{ $t('update.releaseNotes') }}</div>
        <div class="update-notes">{{ notes }}</div>
      </template>
      <el-progress v-if="status === 'downloading'" class="update-progress" :percentage="percent"/>
      <template #footer>
        <div class="update-footer">
          <template v-if="status === 'available'">
            <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="download">
              {{ inApp || downloadUrl ? $t('update.downloadNow') : $t('update.download') }}
            </el-button>
          </template>
          <template v-else-if="status === 'unreleased'">
            <el-button type="primary" @click="download">{{ $t('update.download') }}</el-button>
          </template>
          <template v-else-if="status === 'downloading'">
            <el-button type="primary" @click="visible = false">{{ $t('update.background') }}</el-button>
          </template>
          <template v-else-if="status === 'downloaded'">
            <el-button @click="visible = false">{{ $t('update.later') }}</el-button>
            <el-button type="primary" @click="restart">{{ $t('update.restart') }}</el-button>
          </template>
          <el-button v-else type="primary" :disabled="status === 'checking'" @click="visible = false">
            {{ $t('common.confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {computed, onUnmounted, ref} from 'vue'

import {useI18n} from 'vue-i18n'

const {t} = useI18n()

const visible = ref(false)
const status = ref('checking')
const percent = ref(0)
const speed = ref(0)
const current = ref('')
const latest = ref('')
const url = ref('')
const notes = ref('')
const downloadUrl = ref('')
// 下载来源：'updater' = electron-updater 应用内下载；'release' = 回落路径应用内下载安装包；'' = 未发起
const pendingInstall = ref('')
// 检测到新版本的来源：true = 应用内自动更新；false = 回落 GitHub release 检查
const inApp = ref(false)

// 检测到新版本的状态（有更新内容可展示）：发现新版本 / 下载中 / 已下载待重启
const hasUpdateDetected = computed(() => ['available', 'downloading', 'downloaded'].includes(status.value))

const message = computed(() => {
  switch (status.value) {
    case 'checking':
      return t('update.checking')
    case 'latest':
      return t('update.latest', {version: current.value})
    case 'downloading':
      return t('update.downloading', {speed: formatSpeed(speed.value)})
    case 'downloaded':
      return t('update.downloaded')
    case 'available':
      return t('update.available', {version: latest.value, current: current.value})
    case 'unreleased':
      return t('update.unreleased')
    default:
      return t('update.failed')
  }
})

// 兜底：自动更新不可用时回落到 GitHub release 检查，有新版引导去下载页
const fallbackCheck = async () => {
  inApp.value = false
  const result = await window.electronAPI.checkLatestRelease()
  if (result?.error === 'no-release') {
    url.value = result.url
    status.value = 'unreleased'
    return
  }
  if (!result || result.error) {
    status.value = 'error'
    return
  }
  current.value = result.current
  latest.value = result.latest
  url.value = result.url
  notes.value = result.notes || ''
  downloadUrl.value = result.downloadUrl || ''
  status.value = result.hasUpdate ? 'available' : 'latest'
}

// 下载速度格式化为 KB/s 或 MB/s
const formatSpeed = (bytes) => bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB/s`
  : `${Math.round(bytes / 1024)} KB/s`

const check = async () => {
  visible.value = true
  status.value = 'checking'
  percent.value = 0
  speed.value = 0
  notes.value = ''
  pendingInstall.value = ''
  downloadUrl.value = ''
  const result = await window.electronAPI.checkAppUpdate()
  if (!result || result.error) {
    await fallbackCheck()
    return
  }
  current.value = result.current
  latest.value = result.latest
  notes.value = result.notes || ''
  if (!result.hasUpdate) {
    status.value = 'latest'
    return
  }
  // 不自动下载：停在“发现新版本”，等用户看完更新内容后点“下载”确认
  inApp.value = true
  status.value = 'available'
}

const download = () => {
  // 支持应用内下载安装的（electron-updater 可用 / Windows 有安装包资产）：
  // 用户确认后应用内下载，进度与完成由事件推送，无需跳网页
  if (inApp.value) {
    status.value = 'downloading'
    pendingInstall.value = 'updater'
    window.electronAPI.downloadAppUpdate()
    return
  }
  if (downloadUrl.value) {
    status.value = 'downloading'
    pendingInstall.value = 'release'
    window.electronAPI.downloadReleaseUpdate({url: downloadUrl.value, version: latest.value})
    return
  }
  // 不支持自动下载安装（非 Windows / 无安装包资产）：维持原方式，跳转 release 页手动下载
  window.electronAPI.openExternal(url.value)
  visible.value = false
}

const restart = () => {
  if (pendingInstall.value === 'release') {
    // 回落路径：静默运行已下载的安装包并退出应用
    window.electronAPI.installReleaseUpdate()
    return
  }
  window.electronAPI.installAppUpdate()
}

const disposeProgress = window.electronAPI.watchUpdateProgress((event, {percent: p, speed: s}) => {
  percent.value = p
  speed.value = s
  if (status.value === 'checking') status.value = 'downloading'
})
const disposeDownloaded = window.electronAPI.watchUpdateDownloaded((event, info) => {
  if (info?.version) latest.value = info.version
  status.value = 'downloaded'
})
// 下载中断（断网等）时回落到手动下载
const disposeError = window.electronAPI.watchUpdateError(() => {
  if (status.value === 'downloading') fallbackCheck()
})

// 托盘「检查更新」的 IPC 监听（卸载时解绑，防 HMR 重挂载累积监听器）
const disposeOpenUpdateDialog = window.electronAPI.openUpdateDialog(() => {
  check()
})

onUnmounted(() => {
  disposeProgress?.()
  disposeDownloaded?.()
  disposeError?.()
  disposeOpenUpdateDialog?.()
})

defineExpose({check})

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.update {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-regular-text);
}

.update-progress {
  margin-top: 8px;

  :deep(.el-progress__text) {
    min-width: 40px;
  }
}

.update-notes-label {
  margin-top: 10px;
  font-size: 11px;
  color: var(--ui-text-secondary);
}

.update-notes {
  margin-top: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding: 8px 10px;
  border-radius: var(--app-radius-sm);
  background: var(--ui-elevated);
  font-size: 12px;
  line-height: 1.7;
  /* release notes 为 markdown 纯文本：保留换行原样展示 */
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--app-regular-text);
  user-select: text;
}

.update-footer {
  display: flex;
  justify-content: end;
  gap: 10px;
}
</style>
