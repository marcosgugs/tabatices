export interface CartItem {
  id: string
  slug: string
  name: string
  image: string
  paper: string
  unitPrice: number
  quantity: number
}

export type DeliveryMethod = 'correios'

export interface ShippingAddress {
  cep: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}
