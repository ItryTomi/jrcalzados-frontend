import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTOS as DEL_ARCHIVO } from '../data/productos'

// El catalogo del archivo se usa como punto de partida: la pagina pinta
// completa desde el primer momento, sin pantalla en blanco ni saltos.
// Cuando llega el de la base (que es el que el local edita) lo reemplaza.
// Si no hay base configurada, el del archivo queda y la web funciona igual.

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const [productos, setProductos] = useState(DEL_ARCHIVO)
  const [desdeBase, setDesdeBase] = useState(false)

  // `frescos` saltea el cache del CDN. /api/catalogo se cachea 60s con 5
  // minutos de tolerancia, comodo para el visitante pero veneno para el
  // panel: el local cambiaba un precio y seguia viendo el viejo, y parecia
  // que el cambio no se habia guardado.
  const traer = useCallback((frescos = false) => {
    const url = frescos ? `/api/catalogo?t=${Date.now()}` : '/api/catalogo'
    return fetch(url, frescos ? { cache: 'no-store' } : undefined)
      .then((r) => (r.status === 204 ? null : r.json()))
      .then((d) => {
        if (!d?.productos?.length) return false
        setProductos(d.productos)
        setDesdeBase(true)
        return true
      })
      .catch(() => false /* nos quedamos con lo que ya teniamos */)
  }, [])

  useEffect(() => {
    traer()
  }, [traer])

  // La llama el panel despues de guardar, para que la pantalla muestre lo
  // que quedo realmente en la base y no lo que habia al abrir la pagina.
  const recargar = useCallback(() => traer(true), [traer])

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
      recargar,
      marcas,
      tipos,
      usos,
      talles,
      colores,
      buscar: (id) => productos.find((x) => x.id === id)
    }
  }, [productos, desdeBase, recargar])

  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => {
  const ctx = useContext(CatalogoContext)
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider')
  return ctx
}
