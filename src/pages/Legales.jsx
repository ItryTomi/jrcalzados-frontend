import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { LEGALES } from '../data/legales'
import './Legales.css'

export default function Legales() {
  const { doc } = useParams()
  const info = LEGALES[doc]

  if (!info) return <Navigate to="/" replace />

  return (
    <div className="legales">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <span>{info.titulo}</span>
        </nav>

        <header className="legales-top">
          <h1>{info.titulo}</h1>
          <p>{info.bajada}</p>
        </header>

        <article className="legales-cuerpo">
          {info.secciones.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i}>{t}</p>
              ))}
            </section>
          ))}
        </article>
      </div>
    </div>
  )
}
