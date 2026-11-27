import { storeConfig } from '@/config/store'
import { describePaymentDetails } from '@/composables/usePayment'
import { calculateProductionDays, calculateSubtotal } from '@/composables/useOrderSummary'
import type { OrderStatus, PanelOrderDraft } from '@/types/panel'

export type CustomerMessageKind = 'order_received' | 'payment_received' | 'order_shipped'

export interface CustomerMessageOption {
  kind: CustomerMessageKind
  label: string
}

interface CustomerMessageContext {
  customerName: string
  order: Pick<PanelOrderDraft, 'items' | 'shippingFee' | 'payment' | 'trackingCode'>
}

export const customerMessageOptions: CustomerMessageOption[] = [
  { kind: 'order_received', label: 'Pedido recebido' },
  { kind: 'payment_received', label: 'Pagamento recebido' },
  { kind: 'order_shipped', label: 'Pedido enviado' },
]

const messageKindByStatus: Partial<Record<OrderStatus, CustomerMessageKind>> = {
  awaiting_payment: 'order_received',
  in_production: 'payment_received',
  ready_to_ship: 'payment_received',
  shipped: 'order_shipped',
  delivered: 'order_shipped',
}

export function findMessageKindForStatus(status: OrderStatus): CustomerMessageKind {
  return messageKindByStatus[status] ?? 'order_received'
}

function buildGreeting(customerName: string): string {
  const firstName = customerName.trim().split(/\s+/)[0]
  return firstName ? `Oi, ${firstName}!` : 'Oi!'
}

function buildOrderReceivedMessage({ customerName, order }: CustomerMessageContext): string {
  const paymentLines = order.payment
    ? ['', `Forma de pagamento: ${describePaymentDetails({ subtotal: calculateSubtotal(order.items), shippingFee: order.shippingFee }, order.payment)}`]
    : []

  return [
    `${buildGreeting(customerName)} Muito obrigada pelo seu pedido! 💚`,
    '',
    `Cada peça é feita à mão, com todo o cuidado, e a produção leva ${calculateProductionDays(order.items)} dias úteis.`,
    ...paymentLines,
    '',
    'Em seguida te envio o link para pagamento. Assim que ele for confirmado, começo a produção do seu pedido.',
    '',
    'Qualquer dúvida, é só me chamar por aqui!',
  ].join('\n')
}

function buildPaymentReceivedMessage({ customerName, order }: CustomerMessageContext): string {
  return [
    `${buildGreeting(customerName)} Seu pagamento foi confirmado ✨`,
    '',
    `Já comecei a produção e seu pedido fica pronto em ${calculateProductionDays(order.items)} dias úteis. Assim que ele for enviado, te aviso por aqui.`,
  ].join('\n')
}

function buildOrderShippedMessage({ customerName, order }: CustomerMessageContext): string {
  const trackingCode = order.trackingCode.trim()
  const trackingLines = trackingCode ? ['', `Código de rastreio: ${trackingCode}`] : []

  return [
    `${buildGreeting(customerName)} Seu pedido já está a caminho 📦`,
    ...trackingLines,
    '',
    `Espero que você goste muito! Quando ele chegar, me marca no Instagram @${storeConfig.instagramHandle} 💚`,
  ].join('\n')
}

const messageBuilders: Record<CustomerMessageKind, (context: CustomerMessageContext) => string> = {
  order_received: buildOrderReceivedMessage,
  payment_received: buildPaymentReceivedMessage,
  order_shipped: buildOrderShippedMessage,
}

export function buildCustomerMessage(kind: CustomerMessageKind, context: CustomerMessageContext): string {
  return messageBuilders[kind](context)
}
