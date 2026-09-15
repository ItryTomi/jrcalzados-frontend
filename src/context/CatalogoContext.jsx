import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PRODUCTOS as DEL_ARCHIVO } from '../data/productos'

// Modo mayorista: se enciende solo cuando la URL arranca con /mayorista.
//
// La gracia es que el resto de la web no se entera. El catalogo, las tarjetas,
// los filtros de talle y marca y el carrito son EXACTAMENTE los mismos: lo
// unico que cambia es de donde sale el precio. Por eso se pisa aca, en la
// fuente, y no en cada componente.
const aPrecioMayorista = (p) => ({
  ...p,
  precio: p.precioMayorista,
  // Un "20% OFF" calculado contra el precio de vidriera no significa nada en
  // una lista mayorista.
  precioAnterior: null,
  // Los precios propios por color son de la lista minorista. Sin esto, la
  // zapatilla blanca se cobraria al precio de vidriera dentro del mayorista.
  colores: (p.colores || []).map((c) => ({ ...c, precio: null }))
})

// El catalogo del archivo se usa como punto de partida: la pagina pinta
// completa desde el primer momento, sin pantalla en blanco ni saltos.
// Cuando llega el de la base (que es el que el local edita) lo reemplaza.
// Si no hay base configurada, el del archivo queda y la web funciona igual.

const CatalogoContext = createContext(null)

export function CatalogoProvider({ children }) {
  const { pathname } = useLocation()
  const mayorista = pathname === '/mayorista' || pathname.startsWith('/mayorista/')
  // Prefijo para los enlaces: dentro del mayorista, todo tiene que seguir
  // dentro del mayorista o el precio cambia de golpe al entrar a un producto.
  const base = mayorista ? '/mayorista' : ''

  const [productos, setProductos] = useState(DEL_ARCHIVO)
  const [desdeBase, setDesdeBase] = useState(false)

  // `frescos` saltea el cache del CDN. /api/catalogo se cachea 60s con 5
  // minutos de tolerancia, comodo para el visitante pero veneno para el
  // panel: el local cambiaba un precio y seguia viendo el viejo, y parecia
  // que el cambio no se habia guardado.
  const traer = useCallback(
    (frescos = false) => {
      const qs = [mayorista ? 'mayorista=1' : '', frescos ? `t=${Date.now()}` : '']
        .filter(Boolean)
        .join('&')
      const url = qs ? `/api/catalogo?${qs}` : '/api/catalogo'
      return fetch(url, frescos ? { cache: 'no-store' } : undefined)
        .then((r) => (r.status === 204 ? null : r.json()))
        .then((d) => {
          if (!d?.productos?.length) return false
          // Sin precio mayorista cargado no se puede mostrar el producto en la
          // lista: quedaria una tarjeta con el precio vacio.
          const lista = mayorista
            ? d.productos.filter((p) => p.precioMayorista != null).map(aPrecioMayorista)
            : d.productos
          setProductos(lista)
          setDesdeBase(true)
          return true
        })
        .catch(() => false /* nos quedamos con lo que ya teniamos */)
    },
    [mayorista]
  )

  useEffect(() => {
    // Al entrar al mayorista se limpia la lista: el catalogo del archivo trae
    // precios minoristas y mostrarlos como mayoristas seria vender a perdida.
    if (mayorista) {
      setProductos([])
      setDesdeBase(false)
    }
    traer()
  }, [traer, mayorista])

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
      mayorista,
      base,
      marcas,
      tipos,
      usos,
      talles,
      colores,
      buscar: (id) => productos.find((x) => x.id === id)
    }
  }, [productos, desdeBase, recargar, mayorista, base])

  return <CatalogoContext.Provider value={valor}>{children}</CatalogoContext.Provider>
}

export const useCatalogo = () => {
  const ctx = useContext(CatalogoContext)
  if (!ctx) throw new Error('useCatalogo debe usarse dentro de CatalogoProvider')
  return ctx
}
