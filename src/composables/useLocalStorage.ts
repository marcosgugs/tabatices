export function readStorage<Value>(key: string, fallback: Value): Value {
  try {
    const storedValue = localStorage.getItem(key)
    if (!storedValue) return fallback

    const parsedValue: unknown = JSON.parse(storedValue)
    const hasExpectedShape = Array.isArray(fallback) === Array.isArray(parsedValue)
    return hasExpectedShape ? (parsedValue as Value) : fallback
  } catch {
    return fallback
  }
}

export function writeStorage<Value>(key: string, value: Value): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}
