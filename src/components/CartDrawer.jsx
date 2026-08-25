import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Minus, Plus, ShoppingBag, Trash2, Truck, X } from 'lucide-react'
import { useCarrito } from '../context/CartContext'
import { useBloquearScroll } from '../hooks/useBloquearScroll'
import { precioARS, CUOTAS } from '../data/productos'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import { iniciarPago } from '../services/pago'
import FotoProducto from './FotoProducto'
import './CartDrawer.css'

export default function CartDrawer() {
  const { lineas, unidades, subtotal, abierto, cerrar, cambiarCantidad, quitar, vaciar } =
    useCarrito()
  const [pagando, setPagando] = useState(false)
  const [errorPago, setErrorPago] = useState(null)
  useBloquearScroll(abierto)

  if (!abierto) return null

  const mensaje = [
    `Hola ${TIENDA.nombre}! Quiero hacer este pedido:`,
    '',
    ...lineas.map(
      (l) =>
        `- ${l.marca} ${l.nombre} | Talle ${l.talle} | ${l.color} | x${l.cantidad} | ${precioARS(
          l.precio * l.cantidad
        )}`
    ),
    '',
    `Total: ${precioARS(subtotal)}`
  ].join('\n')

  const pagar = async () => {
    setErrorPago(null)
    setPagando(true)
    try {
      const { url } = await iniciarPago(lineas)
      window.location.href = url
    } catch (e) {
      setErrorPago(e.message)
      setPagando(false)
    }
  }

  return (
    <div className="carrito" role="dialog" aria-label="Carrito de compras">
      <div className="carrito-velo" onClick={cerrar} />
      <aside className="carrito-panel">
        <header className="carrito-top">
          <h2>
            <ShoppingBag size={20} /> Tu carrito
            {unidades > 0 && <em>({unidades})</em>}
          </h2>
          <button onClick={cerrar} aria-label="Cerrar carrito">
            <X size={22} />
          </button>
        </header>

        {lineas.length === 0 ? (
          <div className="carrito-vacio">
            <ShoppingBag size={46} strokeWidth={1.2} />
            <p>Todavia no agregaste nada.</p>
            <Link to="/catalogo" className="btn btn-negro" onClick={cerrar}>
              Ver catalogo
            </Link>
          </div>
        ) : (
          <>
            <div className="carrito-envio">
              <p className="listo">
                <Truck size={15} /> Envio gratis a todo el pais
              </p>
            </div>

            <ul className="carrito-lista">
              {lineas.map((l) => (
                <li key={l.key}>
                  <div className="linea-figura">
                    <FotoProducto
                      imagen={l.imagen}
                      colorHex={l.colorHex}
                      alt={l.nombre}
                      className="linea-img"
                    />
                  </div>
                  <div className="linea-datos">
                    <p className="linea-marca">{l.marca}</p>
                    <p className="linea-nombre">{l.nombre}</p>
                    <p className="linea-variante">
                      Talle {l.talle} &middot; {l.color}
                    </p>
                    <div className="linea-pie">
                      <div className="contador">
                        <button
                          onClick={() => cambiarCantidad(l.key, l.cantidad - 1)}
                          aria-label="Quitar uno"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{l.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(l.key, l.cantidad + 1)}
                          aria-label="Agregar uno"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <strong>{precioARS(l.precio * l.cantidad)}</strong>
                    </div>
                  </div>
                  <button className="linea-borrar" onClick={() => quitar(l.key)} aria-label="Quitar">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>

            <footer className="carrito-pie">
              <div className="carrito-total">
                <span>Total</span>
                <strong>{precioARS(subtotal)}</strong>
              </div>
              <p className="carrito-cuotas">
                Hasta {CUOTAS} cuotas sin interes de {precioARS(Math.round(subtotal / CUOTAS))}
              </p>

              {errorPago && <p className="carrito-error">{errorPago}</p>}

              <button className="btn btn-lima btn-bloque" onClick={pagar} disabled={pagando}>
                {pagando ? 'Abriendo el pago...' : 'Pagar ahora'}
              </button>

              <p className="carrito-seguro">
                <Lock size={13} /> Pago protegido por Mercado Pago. Tarjetas, debito y billetera.
              </p>

              <a
                className="btn btn-linea btn-bloque"
                href={linkWhatsApp(mensaje)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Prefiero coordinar por WhatsApp
              </a>

              <button className="carrito-vaciar" onClick={vaciar}>
                Vaciar carrito
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
