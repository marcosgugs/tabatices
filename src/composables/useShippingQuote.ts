import { ref } from 'vue'
import { storeConfig } from '@/config/store'
import { onlyDigits } from '@/composables/useDeliveryLookup'
import { getShippingFee } from '@/composables/useShippingRate'
import type { CartItem, ShippingOption } from '@/types/cart'

interface ShippingQuoteResponse {
  options: ShippingOption[]
}

interface ShippingBox {
  id: string
  quantity: number
  unitPrice: number
  width: number
  height: number
  length: number
  weight: number
}

function buildShippingBoxes(items: CartItem[]): ShippingBox[] {
  const { weightsInKgByItemCount, ...dimensions } = storeConfig.shippingBox
  const itemsPerBox = weightsInKgByItemCount.length
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)
  const averageUnitPrice = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0) / totalQuantity
  const boxCount = Math.ceil(totalQuantity / itemsPerBox)

  return [...Array(boxCount).keys()].map((boxIndex) => {
    const itemsInBox = Math.min(itemsPerBox, totalQuantity - boxIndex * itemsPerBox)

    return {
      id: `caixa-${boxIndex + 1}`,
      quantity: 1,
      unitPrice: Number((averageUnitPrice * itemsInBox).toFixed(2)),
      ...dimensions,
      weight: weightsInKgByItemCount[itemsInBox - 1],
    }
  })
}

function buildFallbackOption(state: string): ShippingOption {
  return { id: 'tabela', carrier: 'Correios', service: 'PAC', price: getShippingFee(state), deliveryDays: null }
}

export function useShippingQuote() {
  const options = ref<ShippingOption[]>([])
  const isLoading = ref(false)
  let latestRequestId = 0

  async function quote(postalCode: string, state: string, items: CartItem[]): Promise<void> {
    const requestId = ++latestRequestId
    isLoading.value = true

    try {
      const response = await fetch(storeConfig.shippingQuoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: onlyDigits(postalCode),
          items: buildShippingBoxes(items),
        }),
      })
      if (!response.ok) throw new Error('quote_failed')

      const data = (await response.json()) as ShippingQuoteResponse
      if (!data.options.length) throw new Error('quote_empty')
      if (requestId === latestRequestId) options.value = data.options
    } catch {
      if (requestId === latestRequestId) options.value = [buildFallbackOption(state)]
    } finally {
      if (requestId === latestRequestId) isLoading.value = false
    }
  }

  function reset(): void {
    latestRequestId++
    options.value = []
    isLoading.value = false
  }

  return { options, isLoading, quote, reset }
}
