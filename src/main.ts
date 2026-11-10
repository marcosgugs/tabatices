import { createApp, createSSRApp } from 'vue'
import { createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { applyPageMeta, buildPageMeta } from '@/seo'
import '@/assets/main.css'

const appContainer = document.querySelector<HTMLElement>('#app')

if (appContainer) {
  const legacyHashPath = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : null

  if (legacyHashPath) {
    window.history.replaceState(null, '', legacyHashPath)
    appContainer.innerHTML = ''
  }

  const isPrerendered = appContainer.hasChildNodes()
  const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL))
  const app = (isPrerendered ? createSSRApp : createApp)(App).use(createPinia()).use(router)

  router.afterEach((to) => applyPageMeta(buildPageMeta(to)))
  router.isReady().then(() => app.mount(appContainer))
}
