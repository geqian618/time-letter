<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="aboutDialogVisible" :close-on-click-modal="false" :close-on-press-escape="false" :title="$t('about.title')"
               width="700" align-center draggable>
      <div class="about">
        <div class="brand">
          <img class="brand-mark" :src="appLogo" :alt="$t('toolbar.brand')" draggable="false">
          <div class="meta">
            <div class="name">{{ $t('toolbar.brand') }}</div>
            <div class="sub">秋风吹落了秋枫 · v2.0.0</div>
          </div>
        </div>
        <div class="panels">
          <div class="texts">
            <div class="panel">
              <div class="panel-head">
                <span class="dot"></span>
                <span class="title">{{ $t('about.intro') }}</span>
              </div>
              <div class="panel-body">{{ $t('about.introText') }}</div>
            </div>
            <div class="panel">
              <div class="panel-head">
                <span class="dot"></span>
                <span class="title">{{ $t('about.origin') }}</span>
              </div>
              <div class="panel-body">{{ $t('about.originText') }}</div>
            </div>
          </div>
          <div class="panel contact">
            <div class="panel-head">
              <span class="dot"></span>
              <span class="title">{{ $t('about.contact') }}</span>
            </div>
            <img class="qr" src="/src/assets/images/qr-code.png" alt="wechat contact">
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref, onUnmounted} from 'vue'
import appLogo from '@resources/favicon.png'

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
  gap: 14px;
  font-family: "黑体", "Microsoft YaHei", sans-serif;

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    /* 上沿到标题栏 10px（弹窗 body padding）、下沿到卡片 14px（列 gap），补 4px 让品牌行上下留白相等 */
    margin-top: 4px;

    .brand-mark {
      width: 34px;
      height: 34px;
      display: block;
      object-fit: contain;
      flex-shrink: 0;
      user-select: none;
      -webkit-user-drag: none;
    }

    .name {
      font-size: 14px;
      font-weight: bold;
      color: var(--ui-text);
    }

    .sub {
      margin-top: 2px;
      font-size: 12px;
      color: var(--ui-text-muted);
    }
  }

  .panels {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 14px;

    .texts {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;

      /* 由来卡吃掉剩余高度，让左列上下边与右侧二维码卡对齐 */
      .panel:last-child {
        flex: 1;
      }
    }

    .panel {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--app-settings-card-border);
      border-radius: var(--app-radius-lg);
      background-color: var(--app-settings-card-bg);

      .panel-head {
        display: flex;
        align-items: center;
        gap: 6px;

        .dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background-color: var(--ui-accent);
        }

        .title {
          font-size: 12px;
          font-weight: bold;
          color: var(--ui-text-secondary);
        }
      }

      .panel-body {
        font-size: 13px;
        color: var(--ui-text);
        line-height: 1.7;
      }

      /* 二维码按栏宽铺满；文本比码长时（英文）码盒长高，图靠 contain 居中，不留空底 */
      .qr {
        flex: 1;
        width: 100%;
        height: auto;
        object-fit: contain;
        border-radius: var(--app-radius-md);
      }
    }
  }
}
</style>
