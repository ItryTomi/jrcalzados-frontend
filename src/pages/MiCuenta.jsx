import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, MapPin, Package, Truck } from 'lucide-react'
import { precioARS } from '../data/productos'
import { useCuenta } from '../context/AuthContext'
import './MiCuenta.css'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba', 'Corrientes',
  'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquen', 'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucuman'
]

const VACIO = {
  telefono: '', dni: '', calle: '', numero: '', piso: '',
  ciudad: '', provincia: 'Cordoba', cp: '', notas: ''
}

const ESTADOS = {
  iniciado: 'Sin pagar',
  pendiente: 'Pago pendiente',
  pagado: 'Pagado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
  devuelto: 'Devuelto'
}

const ENVIOS = {
  pendiente: 'En preparación',
  preparado: 'Preparado',
  despachado: 'Despachado',
  entregado: 'Entregado'
}

const fecha = (v) =>
  new Date(v).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function MiCuenta() {
  const { hayCuentas, entrado, cargando, usuario, token } = useCuenta()

  const [pedidos, setPedidos] = useState([])
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState(null)

  const pedir = useCallback(
    async (url, opciones = {}) => {
      const t = await token()
      const r = await fetch(url, {
        ...opciones,
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
          ...(opciones.headers || {})
        }
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'Algo no salió bien')
      return data
    },
    [token]
  )

  useEffect(() => {
    if (!entrado) return
    let vivo = true
    ;(async () => {
      try {
        const [p, perfil] = await Promise.all([
          pedir('/api/mis-pedidos'),
          pedir('/api/mi-perfil').catch(() => ({ perfil: null }))
        ])
        if (!vivo) return
        setPedidos(p.pedidos || [])
        if (perfil.perfil) setForm({ ...VACIO, ...perfil.perfil })
      } catch (e) {
        if (vivo) setError(e.message)
      }
    })()
    return () => {
      vivo = false
    }
  }, [entrado, pedir])

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setGuardado(false)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await pedir('/api/mi-perfil', { method: 'POST', body: JSON.stringify({ datos: form }) })
      setGuardado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (!hayCuentas) {
    return (
      <div className="contenedor cuenta-aviso">
        <h1>Las cuentas todavía no están activas</h1>
        <Link to="/catalogo" className="btn btn-negro">
          Ver catálogo
        </Link>
      </div>
    )
  }

  if (cargando) return <div className="contenedor cuenta-aviso">Cargando...</div>

  if (!entrado) {
    return (
      <div className="contenedor cuenta-aviso">
        <h1>Ingresá para ver tus pedidos</h1>
        <p>Usá el botón de arriba para entrar con tu cuenta de Google o tu mail.</p>
        <Link to="/catalogo" className="btn btn-negro">
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="mi-cuenta">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <span>Mi cuenta</span>
        </nav>

        <header className="cuenta-top">
          <h1>Hola{usuario?.nombre ? `, ${usuario.nombre}` : ''}</h1>
          <p>{usuario?.email}</p>
        </header>

        {error && <p className="panel-error">{error}</p>}

        <div className="cuenta-cuerpo">
          <section className="cuenta-pedidos">
            <h2>
              <Package size={19} /> Mis pedidos
            </h2>

            {pedidos.length === 0 ? (
              <div className="cuenta-vacio">
                <p>Todavía no hiciste ningún pedido con esta cuenta.</p>
                <Link to="/catalogo" className="btn btn-negro">
                  Ver catálogo
                </Link>
              </div>
            ) : (
              <ul>
                {pedidos.map((p) => {
                  const items = Array.isArray(p.items) ? p.items : []
                  return (
                    <li key={p.orden}>
                      <div className="pedido-fila">
                        <span className="pedido-num">{p.orden}</span>
                        <span className="pedido-dia">{fecha(p.creado_en)}</span>
                        <span className={`chip chip-${p.estado}`}>
                          {ESTADOS[p.estado] || p.estado}
                        </span>
                        <strong>{precioARS(p.total)}</strong>
                      </div>

                      <ul className="pedido-items">
                        {items.map((i, n) => (
                          <li key={n}>
                            {i.quantity}× {i.title} <em>{i.description}</em>
                          </li>
                        ))}
                      </ul>

                      <p className="pedido-envio">
                        <Truck size={14} /> {ENVIOS[p.envio_estado] || p.envio_estado}
                        {p.seguimiento && (
                          <>
                            {' · '}
                            Seguimiento: <strong>{p.seguimiento}</strong>
                          </>
                        )}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="cuenta-datos">
            <h2>
              <MapPin size={19} /> Datos de envío
            </h2>
            <p className="cuenta-ayuda">
              Los guardamos para que el próximo checkout se complete solo. No guardamos
              datos de tarjeta: de eso se encarga Mercado Pago.
            </p>

            <form onSubmit={guardar}>
              <div className="grilla-campos">
                <label className="campo">
                  Teléfono
                  <input name="telefono" value={form.telefono} onChange={cambiar} />
                </label>
                <label className="campo">
                  DNI
                  <input name="dni" value={form.dni} onChange={cambiar} />
                </label>
                <label className="campo ancho">
                  Calle
                  <input name="calle" value={form.calle} onChange={cambiar} />
                </label>
                <label className="campo">
                  Altura
                  <input name="numero" value={form.numero} onChange={cambiar} />
                </label>
                <label className="campo">
                  Piso / depto
                  <input name="piso" value={form.piso} onChange={cambiar} />
                </label>
                <label className="campo">
                  Localidad
                  <input name="ciudad" value={form.ciudad} onChange={cambiar} />
                </label>
                <label className="campo">
                  Provincia
                  <select name="provincia" value={form.provincia} onChange={cambiar}>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="campo">
                  Código postal
                  <input name="cp" value={form.cp} onChange={cambiar} maxLength={4} />
                </label>
              </div>

              <label className="campo">
                Aclaraciones para la entrega
                <textarea name="notas" rows="2" value={form.notas} onChange={cambiar} />
              </label>

              <button className="btn btn-lima btn-bloque" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : guardado ? 'Guardado' : 'Guardar mis datos'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
