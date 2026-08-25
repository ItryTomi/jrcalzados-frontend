import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, MapPin, RefreshCw, Truck } from 'lucide-react'
import { PRODUCTOS, MARCAS, DEPORTES, descuento } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import ProductCard from '../components/ProductCard'
import FotoProducto from '../components/FotoProducto'
import './Home.css'

const SLIDES = [
  {
    rotulo: 'Temporada 2026',
    titulo: 'Corre mas\nlejos',
    texto: 'Running de las mejores marcas. Hasta 6 cuotas sin interes.',
    cta: 'Ver running',
    link: '/catalogo?deporte=Running',
    color: '#a3cc1e'
  },
  {
    rotulo: 'Hasta 40% OFF',
    titulo: 'Liquidacion\nurbana',
    texto: 'Zapatillas urbanas seleccionadas con descuentos reales.',
    cta: 'Ver ofertas',
    link: '/catalogo/ofertas',
    color: '#2b4f9e'
  },
  {
    rotulo: 'Envio a todo el pais',
    titulo: 'Retira en\nel local',
    texto: `Estamos en ${TIENDA.ciudad}, ${TIENDA.provincia}. Comprás online y pasás a buscarlo.`,
    cta: 'Como llegar',
    link: '/contacto',
    color: '#141414'
  }
]

const BENEFICIOS = [
  { icono: Truck, titulo: 'Envio a todo el pais', texto: 'Gratis en compras desde $149.999' },
  { icono: CreditCard, titulo: '6 cuotas sin interes', texto: 'Con todas las tarjetas' },
  { icono: RefreshCw, titulo: 'Cambios sin drama', texto: '30 dias para cambiar el talle' },
  { icono: MapPin, titulo: 'Local a la calle', texto: `${TIENDA.ciudad}, ${TIENDA.provincia}` }
]

export default function Home() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const destacados = PRODUCTOS.filter((x) => x.destacado).slice(0, 8)
  const ofertas = [...PRODUCTOS]
    .filter((x) => descuento(x) > 0)
    .sort((a, b) => descuento(b) - descuento(a))
    .slice(0, 4)
  const nuevos = PRODUCTOS.filter((x) => x.nuevo).slice(0, 4)
  const s = SLIDES[slide]

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero" style={{ '--acento': s.color }}>
        <div className="contenedor hero-int">
          <div className="hero-texto" key={slide}>
            <span className="hero-rotulo">{s.rotulo}</span>
            <h1>{s.titulo}</h1>
            <p>{s.texto}</p>
            <Link to={s.link} className="btn btn-lima">
              {s.cta} <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-figura" key={`f${slide}`}>
            <FotoProducto
              producto={{ imagen: null, nombre: 'Zapatilla destacada', colores: [] }}
              colorHex={s.color}
              alt="Zapatilla destacada"
              className="hero-img"
            />
          </div>
        </div>
        <div className="hero-puntos">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={i === slide ? 'activo' : ''}
              onClick={() => setSlide(i)}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ---------- BENEFICIOS ---------- */}
      <section className="beneficios">
        <div className="contenedor beneficios-int">
          {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
            <div className="beneficio" key={titulo}>
              <Icono size={24} strokeWidth={1.7} />
              <div>
                <strong>{titulo}</strong>
                <span>{texto}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Elegi por categoria</span>
              <h2>Compra por deporte</h2>
            </div>
            <Link to="/catalogo" className="link-todos">
              Ver todo
            </Link>
          </div>
          <div className="deportes">
            {DEPORTES.map((d, i) => (
              <Link key={d} to={`/catalogo?deporte=${encodeURIComponent(d)}`} className="deporte">
                <span className="deporte-num">0{i + 1}</span>
                <span className="deporte-nombre">{d}</span>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DESTACADOS ---------- */}
      <section className="seccion seccion-gris">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Los que mas se venden</span>
              <h2>Destacados</h2>
            </div>
            <Link to="/catalogo" className="link-todos">
              Ver catalogo
            </Link>
          </div>
          <div className="grilla-productos">
            {destacados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BANNER OFERTAS ---------- */}
      <section className="banner-ofertas">
        <div className="contenedor banner-int">
          <div>
            <span className="rotulo rotulo-claro">Solo por tiempo limitado</span>
            <h2>
              Hasta <em>40% OFF</em> en seleccionados
            </h2>
            <p>Modelos de temporada anterior con descuentos que no vuelven.</p>
          </div>
          <Link to="/catalogo/ofertas" className="btn btn-lima">
            Ver ofertas <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ---------- OFERTAS ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Bajaron de precio</span>
              <h2>Mejores descuentos</h2>
            </div>
            <Link to="/catalogo/ofertas" className="link-todos">
              Ver todas
            </Link>
          </div>
          <div className="grilla-productos">
            {ofertas.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- MARCAS ---------- */}
      <section className="tira-marcas">
        <div className="contenedor tira-marcas-int">
          {MARCAS.map((m) => (
            <Link key={m} to={`/catalogo?marca=${encodeURIComponent(m)}`}>
              {m}
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- NUEVOS ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Recien llegados</span>
              <h2>Nuevos ingresos</h2>
            </div>
            <Link to="/catalogo" className="link-todos">
              Ver todo
            </Link>
          </div>
          <div className="grilla-productos">
            {nuevos.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- LOCAL ---------- */}
      <section className="bloque-local">
        <div className="contenedor bloque-local-int">
          <div>
            <span className="rotulo">Vení a probártelas</span>
            <h2>
              Estamos en {TIENDA.ciudad}, {TIENDA.provincia}
            </h2>
            <p className="bloque-local-dir">{TIENDA.direccion}</p>
            <p className="bloque-local-hor">{TIENDA.horarios}</p>
            <div className="bloque-local-botones">
              <Link to="/contacto" className="btn btn-negro">
                Como llegar
              </Link>
              <a
                className="btn btn-linea"
                href={linkWhatsApp(`Hola ${TIENDA.nombre}! Queria consultar por un modelo.`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar stock
              </a>
            </div>
          </div>
          <div className="bloque-local-mapa">
            <iframe
              title="Ubicacion del local"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                TIENDA.direccion
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  )
}
