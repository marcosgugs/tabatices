<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { formatCurrency } from '@/composables/useCurrency'
import { formatCep, useDeliveryLookup } from '@/composables/useDeliveryLookup'
import { formatCpf, isValidCpf } from '@/composables/useCpf'
import { applyPixDiscount, calculateChargedTotal, describePaymentAdjustment } from '@/composables/usePayment'
import { useShippingQuote } from '@/composables/useShippingQuote'
import { calculateProductionDays } from '@/composables/useOrderSummary'
import {
  buildOrderMessage,
  buildWhatsappUrl,
  describeDeliveryTime,
  describeShipping,
  generateOrderCode,
} from '@/composables/useWhatsappCheckout'
import CartLineItem from '@/components/CartLineItem.vue'
import IconWhatsapp from '@/components/IconWhatsapp.vue'
import PaymentMethodPicker from '@/components/PaymentMethodPicker.vue'
import { publicAsset } from '@/composables/usePublicAsset'
import type { Payment, ShippingAddress } from '@/types/cart'
import type { Order } from '@/types/order'

interface DeliveryChoice {
  id: string
  title: string
  description: string
  priceLabel: string
}

const cartStore = useCartStore()
const { items, subtotal, itemCount } = storeToRefs(cartStore)
const ordersStore = useOrdersStore()
const { orders } = storeToRefs(ordersStore)
const { address, isLoading, errorMessage, lookup, reset } = useDeliveryLookup()
const { options: shippingOptions, isLoading: isQuoting, quote: quoteShipping, reset: resetShipping } = useShippingQuote()

const customerName = ref('')
const customerCpf = ref('')
const payment = ref<Payment | null>(null)
const cep = ref('')
const selectedShippingId = ref<string | null>(null)
const lastOrder = ref<Order | null>(null)

const shippingAddress = reactive<ShippingAddress>({
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
})

const deliveryChoices = computed<DeliveryChoice[]>(() => {
  if (!address.value) return []
  const destination = `${address.value.city}/${address.value.state}`

  return shippingOptions.value.map((option) => ({
    id: option.id,
    title: `${option.carrier} ${option.service}`,
    description: option.deliveryDays
      ? `Entrega em ${describeDeliveryTime(option.deliveryDays)}.`
      : `Envio para ${destination}.`,
    priceLabel: formatCurrency(option.price),
  }))
})

const selectedShipping = computed(() => shippingOptions.value.find((option) => option.id === selectedShippingId.value) ?? null)
const deliveryFee = computed(() => selectedShipping.value?.price ?? 0)
const pixTotal = computed(() => applyPixDiscount(subtotal.value) + deliveryFee.value)
const productionDays = computed(() => calculateProductionDays(items.value))
const paymentBase = computed(() => ({ subtotal: subtotal.value, shippingFee: deliveryFee.value }))
const chargedTotal = computed(() => calculateChargedTotal(paymentBase.value, payment.value))
const paymentAdjustment = computed(() => describePaymentAdjustment(paymentBase.value, payment.value))

const installmentSummary = computed(() => {
  if (payment.value?.method !== 'card') return ''
  const { installmentCount } = payment.value
  return `em ${installmentCount}x de ${formatCurrency(chargedTotal.value / installmentCount)}`
})
const requiresAddress = computed(() => selectedShipping.value !== null)

const isAddressComplete = computed(
  () =>
    !requiresAddress.value ||
    [shippingAddress.street, shippingAddress.number, shippingAddress.district].every((value) => value.trim().length > 0),
)

const pendingRequirement = computed(() => {
  if (customerName.value.trim().length < 2) return 'Preencha seu nome.'
  if (!isValidCpf(customerCpf.value)) return 'Preencha um CPF válido.'
  if (isQuoting.value) return 'Calculando o frete…'
  if (!selectedShipping.value) return 'Informe seu CEP e escolha a entrega.'
  if (!isAddressComplete.value) return 'Complete o endereço de entrega.'
  if (!payment.value) return 'Escolha a forma de pagamento.'
  return ''
})

const justPlacedOrder = computed(() => (items.value.length === 0 ? lastOrder.value : null))

const canCheckout = computed(() => items.value.length > 0 && !pendingRequirement.value)

watch(deliveryChoices, (choices) => {
  const isSelectionAvailable = choices.some((choice) => choice.id === selectedShippingId.value)
  if (isSelectionAvailable) return
  selectedShippingId.value = choices.length === 1 ? choices[0].id : null
})

watch([address, itemCount, subtotal], ([foundAddress]) => {
  if (!foundAddress || items.value.length === 0) {
    resetShipping()
    return
  }

  quoteShipping(foundAddress.cep, foundAddress.state, items.value)
})

watch(address, (foundAddress) => {
  Object.assign(shippingAddress, {
    cep: foundAddress?.cep ?? '',
    street: foundAddress?.street ?? '',
    number: '',
    complement: '',
    district: foundAddress?.district ?? '',
    city: foundAddress?.city ?? '',
    state: foundAddress?.state ?? '',
  })
})

function handleCpfInput(event: Event): void {
  customerCpf.value = formatCpf((event.target as HTMLInputElement).value)
}

function handleCepInput(event: Event): void {
  cep.value = formatCep((event.target as HTMLInputElement).value)
  if (address.value) reset()
}

function submitCep(): void {
  lookup(cep.value)
}

const orderDateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function formatOrderDate(isoDate: string): string {
  return orderDateFormatter.format(new Date(isoDate))
}

function describeOrderItems(order: Order): string {
  return order.items.map((item) => `${item.quantity}x ${item.name} (${item.paper.toLowerCase()})`).join(', ')
}

function checkout(): void {
  if (!canCheckout.value || !selectedShipping.value || !payment.value) return

  const orderCode = generateOrderCode()
  const message = buildOrderMessage(orderCode, {
    customerName: customerName.value,
    customerCpf: customerCpf.value,
    items: items.value,
    subtotal: subtotal.value,
    shipping: selectedShipping.value,
    address: requiresAddress.value ? { ...shippingAddress } : null,
    payment: payment.value,
  })

  const order: Order = {
    code: orderCode,
    createdAt: new Date().toISOString(),
    items: items.value.map((item) => ({ ...item })),
    deliveryLabel: describeShipping(selectedShipping.value),
    total: chargedTotal.value,
    message,
  }

  window.open(buildWhatsappUrl(message), '_blank', 'noopener')
  ordersStore.addOrder(order)
  lastOrder.value = order
  cartStore.clear()
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-5 pt-10 sm:px-8 lg:pt-16">
    <h1 class="text-4xl font-semibold tracking-[-0.025em] text-forest sm:text-5xl">Seu carrinho</h1>

    <div v-if="justPlacedOrder" class="mt-16 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-20 text-center" role="status">
      <img :src="publicAsset('apple-touch-icon.png')" alt="" width="96" height="96" class="size-24 rounded-full" />
      <p class="eyebrow mt-6">Pedido {{ justPlacedOrder.code }}</p>
      <p class="mt-3 text-xl font-semibold tracking-tight text-ink">Seu pedido foi aberto no WhatsApp.</p>
      <p class="mt-2 max-w-md text-ink-muted">É só enviar a mensagem por lá. A gente confirma tudo e combina o pagamento com você.</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a :href="buildWhatsappUrl(justPlacedOrder.message)" target="_blank" rel="noopener noreferrer" class="button-primary">
          <IconWhatsapp class="size-5" />
          Abrir WhatsApp de novo
        </a>
        <RouterLink :to="{ name: 'home', hash: '#cadernos' }" class="button-secondary">Continuar comprando</RouterLink>
      </div>
    </div>

    <div v-else-if="items.length === 0" class="mt-16 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-20 text-center">
      <img :src="publicAsset('apple-touch-icon.png')" alt="" width="96" height="96" class="size-24 rounded-full" />
      <p class="mt-6 text-xl font-semibold tracking-tight text-ink">Seu carrinho está vazio.</p>
      <p class="mt-2 text-ink-muted">Que tal escolher uma capa que combine com você?</p>
      <RouterLink :to="{ name: 'home', hash: '#cadernos' }" class="button-primary mt-8">Ver cadernos</RouterLink>
    </div>

    <div v-else class="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <ul class="divide-y divide-line border-y border-line">
        <CartLineItem v-for="item in items" :key="item.id" :item="item" />
      </ul>

      <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-[32px] bg-white/70 p-6 sm:p-8">
          <div>
            <label for="customer-name" class="text-[15px] font-semibold text-ink">Seu nome</label>
            <input id="customer-name" v-model="customerName" type="text" autocomplete="name" placeholder="Como podemos te chamar?" class="field mt-3" />
          </div>

          <div class="mt-6">
            <div class="relative flex items-center gap-1.5">
              <label for="customer-cpf" class="text-[15px] font-semibold text-ink">CPF</label>
              <span class="group/cpf-hint inline-flex">
                <button
                  type="button"
                  aria-label="Por que pedimos o CPF?"
                  aria-describedby="customer-cpf-hint"
                  class="flex size-5 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-forest"
                >
                  <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5" stroke-linecap="round" />
                    <path d="M12 7.5h.01" stroke-linecap="round" stroke-width="2.5" />
                  </svg>
                </button>
                <span
                  id="customer-cpf-hint"
                  role="tooltip"
                  class="pointer-events-none invisible absolute bottom-full left-0 z-10 mb-2 w-64 max-w-full rounded-2xl bg-forest px-4 py-3 text-[13px] leading-snug text-cream opacity-0 shadow-[0_12px_30px_-12px_rgba(31,38,32,0.5)] transition duration-300 ease-apple group-focus-within/cpf-hint:visible group-focus-within/cpf-hint:opacity-100 group-hover/cpf-hint:visible group-hover/cpf-hint:opacity-100"
                >
                  O CPF é obrigatório para o envio: as transportadoras exigem o documento de quem recebe o pacote.
                </span>
              </span>
            </div>
            <input
              id="customer-cpf"
              :value="customerCpf"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="000.000.000-00"
              maxlength="14"
              aria-describedby="customer-cpf-hint"
              class="field mt-3"
              @input="handleCpfInput"
            />
          </div>

          <form class="mt-6" @submit.prevent="submitCep">
            <label for="cep" class="text-[15px] font-semibold text-ink">Entrega</label>
            <div class="mt-3 flex gap-2">
              <input
                id="cep"
                :value="cep"
                type="text"
                inputmode="numeric"
                autocomplete="postal-code"
                placeholder="Seu CEP"
                maxlength="9"
                class="field"
                @input="handleCepInput"
              />
              <button type="submit" class="button-secondary shrink-0 px-5" :disabled="isLoading">
                {{ isLoading ? 'Buscando…' : 'Calcular' }}
              </button>
            </div>
            <p v-if="errorMessage" class="mt-2 text-sm text-terracotta" role="alert">{{ errorMessage }}</p>
            <p v-else-if="isQuoting" class="mt-2 text-sm text-ink-muted" role="status">Calculando o frete…</p>
          </form>

          <div v-if="deliveryChoices.length" role="radiogroup" aria-label="Forma de entrega" class="mt-4 space-y-2">
            <button
              v-for="choice in deliveryChoices"
              :key="choice.id"
              type="button"
              role="radio"
              :aria-checked="selectedShippingId === choice.id"
              class="flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition duration-300 ease-apple"
              :class="selectedShippingId === choice.id ? 'border-forest bg-forest/[0.04]' : 'border-line hover:border-forest/30'"
              @click="selectedShippingId = choice.id"
            >
              <span>
                <span class="block text-[15px] font-medium text-ink">{{ choice.title }}</span>
                <span class="mt-0.5 block text-sm text-ink-muted">{{ choice.description }}</span>
              </span>
              <span class="shrink-0 text-[15px] font-medium text-ink">{{ choice.priceLabel }}</span>
            </button>
          </div>

          <fieldset v-if="requiresAddress" class="mt-6">
            <legend class="text-[15px] font-semibold text-ink">Endereço de entrega</legend>
            <div class="mt-3 grid grid-cols-6 gap-2">
              <label class="col-span-6">
                <span class="sr-only">Rua</span>
                <input v-model="shippingAddress.street" type="text" autocomplete="address-line1" placeholder="Rua" required class="field" />
              </label>
              <label class="col-span-2">
                <span class="sr-only">Número</span>
                <input v-model="shippingAddress.number" type="text" inputmode="numeric" placeholder="Número" required class="field" />
              </label>
              <label class="col-span-4">
                <span class="sr-only">Complemento</span>
                <input v-model="shippingAddress.complement" type="text" autocomplete="address-line2" placeholder="Complemento (opcional)" class="field" />
              </label>
              <label class="col-span-6">
                <span class="sr-only">Bairro</span>
                <input v-model="shippingAddress.district" type="text" placeholder="Bairro" required class="field" />
              </label>
              <label class="col-span-4">
                <span class="sr-only">Cidade</span>
                <input :value="shippingAddress.city" type="text" readonly tabindex="-1" class="field" />
              </label>
              <label class="col-span-2">
                <span class="sr-only">Estado</span>
                <input :value="shippingAddress.state" type="text" readonly tabindex="-1" class="field" />
              </label>
            </div>
          </fieldset>

          <fieldset class="mt-6">
            <legend class="text-[15px] font-semibold text-ink">Pagamento</legend>
            <PaymentMethodPicker v-model="payment" :subtotal="subtotal" :shipping-fee="deliveryFee" class="mt-3" />
            <p class="mt-3 px-1 text-sm leading-relaxed text-ink-muted">
              A produção começa após a confirmação do pagamento e leva {{ productionDays }} dias úteis.
            </p>
          </fieldset>

          <dl class="mt-8 space-y-3 border-t border-line pt-6 text-[15px]">
            <div class="flex justify-between">
              <dt class="text-ink-muted">Subtotal ({{ itemCount }} {{ itemCount === 1 ? 'item' : 'itens' }})</dt>
              <dd class="text-ink">{{ formatCurrency(subtotal) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-muted">Entrega</dt>
              <dd class="text-ink">
                {{ selectedShipping ? formatCurrency(deliveryFee) : '—' }}
              </dd>
            </div>
            <div v-if="paymentAdjustment" class="flex justify-between">
              <dt class="text-ink-muted">{{ paymentAdjustment.label }}</dt>
              <dd :class="paymentAdjustment.amount < 0 ? 'text-terracotta' : 'text-ink'">{{ formatCurrency(paymentAdjustment.amount) }}</dd>
            </div>
            <div class="flex justify-between pt-3 text-lg font-semibold">
              <dt class="text-ink">Total</dt>
              <dd class="text-ink">{{ formatCurrency(chargedTotal) }}</dd>
            </div>
            <p v-if="installmentSummary" class="text-right text-sm text-ink-muted">{{ installmentSummary }}</p>
            <p v-else-if="!payment" class="text-right text-sm text-terracotta">{{ formatCurrency(pixTotal) }} no Pix</p>
          </dl>

          <button type="button" class="button-primary mt-8 h-13 w-full text-base" :disabled="!canCheckout" @click="checkout">
            <IconWhatsapp class="size-5" />
            Finalizar pedido
          </button>
          <p v-if="pendingRequirement" class="mt-3 text-center text-sm text-ink-muted">{{ pendingRequirement }}</p>
        </div>
      </aside>
    </div>

    <section v-if="orders.length" class="mt-20" aria-labelledby="order-history-title">
      <h2 id="order-history-title" class="text-2xl font-semibold tracking-tight text-forest">Seus pedidos</h2>
      <ul class="mt-6 divide-y divide-line border-y border-line">
        <li v-for="order in orders" :key="order.code" class="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div class="min-w-0">
            <p class="text-[15px] font-semibold text-ink">
              {{ order.code }}
              <span class="ml-2 font-normal text-ink-muted">{{ formatOrderDate(order.createdAt) }}</span>
            </p>
            <p class="mt-1 text-sm text-ink-muted">{{ describeOrderItems(order) }}</p>
            <p class="mt-1 text-sm text-ink-muted">{{ order.deliveryLabel }} ·{{ formatCurrency(order.total) }}</p>
          </div>
          <a :href="buildWhatsappUrl(order.message)" target="_blank" rel="noopener noreferrer" class="link-accent shrink-0 text-sm">
            Enviar de novo
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
