export interface CartItem {
  id: string
  slug: string
  name: string
  image: string
  paper: string
  unitPrice: number
  quantity: number
}

export interface ShippingOption {
  id: string
  carrier: string
  service: string
  price: number
  deliveryDays: number | null
}

export type Payment = { method: 'pix' } | { method: 'card'; installmentCount: number }

export type PaymentMethod = Payment['method']

export interface ShippingAddress {
  cep: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}
