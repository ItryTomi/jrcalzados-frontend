import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, KeyRound, Loader2, Search } from 'lucide-react'
import { precioARS } from '../data/productos'
import PanelPreciosMayorista from './PanelPreciosMayorista'
import './PanelMayorista.css'

// Panel de precios mayoristas, en /mayorista/panel.
//
// Separado del panel de la tienda a proposito: los precios mayoristas son lo
// unico que se administra aca. La pagina publica /mayorista NO los muestra, se
// cotizan por WhatsApp; este panel es el unico lugar donde se ven y se editan.
//
// Usa la misma clave del local y la misma sesion que el panel de pedidos.

const CLAVE = 'jr-panel-token'

export default function PanelMayorista() {
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(CLAVE) || ''
    } catch {
      return ''
    }
  })
  const [clave, setClave] = useState('')

  const [productos, setProductos] = useState(null)
  const [error, setError] = useState(null)
  const [busca, setBusca] = useState('')
  const [editados, setEditados] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [ok, setOk] = useState(null)

  const traer = useCallback(async () => {
    if (!token) return
    setError(null)
    try {
      const r = await fetch(`/api/catalogo?todo=1&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.status === 401) {
        setError('Clave incorrecta')
        setToken('')
        return
      }
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo cargar')
      setProductos((d.productos || []).filter((p) => p.activo !== false))
    } catch (e) {
      setError(e.message)
    }
  }, [token])

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
      /* sin sessionStorage igual anda en esta pestana */
    }
    setToken(t)
    setClave('')
  }

  const escribir = (id, valor) => {
    setOk(null)
    setEditados((e) => ({ ...e, [id]: valor }))
  }

  // Solo se mandan los que cambiaron de verdad: si el local toco un campo y lo
  // dejo igual, no tiene sentido reescribirlo.
  const cambios = useMemo(() => {
    if (!productos) return []
    return productos
      .map((p) => {
        const crudo = editados[p.id]
        if (crudo === undefined) return null
        if (String(crudo).trim() === '') return null
        const nuevo = Number(crudo)
        if (!Number.isFinite(nuevo) || nuevo <= 0) return null
        if (nuevo === p.precioMayorista) return null
        return { id: p.id, nuevo, nombre: p.nombre }
      })
      .filter(Boolean)
  }, [productos, editados])

  const hayInvalidos = useMemo(
    () =>
      Object.values(editados).some(
        (v) => String(v).trim() !== '' && !(Number(v) > 0)
      ),
    [editados]
  )

  const guardar = async () => {
    if (!cambios.length) return
    setGuardando(true)
    setError(null)
    try {
      const r = await fetch('/api/precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accion: 'aplicar-mayorista',
          cambios: cambios.map((c) => ({ id: c.id, nuevo: c.nuevo }))
        })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo guardar')
      setOk(d.actualizados)
      setEditados({})
      await traer()
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!productos) return []
    if (!q) return productos
    return productos.filter((p) =>
      `${p.marca} ${p.nombre} ${p.codigo || ''}`.toLowerCase().includes(q)
    )
  }, [productos, busca])

  const sinCargar = productos ? productos.filter((p) => p.precioMayorista == null).length : 0

  if (!token) {
    return (
      <div className="panel-login">
        <form onSubmit={entrar}>
          <KeyRound size={34} strokeWidth={1.6} />
          <h1>Precios mayoristas</h1>
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
    <div className="pmay">
      <div className="contenedor">
        <header className="pmay-top">
          <div>
            <h1>Precios mayoristas</h1>
            <p>
              Estos precios <strong>no se publican</strong>: la lista mayorista no los
              muestra. Son para vos, para cotizar por WhatsApp.
            </p>
          </div>
        </header>

        {error && <p className="panel-error">{error}</p>}

        <PanelPreciosMayorista token={token} />

        <section className="pmay-tabla-cont">
          <header className="pmay-barra">
            <div>
              <h2>Uno por uno</h2>
              <p>
                {productos ? `${productos.length} productos` : 'Cargando...'}
                {sinCargar > 0 && ` · ${sinCargar} sin precio cargado`}
              </p>
            </div>

            <div className="pmay-acciones">
              <div className="pmay-buscar">
                <Search size={15} />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar modelo, marca o codigo"
                />
              </div>
              <button
                className="btn btn-lima"
                onClick={guardar}
                disabled={guardando || cambios.length === 0 || hayInvalidos}
              >
                {guardando
                  ? 'Guardando...'
                  : cambios.length
                    ? `Guardar ${cambios.length}`
                    : 'Guardar'}
              </button>
            </div>
          </header>

          {ok !== null && (
            <p className="pmay-ok">
              <Check size={15} /> Listo, {ok}{' '}
              {ok === 1 ? 'precio actualizado' : 'precios actualizados'}.
            </p>
          )}

          {hayInvalidos && (
            <p className="panel-error">
              Hay un precio que no es un número válido. Corregilo o dejá el campo vacío.
            </p>
          )}

          {!productos ? (
            <p className="pmay-cargando">
              <Loader2 size={17} /> Cargando productos...
            </p>
          ) : (
            <table className="pmay-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Vidriera</th>
                  <th>Mayorista</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => {
                  const valor =
                    editados[p.id] !== undefined
                      ? editados[p.id]
                      : p.precioMayorista == null
                        ? ''
                        : String(p.precioMayorista)
                  const tocado = editados[p.id] !== undefined
                  return (
                    <tr key={p.id} className={p.precioMayorista == null ? 'pmay-falta' : ''}>
                      <td>
                        <span className="pmay-marca">{p.marca}</span>
                        {p.nombre}
                      </td>
                      <td className="pmay-publico">{precioARS(p.precio)}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={valor}
                          onChange={(e) => escribir(p.id, e.target.value)}
                          placeholder="sin cargar"
                          className={tocado ? 'tocado' : ''}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}
