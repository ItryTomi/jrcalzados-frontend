import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, CreditCard, MapPin, RefreshCw, Ruler, Truck } from 'lucide-react'
import { buscarProducto, PRODUCTOS, descuento, precioARS, CUOTAS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import { useCarrito } from '../context/CartContext'
import FotoProducto from '../components/FotoProducto'
import ProductCard from '../components/ProductCard'
import './Producto.css'

export default function Producto() {
  const { id } = useParams()
  const producto = buscarProducto(id)
  const { agregar } = useCarrito()
  const [color, setColor] = useState(producto?.colores[0])
  const [talle, setTalle] = useState(null)
  const [aviso, setAviso] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setColor(producto?.colores[0])
    setTalle(null)
    setAviso(false)
  }, [id, producto])

  if (!producto) {
    return (
      <div className="contenedor producto-noexiste">
        <h1>No encontramos ese producto</h1>
        <Link to="/catalogo" className="btn btn-negro">
          Volver al catalogo
        </Link>
      </div>
    )
  }

  const off = descuento(producto)
  const cuota = Math.round(producto.precio / CUOTAS)
  const relacionados = PRODUCTOS.filter(
    (p) => p.id !== producto.id && (p.deporte === producto.deporte || p.marca === producto.marca)
  ).slice(0, 4)

  const alAgregar = () => {
    if (!talle) {
      setAviso(true)
      return
    }
    agregar(producto, talle, color.nombre, 1)
  }

  const consulta = linkWhatsApp(
    `Hola ${TIENDA.nombre}! Queria consultar por: ${producto.marca} ${producto.nombre}${
      talle ? ` (talle ${talle})` : ''
    }`
  )

  return (
    <div className="producto">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <Link to={`/catalogo/${producto.genero}`}>{producto.genero}</Link>
          <ChevronRight size={13} />
          <span>{producto.nombre}</span>
        </nav>

        <div className="producto-cuerpo">
          <div className="producto-galeria">
            <div className="galeria-principal">
              {off > 0 && <span className="et et-off">{off}% OFF</span>}
              <FotoProducto
                producto={producto}
                colorHex={color.hex}
                alt={producto.nombre}
                className="galeria-img"
              />
            </div>
            <div className="galeria-mini">
              {producto.colores.map((c) => (
                <button
                  key={c.nombre}
                  className={c.nombre === color.nombre ? 'activo' : ''}
                  onClick={() => setColor(c)}
                  aria-label={`Ver color ${c.nombre}`}
                >
                  <FotoProducto
                    producto={producto}
                    colorHex={c.hex}
                    alt={c.nombre}
                    className="mini-img"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="producto-datos">
            <p className="producto-marca">{producto.marca}</p>
            <h1>{producto.nombre}</h1>
            <p className="producto-sku">
              Cod. {producto.id.toUpperCase()} &middot; {producto.deporte}
            </p>

            <div className="producto-precios">
              {producto.precioAnterior && (
                <span className="precio-viejo">{precioARS(producto.precioAnterior)}</span>
              )}
              <span className="precio-grande">{precioARS(producto.precio)}</span>
              {off > 0 && <span className="et et-off">{off}% OFF</span>}
            </div>
            <p className="producto-cuotas">
              <strong>
                {CUOTAS} cuotas sin interes de {precioARS(cuota)}
              </strong>
            </p>

            <div className="producto-colores">
              <span className="etiqueta-campo">
                Color: <strong>{color.nombre}</strong>
              </span>
              <div className="colores-lista">
                {producto.colores.map((c) => (
                  <button
                    key={c.nombre}
                    title={c.nombre}
                    aria-label={c.nombre}
                    style={{ background: c.hex }}
                    className={c.nombre === color.nombre ? 'activo' : ''}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="producto-talles">
              <div className="talles-top">
                <span className="etiqueta-campo">
                  Talle {talle ? <strong>{talle}</strong> : null}
                </span>
                <span className="guia-talles">
                  <Ruler size={14} /> Guia de talles
                </span>
              </div>
              <div className="talles-lista">
                {producto.talles.map((t) => (
                  <button
                    key={t}
                    className={t === talle ? 'activo' : ''}
                    onClick={() => {
                      setTalle(t)
                      setAviso(false)
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {aviso && <p className="aviso-talle">Elegi un talle para continuar</p>}
            </div>

            <p className="producto-stock">
              {producto.stock <= 4
                ? `Ultimas ${producto.stock} unidades`
                : 'Stock disponible en el local'}
            </p>

            <div className="producto-acciones">
              <button className="btn btn-lima btn-bloque" onClick={alAgregar}>
                Agregar al carrito
              </button>
              <a
                className="btn btn-linea btn-bloque"
                href={consulta}
                target="_blank"
                rel="noopener noreferrer"
              >
                Consultar por WhatsApp
              </a>
            </div>

            <ul className="producto-ventajas">
              <li>
                <Truck size={17} /> Envio gratis desde {precioARS(TIENDA.envioGratisDesde)}
              </li>
              <li>
                <CreditCard size={17} /> Hasta {CUOTAS} cuotas sin interes
              </li>
              <li>
                <RefreshCw size={17} /> Cambio de talle dentro de los 30 dias
              </li>
              <li>
                <MapPin size={17} /> Retiro sin cargo en {TIENDA.ciudad}
              </li>
            </ul>
          </div>
        </div>

        {relacionados.length > 0 && (
          <section className="seccion">
            <div className="seccion-cabecera">
              <div>
                <span className="rotulo">Te puede interesar</span>
                <h2>Productos relacionados</h2>
              </div>
            </div>
            <div className="grilla-productos">
              {relacionados.map((p) => (
                <ProductCard key={p.id} producto={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
