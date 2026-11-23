import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useSupabase } from '@/composables/useSupabase'
import { normalizeText } from '@/composables/useTextSearch'
import type { Database } from '@/types/database'
import type { Customer, CustomerDraft } from '@/types/panel'

type CustomerRow = Database['public']['Tables']['customers']['Row']

const customerColumns = 'id, name, whatsapp, address, notes, created_at'
const saveErrorMessage = 'Não foi possível salvar o cliente. Tente de novo.'
const foreignKeyViolationCode = '23503'

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    address: row.address,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

function sortByName(customers: Customer[]): Customer[] {
  return [...customers].sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))
}

export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])

  const customersById = computed(() => new Map(customers.value.map((customer) => [customer.id, customer])))

  async function load(): Promise<void> {
    const { data, error } = await useSupabase().from('customers').select(customerColumns)
    if (error) throw new Error('Não foi possível carregar os clientes.')
    customers.value = sortByName(data.map(toCustomer))
  }

  async function createCustomer(draft: CustomerDraft): Promise<Customer> {
    const { data, error } = await useSupabase().from('customers').insert(draft).select(customerColumns).single()
    if (error) throw new Error(saveErrorMessage)

    const customer = toCustomer(data)
    customers.value = sortByName([...customers.value, customer])
    return customer
  }

  async function updateCustomer(id: string, draft: CustomerDraft): Promise<void> {
    const { data, error } = await useSupabase().from('customers').update(draft).eq('id', id).select(customerColumns).single()
    if (error) throw new Error(saveErrorMessage)

    const updatedCustomer = toCustomer(data)
    customers.value = sortByName(customers.value.map((customer) => (customer.id === id ? updatedCustomer : customer)))
  }

  async function deleteCustomer(id: string): Promise<void> {
    const { error } = await useSupabase().from('customers').delete().eq('id', id)

    if (error) {
      throw new Error(
        error.code === foreignKeyViolationCode
          ? 'Esse cadastro tem pedidos vinculados. Exclua os pedidos antes.'
          : 'Não foi possível excluir o cliente. Tente de novo.',
      )
    }

    customers.value = customers.value.filter((customer) => customer.id !== id)
  }

  function findCustomer(id: string): Customer | undefined {
    return customersById.value.get(id)
  }

  function findCustomerByName(name: string): Customer | undefined {
    const normalizedName = normalizeText(name)
    return customers.value.find((customer) => normalizeText(customer.name) === normalizedName)
  }

  return { customers, load, createCustomer, updateCustomer, deleteCustomer, findCustomer, findCustomerByName }
})
