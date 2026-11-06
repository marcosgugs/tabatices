import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { readStorage, writeStorage } from '@/composables/useLocalStorage'
import type { Order } from '@/types/order'

type StoredOrder = Omit<Order, 'deliveryLabel'> & { deliveryLabel?: string }

const storageKey = 'tabatices:orders'
const maxStoredOrders = 20
const legacyDeliveryLabel = 'Frete Correios'

function normalizeOrder(storedOrder: StoredOrder): Order {
  return { ...storedOrder, deliveryLabel: storedOrder.deliveryLabel ?? legacyDeliveryLabel }
}

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>(readStorage<StoredOrder[]>(storageKey, []).map(normalizeOrder))

  function addOrder(order: Order): void {
    orders.value = [order, ...orders.value].slice(0, maxStoredOrders)
  }

  watch(orders, (storedOrders) => writeStorage(storageKey, storedOrders), { deep: true })

  return { orders, addOrder }
})
