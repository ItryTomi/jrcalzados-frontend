import { useMemo, useState } from 'react'
import { Calculator, Check, TrendingUp } from 'lucide-react'
import { precioARS } from '../data/productos'
import { useCatalogo } from '../context/CatalogoContext'
import './PanelPrecios.css'

const REDONDEOS = [
  { id: 'peso', txt: 'Al peso' },
  { id: 'centena', txt: 'A los $100' },
  { id: 'mil', txt: 'A los $1.000' },
  { id: 'noventa', txt: 'Terminado en 900' }
]

export default function PanelPrecios({ token }) {
  const { productos, marcas, tipos, recargar } = useCatalogo()

  const [porcentaje, setPorcentaje] = useState('')
  const [marca, setMarca] = useState('')
  const [tipo, setTipo] = useState('')
  const [redondeo, setRedondeo] = useState('centena')

  const [cambios, setCambios] = useState(null)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState(null)
  const [hecho, setHecho] = useState(null)

  const pedir = async (cuerpo) => {
    const r = await fetch('/api/precios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo)
    })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || 'No se pudo procesar')
    return data
  }

  const simular = async (e) => {
    e.preventDefault()
    setError(null)
    setHecho(null)
    const n = Number(porcentaje)
    if (!Number.isFinite(n) || n === 0) {
      setError('Poné un porcentaje distinto de cero')
      return
    }
    setTrabajando(true)
    try {
      const { cambios } = await pedir({
        accion: 'simular',
        porcentaje: n,
        marca: marca || null,
        tipo: tipo || null,
        redondeo
      })
      setCambios(cambios)
    } catch (err) {
      setError(err.message)
    } finally {
      setTrabajando(false)
    }
  }

  const aplicar = async () => {
    if (!cambios?.length) return
    setTrabajando(true)
    setError(null)
    try {
      const { actualizados } = await pedir({
        accion: 'aplicar',
        redondeo,
        cambios: cambios.map((c) => ({ id: c.id, nuevo: c.nuevo }))
      })
      setHecho(actualizados)
      setCambios(null)
      setPorcentaje('')
      // Sin esto la lista sigue mostrando los precios viejos y parece que
      // el aumento no se aplico.
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setTrabajando(false)
    }
  }

  const guardarUno = async (id, precio) => {
    setError(null)
    try {
      await pedir({ accion: 'uno', id, precio: Number(precio) })
      setHecho(1)
      await recargar()
    } catch (err) {
      setError(err.message)
    }
  }

  const resumen = useMemo(() => {
    if (!cambios?.length) return null
    const antes = cambios.reduce((a, c) => a + c.actual, 0)
    const despues = cambios.reduce((a, c) => a + c.nuevo, 0)
    return { n: cambios.length, antes, despues }
  }, [cambios])

  return (
    <div className="precios">
      <section className="precios-form">
        <h2>
          <TrendingUp size={20} /> Aumento masivo
        </h2>
        <p className="precios-ayuda">
          Primero se calcula y te muestro la lista. Nada cambia hasta que confirmes.
        </p>

        <form onSubmit={simular}>
          <label className="campo">
            Porcentaje
            <div className="campo-porcentaje">
              <input
                type="number"
                step="0.1"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                placeholder="15"
              />
              <span>%</span>
            </div>
          </label>

          <label className="campo">
            Solo esta marca
            <select value={marca} onChange={(e) => setMarca(e.target.value)}>
              <option value="">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            Solo este tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            Redondeo
            <select value={redondeo} onChange={(e) => setRedondeo(e.target.value)}>
              {REDONDEOS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.txt}
                </option>
              ))}
            </select>
          </label>

          <button className="btn btn-negro btn-bloque" type="submit" disabled={trabajando}>
            <Calculator size={16} /> {trabajando ? 'Calculando...' : 'Calcular'}
          </button>
        </form>

        {error && <p className="panel-error">{error}</p>}
        {hecho !== null && (
          <p className="precios-ok">
            <Check size={15} /> Listo, {hecho} {hecho === 1 ? 'precio actualizado' : 'precios actualizados'}.
          </p>
        )}
      </section>

      <section className="precios-tabla-cont">
        {cambios ? (
          <>
            <header className="precios-resumen">
              <div>
                <h3>{resumen.n} productos</h3>
                <p>
                  {precioARS(resumen.antes)} → <strong>{precioARS(resumen.despues)}</strong>
                </p>
              </div>
              <div className="precios-confirmar">
                <button className="btn btn-linea" onClick={() => setCambios(null)}>
                  Cancelar
                </button>
                <button className="btn btn-lima" onClick={aplicar} disabled={trabajando}>
                  {trabajando ? 'Aplicando...' : 'Confirmar cambios'}
                </button>
              </div>
            </header>

            <table className="precios-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Ahora</th>
                  <th>Queda en</th>
                </tr>
              </thead>
              <tbody>
                {cambios.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="precios-marca">{c.marca}</span>
                      {c.nombre}
                    </td>
                    <td className="viejo">{precioARS(c.actual)}</td>
                    <td className="nuevo">{precioARS(c.nuevo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <header className="precios-resumen">
              <h3>Precios actuales</h3>
              <p>Podés editar uno suelto: cambiá el número y salí del casillero.</p>
            </header>
            <table className="precios-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="precios-marca">{p.marca}</span>
                      {p.nombre}
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        defaultValue={p.precio}
                        onBlur={(e) => {
                          const v = Number(e.target.value)
                          if (v !== p.precio && v >= 0) guardarUno(p.id, v)
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  )
}
