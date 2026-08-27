import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCarrito } from '../context/CartContext'
import { useCatalogo } from '../context/CatalogoContext'
import { TIENDA } from '../data/tienda'
import Logo from './Logo'
import BotonCuenta from './BotonCuenta'
import './Header.css'

const AVISOS = [
  'RETIRA EN NUESTRO LOCAL DE SAN FRANCISCO SIN CARGO',
  TIENDA.envioGratisDesde > 0
    ? `ENVIO GRATIS EN COMPRAS DESDE $${TIENDA.envioGratisDesde.toLocaleString('es-AR')}`
    : 'ENVIO GRATIS A TODO EL PAIS',
  `HASTA ${TIENDA.cuotasSinInteres} CUOTAS SIN INTERES CON TARJETA`
]

// Los tres publicos con lo que realmente hay en cada uno. Se arma del
// catalogo, asi nunca aparece un enlace a una categoria vacia.
const PUBLICOS = [
  { id: 'hombre', txt: 'Hombre', tiene: (x) => x.genero === 'hombre' || x.genero === 'unisex' },
  {
    id: 'mujer',
    txt: 'Mujer',
    tiene: (x) => x.genero === 'mujer' || x.genero === 'unisex'
  },
  { id: 'ninos', txt: 'Niños', tiene: (x) => x.genero === 'ninos' }
]

export default function Header() {
  const { unidades, abrir } = useCarrito()
  const { marcas, productos } = useCatalogo()

  const menus = useMemo(
    () =>
      PUBLICOS.map((p) => {
        const suyos = productos.filter(p.tiene)
        const cuenta = (campo, valor) => suyos.filter((x) => x[campo] === valor).length
        return {
          ...p,
          tipos: [...new Set(suyos.map((x) => x.tipo))].sort(),
          usos: [...new Set(suyos.map((x) => x.uso))].sort(),
          marcas: [...new Set(suyos.map((x) => x.marca))].sort(),
          total: suyos.length,
          cuenta
        }
      }).filter((p) => p.total > 0),
    [productos]
  )
  const [menuAbierto, setMenuAbierto] = useState(false)
  // Un solo estado para los dos desplegables: asi no pueden quedar los dos
  // abiertos a la vez.
  const [desplegable, setDesplegable] = useState(null)
  const [aviso, setAviso] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const navegar = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setAviso((i) => (i + 1) % AVISOS.length), 4200)
    return () => clearInterval(t)
  }, [])

  // Cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!desplegable) return
    const fuera = (e) => {
      if (!e.target.closest('.nav-desplegable, .nav-mega')) setDesplegable(null)
    }
    const tecla = (e) => e.key === 'Escape' && setDesplegable(null)
    document.addEventListener('click', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('click', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [desplegable])

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
            <BotonCuenta />
            <button className="accion-carrito" onClick={abrir} aria-label="Abrir carrito">
              <ShoppingBag size={22} />
              {unidades > 0 && <span className="globo">{unidades}</span>}
            </button>
          </div>
        </div>
      </div>

      <nav className="barra-nav" aria-label="Categorias">
        <div className="contenedor barra-nav-int">
          {menus.map((m) => (
            <div
              className="nav-mega"
              key={m.id}
              onMouseEnter={() => setDesplegable(m.id)}
              onMouseLeave={() => setDesplegable(null)}
            >
              <NavLink
                to={`/catalogo/${m.id}`}
                aria-expanded={desplegable === m.id}
                className={desplegable === m.id ? 'abierto' : ''}
                onClick={() => setDesplegable(null)}
              >
                {m.txt}
              </NavLink>

              <div className={desplegable === m.id ? 'mega abierto' : 'mega'}>
                <div className="contenedor mega-int">
                  <div className="mega-col">
                    <h4>Tipo de calzado</h4>
                    {m.tipos.map((t) => (
                      <Link
                        key={t}
                        to={`/catalogo/${m.id}?tipo=${encodeURIComponent(t)}`}
                        onClick={() => setDesplegable(null)}
                      >
                        {t} <em>{m.cuenta('tipo', t)}</em>
                      </Link>
                    ))}
                  </div>

                  <div className="mega-col">
                    <h4>Para que</h4>
                    {m.usos.map((u) => (
                      <Link
                        key={u}
                        to={`/catalogo/${m.id}?uso=${encodeURIComponent(u)}`}
                        onClick={() => setDesplegable(null)}
                      >
                        {u} <em>{m.cuenta('uso', u)}</em>
                      </Link>
                    ))}
                  </div>

                  <div className="mega-col">
                    <h4>Marcas</h4>
                    {m.marcas.map((x) => (
                      <Link
                        key={x}
                        to={`/catalogo/${m.id}?marca=${encodeURIComponent(x)}`}
                        onClick={() => setDesplegable(null)}
                      >
                        {x}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div
            className="nav-desplegable"
            onMouseEnter={() => setDesplegable('marcas')}
            onMouseLeave={() => setDesplegable(null)}
          >
            <button
              type="button"
              aria-expanded={desplegable === 'marcas'}
              onClick={() => setDesplegable((d) => (d === 'marcas' ? null : 'marcas'))}
            >
              Marcas
            </button>
            <div className={desplegable === 'marcas' ? 'panel abierto' : 'panel'}>
              {marcas.map((m) => (
                <Link
                  key={m}
                  to={`/catalogo?marca=${encodeURIComponent(m)}`}
                  onClick={() => setDesplegable(null)}
                >
                  {m}
                </Link>
              ))}
            </div>
          </div>

          <NavLink to="/contacto">Contacto</NavLink>
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
              <Link to="/catalogo/ninos">Niños</Link>
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
