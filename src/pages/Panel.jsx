import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Boxes,
  DollarSign,
  ShieldAlert,
  Shirt,
  KeyRound,
  ListOrdered,
  LogOut,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Truck,
  X
} from 'lucide-react'
import { precioARS } from '../data/productos'
import { TIENDA } from '../data/tienda'
import PanelStock from './PanelStock'
import PanelPrecios from './PanelPrecios'
import PanelProductos from './PanelProductos'
import './Panel.css'

const CLAVE = 'jr-panel-token'

const ESTADO_PAGO = {
  iniciado: { txt: 'Sin pagar', tono: 'gris' },
  pendiente: { txt: 'Pendiente', tono: 'espera' },
  pagado: { txt: 'Pagado', tono: 'ok' },
  rechazado: { txt: 'Rechazado', tono: 'mal' },
  cancelado: { txt: 'Cancelado', tono: 'mal' },
  devuelto: { txt: 'Devuelto', tono: 'mal' },
  contracargo: { txt: 'Contracargo', tono: 'mal' },
  en_disputa: { txt: 'En disputa', tono: 'espera' }
}

const ENVIOS = [
  { id: 'pendiente', txt: 'Pendiente' },
  { id: 'preparado', txt: 'Preparado' },
  { id: 'despachado', txt: 'Despachado' },
  { id: 'entregado', txt: 'Entregado' }
]

const fecha = (v) =>
  new Date(v).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

export default function Panel() {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE) || ''
    } catch {
      return ''
    }
  })
  const [clave, setClave] = useState('')
  const [pedidos, setPedidos] = useState([])
  const [filtro, setFiltro] = useState('pagado')
  const [busca, setBusca] = useState('')
  const [entregaF, setEntregaF] = useState('todas')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const [vista, setVista] = useState('pedidos')
  const [claveDebil, setClaveDebil] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [avisoClave, setAvisoClave] = useState(null)

  // El panel no debe indexarse en buscadores.
  useEffect(() => {
    document.title = 'Panel de pedidos | JR Calzados'
    const m = document.createElement('meta')
    m.name = 'robots'
    m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => m.remove()
  }, [])

  const traer = useCallback(async () => {
    if (!token || vista !== 'pedidos') return
    setCargando(true)
    setError(null)
    try {
      const q = filtro === 'todos' ? '' : `?estado=${filtro}`
      const r = await fetch(`/api/pedidos${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No pudimos traer los pedidos')
      setPedidos(data.pedidos || [])
      setClaveDebil(Boolean(data.claveDebil))
    } catch (e) {
      setError(e.message)
      if (/clave/i.test(e.message)) salir()
    } finally {
      setCargando(false)
    }
  }, [token, filtro, vista])

  useEffect(() => {
    traer()
  }, [traer])

  const entrar = (e) => {
    e.preventDefault()
    const t = clave.trim()
    if (!t) return
    try {
      sessionStorage.setItem(CLAVE, t)
    } catch {
      /* sin sessionStorage igual funciona en esta pestana */
    }
    setToken(t)
    setClave('')
  }

  function salir() {
    try {
      sessionStorage.removeItem(CLAVE)
    } catch {
      /* nada */
    }
    setToken('')
    setPedidos([])
  }

  const cambiarClave = async (e) => {
    e.preventDefault()
    setAvisoClave(null)
    if (nueva !== repetir) return setAvisoClave('Las dos claves no coinciden')
    if (nueva.length < 8) return setAvisoClave('Tiene que tener al menos 8 caracteres')
    try {
      const r = await fetch('/api/clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nueva })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cambiar')
      // La clave vieja dejo de servir: hay que volver a entrar.
      setAvisoClave('Listo. Volvé a entrar con la clave nueva.')
      setTimeout(salir, 1600)
    } catch (err) {
      setAvisoClave(err.message)
    }
  }

  const marcar = async (orden, cambios) => {
    try {
      const r = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orden, ...cambios })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No se pudo actualizar')
      setPedidos((ps) => ps.map((p) => (p.orden === orden ? data.pedido : p)))
    } catch (e) {
      setError(e.message)
    }
  }

  const totales = useMemo(() => {
    const pagados = pedidos.filter((p) => p.estado === 'pagado')
    return {
      cantidad: pagados.length,
      plata: pagados.reduce((a, p) => a + Number(p.total || 0), 0),
      porPreparar: pagados.filter((p) => p.envio_estado === 'pendiente').length
    }
  }, [pedidos])

  // Buscador y filtro de entrega sobre los pedidos que ya trajo el servidor.
  // Busca por numero de orden, nombre, mail o telefono del comprador.
  const visibles = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return pedidos.filter((p) => {
      const modo = (p.entrega || {}).modo || 'envio'
      if (entregaF !== 'todas' && modo !== entregaF) return false
      if (!q) return true
      const c = p.comprador || {}
      return `${p.orden} ${c.nombre || ''} ${c.email || ''} ${c.telefono || ''}`
        .toLowerCase()
        .includes(q)
    })
  }, [pedidos, busca, entregaF])

  if (!token) {
    return (
      <div className="panel-login">
        <form onSubmit={entrar}>
          <KeyRound size={34} strokeWidth={1.6} />
          <h1>Panel de pedidos</h1>
          <p>Ingresá la clave del local.</p>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="Clave"
            autoFocus
          />
          <button className="btn btn-lima btn-bloque" type="submit">
            Entrar
          </button>
          {error && <span className="panel-error">{error}</span>}
        </form>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="contenedor">
        <header className="panel-top">
          <div>
            <div className="panel-tabs">
              <button
                className={vista === 'pedidos' ? 'activo' : ''}
                onClick={() => setVista('pedidos')}
              >
                <ListOrdered size={16} /> Pedidos
              </button>
              <button
                className={vista === 'stock' ? 'activo' : ''}
                onClick={() => setVista('stock')}
              >
                <Boxes size={16} /> Stock
              </button>
              <button
                className={vista === 'precios' ? 'activo' : ''}
                onClick={() => setVista('precios')}
              >
                <DollarSign size={16} /> Precios
              </button>
              <button
                className={vista === 'productos' ? 'activo' : ''}
                onClick={() => setVista('productos')}
              >
                <Shirt size={16} /> Productos
              </button>
            </div>
            {vista === 'pedidos' && (
              <p>
                {totales.cantidad} pagados · {precioARS(totales.plata)} ·{' '}
                <strong>{totales.porPreparar} por preparar</strong>
              </p>
            )}
          </div>
          <div className="panel-acciones">
            {vista === 'pedidos' && (
              <>
                <div className="panel-buscar">
                  <Search size={15} />
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Orden, nombre, mail o telefono"
                  />
                  {busca && (
                    <button type="button" onClick={() => setBusca('')} aria-label="Limpiar">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="pagado">Pagados</option>
                  <option value="pendiente">Pago pendiente</option>
                  <option value="iniciado">Sin pagar</option>
                  <option value="todos">Todos</option>
                </select>
                <select value={entregaF} onChange={(e) => setEntregaF(e.target.value)}>
                  <option value="todas">Envio y retiro</option>
                  <option value="envio">Solo envios</option>
                  <option value="retiro">Solo retiros</option>
                </select>
                <button className="btn btn-linea" onClick={traer} disabled={cargando}>
                  <RefreshCw size={15} /> {cargando ? 'Actualizando' : 'Actualizar'}
                </button>
              </>
            )}
            <button className="btn btn-negro" onClick={salir}>
              <LogOut size={15} /> Salir
            </button>
          </div>
        </header>

        {claveDebil && !cambiando && (
          <button className="panel-clave" onClick={() => setCambiando(true)}>
            <ShieldAlert size={15} />
            Clave insegura — cambiar
          </button>
        )}

        {cambiando && (
          <form className="panel-clave-form" onSubmit={cambiarClave}>
            <div className="panel-clave-top">
              <h3>Cambiar la clave del panel</h3>
              <button
                type="button"
                onClick={() => {
                  setCambiando(false)
                  setNueva('')
                  setRepetir('')
                  setAvisoClave(null)
                }}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <p className="panel-clave-ayuda">
              Desde el panel se ven los datos de cada comprador y se pueden cambiar los
              precios. Usá al menos 16 caracteres — una frase con guiones sirve y se
              escribe fácil.
            </p>
            <div className="panel-clave-campos">
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="Clave nueva"
                autoFocus
              />
              <input
                type="password"
                value={repetir}
                onChange={(e) => setRepetir(e.target.value)}
                placeholder="Repetila"
              />
              <button className="btn btn-lima" type="submit">
                Guardar
              </button>
            </div>
            {avisoClave && <p className="panel-clave-aviso">{avisoClave}</p>}
          </form>
        )}

        {vista === 'stock' && <PanelStock token={token} />}
        {vista === 'precios' && <PanelPrecios token={token} />}
        {vista === 'productos' && <PanelProductos token={token} />}

        {vista === 'pedidos' && error && <p className="panel-error">{error}</p>}

        {vista === 'pedidos' && !cargando && visibles.length === 0 && (
          <div className="panel-vacio">
            <Package size={44} strokeWidth={1.2} />
            <p>
              {pedidos.length === 0
                ? 'No hay pedidos con ese filtro.'
                : `Ningun pedido coincide con la busqueda (hay ${pedidos.length} en este filtro).`}
            </p>
          </div>
        )}

        <div className="panel-lista">
          {(vista === 'pedidos' ? visibles : []).map((p) => {
            const pago = ESTADO_PAGO[p.estado] || { txt: p.estado, tono: 'gris' }
            const comprador = p.comprador || {}
            const entrega = p.entrega || {}
            const items = Array.isArray(p.items) ? p.items : []
            const expandido = abierto === p.orden

            return (
              <article className={`pedido ${expandido ? 'abierto' : ''}`} key={p.orden}>
                <button
                  className="pedido-cabecera"
                  onClick={() => setAbierto(expandido ? null : p.orden)}
                >
                  <span className="pedido-orden">{p.orden}</span>
                  <span className="pedido-fecha">{fecha(p.creado_en)}</span>
                  <span className={`chip chip-${pago.tono}`}>{pago.txt}</span>
                  <span className={`chip chip-envio chip-${p.envio_estado}`}>
                    {entrega.modo === 'retiro' ? 'Retira' : 'Envío'} · {p.envio_estado}
                  </span>
                  <span className="pedido-cliente">{comprador.nombre || 'Sin datos'}</span>
                  <strong className="pedido-total">{precioARS(p.total)}</strong>
                </button>

                {expandido && (
                  <div className="pedido-detalle">
                    <div className="detalle-col">
                      <h3>Productos</h3>
                      <ul className="detalle-items">
                        {items.map((i, n) => (
                          <li key={n}>
                            <span>
                              {i.title}
                              <em>{i.description}</em>
                            </span>
                            <span className="detalle-cant">x{i.quantity}</span>
                            <strong>{precioARS((i.unit_price || 0) * (i.quantity || 1))}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="detalle-col">
                      <h3>Comprador</h3>
                      <p>{comprador.nombre || '-'}</p>
                      <p>{comprador.email || '-'}</p>
                      <p>{comprador.telefono || '-'}</p>
                      {comprador.documento && <p>DNI {comprador.documento}</p>}

                      <h3>{entrega.modo === 'retiro' ? 'Retira en el local' : 'Enviar a'}</h3>
                      {entrega.modo === 'envio' ? (
                        <>
                          <p>
                            {entrega.calle} {entrega.numero}
                            {entrega.piso ? `, ${entrega.piso}` : ''}
                          </p>
                          <p>
                            {entrega.ciudad}, {entrega.provincia} (CP {entrega.cp})
                          </p>
                        </>
                      ) : (
                        <p>{TIENDA.direccion}</p>
                      )}
                      {entrega.notas && <p className="detalle-nota">Nota: {entrega.notas}</p>}

                      <p className="detalle-nota">
                        Pago: {p.medio_pago || '-'} · MP {p.pago_id || '-'}
                      </p>
                    </div>

                    <div className="detalle-col">
                      <h3>Preparación</h3>
                      <div className="detalle-estados">
                        {ENVIOS.map((e) => (
                          <button
                            key={e.id}
                            className={p.envio_estado === e.id ? 'activo' : ''}
                            onClick={() => marcar(p.orden, { envioEstado: e.id })}
                          >
                            {e.txt}
                          </button>
                        ))}
                      </div>

                      <label className="detalle-campo">
                        Nº de seguimiento
                        <input
                          defaultValue={p.seguimiento || ''}
                          placeholder="Código del correo"
                          onBlur={(ev) => {
                            const v = ev.target.value.trim()
                            if (v !== (p.seguimiento || '')) marcar(p.orden, { seguimiento: v })
                          }}
                        />
                      </label>

                      <label className="detalle-campo">
                        Nota interna
                        <textarea
                          rows="2"
                          defaultValue={p.nota_local || ''}
                          onBlur={(ev) => {
                            const v = ev.target.value.trim()
                            if (v !== (p.nota_local || '')) marcar(p.orden, { notaLocal: v })
                          }}
                        />
                      </label>

                      {comprador.telefono && (
                        <a
                          className="btn btn-linea btn-bloque"
                          href={`https://wa.me/${String(comprador.telefono).replace(
                            /\D/g,
                            ''
                          )}?text=${encodeURIComponent(
                            `Hola${comprador.nombre ? ` ${comprador.nombre}` : ''}! Te escribimos de ${
                              TIENDA.nombre
                            } por tu pedido ${p.orden}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={15} /> Escribirle
                        </a>
                      )}
                      {entrega.modo === 'envio' && (
                        <p className="detalle-nota">
                          <Truck size={13} /> Envío sin cargo
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
