import { onlyDigits } from '@/composables/useDeliveryLookup'

const cpfLength = 11
const baseDigitsLength = 9
const repeatedDigitsPattern = /^(\d)\1+$/

function calculateCheckDigit(digits: string): number {
  const weightedSum = [...digits].reduce((total, digit, digitIndex) => total + Number(digit) * (digits.length + 1 - digitIndex), 0)
  const remainder = (weightedSum * 10) % 11
  return remainder === 10 ? 0 : remainder
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, cpfLength)
  const groupedDigits = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, baseDigitsLength)].filter(Boolean).join('.')
  const checkDigits = digits.slice(baseDigitsLength)
  return checkDigits ? `${groupedDigits}-${checkDigits}` : groupedDigits
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value)
  if (digits.length !== cpfLength || repeatedDigitsPattern.test(digits)) return false

  const baseDigits = digits.slice(0, baseDigitsLength)
  const firstCheckDigit = calculateCheckDigit(baseDigits)
  const secondCheckDigit = calculateCheckDigit(`${baseDigits}${firstCheckDigit}`)
  return digits.endsWith(`${firstCheckDigit}${secondCheckDigit}`)
}
