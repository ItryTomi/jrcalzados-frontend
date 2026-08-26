import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTOS as DEL_ARCHIVO } from '../data/productos'

// El catalogo del archivo se usa como punto de partida: la pagina pinta
// completa desde el primer momento, sin pantalla en blanco ni saltos.
// Cuando llega el de la base (que es el que el local edita) lo reemplaza.
// Si no hay base configurada, el del archivo queda y la web funciona igual.

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const [productos, setProductos] = useState(DEL_ARCHIVO)
  const [desdeBase, setDesdeBase] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/catalogo')
      .then((r) => (r.status === 204 ? null : r.json()))
      .then((d) => {
        if (!vivo || !d?.productos?.length) return
        setProductos(d.productos)
        setDesdeBase(true)
      })
      .catch(() => {
        /* nos quedamos con el del archivo */
      })
    return () => {
      vivo = false
    }
  }, [])

  const valor = useMemo(() => {
    const marcas = [...new Set(productos.map((x) => x.marca))].sort()
    const tipos = [...new Set(productos.map((x) => x.tipo))]
    const usos = [...new Set(productos.map((x) => x.uso))]
    const talles = [...new Set(productos.flatMap((x) => x.talles))].sort((a, b) => a - b)
    const colores = [
      ...new Map(productos.flatMap((x) => x.colores).map((c) => [c.nombre, c])).values()
    ].sort((a, b) => a.nombre.localeCompare(b.nombre))

    return {
      productos,
      desdeBase,
      marcas,
      tipos,
      usos,
      talles,
      colores,
      buscar: (id) => productos.find((x) => x.id === id)
    }
  }, [productos, desdeBase])

  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => {
  const ctx = useContext(CatalogoContext)
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider')
  return ctx
}
