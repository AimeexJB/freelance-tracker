import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValueFactory) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) return JSON.parse(stored)
    } catch (err) {
      console.error(`Failed to read localStorage key "${key}"`, err)
    }
    return typeof initialValueFactory === 'function' ? initialValueFactory() : initialValueFactory
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.error(`Failed to write localStorage key "${key}"`, err)
    }
  }, [key, value])

  return [value, setValue]
}
