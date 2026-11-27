<script setup lang="ts">
import { computed } from 'vue'
import { storeConfig } from '@/config/store'
import { formatCurrency } from '@/composables/useCurrency'
import { applyPixDiscount, calculateCardInstallments } from '@/composables/usePayment'
import type { Payment } from '@/types/cart'

const props = defineProps<{
  subtotal: number
  shippingFee: number
}>()

const payment = defineModel<Payment | null>({ required: true })

const selectedOptionClass = 'border-forest bg-forest/[0.04]'
const idleOptionClass = 'border-line hover:border-forest/30'

const pixTotal = computed(() => applyPixDiscount(props.subtotal) + props.shippingFee)
const cardInstallments = computed(() => calculateCardInstallments(props.subtotal + props.shippingFee))
const isPixSelected = computed(() => payment.value?.method === 'pix')
const selectedInstallmentCount = computed(() => (payment.value?.method === 'card' ? payment.value.installmentCount : null))
const isCardSelected = computed(() => selectedInstallmentCount.value !== null)

function selectPix(): void {
  payment.value = { method: 'pix' }
}

function selectInstallment(installmentCount: number): void {
  payment.value = { method: 'card', installmentCount }
}

function selectCard(): void {
  if (!isCardSelected.value) selectInstallment(1)
}
</script>

<template>
  <div role="radiogroup" aria-label="Forma de pagamento" class="space-y-2">
    <div class="rounded-2xl border transition duration-300 ease-apple" :class="isPixSelected ? selectedOptionClass : idleOptionClass">
      <button type="button" role="radio" :aria-checked="isPixSelected" class="flex w-full items-center gap-3 px-4 py-3.5 text-left" @click="selectPix">
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
          :class="isPixSelected ? 'border-forest' : 'border-ink-muted/40'"
          aria-hidden="true"
        >
          <span class="size-2.5 rounded-full bg-forest transition-transform duration-300 ease-apple" :class="isPixSelected ? 'scale-100' : 'scale-0'"></span>
        </span>
        <span class="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-cream-deep/70 text-forest sm:flex" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="6" y="6" width="12" height="12" rx="3" transform="rotate(45 12 12)" />
            <path d="m9.5 12 2.5-2.5 2.5 2.5-2.5 2.5Z" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[15px] font-medium text-ink">Pix</span>
          <span class="mt-0.5 block text-sm text-terracotta">{{ storeConfig.pixDiscountPercent }}% de desconto</span>
        </span>
        <span class="shrink-0 text-[15px] font-medium text-ink">{{ formatCurrency(pixTotal) }}</span>
      </button>
    </div>

    <div class="rounded-2xl border transition duration-300 ease-apple" :class="isCardSelected ? selectedOptionClass : idleOptionClass">
      <button type="button" role="radio" :aria-checked="isCardSelected" class="flex w-full items-center gap-3 px-4 py-3.5 text-left" @click="selectCard">
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
          :class="isCardSelected ? 'border-forest' : 'border-ink-muted/40'"
          aria-hidden="true"
        >
          <span class="size-2.5 rounded-full bg-forest transition-transform duration-300 ease-apple" :class="isCardSelected ? 'scale-100' : 'scale-0'"></span>
        </span>
        <span class="hidden size-9 shrink-0 items-center justify-center rounded-xl bg-cream-deep/70 text-forest sm:flex" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.6">
            <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
            <path d="M3 10h18M7 14.5h3" stroke-linecap="round" />
          </svg>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[15px] font-medium text-ink">Cartão de crédito</span>
          <span class="mt-0.5 block text-sm text-ink-muted">Em até {{ cardInstallments.length }}x</span>
        </span>
      </button>

      <div v-if="isCardSelected" role="radiogroup" aria-label="Parcelas" class="mx-4 mb-3 border-t border-line pt-2">
        <button
          v-for="installment in cardInstallments"
          :key="installment.installmentCount"
          type="button"
          role="radio"
          :aria-checked="selectedInstallmentCount === installment.installmentCount"
          class="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left text-sm transition-colors hover:bg-forest/[0.05]"
          @click="selectInstallment(installment.installmentCount)"
        >
          <span
            class="flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors"
            :class="selectedInstallmentCount === installment.installmentCount ? 'border-forest' : 'border-ink-muted/40'"
            aria-hidden="true"
          >
            <span
              class="size-2 rounded-full bg-forest transition-transform duration-300 ease-apple"
              :class="selectedInstallmentCount === installment.installmentCount ? 'scale-100' : 'scale-0'"
            ></span>
          </span>
          <span class="min-w-0 flex-1 font-medium whitespace-nowrap text-ink">{{ installment.installmentCount }}x de {{ formatCurrency(installment.installmentValue) }}</span>
          <span class="shrink-0 text-[13px] whitespace-nowrap text-ink-muted">{{ installment.hasFee ? `total ${formatCurrency(installment.total)}` : 'sem juros' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
