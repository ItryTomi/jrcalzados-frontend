import { useEffect, useState } from 'react'

// Pide una sola vez la lista de variantes agotadas y la comparte entre
// todos los componentes. El endpoint devuelve solo lo agotado, nunca las
// cantidades: no hace falta publicar cuanto stock hay de cada cosa.

let cache = null
let enVuelo = null
const suscriptos = new Set()

const clave = (id, color, talle) => `${id}|${color}|${talle}`

async function traer() {
  if (cache) return cache
  if (!enVuelo) {
    enVuelo = fetch('/api/stock')
      .then((r) => (r.ok ? r.json() : { agotados: [] }))
      .then((d) => {
        cache = new Set(
          (d.agotados || []).map((a) => clave(a.producto_id, a.color, a.talle))
        )
        suscriptos.forEach((fn) => fn(cache))
        return cache
      })
      .catch(() => {
        // Si falla, no bloqueamos la compra: se muestra todo disponible.
        cache = new Set()
        suscriptos.forEach((fn) => fn(cache))
        return cache
      })
      .finally(() => {
        enVuelo = null
      })
  }
  return enVuelo
}

export function useAgotados() {
  const [set, setSet] = useState(cache)

  useEffect(() => {
    let vivo = true
    const avisar = (s) => vivo && setSet(new Set(s))
    suscriptos.add(avisar)
    traer()
    return () => {
      vivo = false
      suscriptos.delete(avisar)
    }
  }, [])

  return {
    estaAgotado: (id, color, talle) => Boolean(set && set.has(clave(id, color, talle))),
    listo: Boolean(set)
  }
}

// Para refrescar despues de cargar stock desde el panel.
export function limpiarCacheAgotados() {
  cache = null
}
