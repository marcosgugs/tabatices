import type { CartItem, ShippingAddress } from '@/types/cart'

export type OrderStatus = 'awaiting_payment' | 'in_production' | 'ready_to_ship' | 'shipped' | 'delivered' | 'canceled'

export interface OrderStatusOption {
  value: OrderStatus
  label: string
  dotClass: string
}

export interface Customer {
  id: string
  name: string
  whatsapp: string
  address: ShippingAddress | null
  notes: string
  createdAt: string
}

export type CustomerDraft = Omit<Customer, 'id' | 'createdAt'>

export interface PanelOrder {
  id: string
  code: string
  customerId: string
  status: OrderStatus
  items: CartItem[]
  shippingFee: number
  notes: string
  createdAt: string
}

export type PanelOrderDraft = Omit<PanelOrder, 'id' | 'createdAt'>
