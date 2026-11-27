<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCustomersStore } from '@/stores/customers'
import { usePanelOrdersStore } from '@/stores/panelOrders'
import { findProductBySlug, products } from '@/data/products'
import { orderStatuses } from '@/data/orderStatuses'
import { formatCurrency } from '@/composables/useCurrency'
import { publicAsset } from '@/composables/usePublicAsset'
import { generateOrderCode } from '@/composables/useWhatsappCheckout'
import { calculateSubtotal } from '@/composables/useOrderSummary'
import { parseOrderMessage, type ParsedOrderMessage } from '@/composables/useOrderMessageParser'
import { calculateChargedTotal, describePaymentAdjustment } from '@/composables/usePayment'
import { formatCpf } from '@/composables/useCpf'
import { buildPhoneWhatsappUrl } from '@/composables/usePhone'
import { buildCustomerMessage, customerMessageOptions, findMessageKindForStatus } from '@/composables/useCustomerMessages'
import SegmentedControl from '@/components/SegmentedControl.vue'
import QuantityStepper from '@/components/QuantityStepper.vue'
import PaymentMethodPicker from '@/components/PaymentMethodPicker.vue'
import IconWhatsapp from '@/components/IconWhatsapp.vue'
import type { CustomerDraft, PanelOrderDraft } from '@/types/panel'

const orderCodePattern = /^[A-Z0-9-]{3,20}$/
const halfCent = 0.005

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const { customers } = storeToRefs(customersStore)
const panelOrdersStore = usePanelOrdersStore()

const isEditing = route.name === 'panel-order'
const editedOrder = isEditing ? panelOrdersStore.findOrderByCode(String(route.params.code)) : undefined
const isOrderMissing = isEditing && !editedOrder
const preselectedCustomerId = typeof route.query.cliente === 'string' && customersStore.findCustomer(route.query.cliente) ? route.query.cliente : ''

const draft = reactive<PanelOrderDraft>({
  code: editedOrder?.code ?? generateOrderCode(),
  customerId: editedOrder?.customerId ?? preselectedCustomerId,
  status: editedOrder?.status ?? 'awaiting_payment',
  items: editedOrder?.items.map((item) => ({ ...item })) ?? [],
  shippingFee: editedOrder?.shippingFee ?? 0,
  payment: editedOrder?.payment ? { ...editedOrder.payment } : null,
  trackingCode: editedOrder?.trackingCode ?? '',
  notes: editedOrder?.notes ?? '',
})

const selectedMessageKind = ref(findMessageKindForStatus(draft.status))

const isPastingMessage = ref(!isEditing && !preselectedCustomerId)
const orderMessage = ref('')
const messageErrorMessage = ref('')
const messageField = ref<HTMLTextAreaElement | null>(null)
const importedMessage = ref<ParsedOrderMessage | null>(null)
const newCustomer = ref<CustomerDraft | null>(null)

const selectedSlug = ref(products[0].slug)
const selectedPaper = ref('')
const itemQuantity = ref(1)
const itemUnitPrice = ref<number | ''>('')
const isSaving = ref(false)
const saveErrorMessage = ref('')

const selectedProduct = computed(() => findProductBySlug(selectedSlug.value) ?? products[0])
const paperLabels = computed(() => selectedProduct.value.paperOptions.map((option) => option.label))

const suggestedUnitPrice = computed(() => {
  const paperOption = selectedProduct.value.paperOptions.find((option) => option.label === selectedPaper.value)
  return (selectedProduct.value.price ?? 0) + (paperOption?.priceDelta ?? 0)
})

const canAddItem = computed(() => Number(itemUnitPrice.value) > 0)
const normalizedCode = computed(() => draft.code.trim().toUpperCase())
const shippingFeeValue = computed(() => Number(draft.shippingFee) || 0)
const subtotal = computed(() => calculateSubtotal(draft.items))
const total = computed(() => subtotal.value + shippingFeeValue.value)
const paymentBase = computed(() => ({ subtotal: subtotal.value, shippingFee: shippingFeeValue.value }))
const chargedTotal = computed(() => calculateChargedTotal(paymentBase.value, draft.payment))
const paymentAdjustment = computed(() => describePaymentAdjustment(paymentBase.value, draft.payment))
const pendingNewCustomer = computed(() => (draft.customerId ? null : newCustomer.value))
const hasPendingCustomerDetails = computed(() => Boolean(pendingNewCustomer.value?.address || pendingNewCustomer.value?.cpf))
const selectedCustomer = computed(() => customersStore.findCustomer(draft.customerId))
const customerWhatsapp = computed(() => selectedCustomer.value?.whatsapp ?? '')

const customerMessage = computed(() =>
  buildCustomerMessage(selectedMessageKind.value, {
    customerName: selectedCustomer.value?.name ?? pendingNewCustomer.value?.name ?? '',
    order: draft,
  }),
)

const customerMessageUrl = computed(() => buildPhoneWhatsappUrl(customerWhatsapp.value, customerMessage.value))

const duplicateOrder = computed(() => {
  const existingOrder = panelOrdersStore.findOrderByCode(normalizedCode.value)
  return existingOrder && existingOrder.id !== editedOrder?.id ? existingOrder : undefined
})

const importWarnings = computed(() => {
  if (!importedMessage.value) return []

  const { code, items, shippingFee, payment, customerCpf, total: messageTotal } = importedMessage.value
  const unknownItemNames = draft.items.filter((item) => !item.slug).map((item) => item.name)
  const registeredCpf = selectedCustomer.value?.cpf
  const warnings: string[] = []

  if (!code) warnings.push('Não achei o número do pedido na mensagem, então gerei um novo.')
  if (items.length === 0) warnings.push('Não achei os itens na mensagem.')
  if (shippingFee === null) warnings.push('Não achei o frete na mensagem.')
  if (!payment) warnings.push('Não achei a forma de pagamento na mensagem.')
  if (customerCpf && registeredCpf && customerCpf !== registeredCpf) {
    warnings.push(`O CPF da mensagem (${formatCpf(customerCpf)}) é diferente do que está no cadastro do cliente.`)
  }
  if (unknownItemNames.length) {
    warnings.push(`Fora do catálogo: ${unknownItemNames.join(', ')}. Entrou com o nome e o preço da mensagem.`)
  }
  if (messageTotal !== null && Math.abs(messageTotal - total.value) > halfCent) {
    warnings.push(`O total da mensagem é ${formatCurrency(messageTotal)}, mas itens + frete somam ${formatCurrency(total.value)}.`)
  }

  return warnings
})

const pendingRequirement = computed(() => {
  if (!orderCodePattern.test(normalizedCode.value)) return 'Informe o número do pedido (letras, números e hífen).'
  if (duplicateOrder.value) return 'Esse número de pedido já está cadastrado.'
  if (!draft.customerId && !newCustomer.value) return 'Escolha o cliente.'
  if (draft.items.length === 0) return 'Adicione pelo menos um item.'
  if (Number(draft.shippingFee) < 0) return 'Confira o valor do frete.'
  return ''
})

const isSaveDisabled = computed(() => Boolean(pendingRequirement.value) || isSaving.value)

watch(
  selectedProduct,
  (product) => {
    selectedPaper.value = product.paperOptions[0]?.label ?? ''
    itemQuantity.value = 1
  },
  { immediate: true },
)

watch(
  suggestedUnitPrice,
  (price) => {
    itemUnitPrice.value = price > 0 ? price : ''
  },
  { immediate: true },
)

watch(
  () => draft.status,
  (status) => {
    selectedMessageKind.value = findMessageKindForStatus(status)
  },
)

watch(isPastingMessage, async (isPasting) => {
  if (!isPasting) return
  await nextTick()
  messageField.value?.focus()
})

onMounted(() => messageField.value?.focus())

function fillFromMessage(): void {
  const parsedMessage = parseOrderMessage(orderMessage.value)

  if (!parsedMessage) {
    messageErrorMessage.value = 'Não reconheci essa mensagem. Cole a mensagem completa do pedido feito pelo site.'
    return
  }

  const matchedCustomer = parsedMessage.customerName ? customersStore.findCustomerByName(parsedMessage.customerName) : undefined

  Object.assign(draft, {
    code: parsedMessage.code ?? draft.code,
    customerId: matchedCustomer?.id ?? '',
    items: parsedMessage.items,
    shippingFee: parsedMessage.shippingFee ?? 0,
    payment: parsedMessage.payment,
    notes: parsedMessage.shippingLabel ?? '',
  })

  newCustomer.value =
    !matchedCustomer && parsedMessage.customerName
      ? { name: parsedMessage.customerName, whatsapp: '', cpf: parsedMessage.customerCpf ?? '', address: parsedMessage.address, notes: '' }
      : null

  importedMessage.value = parsedMessage
  messageErrorMessage.value = ''
  isPastingMessage.value = false
}

function handleMessagePaste(event: ClipboardEvent): void {
  const pastedText = event.clipboardData?.getData('text/plain') ?? ''
  if (orderMessage.value.trim() || !parseOrderMessage(pastedText)) return

  event.preventDefault()
  orderMessage.value = pastedText
  fillFromMessage()
}

function reopenMessage(): void {
  orderMessage.value = ''
  messageErrorMessage.value = ''
  isPastingMessage.value = true
}

function addItem(): void {
  if (!canAddItem.value) return
  const product = selectedProduct.value

  draft.items.push({
    id: crypto.randomUUID(),
    slug: product.slug,
    name: product.name,
    image: product.image,
    paper: selectedPaper.value,
    unitPrice: Number(itemUnitPrice.value),
    quantity: itemQuantity.value,
  })

  itemQuantity.value = 1
}

function removeItem(id: string): void {
  draft.items = draft.items.filter((item) => item.id !== id)
}

async function completeCustomerCpf(): Promise<void> {
  const customer = selectedCustomer.value
  const importedCpf = importedMessage.value?.customerCpf
  if (!customer || customer.cpf || !importedCpf) return

  const { id, createdAt, ...customerDraft } = customer
  await customersStore.updateCustomer(id, { ...customerDraft, cpf: importedCpf })
}

async function save(): Promise<void> {
  if (pendingRequirement.value || isSaving.value) return

  isSaving.value = true
  saveErrorMessage.value = ''

  try {
    if (!draft.customerId && newCustomer.value) {
      const customer = await customersStore.createCustomer(newCustomer.value)
      draft.customerId = customer.id
      newCustomer.value = null
    }

    await completeCustomerCpf()

    const orderDraft: PanelOrderDraft = {
      ...draft,
      code: normalizedCode.value,
      shippingFee: shippingFeeValue.value,
      trackingCode: draft.trackingCode.trim(),
      notes: draft.notes.trim(),
    }

    if (editedOrder) await panelOrdersStore.updateOrder(editedOrder.id, orderDraft)
    else await panelOrdersStore.createOrder(orderDraft)
    router.push({ name: 'panel-orders' })
  } catch (error) {
    saveErrorMessage.value = (error as Error).message
  } finally {
    isSaving.value = false
  }
}

async function deleteOrder(): Promise<void> {
  if (!editedOrder || isSaving.value) return
  if (!window.confirm(`Excluir o pedido ${editedOrder.code}? Essa ação não pode ser desfeita.`)) return

  isSaving.value = true
  saveErrorMessage.value = ''

  try {
    await panelOrdersStore.deleteOrder(editedOrder.id)
    router.push({ name: 'panel-orders' })
  } catch (error) {
    saveErrorMessage.value = (error as Error).message
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="isOrderMissing" class="flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-16 text-center">
    <p class="text-xl font-semibold tracking-tight text-ink">Pedido não encontrado.</p>
    <RouterLink :to="{ name: 'panel-orders' }" class="button-primary mt-8">Voltar para pedidos</RouterLink>
  </div>

  <div v-else>
    <RouterLink :to="{ name: 'panel-orders' }" class="link-accent text-sm">← Pedidos</RouterLink>
    <h1 class="mt-3 text-4xl font-semibold tracking-[-0.025em] text-forest">
      {{ editedOrder ? `Pedido ${editedOrder.code}` : 'Novo pedido' }}
    </h1>

    <section v-if="isPastingMessage" class="mt-10 max-w-3xl rounded-[32px] bg-white/70 p-6 sm:p-8">
      <label for="order-message" class="text-[15px] font-semibold text-ink">Mensagem do WhatsApp</label>
      <p class="mt-1 text-sm text-ink-muted">Cole a mensagem do pedido que chegou pelo WhatsApp e o formulário é preenchido sozinho.</p>
      <textarea
        id="order-message"
        ref="messageField"
        v-model="orderMessage"
        rows="12"
        placeholder="Olá! Quero fazer um pedido na Tabatices…"
        class="field mt-4 resize-y"
        @paste="handleMessagePaste"
      ></textarea>
      <p v-if="messageErrorMessage" class="mt-2 text-sm text-terracotta" role="alert">{{ messageErrorMessage }}</p>

      <div class="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button type="button" class="button-primary" :disabled="!orderMessage.trim()" @click="fillFromMessage">Preencher pedido</button>
        <button type="button" class="link-accent text-sm" @click="isPastingMessage = false">Preencher manualmente</button>
      </div>
    </section>

    <form v-else class="mt-10" novalidate @submit.prevent="save">
      <div v-if="importedMessage" class="mb-10 rounded-[28px] border border-line bg-white/60 p-5 sm:p-6" role="status">
        <p class="text-[15px] font-semibold text-ink">Pedido preenchido pela mensagem. Confira antes de salvar.</p>
        <ul v-if="importWarnings.length" class="mt-2 space-y-1 text-sm text-terracotta">
          <li v-for="warning in importWarnings" :key="warning">{{ warning }}</li>
        </ul>
        <button type="button" class="link-accent mt-3 text-sm" @click="reopenMessage">Colar outra mensagem</button>
      </div>

      <button v-else-if="!editedOrder" type="button" class="link-accent -mt-4 mb-10 block text-sm" @click="reopenMessage">
        Colar mensagem do WhatsApp
      </button>

      <div class="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div class="min-w-0 space-y-8">
          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label for="order-code" class="text-[15px] font-semibold text-ink">Número do pedido</label>
              <input
                id="order-code"
                v-model="draft.code"
                type="text"
                autocomplete="off"
                autocapitalize="characters"
                spellcheck="false"
                maxlength="20"
                class="field mt-3 uppercase"
              />
              <p v-if="duplicateOrder" class="mt-2 text-sm text-terracotta" role="alert">
                Esse pedido já está cadastrado.
                <RouterLink :to="{ name: 'panel-order', params: { code: duplicateOrder.code } }" class="font-medium underline">Ver pedido</RouterLink>
              </p>
              <p v-else class="mt-2 text-sm text-ink-muted">Veio pelo site? Use o número da mensagem do WhatsApp.</p>
            </div>

            <div>
              <div class="flex items-baseline justify-between gap-3">
                <label for="order-customer" class="text-[15px] font-semibold text-ink">Cliente</label>
                <RouterLink v-if="!editedOrder" :to="{ name: 'panel-customer-new', query: { pedido: 'novo' } }" class="link-accent text-sm">
                  Cadastrar cliente
                </RouterLink>
              </div>
              <p v-if="pendingNewCustomer" class="mt-3 rounded-2xl border border-dashed border-forest/30 bg-forest/[0.04] px-4 py-3 text-sm text-ink">
                Ainda não há cadastro de <span class="font-semibold">{{ pendingNewCustomer.name }}</span>. Ele é criado ao salvar o
                pedido<template v-if="hasPendingCustomerDetails">, com os dados da mensagem</template>.
              </p>
              <select id="order-customer" v-model="draft.customerId" class="field mt-3">
                <option value="" disabled>{{ newCustomer ? 'Ou escolha um cliente cadastrado' : 'Escolha o cliente' }}</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
              </select>
            </div>
          </div>

          <div>
            <p id="order-status-label" class="text-[15px] font-semibold text-ink">Status</p>
            <div role="radiogroup" aria-labelledby="order-status-label" class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="statusOption in orderStatuses"
                :key="statusOption.value"
                type="button"
                role="radio"
                :aria-checked="draft.status === statusOption.value"
                class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition duration-300 ease-apple"
                :class="draft.status === statusOption.value ? 'border-forest bg-forest/[0.04] text-ink' : 'border-line text-ink-muted hover:border-forest/30 hover:text-ink'"
                @click="draft.status = statusOption.value"
              >
                <span class="size-2 rounded-full" :class="statusOption.dotClass" aria-hidden="true"></span>
                {{ statusOption.label }}
              </button>
            </div>
          </div>

          <div>
            <p class="text-[15px] font-semibold text-ink">Itens</p>

            <ul v-if="draft.items.length" class="mt-3 divide-y divide-line border-y border-line">
              <li v-for="item in draft.items" :key="item.id" class="flex gap-4 py-4">
                <img v-if="item.image" :src="publicAsset(item.image)" alt="" width="48" height="60" class="h-15 w-12 shrink-0 rounded-xl object-cover" />
                <span v-else class="h-15 w-12 shrink-0 rounded-xl bg-cream-deep" aria-hidden="true"></span>
                <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div class="min-w-0">
                    <p class="font-medium text-ink">{{ item.name }}</p>
                    <p class="mt-0.5 text-sm text-ink-muted">
                      <template v-if="item.paper">Miolo {{ item.paper.toLowerCase() }} · </template>{{ formatCurrency(item.unitPrice) }} cada
                    </p>
                  </div>
                  <div class="flex items-center gap-4">
                    <QuantityStepper v-model="item.quantity" size="compact" />
                    <button type="button" class="text-sm text-ink-muted transition-colors hover:text-terracotta" @click="removeItem(item.id)">
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            </ul>

            <div class="mt-4 rounded-[28px] border border-line p-4 sm:p-5">
              <label for="item-product" class="sr-only">Produto</label>
              <select id="item-product" v-model="selectedSlug" class="field">
                <option v-for="product in products" :key="product.slug" :value="product.slug">{{ product.name }}</option>
              </select>

              <SegmentedControl v-if="paperLabels.length" v-model="selectedPaper" :options="paperLabels" label="Miolo" class="mt-3" />

              <div class="mt-3 flex flex-wrap items-center gap-3">
                <QuantityStepper v-model="itemQuantity" size="compact" />
                <label class="min-w-32 flex-1">
                  <span class="sr-only">Preço unitário</span>
                  <input
                    v-model.number="itemUnitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    inputmode="decimal"
                    placeholder="Preço unitário"
                    class="field"
                    @keydown.enter.prevent="addItem"
                  />
                </label>
                <button type="button" class="button-secondary px-5 disabled:opacity-40" :disabled="!canAddItem" @click="addItem">Adicionar</button>
              </div>
              <p v-if="!canAddItem" class="mt-2 text-sm text-ink-muted">Informe o preço combinado para adicionar.</p>
            </div>
          </div>

          <div>
            <label for="order-notes" class="text-[15px] font-semibold text-ink">Observações</label>
            <textarea
              id="order-notes"
              v-model="draft.notes"
              rows="3"
              placeholder="Forma de entrega, combinados…"
              class="field mt-3 resize-y"
            ></textarea>
          </div>

          <div>
            <label for="order-tracking-code" class="text-[15px] font-semibold text-ink">Código de rastreio</label>
            <input
              id="order-tracking-code"
              v-model="draft.trackingCode"
              type="text"
              autocomplete="off"
              spellcheck="false"
              maxlength="60"
              placeholder="Preencha quando enviar o pedido"
              class="field mt-3"
            />
          </div>

          <div>
            <p id="customer-message-label" class="text-[15px] font-semibold text-ink">Mensagem para o cliente</p>
            <div role="radiogroup" aria-labelledby="customer-message-label" class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="messageOption in customerMessageOptions"
                :key="messageOption.kind"
                type="button"
                role="radio"
                :aria-checked="selectedMessageKind === messageOption.kind"
                class="rounded-full border px-4 py-2 text-[14px] font-medium transition duration-300 ease-apple"
                :class="selectedMessageKind === messageOption.kind ? 'border-forest bg-forest/[0.04] text-ink' : 'border-line text-ink-muted hover:border-forest/30 hover:text-ink'"
                @click="selectedMessageKind = messageOption.kind"
              >
                {{ messageOption.label }}
              </button>
            </div>
            <p class="mt-3 rounded-[28px] border border-line bg-white/60 p-5 text-[15px] leading-relaxed whitespace-pre-line text-ink">{{ customerMessage }}</p>
            <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a :href="customerMessageUrl" target="_blank" rel="noopener noreferrer" class="button-primary">
                <IconWhatsapp class="size-5" />
                Enviar no WhatsApp
              </a>
              <p v-if="!customerWhatsapp" class="text-sm text-ink-muted">Cliente sem WhatsApp no cadastro: você escolhe o contato ao abrir.</p>
            </div>
          </div>
        </div>

        <aside class="min-w-0 lg:sticky lg:top-8 lg:self-start">
          <div class="rounded-[32px] bg-white/70 p-6 sm:p-8">
            <label for="order-shipping" class="text-[15px] font-semibold text-ink">Frete</label>
            <input
              id="order-shipping"
              v-model.number="draft.shippingFee"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              class="field mt-3"
            />

            <fieldset class="mt-6">
              <legend class="text-[15px] font-semibold text-ink">Pagamento</legend>
              <PaymentMethodPicker v-model="draft.payment" :subtotal="subtotal" :shipping-fee="shippingFeeValue" class="mt-3" />
            </fieldset>

            <dl class="mt-8 space-y-3 border-t border-line pt-6 text-[15px]">
              <div class="flex justify-between">
                <dt class="text-ink-muted">Itens</dt>
                <dd class="text-ink">{{ formatCurrency(subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-ink-muted">Frete</dt>
                <dd class="text-ink">{{ formatCurrency(shippingFeeValue) }}</dd>
              </div>
              <div v-if="paymentAdjustment" class="flex justify-between">
                <dt class="text-ink-muted">{{ paymentAdjustment.label }}</dt>
                <dd :class="paymentAdjustment.amount < 0 ? 'text-terracotta' : 'text-ink'">{{ formatCurrency(paymentAdjustment.amount) }}</dd>
              </div>
              <div class="flex justify-between pt-3 text-lg font-semibold">
                <dt class="text-ink">Total</dt>
                <dd class="text-ink">{{ formatCurrency(chargedTotal) }}</dd>
              </div>
            </dl>

            <button type="submit" class="button-primary mt-8 h-13 w-full text-base" :disabled="isSaveDisabled">
              {{ isSaving ? 'Salvando…' : 'Salvar pedido' }}
            </button>
            <p v-if="saveErrorMessage" class="mt-3 text-center text-sm text-terracotta" role="alert">{{ saveErrorMessage }}</p>
            <p v-else-if="pendingRequirement" class="mt-3 text-center text-sm text-ink-muted">{{ pendingRequirement }}</p>
          </div>

          <button
            v-if="editedOrder"
            type="button"
            class="mt-5 w-full text-sm text-ink-muted transition-colors hover:text-terracotta disabled:opacity-40"
            :disabled="isSaving"
            @click="deleteOrder"
          >
            Excluir pedido
          </button>
        </aside>
      </div>
    </form>
  </div>
</template>
