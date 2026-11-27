<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCustomersStore } from '@/stores/customers'
import { usePanelOrdersStore } from '@/stores/panelOrders'
import { findNextStatus, orderStatuses } from '@/data/orderStatuses'
import { formatCurrency } from '@/composables/useCurrency'
import { calculateTotal, describeItems, formatOrderDate } from '@/composables/useOrderSummary'
import { describePayment } from '@/composables/usePayment'
import { matchesSearch } from '@/composables/useTextSearch'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import type { OrderStatus, OrderStatusOption, PanelOrder } from '@/types/panel'

type StatusFilter = OrderStatus | 'all'

interface StatusFilterOption {
  value: StatusFilter
  label: string
  count: number
}

interface OrderListItem {
  order: PanelOrder
  customerName: string
  nextStatus: OrderStatusOption | null
}

const customersStore = useCustomersStore()
const panelOrdersStore = usePanelOrdersStore()
const { orders } = storeToRefs(panelOrdersStore)

const searchTerm = ref('')
const statusFilter = ref<StatusFilter>('all')
const updatingOrderId = ref<string | null>(null)
const statusErrorMessage = ref('')

const searchedOrders = computed<OrderListItem[]>(() =>
  orders.value
    .map((order) => ({
      order,
      customerName: customersStore.findCustomer(order.customerId)?.name ?? '—',
      nextStatus: findNextStatus(order.status),
    }))
    .filter((listItem) => matchesSearch(searchTerm.value, [listItem.order.code, listItem.customerName])),
)

const statusFilters = computed<StatusFilterOption[]>(() => [
  { value: 'all', label: 'Todos', count: searchedOrders.value.length },
  ...orderStatuses.map((statusOption) => ({
    value: statusOption.value,
    label: statusOption.label,
    count: searchedOrders.value.filter((listItem) => listItem.order.status === statusOption.value).length,
  })),
])

const visibleOrders = computed(() =>
  statusFilter.value === 'all'
    ? searchedOrders.value
    : searchedOrders.value.filter((listItem) => listItem.order.status === statusFilter.value),
)

async function moveToStatus(order: PanelOrder, status: OrderStatus): Promise<void> {
  updatingOrderId.value = order.id
  statusErrorMessage.value = ''

  try {
    await panelOrdersStore.updateStatus(order.id, status)
  } catch (error) {
    statusErrorMessage.value = (error as Error).message
  } finally {
    updatingOrderId.value = null
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-4xl font-semibold tracking-[-0.025em] text-forest">Pedidos</h1>
      <RouterLink :to="{ name: 'panel-order-new' }" class="button-primary">Novo pedido</RouterLink>
    </div>

    <label for="order-search" class="sr-only">Buscar pedido</label>
    <input
      id="order-search"
      v-model="searchTerm"
      type="search"
      autocomplete="off"
      placeholder="Buscar por número ou nome do cliente"
      class="field mt-8"
    />

    <div role="radiogroup" aria-label="Filtrar por status" class="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        type="button"
        role="radio"
        :aria-checked="statusFilter === filter.value"
        class="shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition duration-300 ease-apple"
        :class="statusFilter === filter.value ? 'border-forest bg-forest text-cream' : 'border-line text-ink-muted hover:border-forest/30 hover:text-ink'"
        @click="statusFilter = filter.value"
      >
        {{ filter.label }}
        <span class="ml-1 tabular-nums opacity-70">{{ filter.count }}</span>
      </button>
    </div>

    <p v-if="statusErrorMessage" class="mt-4 text-sm text-terracotta" role="alert">{{ statusErrorMessage }}</p>

    <ul v-if="visibleOrders.length" class="mt-6 divide-y divide-line border-y border-line">
      <li
        v-for="listItem in visibleOrders"
        :key="listItem.order.id"
        class="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      >
        <RouterLink :to="{ name: 'panel-order', params: { code: listItem.order.code } }" class="group min-w-0 flex-1">
          <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span class="text-[15px] font-semibold text-ink transition-colors group-hover:text-terracotta">{{ listItem.order.code }}</span>
            <OrderStatusBadge :status="listItem.order.status" />
          </span>
          <span class="mt-1 block text-[15px] text-ink">{{ listItem.customerName }}</span>
          <span class="mt-1 block text-sm text-ink-muted">{{ describeItems(listItem.order.items) }}</span>
          <span class="mt-1 block text-sm text-ink-muted">
            {{ formatOrderDate(listItem.order.createdAt) }} · {{ formatCurrency(calculateTotal(listItem.order)) }}
            <template v-if="listItem.order.payment">· {{ describePayment(listItem.order.payment) }}</template>
          </span>
        </RouterLink>

        <button
          v-if="listItem.nextStatus"
          type="button"
          class="button-secondary shrink-0 px-5 py-2.5 text-sm disabled:opacity-40"
          :disabled="updatingOrderId === listItem.order.id"
          @click="moveToStatus(listItem.order, listItem.nextStatus.value)"
        >
          Mover para {{ listItem.nextStatus.label.toLowerCase() }}
        </button>
      </li>
    </ul>

    <div v-else class="mt-10 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-16 text-center">
      <p class="text-lg font-semibold tracking-tight text-ink">
        {{ orders.length ? 'Nenhum pedido encontrado.' : 'Nenhum pedido cadastrado ainda.' }}
      </p>
      <p class="mt-2 text-ink-muted">
        {{ orders.length ? 'Tente outro número, nome ou status.' : 'Cadastre o primeiro e acompanhe o status por aqui.' }}
      </p>
    </div>
  </div>
</template>
