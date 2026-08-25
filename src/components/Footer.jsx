import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Instagram } from './IconosSociales'
import { MARCAS } from '../data/productos'
import { TIENDA } from '../data/tienda'
import Logo from './Logo'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="pie">
      <div className="contenedor pie-grilla">
        <div className="pie-col pie-marca">
          <div className="pie-logo">
            <Logo invertido />
          </div>
          <p>
            Zapatillas, sandalias y calzado para toda la familia en {TIENDA.ciudad},{' '}
            {TIENDA.provincia}. Atencion personalizada y envios a todo el pais.
          </p>
          <div className="pie-redes">
            <a
              href={`https://instagram.com/${TIENDA.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a href={`mailto:${TIENDA.email}`} aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>

        <div className="pie-col">
          <h4>Comprar</h4>
          <Link to="/catalogo/hombre">Hombre</Link>
          <Link to="/catalogo/mujer">Mujer</Link>
          <Link to="/catalogo/ninos">Ninos</Link>
          <Link to="/catalogo/sandalias">Sandalias</Link>
          <Link to="/catalogo">Todo el catalogo</Link>
        </div>

        <div className="pie-col">
          <h4>Marcas</h4>
          {MARCAS.slice(0, 6).map((m) => (
            <Link key={m} to={`/catalogo?marca=${encodeURIComponent(m)}`}>
              {m}
            </Link>
          ))}
        </div>

        <div className="pie-col">
          <h4>El local</h4>
          <p className="pie-dato">
            <MapPin size={15} /> {TIENDA.direccion}
          </p>
          <p className="pie-dato">
            <Clock size={15} /> {TIENDA.horarios}
          </p>
          <p className="pie-dato">
            <Phone size={15} /> {TIENDA.whatsappVisible}
          </p>
          <p className="pie-dato">
            <Mail size={15} /> {TIENDA.email}
          </p>
        </div>
      </div>

      <div className="pie-legal">
        <div className="contenedor pie-legal-int">
          <span>
            &copy; {new Date().getFullYear()} {TIENDA.nombre}. Todos los derechos reservados.
          </span>
          <span className="pie-credito">
            Sitio desarrollado por{' '}
            <a href="https://kaairo.com" target="_blank" rel="noopener noreferrer">
              Kaairo
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
