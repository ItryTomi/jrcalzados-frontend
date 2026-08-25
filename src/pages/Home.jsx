import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, MapPin, Store, Truck } from 'lucide-react'
import { PRODUCTOS, MARCAS, precioARS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import ProductCard from '../components/ProductCard'
import './Home.css'

const SLIDES = [
  {
    rotulo: 'Running 2026',
    titulo: 'Corre mas\nlejos',
    texto: 'Olympikus, Jaguar y Diportto. Hasta 3 cuotas sin interes.',
    cta: 'Ver running',
    link: '/catalogo?uso=Running',
    imagen: '/productos/olympikus-pride4-blanco-coral.jpg',
    color: '#f2775f'
  },
  {
    rotulo: 'Urbanas',
    titulo: 'Clasicas\nde siempre',
    texto: 'Retro runners y lonas para todos los dias, de 36 al 45.',
    cta: 'Ver urbanas',
    link: '/catalogo?uso=Urbano',
    imagen: '/productos/jaguar-9412-azul.jpg',
    color: '#22314f'
  },
  {
    rotulo: 'Temporada',
    titulo: 'Sandalias\nLady Comfort',
    texto: 'Confort real para todo el dia. Consultanos talles disponibles.',
    cta: 'Ver sandalias',
    link: '/catalogo/sandalias',
    imagen: '/productos/ladycomfort-velcro-taupe.jpg',
    color: '#8d7c6a'
  }
]

const CATEGORIAS_HOME = [
  { nombre: 'Hombre', link: '/catalogo/hombre', imagen: '/productos/jaguar-9435-negra.jpg' },
  { nombre: 'Mujer', link: '/catalogo/mujer', imagen: '/productos/jaguar-9394-rosa.jpg' },
  { nombre: 'Ninos', link: '/catalogo/ninos', imagen: '/productos/jaguar-4036-rosa.jpg' },
  { nombre: 'Sandalias', link: '/catalogo/sandalias', imagen: '/productos/karina-1494-beige.jpg' }
]

export default function Home() {
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  const destacados = PRODUCTOS.filter((x) => x.destacado).slice(0, 8)
  const nuevos = PRODUCTOS.filter((x) => x.nuevo).slice(0, 4)
  const masBarato = Math.min(...PRODUCTOS.map((x) => x.precio))
  const s = SLIDES[slide]

  const BENEFICIOS = [
    { icono: Truck, titulo: 'Envios a todo el pais', texto: 'Coordinamos al confirmar el pedido' },
    {
      icono: CreditCard,
      titulo: `${TIENDA.cuotasSinInteres} cuotas sin interes`,
      texto: 'Con todas las tarjetas'
    },
    { icono: Store, titulo: 'Retiro en el local', texto: 'Sin cargo, comprando online' },
    { icono: MapPin, titulo: 'Local a la calle', texto: `${TIENDA.ciudad}, ${TIENDA.provincia}` }
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
              <h2>Que estas buscando</h2>
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
                  {c.nombre} <ArrowRight size={17} />
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
            {nuevos.map((x) => (
              <ProductCard key={x.id} producto={x} />
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

      {/* ---------- LOCAL ---------- */}
      <section className="bloque-local">
        <div className="contenedor bloque-local-int">
          <div>
            <span className="rotulo">Veni a probartelas</span>
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
                `${TIENDA.direccion}`
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
