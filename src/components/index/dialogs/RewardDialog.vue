<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :title="$t('reward.title')"
               width="640" align-center>
      <div class="reward">
        <div class="description">{{ $t('reward.description') }}</div>
        <div class="codes">
          <div class="code-card">
            <div class="card-head">
              <span class="dot"></span>
              <span class="channel">{{ $t('reward.wechat') }}</span>
            </div>
            <div class="qr">
              <img src="/src/assets/images/reward-code.png" alt="wechat reward">
            </div>
            <div class="hint">{{ $t('reward.wechatHint') }}</div>
          </div>
          <div class="code-card">
            <div class="card-head">
              <span class="dot"></span>
              <span class="channel">{{ $t('reward.alipay') }}</span>
            </div>
            <div class="qr">
              <img src="/src/assets/images/alipay.png" alt="alipay reward">
            </div>
            <div class="hint">{{ $t('reward.alipayHint') }}</div>
          </div>
        </div>
        <div class="footnote">{{ $t('reward.footnote') }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {computed} from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

</script>

<style scoped lang="scss">
@use '@/assets/styles/dialog';

.reward {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: "黑体", "Microsoft YaHei", sans-serif;

  .description {
    font-size: 13px;
    color: var(--ui-text);
    line-height: 1.6;
    /* 上沿到标题栏 10px（弹窗 body padding）、下沿到卡片 14px（列 gap），补 4px 让文案在这段空隙里上下居中 */
    /* shortcut: 4px 由 body padding 与列 gap 手算，改这两处要跟着调 */
    margin-top: 4px;
  }

  .codes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    .code-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border: 1px solid var(--app-settings-card-border);
      border-radius: var(--app-radius-lg);
      background-color: var(--app-settings-card-bg);

      .card-head {
        width: 100%;
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

        .channel {
          font-size: 12px;
          font-weight: bold;
          color: var(--ui-text-secondary);
        }
      }

      .qr {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          /* 等高 220px、宽度按各自比例，不拉伸不裁剪 */
          height: 220px;
          width: auto;
          border-radius: var(--app-radius-md);
        }
      }

      .hint {
        font-size: 11px;
        color: var(--ui-text-muted);
      }
    }
  }

  .footnote {
    text-align: center;
    font-size: 11px;
    color: var(--ui-text-faint);
  }
}
</style>
