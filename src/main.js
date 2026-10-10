import 'normalize.css'
/* 内置思源黑体（Noto Sans SC 可变字重）：跨平台与设计稿字体观感一致 */
import './assets/fonts/noto-sans-sc/noto-sans-sc-variable.css'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import loadErrorIcon from './assets/images/load-error.jpeg';
import loadingIcon from './assets/images/loading.jpeg';

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './assets/styles/element-overrides.css'

import VueLazyload from 'vue3-lazyload'

import i18n from './locales'

import inputFocus from '@/directive/input-focus';

import dragSort from '@/directive/drag-sort';

/* electronAPI 兜底：preload 加载失败或非 Electron 环境（如纯浏览器调试）时，
   以空实现代理避免启动阶段直接崩溃白屏；正常 Electron 运行时 preload 已注入真实 API，此处不生效 */
if (typeof window !== 'undefined' && !window.electronAPI) {
    const noop = () => {};
    window.electronAPI = new Proxy({}, {
        get: (target, prop) => {
            if (!(prop in target)) {
                target[prop] = prop === 'getPerformanceMetrics'
                    ? async () => undefined
                    : noop;
            }
            return target[prop];
        }
    });
}

const app = createApp(App)

app.use(router)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.use(ElementPlus)

app.use(i18n)

app.use(VueLazyload, {
    // 错误图片
    error: loadErrorIcon,
    // 加载中图片
    loading: loadingIcon,
    preLoad: 2, // 横向预加载比例（1.5表示左右各多加载0.25屏）
    attempt: 3,
    observerOptions: {
        rootMargin: '0px 50% 0px 50%' // 横向扩展触发区域
    }
})

app.directive('dragSort', dragSort)

// 全局应用指令
app.directive('focus', inputFocus)

app.mount('#app')

