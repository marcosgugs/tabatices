import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { PostgrestError } from '@supabase/supabase-js'
import { useSupabase } from '@/composables/useSupabase'
import type { Database } from '@/types/database'
import type { OrderStatus, PanelOrder, PanelOrderDraft } from '@/types/panel'

type OrderTable = Database['public']['Tables']['orders']

const orderColumns = 'id, code, customer_id, status, items, shipping_fee, notes, created_at'
const uniqueViolationCode = '23505'

function toPanelOrder(row: OrderTable['Row']): PanelOrder {
  return {
    id: row.id,
    code: row.code,
    customerId: row.customer_id,
    status: row.status,
    items: row.items,
    shippingFee: row.shipping_fee,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

function toOrderInsert(draft: PanelOrderDraft): OrderTable['Insert'] {
  return {
    code: draft.code,
    customer_id: draft.customerId,
    status: draft.status,
    items: draft.items,
    shipping_fee: draft.shippingFee,
    notes: draft.notes,
  }
}

function toSaveError(error: PostgrestError): Error {
  return new Error(
    error.code === uniqueViolationCode ? 'Já existe um pedido com esse número.' : 'Não foi possível salvar o pedido. Tente de novo.',
  )
}

export const usePanelOrdersStore = defineStore('panelOrders', () => {
  const orders = ref<PanelOrder[]>([])

  function replaceOrder(updatedOrder: PanelOrder): void {
    orders.value = orders.value.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
  }

  async function load(): Promise<void> {
    const { data, error } = await useSupabase().from('orders').select(orderColumns).order('created_at', { ascending: false })
    if (error) throw new Error('Não foi possível carregar os pedidos.')
    orders.value = data.map(toPanelOrder)
  }

  async function createOrder(draft: PanelOrderDraft): Promise<void> {
    const { data, error } = await useSupabase().from('orders').insert(toOrderInsert(draft)).select(orderColumns).single()
    if (error) throw toSaveError(error)
    orders.value = [toPanelOrder(data), ...orders.value]
  }

  async function updateOrder(id: string, draft: PanelOrderDraft): Promise<void> {
    const { data, error } = await useSupabase().from('orders').update(toOrderInsert(draft)).eq('id', id).select(orderColumns).single()
    if (error) throw toSaveError(error)
    replaceOrder(toPanelOrder(data))
  }

  async function updateStatus(id: string, status: OrderStatus): Promise<void> {
    const { data, error } = await useSupabase().from('orders').update({ status }).eq('id', id).select(orderColumns).single()
    if (error) throw new Error('Não foi possível mudar o status. Tente de novo.')
    replaceOrder(toPanelOrder(data))
  }

  async function deleteOrder(id: string): Promise<void> {
    const { error } = await useSupabase().from('orders').delete().eq('id', id)
    if (error) throw new Error('Não foi possível excluir o pedido. Tente de novo.')
    orders.value = orders.value.filter((order) => order.id !== id)
  }

  function findOrderByCode(code: string): PanelOrder | undefined {
    const normalizedCode = code.trim().toUpperCase()
    return orders.value.find((order) => order.code === normalizedCode)
  }

  return { orders, load, createOrder, updateOrder, updateStatus, deleteOrder, findOrderByCode }
})
