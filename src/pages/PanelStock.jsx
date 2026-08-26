import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Loader2, PackageSearch } from 'lucide-react'
import { PRODUCTOS } from '../data/productos'
import { limpiarCacheAgotados } from '../hooks/useAgotados'
import './PanelStock.css'

// Los productos con talle "a consultar" no entran: no hay variantes sobre
// las que llevar cuenta hasta que el local cargue los rangos.
const CONTROLABLES = PRODUCTOS.filter((p) => !p.consultarTalle && p.talles.length > 0)

const clave = (id, color, talle) => `${id}|${color}|${talle}`

export default function PanelStock({ token }) {
  const [elegido, setElegido] = useState(CONTROLABLES[0]?.id || null)
  const [valores, setValores] = useState({})
  const [sucios, setSucios] = useState({})
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(false)

  const traer = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const r = await fetch('/api/stock?todo=1', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No pudimos traer el stock')
      const mapa = {}
      for (const f of data.stock || []) mapa[clave(f.producto_id, f.color, f.talle)] = f.cantidad
      setValores(mapa)
      setSucios({})
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }, [token])

  useEffect(() => {
    traer()
  }, [traer])

  const producto = useMemo(() => CONTROLABLES.find((p) => p.id === elegido), [elegido])

  const cambiar = (id, color, talle, valor) => {
    const k = clave(id, color, talle)
    const n = valor === '' ? '' : Math.max(0, parseInt(valor, 10) || 0)
    setValores((v) => ({ ...v, [k]: n }))
    setSucios((s) => ({ ...s, [k]: { producto_id: id, color, talle, cantidad: n === '' ? 0 : n } }))
    setOk(false)
  }

  const guardar = async () => {
    const filas = Object.values(sucios)
    if (!filas.length) return
    setGuardando(true)
    setError(null)
    try {
      const r = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filas })
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(data.error || 'No se pudo guardar')
      setSucios({})
      setOk(true)
      limpiarCacheAgotados()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  // Cuantas variantes de cada producto todavia no tienen cantidad cargada.
  const sinCargar = (p) =>
    p.colores.reduce(
      (a, c) => a + p.talles.filter((t) => valores[clave(p.id, c.nombre, t)] === undefined).length,
      0
    )

  const pendientes = Object.keys(sucios).length

  return (
    <div className="stock">
      <aside className="stock-lista">
        {CONTROLABLES.map((p) => {
          const faltan = sinCargar(p)
          return (
            <button
              key={p.id}
              className={p.id === elegido ? 'activo' : ''}
              onClick={() => setElegido(p.id)}
            >
              <span>{p.nombre}</span>
              {faltan > 0 ? <em className="sin-cargar">{faltan} sin cargar</em> : <em>Cargado</em>}
            </button>
          )
        })}
      </aside>

      <div className="stock-detalle">
        {cargando && (
          <p className="stock-aviso">
            <Loader2 size={15} className="girando" /> Cargando stock...
          </p>
        )}
        {error && <p className="panel-error">{error}</p>}

        {producto && (
          <>
            <header className="stock-top">
              <div>
                <h2>{producto.nombre}</h2>
                <p>
                  {producto.marca} · {producto.colores.length}{' '}
                  {producto.colores.length === 1 ? 'color' : 'colores'} ·{' '}
                  {producto.talles.length} talles
                </p>
              </div>
              <button
                className="btn btn-lima"
                onClick={guardar}
                disabled={!pendientes || guardando}
              >
                {guardando ? 'Guardando...' : pendientes ? `Guardar (${pendientes})` : 'Guardado'}
              </button>
            </header>

            {ok && (
              <p className="stock-ok">
                <Check size={15} /> Stock actualizado.
              </p>
            )}

            <div className="stock-tabla-cont">
              <table className="stock-tabla">
                <thead>
                  <tr>
                    <th>Color</th>
                    {producto.talles.map((t) => (
                      <th key={t}>{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {producto.colores.map((c) => (
                    <tr key={c.nombre}>
                      <th>
                        <span className="stock-color" style={{ background: c.hex }} />
                        {c.nombre}
                      </th>
                      {producto.talles.map((t) => {
                        const k = clave(producto.id, c.nombre, t)
                        const v = valores[k]
                        return (
                          <td key={t}>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              className={v === 0 ? 'agotado' : v === undefined ? 'vacio' : ''}
                              value={v ?? ''}
                              placeholder="-"
                              onChange={(e) => cambiar(producto.id, c.nombre, t, e.target.value)}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="stock-nota">
              <PackageSearch size={14} /> Los talles en blanco quedan <strong>sin control</strong>:
              se pueden vender sin límite. Poné <strong>0</strong> para marcarlos agotados y que no
              se puedan comprar.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
