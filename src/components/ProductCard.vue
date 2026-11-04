<script setup lang="ts">
import type { Product } from '@/types/product'
import { formatCurrency } from '@/composables/useCurrency'

defineProps<{
  product: Product
}>()
</script>

<template>
  <RouterLink :to="{ name: 'product', params: { slug: product.slug } }" class="group block">
    <div class="overflow-hidden rounded-[28px] bg-cream-deep shadow-[0_1px_2px_rgba(46,58,47,0.06)]">
      <img
        :src="product.image"
        :alt="product.imageAlt"
        loading="lazy"
        width="1200"
        height="1600"
        class="aspect-[4/5] w-full object-cover transition duration-700 ease-apple group-hover:scale-[1.03]"
      />
    </div>
    <div class="mt-5 flex items-baseline justify-between gap-4 px-1">
      <div>
        <h3 class="text-xl font-semibold tracking-tight text-ink">{{ product.name }}</h3>
        <p class="mt-1 text-[15px] text-ink-muted">{{ product.tagline }}</p>
      </div>
      <p class="shrink-0 text-[15px] font-medium text-ink">{{ formatCurrency(product.price) }}</p>
    </div>
    <span class="button-primary mt-5 ml-1 px-7 py-2.5 text-sm group-hover:bg-forest-soft">Comprar</span>
  </RouterLink>
</template>
