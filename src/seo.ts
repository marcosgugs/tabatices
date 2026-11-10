import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { storeConfig } from '@/config/store'
import { findProductBySlug } from '@/data/products'

export interface PageMeta {
  title: string
  description: string
  path: string
  image: string
  type: 'website' | 'product'
  isIndexable: boolean
  structuredData: Record<string, unknown> | null
}

const defaultTitle = `${storeConfig.name} · Cadernos ilustrados à mão`
const defaultDescription =
  'Cadernos kraft com capas ilustradas à mão, feitos sob encomenda em cadernos Cicero. Envio para todo o Brasil e pedido pelo WhatsApp.'
const defaultImage = 'images/hero.webp'
const maxDescriptionLength = 160

function toAbsoluteUrl(path: string): string {
  return `${storeConfig.siteUrl}/${path.replace(/^\//, '')}`
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text
  return `${text.slice(0, limit - 1).trimEnd()}…`
}

function buildOrganizationData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeConfig.name,
    url: storeConfig.siteUrl,
    logo: toAbsoluteUrl('images/logo.webp'),
    sameAs: [`https://instagram.com/${storeConfig.instagramHandle}`],
  }
}

export function buildPageMeta(route: RouteLocationNormalizedLoaded): PageMeta {
  const homeMeta: PageMeta = {
    title: defaultTitle,
    description: defaultDescription,
    path: '/',
    image: defaultImage,
    type: 'website',
    isIndexable: true,
    structuredData: buildOrganizationData(),
  }

  if (route.name === 'product') {
    const product = findProductBySlug(String(route.params.slug))
    if (!product) return homeMeta

    const path = `/produto/${product.slug}`

    return {
      title: `Caderno ${product.name} ilustrado à mão · ${storeConfig.name}`,
      description: truncate(product.description, maxDescriptionLength),
      path,
      image: product.image,
      type: 'product',
      isIndexable: true,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `Caderno ${product.name}`,
        description: product.description,
        image: toAbsoluteUrl(product.image),
        brand: { '@type': 'Brand', name: storeConfig.name },
        offers: {
          '@type': 'Offer',
          url: toAbsoluteUrl(path),
          price: product.price.toFixed(2),
          priceCurrency: 'BRL',
          availability: 'https://schema.org/MadeToOrder',
        },
      },
    }
  }

  if (route.name === 'cart') {
    return { ...homeMeta, title: `Carrinho · ${storeConfig.name}`, path: '/carrinho', isIndexable: false, structuredData: null }
  }

  return homeMeta
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderHead(meta: PageMeta): string {
  const canonicalUrl = toAbsoluteUrl(meta.path)
  const imageUrl = toAbsoluteUrl(meta.image)

  const tags = [
    `<title>${escapeAttribute(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttribute(meta.description)}" />`,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    `<meta property="og:type" content="${meta.type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:site_name" content="${storeConfig.name}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${escapeAttribute(meta.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(meta.description)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ]

  if (!meta.isIndexable) tags.push('<meta name="robots" content="noindex" />')

  if (meta.structuredData) {
    const json = JSON.stringify(meta.structuredData).replace(/</g, '\\u003c')
    tags.push(`<script type="application/ld+json">${json}</script>`)
  }

  return tags.join('\n    ')
}

function upsertHeadElement(selector: string, create: () => HTMLElement, attribute: string, value: string): void {
  const existingElement = document.head.querySelector(selector)
  const element = existingElement ?? document.head.appendChild(create())
  element.setAttribute(attribute, value)
}

export function applyPageMeta(meta: PageMeta): void {
  document.title = meta.title

  upsertHeadElement(
    'meta[name="description"]',
    () => Object.assign(document.createElement('meta'), { name: 'description' }),
    'content',
    meta.description,
  )
  upsertHeadElement(
    'link[rel="canonical"]',
    () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
    'href',
    toAbsoluteUrl(meta.path),
  )
}
