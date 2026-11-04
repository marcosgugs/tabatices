import type { CartItem, DeliveryMethod } from '@/types/cart'

export interface Order {
  code: string
  createdAt: string
  items: CartItem[]
  deliveryMethod: DeliveryMethod
  total: number
  message: string
}
