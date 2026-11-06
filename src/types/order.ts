import type { CartItem } from '@/types/cart'

export interface Order {
  code: string
  createdAt: string
  items: CartItem[]
  deliveryLabel: string
  total: number
  message: string
}
