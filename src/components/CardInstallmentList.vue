<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/composables/useCurrency'
import { calculateCardInstallments } from '@/composables/usePayment'

const props = defineProps<{
  amount: number
}>()

const installments = computed(() => calculateCardInstallments(props.amount))
</script>

<template>
  <ul class="space-y-2 text-sm text-ink-muted">
    <li v-for="installment in installments" :key="installment.installmentCount" class="flex justify-between gap-4">
      <span>{{ installment.installmentCount }}x de {{ formatCurrency(installment.installmentValue) }}</span>
      <span>{{ installment.hasFee ? `total ${formatCurrency(installment.total)}` : 'sem juros' }}</span>
    </li>
  </ul>
</template>
