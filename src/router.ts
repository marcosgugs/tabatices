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
      {
        path: '/painel',
        component: () => import('@/views/PanelView.vue'),
        meta: { isPanel: true },
        children: [
          { path: '', name: 'panel-orders', component: () => import('@/views/PanelOrdersView.vue') },
          { path: 'pedidos/novo', name: 'panel-order-new', component: () => import('@/views/PanelOrderFormView.vue') },
          { path: 'pedidos/:code', name: 'panel-order', component: () => import('@/views/PanelOrderFormView.vue') },
          { path: 'clientes', name: 'panel-customers', component: () => import('@/views/PanelCustomersView.vue') },
          { path: 'clientes/novo', name: 'panel-customer-new', component: () => import('@/views/PanelCustomerFormView.vue') },
          { path: 'clientes/:id', name: 'panel-customer', component: () => import('@/views/PanelCustomerFormView.vue') },
        ],
      },
      { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
    ],
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth', top: 72 }
      return { top: 0 }
    },
  })
}
