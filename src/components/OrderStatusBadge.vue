<script setup lang="ts">
import { computed } from 'vue'
import { findOrderStatus } from '@/data/orderStatuses'
import type { OrderStatus } from '@/types/panel'

const props = defineProps<{
  status: OrderStatus
}>()

const statusOption = computed(() => findOrderStatus(props.status))
</script>

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-ink">
    <span class="size-2 rounded-full" :class="statusOption.dotClass" aria-hidden="true"></span>
    {{ statusOption.label }}
  </span>
</template>
