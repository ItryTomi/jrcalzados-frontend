import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Image as IconoImagen, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { precioARS } from '../data/productos'
import { useCatalogo } from '../context/CatalogoContext'
import { optimizar } from '../utils/imagen'
import './PanelProductos.css'

const GENEROS = [
  { id: 'hombre', txt: 'Hombre' },
  { id: 'mujer', txt: 'Mujer' },
  { id: 'ninos', txt: 'Niños' },
  { id: 'unisex', txt: 'Unisex' }
]
const TIPOS = ['Zapatillas', 'Botitas', 'Lona', 'Sandalias']
const USOS = ['Running', 'Urbano', 'Padel', 'Confort', 'Fiesta', 'Primeros pasos']

// precio y descripcion vacios = "vale y se describe igual que el producto".
const COLOR_VACIO = { nombre: '', hex: '#141414', imagen: null, precio: '', descripcion: '' }

const NUEVO = {
  id: '',
  marca: '',
  codigo: '',
  nombre: '',
  genero: 'unisex',
  tipo: 'Zapatillas',
  uso: 'Urbano',
  precio: '',
  precioAnterior: '',
  desde: 35,
  hasta: 45,
  consultarTalle: false,
  descripcion: '',
  colores: [COLOR_VACIO],
  destacado: false,
  nuevo: true,
  activo: true
}

// Del 16 (pie de nene) al 48 (pie de adulto grande). Sin este tope, un
// numero mal tipeado genera decenas de miles de talles y tumba la pagina.
export const TALLE_MIN = 16
export const TALLE_MAX = 48

const acotar = (v) => Math.min(TALLE_MAX, Math.max(TALLE_MIN, parseInt(v, 10) || TALLE_MIN))

const rango = (a, b) => {
  const desde = acotar(a)
  const hasta = Math.max(desde, acotar(b))
  const out = []
  for (let t = desde; t <= hasta; t++) out.push(t)
  return out
}

export default function PanelProductos({ token }) {
  const { productos, marcas, recargar } = useCatalogo()
  const [busca, setBusca] = useState('')
  const [tipoF, setTipoF] = useState('')
  const [elegido, setElegido] = useState(null)
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)
  const [subiendo, setSubiendo] = useState(null)
  const [colorMal, setColorMal] = useState(null)
  const archivos = useRef({})

  const cargar = useCallback(
    (p) => {
      setError(null)
      setOk(null)
      if (!p) {
        setElegido(null)
        setForm({ ...NUEVO, colores: [{ ...COLOR_VACIO }] })
        return
      }
      setElegido(p.id)
      setForm({
        ...NUEVO,
        ...p,
        precio: String(p.precio),
        precioAnterior: p.precioAnterior ? String(p.precioAnterior) : '',
        desde: p.talles?.[0] ?? 35,
        hasta: p.talles?.[p.talles.length - 1] ?? 45,
        descripcion: p.descripcion || '',
        colores: (p.colores?.length ? p.colores : [COLOR_VACIO]).map((c) => ({
          ...COLOR_VACIO,
          ...c,
          precio: c.precio == null ? '' : String(c.precio),
          descripcion: c.descripcion || ''
        }))
      })
    },
    []
  )

  useEffect(() => {
    if (!form) cargar(null)
  }, [form, cargar])

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    setOk(null)
  }

  const setColor = (i, campo, valor) =>
    setForm((f) => ({
      ...f,
      colores: f.colores.map((c, n) => (n === i ? { ...c, [campo]: valor } : c))
    }))

  // Sube la foto directo a Cloudinary con una firma que pide al backend.
  const subirFoto = async (i, archivo) => {
    if (!archivo) return
    setSubiendo(i)
    setError(null)
    try {
      const r = await fetch('/api/subir-foto', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const firma = await r.json()
      if (!r.ok) throw new Error(firma.error || 'No pudimos preparar la subida')

      const datos = new FormData()
      datos.append('file', archivo)
      datos.append('api_key', firma.apiKey)
      datos.append('timestamp', firma.timestamp)
      datos.append('signature', firma.signature)
      datos.append('folder', firma.folder)
      datos.append('upload_preset', firma.preset)

      const sub = await fetch(firma.url, { method: 'POST', body: datos })
      const res = await sub.json()
      if (!sub.ok) throw new Error(res?.error?.message || 'Cloudinary rechazó la foto')

      setColor(i, 'imagen', res.secure_url)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubiendo(null)
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setColorMal(null)

    // Un color sin nombre no se puede guardar. Antes se mandaba igual, el
    // servidor lo descartaba callado y el local veia "Producto actualizado"
    // mientras el color desaparecia. Ahora frena aca y dice cual es.
    const falta = form.colores.findIndex((c) => !String(c.nombre || '').trim())
    if (falta !== -1) {
      setColorMal(falta)
      setOk(null)
      setError(`Falta el nombre del color ${falta + 1}. Escribilo y volvé a guardar.`)
      document.getElementById(`color-nombre-${falta}`)?.focus()
      return
    }

    const precioMal = form.colores.findIndex(
      (c) => String(c.precio || '').trim() !== '' && !(Number(c.precio) > 0)
    )
    if (precioMal !== -1) {
      setColorMal(precioMal)
      setOk(null)
      setError(`El precio del color ${precioMal + 1} no es un número válido. Dejalo vacío si vale igual que el producto.`)
      return
    }

    setGuardando(true)
    setError(null)
    try {
      const cuerpo = {
        ...form,
        precio: Number(form.precio),
        precioAnterior: form.precioAnterior === '' ? null : Number(form.precioAnterior),
        talles: form.consultarTalle ? [] : rango(form.desde, form.hasta)
      }
      const r = await fetch('/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ producto: cuerpo })
      })
      const data = await r.json()
      if (!r.ok) {
        if (Number.isInteger(data.colorSinNombre)) setColorMal(data.colorSinNombre)
        throw new Error(data.error || 'No se pudo guardar')
      }
      setOk(elegido ? 'Producto actualizado' : 'Producto creado')
      await recargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async () => {
    if (!elegido) return
    setGuardando(true)
    try {
      const r = await fetch(`/api/productos?id=${encodeURIComponent(elegido)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'No se pudo desactivar')
      setOk('Producto desactivado. Ya no se ve en la tienda.')
      cargar(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setGuardando(false)
    }
  }

  // Buscador de la lista lateral: marca, nombre, codigo o id, mas un filtro
  // por tipo. Con 30 productos ya cuesta encontrarlos a ojo.
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return [...productos]
      .filter((p) => !tipoF || p.tipo === tipoF)
      .filter(
        (p) =>
          !q ||
          `${p.marca} ${p.nombre} ${p.codigo || ''} ${p.id}`.toLowerCase().includes(q)
      )
      .sort((a, b) => a.marca.localeCompare(b.marca) || a.nombre.localeCompare(b.nombre))
  }, [productos, busca, tipoF])

  if (!form) return null

  return (
    <div className="prods">
      <aside className="prods-lista">
        <div className="prods-cabecera">
          <button className="prods-nuevo" onClick={() => cargar(null)}>
            <Plus size={16} /> Producto nuevo
          </button>

          <div className="prods-buscar">
          <Search size={15} />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nombre, marca o codigo"
          />
            {busca && (
              <button type="button" onClick={() => setBusca('')} aria-label="Limpiar">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="prods-tipos">
            <button
              type="button"
              className={tipoF === '' ? 'activo' : ''}
              onClick={() => setTipoF('')}
            >
              Todos
            </button>
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                className={tipoF === t ? 'activo' : ''}
                onClick={() => setTipoF(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <p className="prods-cuenta">
            {lista.length === productos.length
              ? `${productos.length} productos`
              : `${lista.length} de ${productos.length}`}
          </p>
        </div>

        {lista.length === 0 && <p className="prods-sinnada">No hay productos que coincidan.</p>}
        {lista.map((p) => (
          <button
            key={p.id}
            className={p.id === elegido ? 'activo' : ''}
            onClick={() => cargar(p)}
          >
            <span className="prods-marca">{p.marca}</span>
            <span className="prods-nombre">{p.nombre}</span>
            <em>{precioARS(p.precio)}</em>
          </button>
        ))}
      </aside>

      <form className="prods-form" onSubmit={guardar}>
        <header className="prods-top">
          <h2>{elegido ? 'Editar producto' : 'Producto nuevo'}</h2>
          <div className="prods-acciones">
            {elegido && (
              <button type="button" className="btn btn-linea" onClick={desactivar}>
                Desactivar
              </button>
            )}
            <button className="btn btn-lima" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </header>

        {error && <p className="panel-error">{error}</p>}
        {ok && (
          <p className="prods-ok">
            <Check size={15} /> {ok}
          </p>
        )}

        <div className="grilla-campos">
          <label className="campo ancho">
            Nombre del producto
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Zapatillas Jaguar 9412 Retro"
            />
          </label>

          <label className="campo ancho">
            Descripción <span className="opcional">(opcional)</span>
            <textarea
              rows={3}
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="Capellada elastizada, plantilla de memory foam, suela liviana. Ideal para caminar todo el día."
            />
            <small className="campo-nota">
              Se muestra en la página del producto. Cada color puede tener la suya propia.
            </small>
          </label>

          <label className="campo">
            Marca
            <input
              list="marcas-existentes"
              value={form.marca}
              onChange={(e) => set('marca', e.target.value)}
              placeholder="Jaguar"
            />
            <datalist id="marcas-existentes">
              {marcas.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </label>

          <label className="campo">
            Código <span className="opcional">(opcional)</span>
            <input value={form.codigo || ''} onChange={(e) => set('codigo', e.target.value)} />
          </label>

          <label className="campo">
            Precio
            <input
              type="number"
              min="0"
              value={form.precio}
              onChange={(e) => set('precio', e.target.value)}
            />
          </label>

          <label className="campo">
            Precio anterior <span className="opcional">(para mostrar % OFF)</span>
            <input
              type="number"
              min="0"
              value={form.precioAnterior}
              onChange={(e) => set('precioAnterior', e.target.value)}
            />
          </label>

          <label className="campo">
            Para quién
            <select value={form.genero} onChange={(e) => set('genero', e.target.value)}>
              {GENEROS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.txt}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            Tipo
            <select value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="campo">
            Uso
            <select value={form.uso} onChange={(e) => set('uso', e.target.value)}>
              {USOS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="prods-bloque">
          <legend>Talles</legend>
          <label className="prods-check">
            <input
              type="checkbox"
              checked={form.consultarTalle}
              onChange={(e) => set('consultarTalle', e.target.checked)}
            />
            No tengo los talles cargados — mostrar "consultar talles"
          </label>

          {!form.consultarTalle && (
            <div className="prods-rango">
              <label className="campo">
                Desde
                <input
                  type="number"
                  min={TALLE_MIN}
                  max={TALLE_MAX}
                  value={form.desde}
                  onChange={(e) => set('desde', e.target.value)}
                  onBlur={(e) => set('desde', acotar(e.target.value))}
                />
              </label>
              <span>al</span>
              <label className="campo">
                Hasta
                <input
                  type="number"
                  min={TALLE_MIN}
                  max={TALLE_MAX}
                  value={form.hasta}
                  onChange={(e) => set('hasta', e.target.value)}
                  onBlur={(e) => set('hasta', Math.max(acotar(form.desde), acotar(e.target.value)))}
                />
              </label>
              <p className="prods-preview">
                {rango(form.desde, form.hasta).length} talles:{' '}
                {rango(form.desde, form.hasta).join(', ')}
              </p>
              <p className="prods-limite">
                Los talles van del {TALLE_MIN} al {TALLE_MAX}: del pie de un nene al de un
                adulto grande.
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="prods-bloque">
          <legend>Colores y fotos</legend>
          <p className="prods-ayuda">
            Una foto por color. Subila tal cual la sacaste del celular: se achica y se
            comprime sola.
          </p>

          {form.colores.map((c, i) => (
            <div className="prods-color" key={i}>
              <div className="prods-foto">
                {c.imagen ? (
                  <img src={optimizar(c.imagen, 200)} alt={c.nombre} />
                ) : (
                  <span className="prods-sinfoto">
                    <IconoImagen size={22} />
                  </span>
                )}
                {subiendo === i && (
                  <span className="prods-subiendo">
                    <Loader2 size={20} className="girando" />
                  </span>
                )}
              </div>

              <div className="prods-color-datos">
                {/* El placeholder lleva "Ej:" adelante para que el gris no se
                    lea como un valor ya cargado: eso era lo que hacia que el
                    local guardara el color sin nombre y lo perdiera. */}
                <label className={`campo${colorMal === i ? ' campo-error' : ''}`}>
                  Nombre del color <span className="obligatorio">*</span>
                  <input
                    id={`color-nombre-${i}`}
                    value={c.nombre}
                    onChange={(e) => {
                      setColor(i, 'nombre', e.target.value)
                      if (colorMal === i) setColorMal(null)
                    }}
                    placeholder="Ej: Negro"
                  />
                </label>
                <label className="campo">
                  Color de la muestra
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => setColor(i, 'hex', e.target.value)}
                  />
                </label>
                <label className="campo">
                  Precio de este color <span className="opcional">(opcional)</span>
                  <input
                    inputMode="numeric"
                    value={c.precio}
                    onChange={(e) => setColor(i, 'precio', e.target.value.replace(/[^\d]/g, ''))}
                    placeholder={form.precio ? `Vale ${form.precio}` : 'Igual que el producto'}
                  />
                </label>
                <label className="campo ancho">
                  Descripción de este color <span className="opcional">(opcional)</span>
                  <textarea
                    rows={2}
                    value={c.descripcion}
                    onChange={(e) => setColor(i, 'descripcion', e.target.value)}
                    placeholder="Si este color tiene algo distinto, contalo acá. Si no, se usa la del producto."
                  />
                </label>
              </div>

              <div className="prods-color-acciones">
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => (archivos.current[i] = el)}
                  hidden
                  onChange={(e) => subirFoto(i, e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-linea"
                  onClick={() => archivos.current[i]?.click()}
                  disabled={subiendo !== null}
                >
                  {c.imagen ? 'Cambiar foto' : 'Subir foto'}
                </button>
                {form.colores.length > 1 && (
                  <button
                    type="button"
                    className="prods-quitar"
                    onClick={() =>
                      set('colores', form.colores.filter((_, n) => n !== i))
                    }
                    aria-label="Quitar color"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-linea"
            onClick={() =>
              set('colores', [...form.colores, { ...COLOR_VACIO }])
            }
          >
            <Plus size={15} /> Agregar otro color
          </button>
        </fieldset>

        <fieldset className="prods-bloque">
          <legend>Dónde aparece</legend>
          <label className="prods-check">
            <input
              type="checkbox"
              checked={form.destacado}
              onChange={(e) => set('destacado', e.target.checked)}
            />
            Destacado — sale en la portada
          </label>
          <label className="prods-check">
            <input
              type="checkbox"
              checked={form.nuevo}
              onChange={(e) => set('nuevo', e.target.checked)}
            />
            Nuevo — le pone la etiqueta "Nuevo"
          </label>
          <label className="prods-check">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => set('activo', e.target.checked)}
            />
            Visible en la tienda
          </label>
        </fieldset>

        <p className="prods-nota">
          <X size={13} /> El stock se carga aparte, en la pestaña Stock, después de guardar.
        </p>
      </form>
    </div>
  )
}
