import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { descuento, precioARS, CUOTAS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import { useCarrito } from '../context/CartContext'
import { useAgotados } from '../hooks/useAgotados'
import FotoProducto from './FotoProducto'
import './ProductCard.css'

export default function ProductCard({ producto }) {
  const [color, setColor] = useState(producto.colores[0])
  const { agregar } = useCarrito()
  const { estaAgotado } = useAgotados()
  const sinStock =
    !producto.consultarTalle &&
    producto.talles.length > 0 &&
    producto.talles.every((t) => estaAgotado(producto.id, color.nombre, t))
  const off = descuento(producto)
  const cuota = Math.round(producto.precio / CUOTAS)

  const consulta = linkWhatsApp(
    `Hola ${TIENDA.nombre}! Queria consultar talles de: ${producto.marca} ${producto.nombre} (${color.nombre})`
  )

  return (
    <article className="tarjeta">
      <div className="tarjeta-figura">
        <Link to={`/producto/${producto.id}`} aria-label={producto.nombre}>
          <FotoProducto
            imagen={color.imagen}
            colorHex={color.hex}
            alt={`${producto.nombre} - ${color.nombre}`}
            className="tarjeta-img"
          />
        </Link>

        <div className="tarjeta-etiquetas">
          {off > 0 && <span className="et et-off">{off}% OFF</span>}
          {producto.nuevo && !sinStock && <span className="et et-nuevo">Nuevo</span>}
          {sinStock && <span className="et et-agotado">Sin stock</span>}
        </div>

        {producto.consultarTalle ? (
          <a
            className="tarjeta-rapida tarjeta-consulta"
            href={consulta}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={16} /> Consultar talles
          </a>
        ) : (
          <div className="tarjeta-rapida">
            <span>Agregar talle</span>
            <div className="tarjeta-talles">
              {producto.talles.map((t) => {
                const agotado = estaAgotado(producto.id, color.nombre, t)
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={agotado}
                    title={agotado ? 'Sin stock' : undefined}
                    onClick={() => agregar(producto, t, color.nombre, 1)}
                    aria-label={`Agregar talle ${t} al carrito`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        )}
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

        <Link to={`/producto/${producto.id}`} className="btn btn-negro tarjeta-comprar">
          Comprar
        </Link>

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
