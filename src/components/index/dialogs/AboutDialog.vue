<template>
  <div class="dialog-wrapper">
    <el-dialog v-model="aboutDialogVisible" :close-on-click-modal="false" :close-on-press-escape="false" title="关于"
               width="700" align-center draggable>
      <div class="about">
        <div class="introduction">
          <span class="title">简介：</span>
          <div class="value">“时光信笺”是一款简单易用、扩展性极强、本地运行且无需联网的照片水印与边框工具。</div>
        </div>
        <div class="purpose">
          <span class="title">由来：</span>
          <div class="value">
            灵感源自网络上的“埋信仪式”——“寻一块地，埋一封信，寄给若干年后的自己”。将此刻心绪悉心封存，静待时光开启。
            照片亦是如此。如果说书信是写给未来的文字独白，那么照片便是赠予岁月的无声诗篇。
            愿我们都能将转瞬即逝的心绪，凝成一封封穿越时光的无声信笺。待到未来的某日，被你亲手拆开，与曾经的自己，温柔重逢，再忆彼时。
          </div>
        </div>
        <div class="contact">
          <span class="title">联系与赞赏：</span>
          <div class="value">
            <img src="/src/assets/images/qr-code.jpg">
            <img src="/src/assets/images/reward-code.jpg">
          </div>
        </div>
        <div class="version">
          <span class="title">版本：</span>
          <div class="value">v2.0</div>
        </div>
        <div class="author">
          <span class="title">作者：</span>
          <div class="value">秋风吹落了秋枫</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="js">

import {ref} from 'vue'

const aboutDialogVisible = ref(false)

// 应用菜单"关于"的 IPC 监听
window.electronAPI.openAboutDialog(() => {
  aboutDialogVisible.value = true;
})

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
        width: 240px;
        height: 270px;
      }
    }

  }
}
</style>
