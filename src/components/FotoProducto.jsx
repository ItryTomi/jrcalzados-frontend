// Placeholder vectorial: se usa mientras no haya foto real cargada.
// Toma el color del producto para que cada modelo se distinga en la grilla.

const aclarar = (hex, f) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const mez = (c) => Math.round(c + (255 - c) * f)
  return `rgb(${mez((n >> 16) & 255)}, ${mez((n >> 8) & 255)}, ${mez(n & 255)})`
}

const oscurecer = (hex, f) => {
  const n = parseInt(hex.replace('#', ''), 16)
  const mez = (c) => Math.round(c * (1 - f))
  return `rgb(${mez((n >> 16) & 255)}, ${mez((n >> 8) & 255)}, ${mez(n & 255)})`
}

export default function FotoProducto({ producto, colorHex, alt, className = '' }) {
  const base = colorHex || producto?.colores?.[0]?.hex || '#141414'
  const src = producto?.imagen

  if (src) {
    return <img className={className} src={src} alt={alt || producto?.nombre} loading="lazy" />
  }

  const cuerpo = base
  const claro = aclarar(base, 0.34)
  const oscuro = oscurecer(base, 0.32)
  const suela = '#f0f0ee'
  const detalle = base.toLowerCase() === '#f2f2f0' ? '#c9ccc6' : aclarar(base, 0.62)

  return (
    <svg
      className={className}
      viewBox="0 0 400 260"
      role="img"
      aria-label={alt || producto?.nombre || 'Zapatilla'}
      preserveAspectRatio="xMidYMid meet"
    >
      <ellipse cx="205" cy="232" rx="150" ry="11" fill="rgba(13,13,13,.09)" />

      {/* caña / talon */}
      <path
        d="M296 78c22-6 42 2 50 20 6 14 6 34 2 52l-46 6z"
        fill={oscuro}
      />
      {/* cuerpo principal */}
      <path
        d="M44 186c-4-26 14-42 48-52 32-9 60-22 88-40 24-15 46-24 70-24 10 0 18 2 24 6 14 10 20 30 22 52 2 22 4 42 6 58z"
        fill={cuerpo}
      />
      {/* puntera */}
      <path
        d="M44 186c-3-20 8-34 32-44 14 6 24 20 27 44z"
        fill={claro}
      />
      {/* panel lateral / detalle tipo swoosh */}
      <path
        d="M104 176c22-28 56-48 96-62 14-5 26-6 36-4l-6 18c-12-2-24 0-38 6-34 14-62 30-78 52z"
        fill={detalle}
      />
      {/* cordones */}
      <g stroke={suela} strokeWidth="7" strokeLinecap="round" opacity=".92">
        <path d="M150 128l30 22" />
        <path d="M178 110l30 22" />
        <path d="M206 92l30 22" />
        <path d="M234 78l28 20" />
      </g>
      {/* lengueta */}
      <path d="M262 62c14-4 26 0 32 12l-24 16z" fill={claro} />
      {/* mediasuela */}
      <path
        d="M40 186h318c8 0 12 5 10 12l-3 10c-2 8-9 12-19 12H62c-13 0-23-7-27-19l-3-9c-2-4 2-6 8-6z"
        fill={suela}
        stroke="#dcdedb"
        strokeWidth="2"
      />
      {/* linea de la mediasuela */}
      <path d="M46 202h312" stroke={cuerpo} strokeWidth="4" opacity=".55" />
      {/* suela */}
      <path
        d="M62 210h284c8 0 12 4 10 9-2 6-8 9-17 9H78c-11 0-19-5-22-13-1-3 1-5 6-5z"
        fill="#1c1c1c"
        opacity=".9"
      />
    </svg>
  )
}
