import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, X, MapPin, Phone } from 'lucide-react'
import { useCarrito } from '../context/CartContext'
import { MARCAS, TIPOS } from '../data/productos'
import { TIENDA } from '../data/tienda'
import Logo from './Logo'
import './Header.css'

const AVISOS = [
  'RETIRA EN NUESTRO LOCAL DE SAN FRANCISCO SIN CARGO',
  TIENDA.envioGratisActivo
    ? `ENVIO GRATIS EN COMPRAS DESDE $${TIENDA.envioGratisDesde.toLocaleString('es-AR')}`
    : 'ENVIOS A TODO EL PAIS',
  `HASTA ${TIENDA.cuotasSinInteres} CUOTAS SIN INTERES CON TARJETA`
]

export default function Header() {
  const { unidades, abrir } = useCarrito()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [aviso, setAviso] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const navegar = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setAviso((i) => (i + 1) % AVISOS.length), 4200)
    return () => clearInterval(t)
  }, [])

  const enviarBusqueda = (e) => {
    e.preventDefault()
    const q = busqueda.trim()
    navegar(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo')
    setMenuAbierto(false)
  }

  return (
    <header className="cabecera">
      <div className="barra-avisos">
        <span key={aviso}>{AVISOS[aviso]}</span>
      </div>

      <div className="barra-principal">
        <div className="contenedor barra-principal-int">
          <button
            className="boton-menu"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>

          <Link to="/" className="logo-link" aria-label="JR Calzados - Inicio">
            <Logo />
          </Link>

          <form className="buscador" onSubmit={enviarBusqueda} role="search">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar zapatillas, sandalias, marcas..."
              aria-label="Buscar productos"
            />
            <button type="submit" aria-label="Buscar">
              <Search size={19} />
            </button>
          </form>

          <div className="acciones">
            <a
              className="accion-texto"
              href={`tel:${TIENDA.whatsapp}`}
              aria-label="Telefono del local"
            >
              <Phone size={18} />
              <span>{TIENDA.whatsappVisible}</span>
            </a>
            <button className="accion-carrito" onClick={abrir} aria-label="Abrir carrito">
              <ShoppingBag size={22} />
              {unidades > 0 && <span className="globo">{unidades}</span>}
            </button>
          </div>
        </div>
      </div>

      <nav className="barra-nav" aria-label="Categorias">
        <div className="contenedor barra-nav-int">
          <NavLink to="/catalogo/hombre">Hombre</NavLink>
          <NavLink to="/catalogo/mujer">Mujer</NavLink>
          <NavLink to="/catalogo/ninos">Ninos</NavLink>

          <div className="nav-desplegable">
            <button type="button">Marcas</button>
            <div className="panel">
              {MARCAS.map((m) => (
                <Link key={m} to={`/catalogo?marca=${encodeURIComponent(m)}`}>
                  {m}
                </Link>
              ))}
            </div>
          </div>

          <div className="nav-desplegable">
            <button type="button">Tipo</button>
            <div className="panel">
              {TIPOS.map((t) => (
                <Link key={t} to={`/catalogo?tipo=${encodeURIComponent(t)}`}>
                  {t}
                </Link>
              ))}
            </div>
          </div>

          <NavLink to="/catalogo/sandalias">Sandalias</NavLink>
          <NavLink to="/contacto">Contacto</NavLink>

          <span className="nav-local">
            <MapPin size={15} /> {TIENDA.ciudad}, {TIENDA.provincia}
          </span>
        </div>
      </nav>

      {menuAbierto && (
        <div className="menu-movil" role="dialog" aria-label="Menu">
          <div className="velo" onClick={() => setMenuAbierto(false)} />
          <div className="panel-movil">
            <div className="panel-movil-top">
              <Logo compacto />
              <button onClick={() => setMenuAbierto(false)} aria-label="Cerrar menu">
                <X size={24} />
              </button>
            </div>
            <form className="buscador buscador-movil" onSubmit={enviarBusqueda}>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
              />
              <button type="submit" aria-label="Buscar">
                <Search size={18} />
              </button>
            </form>
            <nav onClick={() => setMenuAbierto(false)}>
              <Link to="/catalogo/hombre">Hombre</Link>
              <Link to="/catalogo/mujer">Mujer</Link>
              <Link to="/catalogo/ninos">Ninos</Link>
              <Link to="/catalogo/sandalias">Sandalias</Link>
              <Link to="/catalogo">Ver todo el catalogo</Link>
              <Link to="/contacto">Contacto</Link>
            </nav>
            <p className="panel-movil-pie">
              {TIENDA.direccion}
              <br />
              {TIENDA.horarios}
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
