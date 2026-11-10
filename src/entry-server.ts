import { createSSRApp } from 'vue'
import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { createAppRouter } from '@/router'
import { buildPageMeta, renderHead } from '@/seo'
import { storeConfig } from '@/config/store'
import { products } from '@/data/products'

export const siteUrl = storeConfig.siteUrl
export const prerenderPaths = ['/', ...products.map((product) => `/produto/${product.slug}`)]
export const clientOnlyPaths = ['/carrinho']

async function resolveRoute(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router
}

export async function renderPage(path: string) {
  const router = await resolveRoute(path)
  const app = createSSRApp(App).use(createPinia()).use(router)
  const context: SSRContext = {}
  const html = await renderToString(app, context)

  return {
    html,
    head: renderHead(buildPageMeta(router.currentRoute.value)),
    teleports: context.teleports?.['#teleports'] ?? '',
  }
}

export async function renderPageHead(path: string) {
  const router = await resolveRoute(path)
  return renderHead(buildPageMeta(router.currentRoute.value))
}
