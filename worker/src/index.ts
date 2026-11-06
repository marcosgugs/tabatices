interface QuoteItem {
  id: string
  quantity: number
  unitPrice: number
  width: number
  height: number
  length: number
  weight: number
}

interface QuoteRequest {
  postalCode: string
  items: QuoteItem[]
}

interface MelhorEnvioService {
  id: number
  name: string
  custom_price?: string
  custom_delivery_time?: number
  error?: string
  company: { name: string }
}

interface ShippingOption {
  id: string
  carrier: string
  service: string
  price: number
  deliveryDays: number | null
}

const maxItems = 20
const maxQuantity = 50
const maxDimensionInCm = 100
const maxWeightInKg = 30
const maxUnitPrice = 10000

function isBoundedNumber(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= limit
}

function isQuoteItem(value: unknown): value is QuoteItem {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    item.id.length <= 100 &&
    Number.isInteger(item.quantity) &&
    isBoundedNumber(item.quantity, maxQuantity) &&
    isBoundedNumber(item.unitPrice, maxUnitPrice) &&
    isBoundedNumber(item.width, maxDimensionInCm) &&
    isBoundedNumber(item.height, maxDimensionInCm) &&
    isBoundedNumber(item.length, maxDimensionInCm) &&
    isBoundedNumber(item.weight, maxWeightInKg)
  )
}

function parseQuoteRequest(payload: unknown): QuoteRequest | null {
  if (typeof payload !== 'object' || payload === null) return null
  const { postalCode, items } = payload as Record<string, unknown>

  if (typeof postalCode !== 'string' || !/^\d{8}$/.test(postalCode)) return null
  if (!Array.isArray(items) || items.length === 0 || items.length > maxItems) return null
  if (!items.every(isQuoteItem)) return null

  return { postalCode, items }
}

function resolveAllowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((allowedOrigin) => allowedOrigin.trim())
  return allowedOrigins.includes(origin) ? origin : null
}

function buildCorsHeaders(allowedOrigin: string | null): Record<string, string> {
  if (!allowedOrigin) return {}

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function jsonResponse(body: unknown, status: number, allowedOrigin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...buildCorsHeaders(allowedOrigin) },
  })
}

function toShippingOption(service: MelhorEnvioService): ShippingOption {
  return {
    id: String(service.id),
    carrier: service.company.name,
    service: service.name,
    price: Number(service.custom_price),
    deliveryDays: service.custom_delivery_time ?? null,
  }
}

async function requestQuote(quoteRequest: QuoteRequest, env: Env): Promise<ShippingOption[] | null> {
  const response = await fetch(`${env.MELHOR_ENVIO_API_URL}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MELHOR_ENVIO_TOKEN}`,
      'User-Agent': env.USER_AGENT,
    },
    body: JSON.stringify({
      from: { postal_code: env.ORIGIN_POSTAL_CODE },
      to: { postal_code: quoteRequest.postalCode },
      products: quoteRequest.items.map((item) => ({
        id: item.id,
        width: item.width,
        height: item.height,
        length: item.length,
        weight: item.weight,
        insurance_value: item.unitPrice,
        quantity: item.quantity,
      })),
      options: { receipt: false, own_hand: false },
      services: env.MELHOR_ENVIO_SERVICES,
    }),
  })

  if (!response.ok) {
    console.error('melhor_envio_error', response.status, await response.text())
    return null
  }

  const services = (await response.json()) as MelhorEnvioService[]
  const allowedServiceIds = env.MELHOR_ENVIO_SERVICES.split(',').map((serviceId) => serviceId.trim())

  return services
    .filter((service) => allowedServiceIds.includes(String(service.id)))
    .filter((service) => !service.error && service.custom_price !== undefined)
    .map(toShippingOption)
    .filter((option) => Number.isFinite(option.price) && option.price > 0)
    .sort((first, second) => first.price - second.price)
}

export default {
  async fetch(request, env): Promise<Response> {
    const allowedOrigin = resolveAllowedOrigin(request.headers.get('Origin'), env)
    const { pathname } = new URL(request.url)

    if (pathname !== '/quote') return jsonResponse({ error: 'not_found' }, 404, allowedOrigin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: buildCorsHeaders(allowedOrigin) })
    if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405, allowedOrigin)
    if (!allowedOrigin) return jsonResponse({ error: 'forbidden_origin' }, 403, null)

    const quoteRequest = parseQuoteRequest(await request.json().catch(() => null))
    if (!quoteRequest) return jsonResponse({ error: 'invalid_request' }, 400, allowedOrigin)

    const options = await requestQuote(quoteRequest, env)
    if (!options) return jsonResponse({ error: 'quote_unavailable' }, 502, allowedOrigin)

    return jsonResponse({ options }, 200, allowedOrigin)
  },
} satisfies ExportedHandler<Env>
