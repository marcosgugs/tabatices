<script setup lang="ts">
withDefaults(
  defineProps<{
    min?: number
    max?: number
    size?: 'regular' | 'compact'
  }>(),
  { min: 1, max: 20, size: 'regular' },
)

const quantity = defineModel<number>({ required: true })
</script>

<template>
  <div
    class="inline-flex items-center rounded-full border border-line bg-white/60"
    :class="size === 'compact' ? 'h-9' : 'h-12'"
  >
    <button
      type="button"
      aria-label="Diminuir quantidade"
      class="flex h-full items-center justify-center rounded-full text-lg text-forest transition hover:bg-forest/5 disabled:opacity-30"
      :class="size === 'compact' ? 'w-9' : 'w-12'"
      :disabled="quantity <= min"
      @click="quantity = Math.max(min, quantity - 1)"
    >
      −
    </button>
    <span class="min-w-6 text-center text-[15px] font-medium tabular-nums" aria-live="polite">{{ quantity }}</span>
    <button
      type="button"
      aria-label="Aumentar quantidade"
      class="flex h-full items-center justify-center rounded-full text-lg text-forest transition hover:bg-forest/5 disabled:opacity-30"
      :class="size === 'compact' ? 'w-9' : 'w-12'"
      :disabled="quantity >= max"
      @click="quantity = Math.min(max, quantity + 1)"
    >
      +
    </button>
  </div>
</template>
