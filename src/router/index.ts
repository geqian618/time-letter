import {createRouter, createWebHashHistory} from 'vue-router'
import Home from '../views/Index.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/image-manager',
      name: 'image-manager',
      component: () => import('../views/extensions/ImageManager.vue')
    }
  ]
})

export default router
