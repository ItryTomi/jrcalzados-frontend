import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, MessageCircle, Plus, Search, Trash2 } from 'lucide-react'
import { precioARS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import FotoProducto from '../components/FotoProducto'
import './Mayorista.css'

// Lista mayorista.
//
// Es la misma tienda con otros precios y sin pasarela de pago: el pedido se
// cierra por WhatsApp. Va sin clave por decision del local (2026-09-15): se
// prioriza que el comercio entre y vea los precios sin ningun tramite. Queda
// fuera de Google por robots.txt, pero cualquiera con el link la ve.

export default function Mayorista() {
  const [productos, setProductos] = useState(null)
  const [error, setError] = useState(null)
  const [busca, setBusca] = useState('')
  const [marcaF, setMarcaF] = useState('')
  const [pedido, setPedido] = useState([])
  const [comercio, setComercio] = useState('')

  useEffect(() => {
    let vivo = true

    const traer = async () => {
      try {
        const r = await fetch('/api/catalogo?mayorista=1')
        const d = await r.json()
        if (!vivo) return
        if (!r.ok) throw new Error(d.error || 'No se pudo cargar la lista')
        setProductos(d.productos)
      } catch (e) {
        if (vivo) setError(e.message)
      }
    }

    traer()
    return () => {
      vivo = false
    }
  }, [])

  const marcas = useMemo(
    () => [...new Set((productos || []).map((p) => p.marca))].sort(),
    [productos]
  )

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return (productos || [])
      .filter((p) => !marcaF || p.marca === marcaF)
      .filter((p) => !q || `${p.marca} ${p.nombre} ${p.codigo || ''}`.toLowerCase().includes(q))
  }, [productos, busca, marcaF])

  const agregar = (item) =>
    setPedido((ps) => {
      const i = ps.findIndex(
        (x) => x.id === item.id && x.color === item.color && x.talle === item.talle
      )
      if (i === -1) return [...ps, item]
      const copia = [...ps]
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad + item.cantidad }
      return copia
    })

  const sacar = (n) => setPedido((ps) => ps.filter((_, i) => i !== n))

  const total = pedido.reduce((a, i) => a + i.precio * i.cantidad, 0)
  const pares = pedido.reduce((a, i) => a + i.cantidad, 0)

  const mensaje = useMemo(() => {
    const quien = comercio.trim()
    const lineas = pedido.map(
      (i) =>
        `- ${i.marca} ${i.nombre} | ${i.color} | Talle ${i.talle} | ${i.cantidad} ${
          i.cantidad === 1 ? 'par' : 'pares'
        } | ${precioARS(i.precio * i.cantidad)}`
    )
    return [
      quien
        ? `Hola ${TIENDA.nombre}! Soy ${quien} y quiero hacer este pedido mayorista:`
        : `Hola ${TIENDA.nombre}! Quiero hacer este pedido mayorista:`,
      '',
      ...lineas,
      '',
      `Total estimado: ${precioARS(total)} (${pares} ${pares === 1 ? 'par' : 'pares'})`
    ].join('\n')
  }, [pedido, comercio, total, pares])

  if (error) {
    return (
      <div className="may may-centro">
        <h1>No pudimos abrir la lista</h1>
        <p>{error}</p>
        <a
          className="btn btn-lima"
          href={linkWhatsApp('Hola! Quiero consultar por la lista mayorista.')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={17} /> Consultar por WhatsApp
        </a>
      </div>
    )
  }

  if (!productos) {
    return (
      <div className="may may-centro">
        <Loader2 className="may-girando" size={30} />
      </div>
    )
  }

  return (
    <div className="may">
      <header className="may-top">
        <div>
          <span className="may-etiqueta">Precios para comercios</span>
          <h1>Lista mayorista</h1>
        </div>
        <div className="may-filtros">
          <div className="may-buscar">
            <Search size={15} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar modelo, marca o codigo"
            />
          </div>
          <select value={marcaF} onChange={(e) => setMarcaF(e.target.value)}>
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </header>

      {productos.length === 0 ? (
        <p className="may-vacio">
          Todavia no hay productos con precio mayorista cargado. Escribinos y te pasamos la
          lista.
        </p>
      ) : (
        <p className="may-bajada">
          Arma tu pedido y lo cerramos por WhatsApp: te confirmamos disponibilidad, forma de
          pago y envio.
        </p>
      )}

      <div className="may-lista">
        {lista.map((p) => (
          <Fila key={p.id} producto={p} onAgregar={agregar} />
        ))}
      </div>

      {pedido.length > 0 && (
        <aside className="may-pedido">
          <h2>
            Tu pedido{' '}
            <span>
              {pares} {pares === 1 ? 'par' : 'pares'}
            </span>
          </h2>
          <ul>
            {pedido.map((i, n) => (
              <li key={`${i.id}-${i.color}-${i.talle}`}>
                <span>
                  {i.marca} {i.nombre}
                  <em>
                    {i.color} · Talle {i.talle} · {i.cantidad}u
                  </em>
                </span>
                <strong>{precioARS(i.precio * i.cantidad)}</strong>
                <button onClick={() => sacar(n)} aria-label="Sacar del pedido">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          <input
            className="may-comercio"
            value={comercio}
            onChange={(e) => setComercio(e.target.value)}
            placeholder="Tu comercio (opcional)"
          />

          <p className="may-total">
            Total estimado <strong>{precioARS(total)}</strong>
          </p>
          <a
            className="btn btn-lima"
            href={linkWhatsApp(mensaje)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} /> Enviar pedido por WhatsApp
          </a>
          <p className="may-chico">El pedido se confirma por WhatsApp. No se paga online.</p>
        </aside>
      )}
    </div>
  )
}

function Fila({ producto, onAgregar }) {
  const [color, setColor] = useState(producto.colores[0] || { nombre: 'Unico' })
  const [talle, setTalle] = useState(
    producto.consultarTalle ? 'a confirmar' : producto.talles[0] || 'a confirmar'
  )
  const [cantidad, setCantidad] = useState(1)
  const [puesto, setPuesto] = useState(false)

  const precio = producto.precioMayorista

  const agregar = () => {
    onAgregar({
      id: producto.id,
      marca: producto.marca,
      nombre: producto.nombre,
      color: color.nombre,
      talle,
      cantidad: Math.max(1, Number(cantidad) || 1),
      precio
    })
    setPuesto(true)
    setTimeout(() => setPuesto(false), 1200)
  }

  return (
    <article className="may-fila">
      <FotoProducto
        imagen={color.imagen}
        colorHex={color.hex}
        alt={producto.nombre}
        className="may-foto"
      />

      <div className="may-datos">
        <span className="may-marca">{producto.marca}</span>
        <h3>{producto.nombre}</h3>
        {producto.codigo && <span className="may-codigo">Cod. {producto.codigo}</span>}
      </div>

      <div className="may-precio">
        <span>Mayorista</span>
        <strong>{precioARS(precio)}</strong>
      </div>

      <div className="may-controles">
        {producto.colores.length > 1 && (
          <select
            value={color.nombre}
            onChange={(e) =>
              setColor(producto.colores.find((c) => c.nombre === e.target.value) || color)
            }
          >
            {producto.colores.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
        )}

        <select value={talle} onChange={(e) => setTalle(e.target.value)}>
          {producto.consultarTalle ? (
            <option value="a confirmar">Talle a confirmar</option>
          ) : (
            producto.talles.map((t) => (
              <option key={t} value={t}>
                Talle {t}
              </option>
            ))
          )}
        </select>

        <input
          type="number"
          min="1"
          max="999"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          aria-label="Cantidad de pares"
        />

        <button className="may-add" onClick={agregar}>
          {puesto ? <Check size={16} /> : <Plus size={16} />}
          {puesto ? 'Agregado' : 'Agregar'}
        </button>
      </div>
    </article>
  )
}
