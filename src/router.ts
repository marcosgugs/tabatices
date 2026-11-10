import { createRouter, type RouterHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

export function createAppRouter(history: RouterHistory) {
  return createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: HomeView },
      { path: '/produto/:slug', name: 'product', component: () => import('@/views/ProductView.vue') },
      { path: '/carrinho', name: 'cart', component: () => import('@/views/CartView.vue') },
      { path: '/sacola', redirect: { name: 'cart' } },
      { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
    ],
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth', top: 72 }
      return { top: 0 }
    },
  })
}
