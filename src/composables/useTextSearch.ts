export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

export function matchesSearch(term: string, values: string[]): boolean {
  const normalizedTerm = normalizeText(term)
  if (!normalizedTerm) return true
  return values.some((value) => normalizeText(value).includes(normalizedTerm))
}
