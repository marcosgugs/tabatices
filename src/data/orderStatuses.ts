import type { OrderStatus, OrderStatusOption } from '@/types/panel'

export const orderStatuses: OrderStatusOption[] = [
  { value: 'awaiting_payment', label: 'Aguardando pagamento', dotClass: 'bg-mustard' },
  { value: 'in_production', label: 'Em produção', dotClass: 'bg-terracotta' },
  { value: 'ready_to_ship', label: 'Pronto pra envio', dotClass: 'bg-kraft' },
  { value: 'shipped', label: 'Enviado', dotClass: 'bg-forest/40' },
  { value: 'delivered', label: 'Entregue', dotClass: 'bg-forest' },
  { value: 'canceled', label: 'Cancelado', dotClass: 'bg-ink-muted/40' },
]

const statusFlow: OrderStatus[] = ['awaiting_payment', 'in_production', 'ready_to_ship', 'shipped', 'delivered']

export function findOrderStatus(status: OrderStatus): OrderStatusOption {
  return orderStatuses.find((option) => option.value === status) ?? orderStatuses[0]
}

export function findNextStatus(status: OrderStatus): OrderStatusOption | null {
  const flowIndex = statusFlow.indexOf(status)
  if (flowIndex === -1 || flowIndex === statusFlow.length - 1) return null
  return findOrderStatus(statusFlow[flowIndex + 1])
}
