import 'normalize.css'
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

import VueLazyload from 'vue3-lazyload'

import draggable from "@/directive/draggable.js";

import inputFocus from "@/directive/input-focus.js";


const app = createApp(App)

app.use(router)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)


for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

app.use(ElementPlus)

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

app.directive('draggable', draggable)

// 全局应用指令
app.directive('focus', inputFocus)

app.mount('#app')

