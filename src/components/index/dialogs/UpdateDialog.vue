<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="visible" :title="$t('toolbar.checkUpdate')" width="400" align-center
               :close-on-click-modal="false">
      <div class="update" :class="status">{{ message }}</div>
      <template #footer>
        <div class="update-footer">
          <template v-if="status === 'available'">
            <el-button @click="visible = false">{{ $t('common.cancel') }}</el-button>
            <el-button type="primary" @click="download">{{ $t('update.download') }}</el-button>
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
const current = ref('')
const latest = ref('')
const url = ref('')

const message = computed(() => {
  switch (status.value) {
    case 'checking':
      return t('update.checking')
    case 'latest':
      return t('update.latest', {version: current.value})
    case 'downloading':
      return t('update.downloading', {percent: percent.value})
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
  status.value = result.hasUpdate ? 'available' : 'latest'
}

const check = async () => {
  visible.value = true
  status.value = 'checking'
  percent.value = 0
  const result = await window.electronAPI.checkAppUpdate()
  if (!result || result.error) {
    await fallbackCheck()
    return
  }
  current.value = result.current
  latest.value = result.latest
  if (!result.hasUpdate) {
    status.value = 'latest'
    return
  }
  // 主进程 autoDownload 已开启，下载进度与完成由事件推送
  status.value = 'downloading'
}

const download = () => {
  window.electronAPI.openExternal(url.value)
  visible.value = false
}

const restart = () => window.electronAPI.installAppUpdate()

const disposeProgress = window.electronAPI.watchUpdateProgress((event, value) => {
  percent.value = value
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

onUnmounted(() => {
  disposeProgress?.()
  disposeDownloaded?.()
  disposeError?.()
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

.update-footer {
  display: flex;
  justify-content: end;
  gap: 10px;
}
</style>
