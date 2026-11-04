import { computed, ref } from 'vue'
import { storeConfig } from '@/config/store'

interface ViaCepResponse {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean | string
}

export interface DeliveryAddress {
  cep: string
  street: string
  district: string
  city: string
  state: string
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export function useDeliveryLookup() {
  const address = ref<DeliveryAddress | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const isLocalDelivery = computed(() => {
    if (!address.value) return false

    return (
      normalizeText(address.value.city) === normalizeText(storeConfig.localDelivery.city) &&
      normalizeText(address.value.state) === normalizeText(storeConfig.localDelivery.state)
    )
  })

  async function lookup(cep: string): Promise<void> {
    const digits = onlyDigits(cep)
    address.value = null
    errorMessage.value = ''

    if (digits.length !== 8) {
      errorMessage.value = 'Digite um CEP com 8 números.'
      return
    }

    isLoading.value = true

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      if (!response.ok) throw new Error('lookup_failed')

      const data = (await response.json()) as ViaCepResponse
      if (data.erro) {
        errorMessage.value = 'Não encontramos esse CEP. Confere pra gente?'
        return
      }

      address.value = {
        cep: formatCep(digits),
        street: data.logradouro,
        district: data.bairro,
        city: data.localidade,
        state: data.uf,
      }
    } catch {
      errorMessage.value = 'Não foi possível consultar o CEP agora. Tente de novo em instantes.'
    } finally {
      isLoading.value = false
    }
  }

  function reset(): void {
    address.value = null
    errorMessage.value = ''
  }

  return { address, isLoading, errorMessage, isLocalDelivery, lookup, reset }
}
