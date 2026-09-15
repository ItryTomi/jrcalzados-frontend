import { useMemo, useState } from 'react'
import { Calculator, Check, Store } from 'lucide-react'
import { precioARS } from '../data/productos'
import { useCatalogo } from '../context/CatalogoContext'

const REDONDEOS = [
  { id: 'peso', txt: 'Al peso' },
  { id: 'centena', txt: 'A los $100' },
  { id: 'mil', txt: 'A los $1.000' },
  { id: 'noventa', txt: 'Terminado en 900' }
]

// Calculo masivo del precio mayorista.
//
// El precio de vidriera sale de sumarle al base el IVA y el margen, asi que
// para volver al base hay que DIVIDIR por esos porcentajes. Restarlos da un
// numero distinto y mas bajo: con un par de $111.895, restar 21% y 35% en vez
// de dividir deja el precio $11.000 abajo.

export default function PanelPreciosMayorista({ token }) {
  const { marcas, tipos, recargar } = useCatalogo()

  const [iva, setIva] = useState('21')
  const [margen, setMargen] = useState('35')
  const [marca, setMarca] = useState('')
  const [tipo, setTipo] = useState('')
  const [redondeo, setRedondeo] = useState('centena')

  const [cambios, setCambios] = useState(null)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState(null)
  const [hecho, setHecho] = useState(null)

  const divisor = useMemo(() => {
    const a = Number(iva)
    const b = Number(margen)
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null
    return (1 + a / 100) * (1 + b / 100)
  }, [iva, margen])

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

    const porcentajes = [Number(iva), Number(margen)].filter((n) => Number.isFinite(n) && n > 0)
    if (porcentajes.length === 0) {
      setError('Poné al menos un porcentaje mayor a cero')
      return
    }

    setTrabajando(true)
    try {
      const d = await pedir({
        accion: 'simular-mayorista',
        porcentajes,
        marca: marca || null,
        tipo: tipo || null,
        redondeo
      })
      setCambios(d.cambios)
    } catch (err) {
      setError(err.message)
    } finally {
      setTrabajando(false)
    }
  }

  const aplicar = async () => {
    setTrabajando(true)
    setError(null)
    try {
      const d = await pedir({
        accion: 'aplicar-mayorista',
        cambios: cambios.map((c) => ({ id: c.id, nuevo: c.nuevo }))
      })
      setHecho(d.actualizados)
      setCambios(null)
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setTrabajando(false)
    }
  }

  const resumen = useMemo(() => {
    if (!cambios?.length) return null
    return {
      n: cambios.length,
      publico: cambios.reduce((a, c) => a + c.actual, 0),
      mayorista: cambios.reduce((a, c) => a + c.nuevo, 0),
      pisados: cambios.filter((c) => c.actualMayorista != null).length
    }
  }, [cambios])

  return (
    <div className="precios">
      <section className="precios-form">
        <h2>
          <Store size={20} /> Precio mayorista
        </h2>
        <p className="precios-ayuda">
          Le saca al precio de vidriera los porcentajes que se le sumaron. Primero calculo y
          te muestro la lista: nada cambia hasta que confirmes.
        </p>

        <form onSubmit={simular}>
          <label className="campo">
            IVA
            <div className="campo-porcentaje">
              <input type="number" step="0.1" value={iva} onChange={(e) => setIva(e.target.value)} />
              <span>%</span>
            </div>
          </label>

          <label className="campo">
            Margen
            <div className="campo-porcentaje">
              <input
                type="number"
                step="0.1"
                value={margen}
                onChange={(e) => setMargen(e.target.value)}
              />
              <span>%</span>
            </div>
          </label>

          {divisor && (
            <p className="precios-ayuda precios-formula">
              Se divide por <strong>{divisor.toFixed(4)}</strong>. Un par de $100.000 queda en{' '}
              <strong>{precioARS(Math.round(100000 / divisor))}</strong>.
            </p>
          )}

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
            <Check size={15} /> Listo, {hecho}{' '}
            {hecho === 1 ? 'precio mayorista cargado' : 'precios mayoristas cargados'}.
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
                  Vidriera {precioARS(resumen.publico)} → mayorista{' '}
                  <strong>{precioARS(resumen.mayorista)}</strong>
                </p>
                {resumen.pisados > 0 && (
                  <p className="precios-aviso">
                    {resumen.pisados}{' '}
                    {resumen.pisados === 1
                      ? 'ya tenía precio mayorista y se va a pisar'
                      : 'ya tenían precio mayorista y se van a pisar'}
                    .
                  </p>
                )}
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
                  <th>Vidriera</th>
                  <th>Mayorista hoy</th>
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
                    <td className="viejo">
                      {c.actualMayorista == null ? '—' : precioARS(c.actualMayorista)}
                    </td>
                    <td className="nuevo">{precioARS(c.nuevo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <header className="precios-resumen">
            <div>
              <h3>Sin calcular</h3>
              <p>
                Elegí los porcentajes y tocá Calcular. Después de aplicarlo podés ajustar
                cualquier producto a mano desde la pestaña Productos.
              </p>
            </div>
          </header>
        )}
      </section>
    </div>
  )
}
