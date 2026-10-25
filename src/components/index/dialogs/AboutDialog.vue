<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="aboutDialogVisible" :close-on-click-modal="false" :close-on-press-escape="false" :title="$t('about.title')"
               width="700" align-center draggable>
      <div class="about">
        <div class="introduction">
          <span class="title">{{ $t('about.intro') }}</span>
          <div class="value">{{ $t('about.introText') }}</div>
        </div>
        <div class="purpose">
          <span class="title">{{ $t('about.origin') }}</span>
          <div class="value">
            {{ $t('about.originText') }}
          </div>
        </div>
        <div class="contact">
          <span class="title">{{ $t('about.contact') }}</span>
          <div class="value">
            <img src="/src/assets/images/qr-code.jpg">
          </div>
        </div>
        <div class="author">
          <span class="title">{{ $t('about.author') }}</span>
          <div class="value">秋风吹落了秋枫</div>
        </div>
        <div class="version">
          <span class="title">{{ $t('about.version') }}</span>
          <div class="value">v2.0</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref, onUnmounted} from 'vue'

const aboutDialogVisible = ref(false)

// 应用菜单"关于"的 IPC 监听（卸载时解绑，防 HMR 重挂载累积监听器）
const disposeOpenAboutDialog = window.electronAPI.openAboutDialog(() => {
  aboutDialogVisible.value = true;
})

onUnmounted(() => disposeOpenAboutDialog?.())

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.about {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  gap: 10px;
  font-family: "黑体", "Microsoft YaHei", sans-serif;

  .introduction, .version, .purpose, .contact, .author {
    width: 100%;
    display: flex;
    justify-content: start;

    span {
      font-weight: bold;
      min-width: 43px;
    }

    .value:has(img) {
      border-radius: 3px;

      img {
        height: 240px;
        width: auto;
      }
    }

  }
}
</style>
