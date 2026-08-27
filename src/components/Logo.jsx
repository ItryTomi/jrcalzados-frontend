import { useState } from 'react'
import './Logo.css'

// Usa /public/logo.jpg si existe (el logo real del cliente).
// Si no lo encuentra cae al SVG y, si tampoco, al wordmark tipografico.
//
// El logo va dentro de un contenedor circular con recorte propio: el JPG
// trae las esquinas en negro alrededor del circulo y hay que taparlas.
export default function Logo({ compacto = false, invertido = false }) {
  const [paso, setPaso] = useState(0)
  const clase = `marca ${compacto ? 'marca-chica' : ''} ${invertido ? 'marca-inv' : ''}`

  if (paso < 2) {
    return (
      <span className={clase}>
        <img
          src={paso === 0 ? '/logo.jpg' : '/logo.svg'}
          alt="JR Calzados"
          onError={() => setPaso((n) => n + 1)}
        />
      </span>
    )
  }

  return (
    <span className={`${clase} marca-texto`}>
      <strong>JR</strong>
      <em>CALZADOS</em>
      <small>San Francisco - Cordoba</small>
    </span>
  )
}
