import { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react'

import { precioDe } from '../data/productos'

const CartContext = createContext(null)
const CLAVE = 'jr-carrito'

const lineaId = (id, talle, color) => `${id}__${talle}__${color}`

function reducer(estado, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const { producto, talle, color, cantidad } = accion
      const key = lineaId(producto.id, talle, color)
      const existente = estado.find((l) => l.key === key)
      if (existente) {
        return estado.map((l) =>
          l.key === key ? { ...l, cantidad: l.cantidad + cantidad } : l
        )
      }
      const variante = producto.colores.find((c) => c.nombre === color) || producto.colores[0]
      return [
        ...estado,
        {
          key,
          id: producto.id,
          nombre: producto.nombre,
          marca: producto.marca,
          // El precio del color elegido, no el del producto: pueden diferir.
          precio: precioDe(producto, variante),
          imagen: variante?.imagen || null,
          colorHex: variante?.hex || '#141414',
          talle,
          color,
          cantidad
        }
      ]
    }
    case 'cantidad':
      return estado.map((l) =>
        l.key === accion.key
          ? { ...l, cantidad: Math.max(1, accion.cantidad) }
          : l
      )
    case 'quitar':
      return estado.filter((l) => l.key !== accion.key)
    case 'vaciar':
      return []
    default:
      return estado
  }
}

const inicial = () => {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return guardado ? JSON.parse(guardado) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [lineas, dispatch] = useReducer(reducer, undefined, inicial)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    localStorage.setItem(CLAVE, JSON.stringify(lineas))
  }, [lineas])

  const valor = useMemo(() => {
    const unidades = lineas.reduce((a, l) => a + l.cantidad, 0)
    const subtotal = lineas.reduce((a, l) => a + l.precio * l.cantidad, 0)
    return {
      lineas,
      unidades,
      subtotal,
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar: (producto, talle, color, cantidad = 1) => {
        dispatch({ tipo: 'agregar', producto, talle, color, cantidad })
        setAbierto(true)
      },
      cambiarCantidad: (key, cantidad) => dispatch({ tipo: 'cantidad', key, cantidad }),
      quitar: (key) => dispatch({ tipo: 'quitar', key }),
      vaciar: () => dispatch({ tipo: 'vaciar' })
    }
  }, [lineas, abierto])

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>
}

export const useCarrito = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CartProvider')
  return ctx
}
