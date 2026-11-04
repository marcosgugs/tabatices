import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { readStorage, writeStorage } from '@/composables/useLocalStorage'
import type { Order } from '@/types/order'

const storageKey = 'tabatices:orders'
const maxStoredOrders = 20

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>(readStorage<Order[]>(storageKey, []))

  function addOrder(order: Order): void {
    orders.value = [order, ...orders.value].slice(0, maxStoredOrders)
  }

  watch(orders, (storedOrders) => writeStorage(storageKey, storedOrders), { deep: true })

  return { orders, addOrder }
})
