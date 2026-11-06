import { ref } from 'vue'
import { storeConfig } from '@/config/store'
import { onlyDigits } from '@/composables/useDeliveryLookup'
import { getShippingFee } from '@/composables/useShippingRate'
import type { CartItem, ShippingOption } from '@/types/cart'

interface ShippingQuoteResponse {
  options: ShippingOption[]
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
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            ...storeConfig.shippingPackage,
          })),
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
