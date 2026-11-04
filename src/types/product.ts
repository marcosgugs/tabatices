export interface ProductOption {
  label: string
  priceDelta: number
  image: string
  imageAlt: string
}

export interface Product {
  slug: string
  name: string
  tagline: string
  description: string
  isInspiredByReference: boolean
  price: number
  image: string
  imageAlt: string
  productionDays: number
  details: string[]
  paperOptions: ProductOption[]
}
