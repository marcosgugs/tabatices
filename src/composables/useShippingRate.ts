import { storeConfig } from '@/config/store'

const fallbackRegion = storeConfig.shippingRegions[storeConfig.shippingRegions.length - 1]

export function getShippingFee(state: string): number {
  const normalizedState = state.trim().toUpperCase()
  const region = storeConfig.shippingRegions.find((shippingRegion) => shippingRegion.states.includes(normalizedState))
  return (region ?? fallbackRegion).fee
}
