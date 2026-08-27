import { useEffect, useState } from 'react'

// Pide una sola vez la disponibilidad y la comparte entre todos los
// componentes. El endpoint solo devuelve lo agotado y lo que queda poco:
// nunca publica cuantas unidades hay cuando hay de sobra.

let cache = null
let enVuelo = null
const suscriptos = new Set()

const clave = (id, color, talle) => `${id}|${color}|${talle}`

const VACIO = { agotados: new Set(), bajos: new Map() }

async function traer() {
  if (cache) return cache
  if (!enVuelo) {
    enVuelo = fetch('/api/stock')
      .then((r) => (r.ok ? r.json() : { agotados: [], bajos: [] }))
      .then((d) => {
        cache = {
          agotados: new Set(
            (d.agotados || []).map((a) => clave(a.producto_id, a.color, a.talle))
          ),
          bajos: new Map(
            (d.bajos || []).map((b) => [clave(b.producto_id, b.color, b.talle), b.cantidad])
          )
        }
        suscriptos.forEach((fn) => fn(cache))
        return cache
      })
      .catch(() => {
        // Si falla, no bloqueamos la compra: se muestra todo disponible.
        cache = VACIO
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
  const [datos, setDatos] = useState(cache)

  useEffect(() => {
    let vivo = true
    const avisar = (d) => vivo && setDatos({ ...d })
    suscriptos.add(avisar)
    traer()
    return () => {
      vivo = false
      suscriptos.delete(avisar)
    }
  }, [])

  return {
    estaAgotado: (id, color, talle) =>
      Boolean(datos && datos.agotados.has(clave(id, color, talle))),

    // Unidades restantes solo cuando quedan pocas. null = hay de sobra,
    // o esa variante no tiene stock cargado.
    quedan: (id, color, talle) => (datos ? datos.bajos.get(clave(id, color, talle)) ?? null : null),

    listo: Boolean(datos)
  }
}

export function limpiarCacheAgotados() {
  cache = null
}
