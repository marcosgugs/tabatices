import { storeConfig } from '@/config/store'
import { formatCurrency } from '@/composables/useCurrency'
import type { Payment } from '@/types/cart'

export interface CardInstallment {
  installmentCount: number
  installmentValue: number
  total: number
  hasFee: boolean
}

export interface PaymentAdjustment {
  label: string
  amount: number
}

interface PaymentBase {
  subtotal: number
  shippingFee: number
}

const halfCent = 0.005

function roundUpToCents(amount: number): number {
  return Math.ceil(Number((amount * 100).toFixed(4))) / 100
}

export function applyPixDiscount(amount: number): number {
  return amount * (1 - storeConfig.pixDiscountPercent / 100)
}

export function calculateCardInstallments(amount: number): CardInstallment[] {
  return storeConfig.customerCardFeesPercentByInstallmentCount.map((feePercent, feeIndex) => {
    const installmentCount = feeIndex + 1
    const total = roundUpToCents(amount / (1 - feePercent / 100))

    return { installmentCount, installmentValue: total / installmentCount, total, hasFee: feePercent > 0 }
  })
}

export function calculateChargedTotal(base: PaymentBase, payment: Payment | null): number {
  const fullTotal = base.subtotal + base.shippingFee
  if (payment?.method === 'pix') return applyPixDiscount(base.subtotal) + base.shippingFee
  if (payment?.method === 'card') return calculateCardInstallments(fullTotal)[payment.installmentCount - 1]?.total ?? fullTotal
  return fullTotal
}

export function describePaymentAdjustment(base: PaymentBase, payment: Payment | null): PaymentAdjustment | null {
  if (!payment) return null

  const amount = calculateChargedTotal(base, payment) - (base.subtotal + base.shippingFee)
  if (Math.abs(amount) < halfCent) return null

  return {
    label: payment.method === 'pix' ? `Desconto Pix (${storeConfig.pixDiscountPercent}%)` : `Juros do cartão em ${payment.installmentCount}x`,
    amount,
  }
}

export function describePaymentDetails(base: PaymentBase, payment: Payment): string {
  const chargedTotal = calculateChargedTotal(base, payment)

  if (payment.method === 'pix') {
    return `Pix — ${formatCurrency(chargedTotal)} (${storeConfig.pixDiscountPercent}% de desconto)`
  }

  const installmentValue = chargedTotal / payment.installmentCount
  return `Cartão de crédito em ${payment.installmentCount}x de ${formatCurrency(installmentValue)} — total ${formatCurrency(chargedTotal)}`
}

export function describePayment(payment: Payment): string {
  return payment.method === 'pix' ? 'Pix' : `Cartão em ${payment.installmentCount}x`
}
