import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { readStorage, writeStorage } from '@/composables/useLocalStorage'
import type { CartItem } from '@/types/cart'

const storageKey = 'tabatices:cart'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(readStorage<CartItem[]>(storageKey, []))

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() =>
    items.value.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
  )

  function addItem(newItem: Omit<CartItem, 'id'>): void {
    const id = [newItem.slug, newItem.paper].join('|')
    const existingItem = items.value.find((item) => item.id === id)

    if (existingItem) {
      existingItem.quantity += newItem.quantity
      return
    }

    items.value.push({ ...newItem, id })
  }

  function updateQuantity(id: string, quantity: number): void {
    if (quantity <= 0) {
      removeItem(id)
      return
    }

    const targetItem = items.value.find((item) => item.id === id)
    if (targetItem) targetItem.quantity = quantity
  }

  function removeItem(id: string): void {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function clear(): void {
    items.value = []
  }

  watch(items, (storedItems) => writeStorage(storageKey, storedItems), { deep: true })

  return { items, itemCount, subtotal, addItem, updateQuantity, removeItem, clear }
})
