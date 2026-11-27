import { products } from '@/data/products'
import { formatCep, onlyDigits } from '@/composables/useDeliveryLookup'
import { isValidCpf } from '@/composables/useCpf'
import { normalizeText } from '@/composables/useTextSearch'
import type { CartItem, Payment, ShippingAddress } from '@/types/cart'

export interface ParsedOrderMessage {
  code: string | null
  customerName: string | null
  customerCpf: string | null
  items: CartItem[]
  shippingLabel: string | null
  shippingFee: number | null
  total: number | null
  payment: Payment | null
  address: ShippingAddress | null
}

const moneyPattern = String.raw`R\$\s*([\d.]+,\d{2})`
const whatsappCopyPrefixPattern = /^\[[^\]]*\]\s[^:]+:\s/
const codePattern = /^Pedido\s+([A-Z0-9]+-[A-Z0-9]+)$/i
const customerNamePattern = /^Nome:\s*(.+)$/i
const customerCpfPattern = /^CPF:\s*([\d.\-\s]+)$/i
const pixPaymentPattern = /^Pagamento:\s*Pix\b/i
const cardPaymentPattern = /^Pagamento:\s*Cart[aã]o de cr[eé]dito em (\d+)\s*x/i
const itemPattern = new RegExp(String.raw`^[•·-]?\s*(\d+)\s*x\s+(.+?)\s+[—–-]\s+${moneyPattern}$`, 'i')
const paperPattern = /^Miolo:\s*(.*)$/i
const shippingPattern = new RegExp(String.raw`^(Frete\b.*?):\s*${moneyPattern}$`, 'i')
const totalPattern = new RegExp(String.raw`^Total:\s*${moneyPattern}$`, 'i')
const addressHeaderPattern = /^Endereço de entrega:?$/i
const districtLinePattern = /^(.+?)\s+·\s+(.+)\/([A-Z]{2})$/i
const cepLinePattern = /^CEP:?\s*(\d{5}-?\d{3})$/i
const complementSeparator = ' — '

function toLines(message: string): string[] {
  return message
    .replace(/\p{Cf}/gu, '')
    .replace(/\p{Zs}/gu, ' ')
    .replace(/\*/g, '')
    .split(/\r?\n/)
    .map((line) => line.replace(whatsappCopyPrefixPattern, '').trim())
    .filter((line) => line.length > 0)
}

function findFirstMatch(lines: string[], pattern: RegExp): RegExpMatchArray | null {
  return lines.map((line) => line.match(pattern)).find((lineMatch) => lineMatch !== null) ?? null
}

function parseMoney(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.'))
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100
}

function buildItem(itemMatch: RegExpMatchArray, paper: string): CartItem | null {
  const quantity = Number(itemMatch[1])
  if (quantity <= 0) return null

  const normalizedName = normalizeText(itemMatch[2])
  const product = products.find((catalogProduct) => normalizeText(catalogProduct.name) === normalizedName)

  return {
    id: crypto.randomUUID(),
    slug: product?.slug ?? '',
    name: product?.name ?? itemMatch[2].trim(),
    image: product?.image ?? '',
    paper,
    unitPrice: roundToCents(parseMoney(itemMatch[3]) / quantity),
    quantity,
  }
}

function parseItems(lines: string[]): CartItem[] {
  return lines.flatMap((line, lineIndex) => {
    const itemMatch = line.match(itemPattern)
    if (!itemMatch) return []

    const paper = lines[lineIndex + 1]?.match(paperPattern)?.[1].trim() ?? ''
    const item = buildItem(itemMatch, paper)
    return item ? [item] : []
  })
}

function parseCustomerCpf(lines: string[]): string | null {
  const cpfMatch = findFirstMatch(lines, customerCpfPattern)
  return cpfMatch && isValidCpf(cpfMatch[1]) ? onlyDigits(cpfMatch[1]) : null
}

function parsePayment(lines: string[]): Payment | null {
  const cardMatch = findFirstMatch(lines, cardPaymentPattern)
  if (cardMatch) return { method: 'card', installmentCount: Number(cardMatch[1]) }
  return findFirstMatch(lines, pixPaymentPattern) ? { method: 'pix' } : null
}

function parseAddress(lines: string[]): ShippingAddress | null {
  const headerIndex = lines.findIndex((line) => addressHeaderPattern.test(line))
  if (headerIndex === -1) return null

  const [streetLine = '', districtLine = '', cepLine = ''] = lines.slice(headerIndex + 1, headerIndex + 4)
  const [streetAndNumber, ...complementParts] = streetLine.split(complementSeparator)
  const numberSeparatorIndex = streetAndNumber.lastIndexOf(',')
  const districtMatch = districtLine.match(districtLinePattern)
  const cepMatch = cepLine.match(cepLinePattern)

  return {
    cep: cepMatch ? formatCep(cepMatch[1]) : '',
    street: (numberSeparatorIndex === -1 ? streetAndNumber : streetAndNumber.slice(0, numberSeparatorIndex)).trim(),
    number: numberSeparatorIndex === -1 ? '' : streetAndNumber.slice(numberSeparatorIndex + 1).trim(),
    complement: complementParts.join(complementSeparator).trim(),
    district: districtMatch?.[1].trim() ?? '',
    city: districtMatch?.[2].trim() ?? '',
    state: districtMatch?.[3].toUpperCase() ?? '',
  }
}

export function parseOrderMessage(message: string): ParsedOrderMessage | null {
  const lines = toLines(message)
  const code = findFirstMatch(lines, codePattern)?.[1].toUpperCase() ?? null
  const items = parseItems(lines)
  if (!code && items.length === 0) return null

  const shippingMatch = findFirstMatch(lines, shippingPattern)
  const totalMatch = findFirstMatch(lines, totalPattern)

  return {
    code,
    customerName: findFirstMatch(lines, customerNamePattern)?.[1].trim() ?? null,
    customerCpf: parseCustomerCpf(lines),
    items,
    shippingLabel: shippingMatch?.[1].trim() ?? null,
    shippingFee: shippingMatch ? parseMoney(shippingMatch[2]) : null,
    total: totalMatch ? parseMoney(totalMatch[1]) : null,
    payment: parsePayment(lines),
    address: parseAddress(lines),
  }
}
