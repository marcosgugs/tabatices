import type { CartItem, ShippingAddress } from '@/types/cart'
import type { OrderStatus } from '@/types/panel'

type CustomerRow = {
  id: string
  name: string
  whatsapp: string
  address: ShippingAddress | null
  notes: string
  created_at: string
}

type OrderRow = {
  id: string
  code: string
  customer_id: string
  status: OrderStatus
  items: CartItem[]
  shipping_fee: number
  notes: string
  created_at: string
}

type GeneratedColumns = 'id' | 'created_at'

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: CustomerRow
        Insert: Omit<CustomerRow, GeneratedColumns>
        Update: Partial<Omit<CustomerRow, GeneratedColumns>>
        Relationships: []
      }
      orders: {
        Row: OrderRow
        Insert: Omit<OrderRow, GeneratedColumns>
        Update: Partial<Omit<OrderRow, GeneratedColumns>>
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
  }
}
