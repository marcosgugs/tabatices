import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/produto/:slug', name: 'product', component: () => import('@/views/ProductView.vue') },
    { path: '/sacola', name: 'cart', component: () => import('@/views/CartView.vue') },
    { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 72 }
    return { top: 0 }
  },
})
