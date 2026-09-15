import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, Search, Store, X } from 'lucide-react'
import './PanelMayoristas.css'

// Aprobacion de clientes mayoristas.
//
// Registrarse no habilita a nadie: hasta que el local aprueba desde aca, la
// cuenta no ve un solo precio mayorista.

const ESTADOS = [
  { id: 'pendiente', txt: 'Pendientes' },
  { id: 'aprobado', txt: 'Aprobados' },
  { id: 'rechazado', txt: 'Rechazados' },
  { id: '', txt: 'Todos' }
]

const fecha = (v) =>
  v ? new Date(v).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''

const cuitLindo = (v) => {
  const n = String(v || '').replace(/\D/g, '')
  return n.length === 11 ? `${n.slice(0, 2)}-${n.slice(2, 10)}-${n.slice(10)}` : v
}

export default function PanelMayoristas({ token }) {
  const [mayoristas, setMayoristas] = useState([])
  const [estadoF, setEstadoF] = useState('pendiente')
  const [busca, setBusca] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [tocando, setTocando] = useState(null)

  const traer = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const q = estadoF ? `?estado=${estadoF}` : ''
      const r = await fetch(`/api/mayoristas${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cargar')
      setMayoristas(d.mayoristas || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [token, estadoF])

  useEffect(() => {
    traer()
  }, [traer])

  const cambiar = async (usuarioId, estado) => {
    setTocando(usuarioId)
    try {
      const r = await fetch('/api/mayoristas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ usuarioId, estado })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo actualizar')
      await traer()
    } catch (e) {
      setError(e.message)
    } finally {
      setTocando(null)
    }
  }

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return mayoristas
    return mayoristas.filter((m) =>
      `${m.comercio} ${m.nombre} ${m.cuit} ${m.telefono} ${m.localidad}`.toLowerCase().includes(q)
    )
  }, [mayoristas, busca])

  return (
    <div className="mays">
      <header className="mays-top">
        <div className="mays-estados">
          {ESTADOS.map((e) => (
            <button
              key={e.id || 'todos'}
              type="button"
              className={estadoF === e.id ? 'activo' : ''}
              onClick={() => setEstadoF(e.id)}
            >
              {e.txt}
            </button>
          ))}
        </div>

        <div className="mays-buscar">
          <Search size={15} />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Comercio, nombre, CUIT o localidad"
          />
        </div>
      </header>

      {error && <p className="panel-error">{error}</p>}

      {cargando && (
        <p className="mays-cargando">
          <Loader2 size={17} /> Cargando...
        </p>
      )}

      {!cargando && lista.length === 0 && (
        <div className="mays-vacio">
          <Store size={40} strokeWidth={1.2} />
          <p>
            {estadoF === 'pendiente'
              ? 'No hay solicitudes esperando respuesta.'
              : 'No hay comercios en esta lista.'}
          </p>
        </div>
      )}

      <div className="mays-lista">
        {lista.map((m) => (
          <article key={m.usuarioId} className={`mays-fila mays-${m.estado}`}>
            <div className="mays-datos">
              <h3>{m.comercio}</h3>
              <p>
                {m.nombre} · CUIT {cuitLindo(m.cuit)}
              </p>
              <p className="mays-contacto">
                {m.telefono}
                {m.localidad ? ` · ${m.localidad}` : ''}
                {m.email ? ` · ${m.email}` : ''}
              </p>
              <span className="mays-fecha">Pidio el acceso el {fecha(m.creadoEn)}</span>
            </div>

            <div className="mays-acciones">
              <span className={`chip chip-${m.estado}`}>{m.estado}</span>

              {m.estado !== 'aprobado' && (
                <button
                  className="btn btn-lima"
                  disabled={tocando === m.usuarioId}
                  onClick={() => cambiar(m.usuarioId, 'aprobado')}
                >
                  <Check size={15} /> Habilitar
                </button>
              )}

              {m.estado !== 'rechazado' && (
                <button
                  className="btn btn-linea"
                  disabled={tocando === m.usuarioId}
                  onClick={() => cambiar(m.usuarioId, 'rechazado')}
                >
                  <X size={15} /> {m.estado === 'aprobado' ? 'Dar de baja' : 'Rechazar'}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
