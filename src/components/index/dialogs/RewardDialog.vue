<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="visible" :close-on-click-modal="false" :close-on-press-escape="false" :title="$t('reward.title')"
               width="540" align-center>
      <div class="reward">
        <div class="description">{{ $t('reward.description') }}</div>
        <div class="codes">
          <figure>
            <span class="channel">{{ $t('reward.wechat') }}</span>
            <img src="/src/assets/images/reward-code.jpg" alt="wechat reward">
          </figure>
          <figure>
            <span class="channel">{{ $t('reward.alipay') }}</span>
            <img src="/src/assets/images/alipay.png" alt="alipay reward">
          </figure>
        </div>
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
  align-items: center;
  gap: 12px;
  font-family: "黑体", "Microsoft YaHei", sans-serif;

  .description {
    width: 100%;
    font-size: 13px;
    color: var(--ui-text);
    text-align: center;
    line-height: 1.6;
  }

  .codes {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 28px;

    figure {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin: 0;

      .channel {
        font-size: 12px;
        font-weight: bold;
        color: var(--ui-text-secondary);
      }

      img {
        /* 等高 250px、宽度按各自比例，不拉伸不裁剪 */
        height: 250px;
        width: auto;
        border-radius: 3px;
      }
    }
  }
}
</style>
