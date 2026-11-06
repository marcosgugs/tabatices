import { storeConfig } from '@/config/store'
import { formatCurrency } from '@/composables/useCurrency'
import type { CartItem, ShippingAddress, ShippingOption } from '@/types/cart'

interface OrderSummary {
  customerName: string
  items: CartItem[]
  subtotal: number
  shipping: ShippingOption
  address: ShippingAddress | null
}

export function describeShipping(shipping: ShippingOption): string {
  return `Frete ${shipping.carrier} ${shipping.service}`
}

export function describeDeliveryTime(deliveryDays: number): string {
  return `até ${deliveryDays} ${deliveryDays === 1 ? 'dia útil' : 'dias úteis'} após o envio`
}

export function generateOrderCode(): string {
  const randomValues = crypto.getRandomValues(new Uint32Array(1))
  return `TB-${randomValues[0].toString(36).toUpperCase().slice(0, 5).padStart(5, '0')}`
}

function describeItem(item: CartItem): string {
  return [
    `• ${item.quantity}x *${item.name}* — ${formatCurrency(item.unitPrice * item.quantity)}`,
    `   Miolo: ${item.paper}`,
  ].join('\n')
}

export function describeAddress(address: ShippingAddress): string[] {
  const streetLine = [`${address.street}, ${address.number}`, address.complement.trim()].filter(Boolean).join(' — ')
  return [streetLine, `${address.district} · ${address.city}/${address.state}`, `CEP ${address.cep}`]
}

export function buildOrderMessage(orderCode: string, summary: OrderSummary): string {
  const total = summary.subtotal + summary.shipping.price
  const deliveryTimeLines = summary.shipping.deliveryDays ? [`Prazo de entrega: ${describeDeliveryTime(summary.shipping.deliveryDays)}`] : []

  const lines = [
    `Olá! Quero fazer um pedido na ${storeConfig.name}.`,
    '',
    `*Pedido ${orderCode}*`,
    `Nome: ${summary.customerName.trim()}`,
    '',
    ...summary.items.map(describeItem),
    '',
    `Subtotal: ${formatCurrency(summary.subtotal)}`,
    `${describeShipping(summary.shipping)}: ${formatCurrency(summary.shipping.price)}`,
    ...deliveryTimeLines,
    `*Total: ${formatCurrency(total)}*`,
  ]

  if (summary.address) {
    lines.push('', '*Endereço de entrega*', ...describeAddress(summary.address))
  }

  return lines.join('\n')
}

export function buildWhatsappUrl(message: string): string {
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`
}
