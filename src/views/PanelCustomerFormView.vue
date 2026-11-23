<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCustomersStore } from '@/stores/customers'
import { usePanelOrdersStore } from '@/stores/panelOrders'
import { formatCep, onlyDigits, useDeliveryLookup } from '@/composables/useDeliveryLookup'
import { formatPhone, isValidPhone } from '@/composables/usePhone'
import { formatCurrency } from '@/composables/useCurrency'
import { calculateTotal, formatOrderDate } from '@/composables/useOrderSummary'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import type { ShippingAddress } from '@/types/cart'
import type { CustomerDraft } from '@/types/panel'

const cepLength = 8

const route = useRoute()
const router = useRouter()
const customersStore = useCustomersStore()
const panelOrdersStore = usePanelOrdersStore()
const { orders } = storeToRefs(panelOrdersStore)
const { address: foundAddress, isLoading: isLookingUpCep, errorMessage: cepErrorMessage, lookup } = useDeliveryLookup()

const isEditing = route.name === 'panel-customer'
const editedCustomer = isEditing ? customersStore.findCustomer(String(route.params.id)) : undefined
const isCustomerMissing = isEditing && !editedCustomer
const returnsToNewOrder = route.query.pedido === 'novo'
const backLink: { to: RouteLocationRaw; label: string } = returnsToNewOrder
  ? { to: { name: 'panel-order-new' }, label: '← Novo pedido' }
  : { to: { name: 'panel-customers' }, label: '← Clientes' }

const name = ref(editedCustomer?.name ?? '')
const whatsapp = ref(formatPhone(editedCustomer?.whatsapp ?? ''))
const notes = ref(editedCustomer?.notes ?? '')
const isSaving = ref(false)
const saveErrorMessage = ref('')

const address = reactive<ShippingAddress>({
  cep: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  ...editedCustomer?.address,
})

const customerOrders = computed(() =>
  editedCustomer ? orders.value.filter((order) => order.customerId === editedCustomer.id) : [],
)

const deletionBlocker = computed(() => {
  const orderCount = customerOrders.value.length
  if (orderCount === 0) return ''
  return orderCount === 1
    ? 'Tem 1 pedido vinculado. Exclua o pedido antes de excluir o cadastro.'
    : `Tem ${orderCount} pedidos vinculados. Exclua os pedidos antes de excluir o cadastro.`
})

const pendingRequirement = computed(() => {
  if (name.value.trim().length < 2) return 'Preencha o nome do cliente.'
  if (whatsapp.value && !isValidPhone(whatsapp.value)) return 'Confira o WhatsApp com DDD.'
  return ''
})

const isSaveDisabled = computed(() => Boolean(pendingRequirement.value) || isSaving.value)
const isDeleteDisabled = computed(() => isSaving.value || Boolean(deletionBlocker.value))

watch(foundAddress, (found) => {
  if (!found) return
  Object.assign(address, { cep: found.cep, street: found.street, district: found.district, city: found.city, state: found.state })
})

function handleWhatsappInput(event: Event): void {
  whatsapp.value = formatPhone((event.target as HTMLInputElement).value)
}

function handleCepInput(event: Event): void {
  address.cep = formatCep((event.target as HTMLInputElement).value)
  if (onlyDigits(address.cep).length === cepLength) lookup(address.cep)
}

function buildAddress(): ShippingAddress | null {
  const trimmedAddress: ShippingAddress = {
    cep: address.cep.trim(),
    street: address.street.trim(),
    number: address.number.trim(),
    complement: address.complement.trim(),
    district: address.district.trim(),
    city: address.city.trim(),
    state: address.state.trim().toUpperCase(),
  }

  return Object.values(trimmedAddress).some((value) => value.length > 0) ? trimmedAddress : null
}

async function save(): Promise<void> {
  if (pendingRequirement.value || isSaving.value) return

  isSaving.value = true
  saveErrorMessage.value = ''

  const customerDraft: CustomerDraft = {
    name: name.value.trim(),
    whatsapp: onlyDigits(whatsapp.value),
    address: buildAddress(),
    notes: notes.value.trim(),
  }

  try {
    if (editedCustomer) {
      await customersStore.updateCustomer(editedCustomer.id, customerDraft)
      router.push({ name: 'panel-customers' })
      return
    }

    const customer = await customersStore.createCustomer(customerDraft)
    router.push(returnsToNewOrder ? { name: 'panel-order-new', query: { cliente: customer.id } } : { name: 'panel-customers' })
  } catch (error) {
    saveErrorMessage.value = (error as Error).message
  } finally {
    isSaving.value = false
  }
}

async function deleteCustomer(): Promise<void> {
  if (!editedCustomer || isDeleteDisabled.value) return
  if (!window.confirm(`Excluir o cadastro de ${editedCustomer.name}? Essa ação não pode ser desfeita.`)) return

  isSaving.value = true
  saveErrorMessage.value = ''

  try {
    await customersStore.deleteCustomer(editedCustomer.id)
    router.push({ name: 'panel-customers' })
  } catch (error) {
    saveErrorMessage.value = (error as Error).message
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div v-if="isCustomerMissing" class="flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-16 text-center">
    <p class="text-xl font-semibold tracking-tight text-ink">Cliente não encontrado.</p>
    <RouterLink :to="{ name: 'panel-customers' }" class="button-primary mt-8">Voltar para clientes</RouterLink>
  </div>

  <div v-else>
    <RouterLink :to="backLink.to" class="link-accent text-sm">{{ backLink.label }}</RouterLink>
    <h1 class="mt-3 text-4xl font-semibold tracking-[-0.025em] text-forest">{{ editedCustomer ? editedCustomer.name : 'Novo cliente' }}</h1>

    <div class="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <form class="min-w-0 space-y-8" novalidate @submit.prevent="save">
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label for="customer-name" class="text-[15px] font-semibold text-ink">Nome</label>
            <input id="customer-name" v-model="name" type="text" autocomplete="off" maxlength="120" class="field mt-3" />
          </div>

          <div>
            <label for="customer-whatsapp" class="text-[15px] font-semibold text-ink">WhatsApp</label>
            <input
              id="customer-whatsapp"
              :value="whatsapp"
              type="tel"
              inputmode="numeric"
              autocomplete="off"
              placeholder="(11) 91234-5678"
              class="field mt-3"
              @input="handleWhatsappInput"
            />
          </div>
        </div>

        <fieldset>
          <legend class="text-[15px] font-semibold text-ink">Endereço de entrega</legend>
          <div class="mt-3 grid grid-cols-6 gap-2">
            <label class="col-span-6 sm:col-span-2">
              <span class="sr-only">CEP</span>
              <input
                :value="address.cep"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="9"
                placeholder="CEP"
                class="field"
                @input="handleCepInput"
              />
            </label>
            <label class="col-span-6 sm:col-span-4">
              <span class="sr-only">Rua</span>
              <input v-model="address.street" type="text" autocomplete="off" placeholder="Rua" class="field" />
            </label>
            <label class="col-span-2">
              <span class="sr-only">Número</span>
              <input v-model="address.number" type="text" autocomplete="off" placeholder="Número" class="field" />
            </label>
            <label class="col-span-4">
              <span class="sr-only">Complemento</span>
              <input v-model="address.complement" type="text" autocomplete="off" placeholder="Complemento" class="field" />
            </label>
            <label class="col-span-6">
              <span class="sr-only">Bairro</span>
              <input v-model="address.district" type="text" autocomplete="off" placeholder="Bairro" class="field" />
            </label>
            <label class="col-span-4">
              <span class="sr-only">Cidade</span>
              <input v-model="address.city" type="text" autocomplete="off" placeholder="Cidade" class="field" />
            </label>
            <label class="col-span-2">
              <span class="sr-only">Estado</span>
              <input v-model="address.state" type="text" autocomplete="off" maxlength="2" placeholder="UF" class="field uppercase" />
            </label>
          </div>
          <p v-if="cepErrorMessage" class="mt-2 text-sm text-terracotta" role="alert">{{ cepErrorMessage }}</p>
          <p v-else-if="isLookingUpCep" class="mt-2 text-sm text-ink-muted" role="status">Buscando endereço…</p>
        </fieldset>

        <div>
          <label for="customer-notes" class="text-[15px] font-semibold text-ink">Observações</label>
          <textarea
            id="customer-notes"
            v-model="notes"
            rows="3"
            placeholder="Preferências, como conheceu a loja, combinados…"
            class="field mt-3 resize-y"
          ></textarea>
        </div>

        <div>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="submit" class="button-primary h-13 w-full text-base sm:w-auto sm:px-10" :disabled="isSaveDisabled">
              {{ isSaving ? 'Salvando…' : 'Salvar cliente' }}
            </button>
            <button
              v-if="editedCustomer"
              type="button"
              class="text-sm text-ink-muted transition-colors hover:text-terracotta disabled:opacity-40 disabled:hover:text-ink-muted"
              :disabled="isDeleteDisabled"
              @click="deleteCustomer"
            >
              Excluir cliente
            </button>
          </div>
          <p v-if="saveErrorMessage" class="mt-3 text-sm text-terracotta" role="alert">{{ saveErrorMessage }}</p>
          <p v-else-if="pendingRequirement" class="mt-3 text-sm text-ink-muted">{{ pendingRequirement }}</p>
          <p v-else-if="deletionBlocker" class="mt-3 text-sm text-ink-muted">{{ deletionBlocker }}</p>
        </div>
      </form>

      <aside v-if="editedCustomer" class="min-w-0 lg:sticky lg:top-8 lg:self-start">
        <div class="rounded-[32px] bg-white/70 p-6 sm:p-8">
          <div class="flex items-baseline justify-between gap-3">
            <h2 class="text-xl font-semibold tracking-tight text-forest">Pedidos</h2>
            <RouterLink :to="{ name: 'panel-order-new', query: { cliente: editedCustomer.id } }" class="link-accent text-sm">Novo pedido</RouterLink>
          </div>

          <ul v-if="customerOrders.length" class="mt-4 divide-y divide-line">
            <li v-for="order in customerOrders" :key="order.id">
              <RouterLink :to="{ name: 'panel-order', params: { code: order.code } }" class="group flex items-center justify-between gap-3 py-3">
                <span class="min-w-0">
                  <span class="block text-[15px] font-semibold text-ink transition-colors group-hover:text-terracotta">{{ order.code }}</span>
                  <span class="block text-sm text-ink-muted">{{ formatOrderDate(order.createdAt) }} · {{ formatCurrency(calculateTotal(order)) }}</span>
                </span>
                <OrderStatusBadge :status="order.status" />
              </RouterLink>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-ink-muted">Nenhum pedido ainda.</p>
        </div>
      </aside>
    </div>
  </div>
</template>
