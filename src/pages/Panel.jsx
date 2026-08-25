import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyRound, LogOut, MessageCircle, Package, RefreshCw, Truck } from 'lucide-react'
import { precioARS } from '../data/productos'
import { TIENDA } from '../data/tienda'
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
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [abierto, setAbierto] = useState(null)

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
    if (!token) return
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
    } catch (e) {
      setError(e.message)
      if (/clave/i.test(e.message)) salir()
    } finally {
      setCargando(false)
    }
  }, [token, filtro])

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
            <h1>Pedidos</h1>
            <p>
              {totales.cantidad} pagados · {precioARS(totales.plata)} ·{' '}
              <strong>{totales.porPreparar} por preparar</strong>
            </p>
          </div>
          <div className="panel-acciones">
            <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pago pendiente</option>
              <option value="iniciado">Sin pagar</option>
              <option value="todos">Todos</option>
            </select>
            <button className="btn btn-linea" onClick={traer} disabled={cargando}>
              <RefreshCw size={15} /> {cargando ? 'Actualizando' : 'Actualizar'}
            </button>
            <button className="btn btn-negro" onClick={salir}>
              <LogOut size={15} /> Salir
            </button>
          </div>
        </header>

        {error && <p className="panel-error">{error}</p>}

        {!cargando && pedidos.length === 0 && (
          <div className="panel-vacio">
            <Package size={44} strokeWidth={1.2} />
            <p>No hay pedidos con ese filtro.</p>
          </div>
        )}

        <div className="panel-lista">
          {pedidos.map((p) => {
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
