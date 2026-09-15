import { useCallback, useEffect, useMemo, useState } from 'react'
import { SignInButton } from '@clerk/clerk-react'
import { Check, Clock, Loader2, Lock, MessageCircle, Plus, Search, Trash2 } from 'lucide-react'
import { precioARS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import { hayCuentas, useCuenta } from '../context/AuthContext'
import FotoProducto from '../components/FotoProducto'
import './Mayorista.css'

// Catalogo mayorista.
//
// Es la misma tienda con otros precios y sin pasarela de pago: el pedido se
// cierra por WhatsApp. Los precios NO salen del catalogo publico, sino de
// /api/catalogo-mayorista, que solo responde a cuentas que el local aprobo.

export default function Mayorista() {
  const { cargando, entrado, usuario, token } = useCuenta()
  // undefined = todavia no preguntamos; null = no tiene solicitud
  const [solicitud, setSolicitud] = useState(undefined)

  const traerSolicitud = useCallback(async () => {
    try {
      const t = await token()
      const r = await fetch('/api/mayoristas?mia=1', {
        headers: { Authorization: `Bearer ${t}` }
      })
      const d = await r.json()
      setSolicitud(r.ok ? d.solicitud : null)
    } catch {
      setSolicitud(null)
    }
  }, [token])

  useEffect(() => {
    if (entrado) traerSolicitud()
  }, [entrado, traerSolicitud])

  if (!hayCuentas) return <SinCuentas />
  if (cargando) return <Cargando />
  if (!entrado) return <Portada />
  if (solicitud === undefined) return <Cargando />
  if (!solicitud) return <Formulario usuario={usuario} token={token} onListo={setSolicitud} />
  if (solicitud.estado === 'pendiente') return <EnRevision />
  if (solicitud.estado === 'rechazado') return <Rechazada />
  return <Catalogo solicitud={solicitud} token={token} />
}

// ---------------------------------------------------------------- pantallas

const Cargando = () => (
  <div className="may may-centro">
    <Loader2 className="may-girando" size={30} />
  </div>
)

const SinCuentas = () => (
  <div className="may may-centro">
    <Lock size={40} strokeWidth={1.3} />
    <h1>Acceso mayorista</h1>
    <p>El acceso con cuenta todavia no esta disponible. Escribinos y te atendemos igual.</p>
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

const Portada = () => (
  <div className="may may-centro">
    <Lock size={40} strokeWidth={1.3} />
    <h1>Acceso mayorista</h1>
    <p>
      Lista de precios para comercios. Ingresa con tu cuenta y pedinos el acceso: lo
      habilitamos a mano despues de verificar tus datos.
    </p>
    <SignInButton mode="modal">
      <button className="btn btn-negro">Ingresar o crear cuenta</button>
    </SignInButton>
    <p className="may-chico">
      Si ya tenes cuenta en la tienda es la misma, no hace falta crear otra.
    </p>
  </div>
)

const EnRevision = () => (
  <div className="may may-centro">
    <Clock size={40} strokeWidth={1.3} />
    <h1>Tu solicitud esta en revision</h1>
    <p>
      Ya recibimos tus datos. Cuando el local los confirme vas a ver la lista mayorista al
      entrar aca. Si es urgente, escribinos.
    </p>
    <a
      className="btn btn-lima"
      href={linkWhatsApp('Hola! Mande la solicitud de acceso mayorista y queria consultar por el estado.')}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={17} /> Consultar por WhatsApp
    </a>
  </div>
)

const Rechazada = () => (
  <div className="may may-centro">
    <Lock size={40} strokeWidth={1.3} />
    <h1>Tu cuenta no esta habilitada</h1>
    <p>Escribinos y lo vemos: puede ser que falte algun dato.</p>
    <a
      className="btn btn-lima"
      href={linkWhatsApp('Hola! Queria consultar por el acceso mayorista.')}
      target="_blank"
      rel="noopener noreferrer"
    >
      <MessageCircle size={17} /> Escribir por WhatsApp
    </a>
  </div>
)

// ------------------------------------------------------------- la solicitud

function Formulario({ usuario, token, onListo }) {
  const [form, setForm] = useState({
    nombre: [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' '),
    comercio: '',
    cuit: '',
    telefono: usuario?.telefono || '',
    localidad: '',
    email: usuario?.email || ''
  })
  const [error, setError] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const t = await token()
      const r = await fetch('/api/mayoristas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(form)
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo enviar')
      onListo(d.solicitud)
    } catch (e2) {
      setError(e2.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="may may-form">
      <h1>Pedir acceso mayorista</h1>
      <p className="may-bajada">
        Completa los datos de tu comercio. El local los revisa y te habilita la lista.
      </p>

      <form onSubmit={enviar}>
        <label className="campo">
          Tu nombre
          <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </label>

        <label className="campo">
          Nombre del comercio
          <input
            value={form.comercio}
            onChange={(e) => set('comercio', e.target.value)}
            placeholder="Calzados San Martin"
            required
          />
        </label>

        <label className="campo">
          CUIT
          <input
            value={form.cuit}
            onChange={(e) => set('cuit', e.target.value)}
            placeholder="20-30499571-9"
            required
          />
        </label>

        <label className="campo">
          Telefono
          <input
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            placeholder="3564 60-7522"
            required
          />
        </label>

        <label className="campo">
          Localidad <span className="opcional">(opcional)</span>
          <input value={form.localidad} onChange={(e) => set('localidad', e.target.value)} />
        </label>

        {error && <p className="may-error">{error}</p>}

        <button className="btn btn-negro" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  )
}

// --------------------------------------------------------------- el catalogo

function Catalogo({ solicitud, token }) {
  const [productos, setProductos] = useState(null)
  const [error, setError] = useState(null)
  const [busca, setBusca] = useState('')
  const [marcaF, setMarcaF] = useState('')
  const [pedido, setPedido] = useState([])

  useEffect(() => {
    let vivo = true

    const traer = async () => {
      try {
        const t = await token()
        const r = await fetch('/api/catalogo?mayorista=1', {
          headers: { Authorization: `Bearer ${t}` }
        })
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
  }, [token])

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
    const lineas = pedido.map(
      (i) =>
        `- ${i.marca} ${i.nombre} | ${i.color} | Talle ${i.talle} | ${i.cantidad} ${
          i.cantidad === 1 ? 'par' : 'pares'
        } | ${precioARS(i.precio * i.cantidad)}`
    )
    return [
      `Hola ${TIENDA.nombre}! Soy ${solicitud.comercio} (CUIT ${solicitud.cuit}).`,
      'Quiero hacer este pedido mayorista:',
      '',
      ...lineas,
      '',
      `Total estimado: ${precioARS(total)} (${pares} ${pares === 1 ? 'par' : 'pares'})`
    ].join('\n')
  }, [pedido, solicitud, total, pares])

  if (error) {
    return (
      <div className="may may-centro">
        <Lock size={40} strokeWidth={1.3} />
        <h1>No pudimos abrir la lista</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!productos) return <Cargando />

  return (
    <div className="may">
      <header className="may-top">
        <div>
          <span className="may-etiqueta">Lista mayorista</span>
          <h1>{solicitud.comercio}</h1>
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

      {productos.length === 0 && (
        <p className="may-vacio">
          Todavia no hay productos con precio mayorista cargado. Escribinos y te pasamos la
          lista.
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
          <p className="may-chico">
            El pedido se confirma por WhatsApp: te pasamos disponibilidad y forma de pago.
          </p>
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
