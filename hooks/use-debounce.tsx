import { useEffect, useState } from "react"

/**
 * Custom hook que debuncia un valor para evitar múltiples actualizaciones/efectos
 * @param value - El valor a debouncear
 * @param delay - El tiempo de retraso en milisegundos (por defecto 500ms)
 * @returns El valor debounceado
 */
export function useDebounce<T>(value: T, delay?: number): T {
  // Estado para el valor debounceado
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Configurar el temporizador
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay || 500)

    // Limpiar el temporizador si el valor o el delay cambian
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}