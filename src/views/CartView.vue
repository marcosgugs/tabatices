<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useOrdersStore } from '@/stores/orders'
import { storeConfig } from '@/config/store'
import { formatCurrency } from '@/composables/useCurrency'
import { formatCep, useDeliveryLookup } from '@/composables/useDeliveryLookup'
import { getShippingFee } from '@/composables/useShippingRate'
import { buildOrderMessage, buildWhatsappUrl, deliveryLabels, generateOrderCode } from '@/composables/useWhatsappCheckout'
import CartLineItem from '@/components/CartLineItem.vue'
import IconWhatsapp from '@/components/IconWhatsapp.vue'
import { publicAsset } from '@/composables/usePublicAsset'
import type { DeliveryMethod, ShippingAddress } from '@/types/cart'
import type { Order } from '@/types/order'

interface DeliveryChoice {
  method: DeliveryMethod
  title: string
  description: string
  priceLabel: string
}

const cartStore = useCartStore()
const { items, subtotal, itemCount } = storeToRefs(cartStore)
const ordersStore = useOrdersStore()
const { orders } = storeToRefs(ordersStore)
const { address, isLoading, errorMessage, isLocalDelivery, lookup, reset } = useDeliveryLookup()

const customerName = ref('')
const cep = ref('')
const deliveryMethod = ref<DeliveryMethod | null>(null)
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

const shippingFee = computed(() => (address.value ? getShippingFee(address.value.state) : 0))

const deliveryChoices = computed<DeliveryChoice[]>(() => {
  if (!address.value) return []

  if (isLocalDelivery.value) {
    return [
      {
        method: 'local',
        title: 'Entrega local',
        description: `Levamos até você em ${storeConfig.localDelivery.city}.`,
        priceLabel: formatCurrency(storeConfig.localDelivery.fee),
      },
      {
        method: 'pickup',
        title: 'Retirada',
        description: storeConfig.pickupAddressHint,
        priceLabel: 'Grátis',
      },
    ]
  }

  return [
    {
      method: 'correios',
      title: 'Correios',
      description: `Envio para ${address.value.city}/${address.value.state}.`,
      priceLabel: formatCurrency(shippingFee.value),
    },
  ]
})

const deliveryFee = computed(() => {
  if (deliveryMethod.value === 'local') return storeConfig.localDelivery.fee
  if (deliveryMethod.value === 'correios') return shippingFee.value
  return 0
})
const total = computed(() => subtotal.value + deliveryFee.value)
const pixTotal = computed(() => subtotal.value * (1 - storeConfig.pixDiscountPercent / 100) + deliveryFee.value)
const requiresAddress = computed(() => deliveryMethod.value !== null && deliveryMethod.value !== 'pickup')

const isAddressComplete = computed(
  () =>
    !requiresAddress.value ||
    [shippingAddress.street, shippingAddress.number, shippingAddress.district].every((value) => value.trim().length > 0),
)

const pendingRequirement = computed(() => {
  if (customerName.value.trim().length < 2) return 'Preencha seu nome.'
  if (!deliveryMethod.value) return 'Informe seu CEP e escolha a entrega.'
  if (!isAddressComplete.value) return 'Complete o endereço de entrega.'
  return ''
})

const justPlacedOrder = computed(() => (items.value.length === 0 ? lastOrder.value : null))

const canCheckout = computed(() => items.value.length > 0 && !pendingRequirement.value)

watch(deliveryChoices, (choices) => {
  deliveryMethod.value = choices.length === 1 ? choices[0].method : null
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
  if (!canCheckout.value || !deliveryMethod.value) return

  const orderCode = generateOrderCode()
  const message = buildOrderMessage(orderCode, {
    customerName: customerName.value,
    items: items.value,
    subtotal: subtotal.value,
    deliveryMethod: deliveryMethod.value,
    deliveryFee: deliveryFee.value,
    address: requiresAddress.value ? { ...shippingAddress } : null,
  })

  const order: Order = {
    code: orderCode,
    createdAt: new Date().toISOString(),
    items: items.value.map((item) => ({ ...item })),
    deliveryMethod: deliveryMethod.value,
    total: total.value,
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
    <h1 class="text-4xl font-semibold tracking-[-0.025em] text-forest sm:text-5xl">Seu carrinho.</h1>

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
          </form>

          <div v-if="deliveryChoices.length" role="radiogroup" aria-label="Forma de entrega" class="mt-4 space-y-2">
            <button
              v-for="choice in deliveryChoices"
              :key="choice.method"
              type="button"
              role="radio"
              :aria-checked="deliveryMethod === choice.method"
              class="flex w-full items-start justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition duration-300 ease-apple"
              :class="deliveryMethod === choice.method ? 'border-forest bg-forest/[0.04]' : 'border-line hover:border-forest/30'"
              @click="deliveryMethod = choice.method"
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

          <dl class="mt-8 space-y-3 border-t border-line pt-6 text-[15px]">
            <div class="flex justify-between">
              <dt class="text-ink-muted">Subtotal ({{ itemCount }} {{ itemCount === 1 ? 'item' : 'itens' }})</dt>
              <dd class="text-ink">{{ formatCurrency(subtotal) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-ink-muted">Entrega</dt>
              <dd class="text-ink">
                {{ deliveryMethod ? formatCurrency(deliveryFee) : '—' }}
              </dd>
            </div>
            <div class="flex justify-between pt-3 text-lg font-semibold">
              <dt class="text-ink">Total</dt>
              <dd class="text-ink">{{ formatCurrency(total) }}</dd>
            </div>
            <p class="text-right text-sm text-terracotta">{{ formatCurrency(pixTotal) }} no Pix</p>
          </dl>

          <button type="button" class="button-primary mt-8 h-13 w-full text-base" :disabled="!canCheckout" @click="checkout">
            <IconWhatsapp class="size-5" />
            Finalizar pedido
          </button>
          <p v-if="pendingRequirement" class="mt-3 text-center text-sm text-ink-muted">{{ pendingRequirement }}</p>
        </div>

        <p class="mt-5 px-2 text-sm leading-relaxed text-ink-muted">
          Pagamento por Pix ({{ storeConfig.pixDiscountPercent }}% off) ou cartão. A produção começa após a confirmação do pagamento.
        </p>
      </aside>
    </div>

    <section v-if="orders.length" class="mt-20" aria-labelledby="order-history-title">
      <h2 id="order-history-title" class="text-2xl font-semibold tracking-tight text-forest">Seus pedidos.</h2>
      <ul class="mt-6 divide-y divide-line border-y border-line">
        <li v-for="order in orders" :key="order.code" class="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div class="min-w-0">
            <p class="text-[15px] font-semibold text-ink">
              {{ order.code }}
              <span class="ml-2 font-normal text-ink-muted">{{ formatOrderDate(order.createdAt) }}</span>
            </p>
            <p class="mt-1 text-sm text-ink-muted">{{ describeOrderItems(order) }}</p>
            <p class="mt-1 text-sm text-ink-muted">{{ deliveryLabels[order.deliveryMethod] }} · {{ formatCurrency(order.total) }}</p>
          </div>
          <a :href="buildWhatsappUrl(order.message)" target="_blank" rel="noopener noreferrer" class="link-accent shrink-0 text-sm">
            Enviar de novo
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>
