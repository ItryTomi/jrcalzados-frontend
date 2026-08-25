import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'
import { descuento, precioARS, CUOTAS } from '../data/productos'
import { useCarrito } from '../context/CartContext'
import FotoProducto from './FotoProducto'
import './ProductCard.css'

export default function ProductCard({ producto }) {
  const [color, setColor] = useState(producto.colores[0])
  const { agregar } = useCarrito()
  const off = descuento(producto)
  const cuota = Math.round(producto.precio / CUOTAS)

  return (
    <article className="tarjeta">
      <div className="tarjeta-figura">
        <Link to={`/producto/${producto.id}`} aria-label={producto.nombre}>
          <FotoProducto
            producto={producto}
            colorHex={color.hex}
            alt={producto.nombre}
            className="tarjeta-img"
          />
        </Link>

        <div className="tarjeta-etiquetas">
          {off > 0 && <span className="et et-off">{off}% OFF</span>}
          {producto.nuevo && <span className="et et-nuevo">Nuevo</span>}
          {producto.stock <= 4 && <span className="et et-ultimas">Ultimas {producto.stock}</span>}
        </div>

        <div className="tarjeta-rapida">
          <span>Agregar talle</span>
          <div className="tarjeta-talles">
            {producto.talles.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => agregar(producto, t, color.nombre, 1)}
                aria-label={`Agregar talle ${t} al carrito`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="tarjeta-cuerpo">
        <p className="tarjeta-marca">{producto.marca}</p>
        <h3 className="tarjeta-nombre">
          <Link to={`/producto/${producto.id}`}>{producto.nombre}</Link>
        </h3>

        <div className="tarjeta-precios">
          {producto.precioAnterior && (
            <span className="precio-viejo">{precioARS(producto.precioAnterior)}</span>
          )}
          <span className="precio">{precioARS(producto.precio)}</span>
        </div>

        <p className="tarjeta-cuotas">
          <strong>{CUOTAS} cuotas sin interes</strong> de {precioARS(cuota)}
        </p>

        {producto.envioGratis && (
          <p className="tarjeta-envio">
            <Truck size={14} /> Envio gratis
          </p>
        )}

        {producto.colores.length > 1 && (
          <div className="tarjeta-colores">
            {producto.colores.map((c) => (
              <button
                key={c.nombre}
                type="button"
                title={c.nombre}
                aria-label={`Color ${c.nombre}`}
                className={c.nombre === color.nombre ? 'activo' : ''}
                style={{ background: c.hex }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
