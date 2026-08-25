import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import {
  PRODUCTOS,
  MARCAS,
  DEPORTES,
  TALLES_ADULTO,
  TALLES_NINO,
  descuento
} from '../data/productos'
import ProductCard from '../components/ProductCard'
import { useBloquearScroll } from '../hooks/useBloquearScroll'
import './Catalogo.css'

const TITULOS = {
  hombre: 'Zapatillas de hombre',
  mujer: 'Zapatillas de mujer',
  ninos: 'Zapatillas de ninos',
  ofertas: 'Ofertas'
}

const ORDENES = [
  { id: 'relevancia', nombre: 'Relevancia' },
  { id: 'menor', nombre: 'Precio: menor a mayor' },
  { id: 'mayor', nombre: 'Precio: mayor a menor' },
  { id: 'descuento', nombre: 'Mayor descuento' },
  { id: 'nombre', nombre: 'Nombre A-Z' }
]

const TODOS_TALLES = [...new Set([...TALLES_NINO, ...TALLES_ADULTO])].sort((a, b) => a - b)
const COLORES = [
  ...new Map(PRODUCTOS.flatMap((p) => p.colores).map((c) => [c.nombre, c])).values()
].sort((a, b) => a.nombre.localeCompare(b.nombre))

const alternar = (lista, valor) =>
  lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor]

export default function Catalogo() {
  const { categoria } = useParams()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').toLowerCase().trim()

  const [marcas, setMarcas] = useState([])
  const [deportes, setDeportes] = useState([])
  const [talles, setTalles] = useState([])
  const [colores, setColores] = useState([])
  const [orden, setOrden] = useState('relevancia')
  const [visibles, setVisibles] = useState(12)
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  useBloquearScroll(filtrosAbiertos)

  // Sincroniza los filtros que llegan por URL (?marca= / ?deporte=)
  useEffect(() => {
    const m = params.get('marca')
    const d = params.get('deporte')
    setMarcas(m ? [m] : [])
    setDeportes(d ? [d] : [])
    setVisibles(12)
  }, [params, categoria])

  const resultado = useMemo(() => {
    let lista = PRODUCTOS

    if (categoria === 'ofertas') lista = lista.filter((p) => descuento(p) > 0)
    else if (categoria) lista = lista.filter((p) => p.genero === categoria)

    if (q) {
      lista = lista.filter((p) =>
        `${p.marca} ${p.nombre} ${p.deporte}`.toLowerCase().includes(q)
      )
    }
    if (marcas.length) lista = lista.filter((p) => marcas.includes(p.marca))
    if (deportes.length) lista = lista.filter((p) => deportes.includes(p.deporte))
    if (talles.length) lista = lista.filter((p) => p.talles.some((t) => talles.includes(t)))
    if (colores.length)
      lista = lista.filter((p) => p.colores.some((c) => colores.includes(c.nombre)))

    const copia = [...lista]
    if (orden === 'menor') copia.sort((a, b) => a.precio - b.precio)
    if (orden === 'mayor') copia.sort((a, b) => b.precio - a.precio)
    if (orden === 'descuento') copia.sort((a, b) => descuento(b) - descuento(a))
    if (orden === 'nombre') copia.sort((a, b) => a.nombre.localeCompare(b.nombre))
    return copia
  }, [categoria, q, marcas, deportes, talles, colores, orden])

  const limpiar = () => {
    setMarcas([])
    setDeportes([])
    setTalles([])
    setColores([])
    setParams({})
  }

  const hayFiltros = marcas.length || deportes.length || talles.length || colores.length || q

  const titulo = q
    ? `Resultados para "${params.get('q')}"`
    : TITULOS[categoria] || 'Todo el catalogo'

  const panelFiltros = (
    <>
      <div className="grupo-filtro">
        <h4>Talle</h4>
        <div className="chips">
          {TODOS_TALLES.map((t) => (
            <button
              key={t}
              type="button"
              className={talles.includes(t) ? 'chip activo' : 'chip'}
              onClick={() => setTalles((v) => alternar(v, t))}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grupo-filtro">
        <h4>Marca</h4>
        {MARCAS.map((m) => (
          <label key={m}>
            <input
              type="checkbox"
              checked={marcas.includes(m)}
              onChange={() => setMarcas((v) => alternar(v, m))}
            />
            <span>{m}</span>
            <em>{PRODUCTOS.filter((p) => p.marca === m).length}</em>
          </label>
        ))}
      </div>

      <div className="grupo-filtro">
        <h4>Deporte</h4>
        {DEPORTES.map((d) => (
          <label key={d}>
            <input
              type="checkbox"
              checked={deportes.includes(d)}
              onChange={() => setDeportes((v) => alternar(v, d))}
            />
            <span>{d}</span>
            <em>{PRODUCTOS.filter((p) => p.deporte === d).length}</em>
          </label>
        ))}
      </div>

      <div className="grupo-filtro">
        <h4>Color</h4>
        <div className="chips">
          {COLORES.map((c) => (
            <button
              key={c.nombre}
              type="button"
              title={c.nombre}
              aria-label={c.nombre}
              className={colores.includes(c.nombre) ? 'muestra activo' : 'muestra'}
              style={{ background: c.hex }}
              onClick={() => setColores((v) => alternar(v, c.nombre))}
            />
          ))}
        </div>
      </div>

      {hayFiltros ? (
        <button className="btn btn-linea btn-bloque" onClick={limpiar}>
          Limpiar filtros
        </button>
      ) : null}
    </>
  )

  return (
    <div className="catalogo">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <span>{titulo}</span>
        </nav>

        <div className="catalogo-top">
          <div>
            <h1>{titulo}</h1>
            <p>{resultado.length} productos</p>
          </div>
          <div className="catalogo-controles">
            <button className="boton-filtros" onClick={() => setFiltrosAbiertos(true)}>
              <SlidersHorizontal size={16} /> Filtrar
            </button>
            <label className="selector-orden">
              <span>Ordenar por</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                {ORDENES.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="catalogo-cuerpo">
          <aside className="filtros">{panelFiltros}</aside>

          <div className="catalogo-resultados">
            {resultado.length === 0 ? (
              <div className="sin-resultados">
                <h3>No encontramos productos</h3>
                <p>Proba sacando algun filtro o buscando otro modelo.</p>
                <button className="btn btn-negro" onClick={limpiar}>
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grilla-productos g3">
                  {resultado.slice(0, visibles).map((p) => (
                    <ProductCard key={p.id} producto={p} />
                  ))}
                </div>
                {visibles < resultado.length && (
                  <div className="mostrar-mas">
                    <button className="btn btn-linea" onClick={() => setVisibles((v) => v + 12)}>
                      Mostrar mas
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {filtrosAbiertos && (
        <div className="filtros-movil" role="dialog" aria-label="Filtros">
          <div className="velo" onClick={() => setFiltrosAbiertos(false)} />
          <div className="filtros-panel">
            <header>
              <h3>Filtrar</h3>
              <button onClick={() => setFiltrosAbiertos(false)} aria-label="Cerrar filtros">
                <X size={22} />
              </button>
            </header>
            <div className="filtros-panel-cuerpo">{panelFiltros}</div>
            <button
              className="btn btn-lima btn-bloque"
              onClick={() => setFiltrosAbiertos(false)}
            >
              Ver {resultado.length} productos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
