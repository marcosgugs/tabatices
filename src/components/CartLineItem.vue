<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { formatCurrency } from '@/composables/useCurrency'
import { publicAsset } from '@/composables/usePublicAsset'
import QuantityStepper from '@/components/QuantityStepper.vue'
import type { CartItem } from '@/types/cart'

defineProps<{
  item: CartItem
}>()

const cartStore = useCartStore()
</script>

<template>
  <li class="flex gap-5 py-6">
    <RouterLink :to="{ name: 'product', params: { slug: item.slug } }" class="shrink-0">
      <img :src="publicAsset(item.image)" :alt="item.name" width="96" height="120" class="h-30 w-24 rounded-2xl object-cover" />
    </RouterLink>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-lg font-semibold tracking-tight text-ink">{{ item.name }}</p>
          <p class="mt-1 text-sm text-ink-muted">Miolo {{ item.paper.toLowerCase() }}</p>
        </div>
        <p class="shrink-0 font-medium text-ink">{{ formatCurrency(item.unitPrice * item.quantity) }}</p>
      </div>

      <div class="mt-auto flex items-center justify-between pt-4">
        <QuantityStepper
          :model-value="item.quantity"
          size="compact"
          @update:model-value="(quantity: number) => cartStore.updateQuantity(item.id, quantity)"
        />
        <button type="button" class="text-sm text-ink-muted transition-colors hover:text-terracotta" @click="cartStore.removeItem(item.id)">
          Remover
        </button>
      </div>
    </div>
  </li>
</template>
