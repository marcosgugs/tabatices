export type ProductCategory = 'notebook' | 'decor'

export interface ProductOption {
  label: string
  priceDelta: number
  image: string
  imageAlt: string
}

export interface ProductPhoto {
  label: string
  image: string
  imageAlt: string
}

export interface Product {
  slug: string
  category: ProductCategory
  name: string
  tagline: string
  description: string
  isInspiredByReference: boolean
  isListed: boolean
  price: number | null
  image: string
  imageAlt: string
  extraPhotos: ProductPhoto[]
  productionDays: number | null
  details: string[]
  paperOptions: ProductOption[]
}
