<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useCustomersStore } from '@/stores/customers'
import { usePanelOrdersStore } from '@/stores/panelOrders'
import { buildPhoneWhatsappUrl, formatPhone } from '@/composables/usePhone'
import { matchesSearch } from '@/composables/useTextSearch'

const customersStore = useCustomersStore()
const { customers } = storeToRefs(customersStore)
const panelOrdersStore = usePanelOrdersStore()
const { orders } = storeToRefs(panelOrdersStore)

const searchTerm = ref('')

const orderCountByCustomerId = computed(() =>
  orders.value.reduce(
    (counts, order) => counts.set(order.customerId, (counts.get(order.customerId) ?? 0) + 1),
    new Map<string, number>(),
  ),
)

const visibleCustomers = computed(() =>
  customers.value.filter((customer) =>
    matchesSearch(searchTerm.value, [customer.name, customer.whatsapp, formatPhone(customer.whatsapp)]),
  ),
)

function describeOrderCount(customerId: string): string {
  const orderCount = orderCountByCustomerId.value.get(customerId) ?? 0
  return `${orderCount} ${orderCount === 1 ? 'pedido' : 'pedidos'}`
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-4xl font-semibold tracking-[-0.025em] text-forest">Clientes</h1>
      <RouterLink :to="{ name: 'panel-customer-new' }" class="button-primary">Novo cliente</RouterLink>
    </div>

    <label for="customer-search" class="sr-only">Buscar cliente</label>
    <input
      id="customer-search"
      v-model="searchTerm"
      type="search"
      autocomplete="off"
      placeholder="Buscar por nome ou WhatsApp"
      class="field mt-8"
    />

    <ul v-if="visibleCustomers.length" class="mt-6 divide-y divide-line border-y border-line">
      <li
        v-for="customer in visibleCustomers"
        :key="customer.id"
        class="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
      >
        <RouterLink :to="{ name: 'panel-customer', params: { id: customer.id } }" class="group min-w-0 flex-1">
          <span class="block text-[15px] font-semibold text-ink transition-colors group-hover:text-terracotta">{{ customer.name }}</span>
          <span class="mt-1 block text-sm text-ink-muted">
            {{ describeOrderCount(customer.id) }}<template v-if="customer.address?.city"> · {{ customer.address.city }}/{{ customer.address.state }}</template>
          </span>
        </RouterLink>

        <a
          v-if="customer.whatsapp"
          :href="buildPhoneWhatsappUrl(customer.whatsapp)"
          target="_blank"
          rel="noopener noreferrer"
          class="link-accent shrink-0 text-sm"
        >
          {{ formatPhone(customer.whatsapp) }}
        </a>
      </li>
    </ul>

    <div v-else class="mt-10 flex flex-col items-center rounded-[32px] bg-white/60 px-6 py-16 text-center">
      <p class="text-lg font-semibold tracking-tight text-ink">
        {{ customers.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.' }}
      </p>
      <p class="mt-2 text-ink-muted">
        {{ customers.length ? 'Tente outro nome ou número.' : 'Cadastre o primeiro para registrar pedidos.' }}
      </p>
    </div>
  </div>
</template>
