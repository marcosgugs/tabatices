import { storeConfig } from '@/config/store'
import { calculateChargedTotal } from '@/composables/usePayment'
import type { CartItem } from '@/types/cart'
import type { PanelOrder } from '@/types/panel'

const orderDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0)
}

export function calculateProductionDays(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0) + storeConfig.extraProductionDays
}

export function calculateTotal(order: Pick<PanelOrder, 'items' | 'shippingFee' | 'payment'>): number {
  return calculateChargedTotal({ subtotal: calculateSubtotal(order.items), shippingFee: order.shippingFee }, order.payment)
}

function describeItem(item: CartItem): string {
  return item.paper ? `${item.name} · miolo ${item.paper.toLowerCase()}` : item.name
}

export function describeItems(items: CartItem[]): string {
  return items.map((item) => `${item.quantity}x ${describeItem(item)}`).join(', ')
}

export function formatOrderDate(isoDate: string): string {
  return orderDateFormatter.format(new Date(isoDate))
}
