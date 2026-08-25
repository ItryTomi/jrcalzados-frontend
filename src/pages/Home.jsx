import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import { PRODUCTOS, MARCAS, precioARS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import ProductCard from '../components/ProductCard'
import './Home.css'

const SLIDES = [
  {
    rotulo: 'Running 2026',
    titulo: 'Corre mas\nlejos',
    texto: 'Olympikus, Jaguar y Diportto.',
    cta: 'Ver running',
    link: '/catalogo?uso=Running',
    imagen: '/productos/olympikus-pride4-blanco-coral.jpg',
    color: '#f2775f'
  },
  {
    rotulo: 'Urbanas',
    titulo: 'Clasicas\nde siempre',
    texto: 'Retro runners y lonas para todos los dias.',
    cta: 'Ver urbanas',
    link: '/catalogo?uso=Urbano',
    imagen: '/productos/jaguar-9412-azul.jpg',
    color: '#22314f'
  },
  {
    rotulo: 'Temporada',
    titulo: 'Sandalias\nde confort',
    texto: 'Lady Comfort y Karina, para todo el dia.',
    cta: 'Ver sandalias',
    link: '/catalogo/sandalias',
    imagen: '/productos/ladycomfort-velcro-taupe.jpg',
    color: '#8d7c6a'
  }
]

// Cada tarjeta lleva directo a una vista ya filtrada del catalogo.
const CATEGORIAS_HOME = [
  { nombre: 'Zapatillas hombre', link: '/catalogo/hombre', imagen: '/productos/jaguar-9435-negra.jpg' },
  { nombre: 'Zapatillas mujer', link: '/catalogo/mujer', imagen: '/productos/jaguar-9394-rosa.jpg' },
  { nombre: 'Ninos', link: '/catalogo/ninos', imagen: '/productos/jaguar-4036-rosa.jpg' },
  { nombre: 'Running', link: '/catalogo?uso=Running', imagen: '/productos/olympikus-lance-menta.jpg' },
  { nombre: 'Padel y tenis', link: '/catalogo?uso=Padel', imagen: '/productos/diportto-olympiadi-azul.jpg' },
  { nombre: 'Botitas', link: '/catalogo?tipo=Botitas', imagen: '/productos/jaguar-4351-negra.jpg' },
  { nombre: 'Lonas', link: '/catalogo?tipo=Lona', imagen: '/productos/jaguar-8074-negra.jpg' },
  {
    nombre: 'Sandalias de fiesta',
    link: '/catalogo/sandalias?uso=Fiesta',
    imagen: '/productos/ladycomfort-fiesta-plata.jpg'
  }
]

// "Un poco de todo": cada bloque muestra 4 y manda al listado completo.
const VITRINAS = [
  { titulo: 'Para ellas', rotulo: 'Mujer', link: '/catalogo/mujer', filtro: (x) => x.genero === 'mujer' && x.tipo !== 'Sandalias' },
  { titulo: 'Para ellos', rotulo: 'Hombre', link: '/catalogo/hombre', filtro: (x) => x.genero === 'hombre' || x.genero === 'unisex' },
  { titulo: 'Para los chicos', rotulo: 'Ninos', link: '/catalogo/ninos', filtro: (x) => x.genero === 'ninos' },
  { titulo: 'Sandalias', rotulo: 'Temporada', link: '/catalogo/sandalias', filtro: (x) => x.tipo === 'Sandalias' }
]

export default function Home() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const destacados = PRODUCTOS.filter((x) => x.destacado).slice(0, 8)
  const masBarato = Math.min(...PRODUCTOS.map((x) => x.precio))
  const s = SLIDES[slide]

  const avisos = [
    `${TIENDA.cuotasSinInteres} cuotas sin interes`,
    'Envios a todo el pais',
    `Retiro sin cargo en ${TIENDA.ciudad}`,
    'Cambio de talle en el local'
  ]

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
            <img className="hero-img" src={s.imagen} alt={s.rotulo} />
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

      {/* ---------- TICKER DE BENEFICIOS ---------- */}
      <section className="ticker" aria-label="Beneficios">
        <div className="ticker-pista">
          {[0, 1, 2].map((v) => (
            <div className="ticker-grupo" key={v} aria-hidden={v > 0}>
              {avisos.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      <section className="seccion">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Entra directo a lo que buscas</span>
              <h2>Categorias</h2>
            </div>
            <Link to="/catalogo" className="link-todos">
              Ver todo
            </Link>
          </div>
          <div className="categorias">
            {CATEGORIAS_HOME.map((c) => (
              <Link key={c.nombre} to={c.link} className="categoria">
                <img src={c.imagen} alt={c.nombre} loading="lazy" />
                <span className="categoria-nombre">
                  {c.nombre} <ArrowRight size={16} />
                </span>
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
            {destacados.map((x) => (
              <ProductCard key={x.id} producto={x} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- BANNER ---------- */}
      <section className="banner-ofertas">
        <div className="contenedor banner-int">
          <div>
            <span className="rotulo rotulo-claro">Toda la familia</span>
            <h2>
              Desde <em>{precioARS(masBarato)}</em>
            </h2>
            <p>
              Zapatillas, botitas, lonas y sandalias. Marcas nacionales con precio de local, no de
              shopping.
            </p>
          </div>
          <Link to="/catalogo" className="btn btn-lima">
            Ver catalogo <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* ---------- UN POCO DE TODO ---------- */}
      {VITRINAS.map((v) => {
        const items = PRODUCTOS.filter(v.filtro).slice(0, 4)
        if (!items.length) return null
        return (
          <section className="seccion" key={v.titulo}>
            <div className="contenedor">
              <div className="seccion-cabecera">
                <div>
                  <span className="rotulo">{v.rotulo}</span>
                  <h2>{v.titulo}</h2>
                </div>
                <Link to={v.link} className="link-todos">
                  Ver todos
                </Link>
              </div>
              <div className="grilla-productos">
                {items.map((x) => (
                  <ProductCard key={x.id} producto={x} />
                ))}
              </div>
              <div className="vitrina-pie">
                <Link to={v.link} className="btn btn-linea">
                  Ver todo {v.rotulo.toLowerCase()} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )
      })}

      {/* ---------- MARCAS ---------- */}
      <section className="tira-marcas">
        <div className="contenedor">
          <div className="seccion-cabecera">
            <div>
              <span className="rotulo">Trabajamos con</span>
              <h2>Nuestras marcas</h2>
            </div>
          </div>
          <div className="tira-marcas-int">
            {MARCAS.map((m) => (
              <Link key={m} to={`/catalogo?marca=${encodeURIComponent(m)}`}>
                {m}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- LOCAL ---------- */}
      <section className="bloque-local">
        <div className="contenedor bloque-local-int">
          <div>
            <span className="rotulo">Veni a probartelas</span>
            <h2>
              Estamos en {TIENDA.ciudad}, {TIENDA.provincia}
            </h2>
            <p className="bloque-local-dir">
              <MapPin size={16} /> {TIENDA.direccion}
            </p>
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
