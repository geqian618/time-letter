import 'normalize.css'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

import VueLazyload from 'vue-lazyload'

import draggable from "./directive/draggable.js";

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
    observerOptions: {
        rootMargin: '0px 1000px', // 左右侧预加载1000px
        threshold: 0.1
    }
})

app.directive('draggable', draggable)

app.mount('#app')

