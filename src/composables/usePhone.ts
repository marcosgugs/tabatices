import { onlyDigits } from '@/composables/useDeliveryLookup'

const brazilCountryCode = '55'
const whatsappSendUrl = 'https://api.whatsapp.com/send'
const maxPhoneDigits = 11
const areaCodeLength = 2

export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, maxPhoneDigits)
  if (digits.length <= areaCodeLength) return digits

  const areaCode = `(${digits.slice(0, areaCodeLength)})`
  const localNumber = digits.slice(areaCodeLength)
  if (localNumber.length <= 4) return `${areaCode} ${localNumber}`

  const prefixLength = localNumber.length > 8 ? 5 : 4
  return `${areaCode} ${localNumber.slice(0, prefixLength)}-${localNumber.slice(prefixLength)}`
}

export function isValidPhone(value: string): boolean {
  return [10, 11].includes(onlyDigits(value).length)
}

export function buildWhatsappSendUrl(recipient: string, message = ''): string {
  const params = new URLSearchParams()
  if (recipient) params.set('phone', recipient)
  if (message) params.set('text', message)
  const query = params.toString()
  return query ? `${whatsappSendUrl}?${query}` : whatsappSendUrl
}

export function buildPhoneWhatsappUrl(phone: string, message = ''): string {
  const phoneDigits = onlyDigits(phone)
  const recipient = phoneDigits ? `${brazilCountryCode}${phoneDigits}` : ''
  return buildWhatsappSendUrl(recipient, message)
}
