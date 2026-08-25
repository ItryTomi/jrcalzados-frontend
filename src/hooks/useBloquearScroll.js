import { useEffect } from 'react'

export function useBloquearScroll(activo) {
  useEffect(() => {
    if (!activo) return
    document.body.classList.add('sin-scroll')
    return () => document.body.classList.remove('sin-scroll')
  }, [activo])
}
