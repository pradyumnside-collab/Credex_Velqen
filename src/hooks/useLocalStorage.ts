import { useEffect, useState } from 'react'

type SetValue<T> = T | ((previousValue: T) => T)

function readStoredValue<T>(key: string, initialValue: T) {
  if (typeof window === 'undefined') {
    return initialValue
  }

  try {
    const storedValue = window.localStorage.getItem(key)
    if (storedValue === null) {
      return initialValue
    }

    return JSON.parse(storedValue) as T
  } catch {
    return initialValue
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => readStoredValue(key, initialValue))

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(key, JSON.stringify(storedValue))
  }, [key, storedValue])

  const setValue = (value: SetValue<T>) => {
    setStoredValue((currentValue) => {
      const nextValue = value instanceof Function ? value(currentValue) : value
      return nextValue
    })
  }

  const removeValue = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }

    setStoredValue(initialValue)
  }

  return [storedValue, setValue, removeValue] as const
}