import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useCarrito } from '../context/CartContext'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import './PagoResultado.css'

const ESTADOS = {
  exito: {
    icono: CheckCircle2,
    tono: 'ok',
    titulo: 'Listo, recibimos tu pago',
    texto:
      'Te llega el comprobante por mail. Preparamos el pedido y te escribimos para coordinar el envio.'
  },
  pendiente: {
    icono: Clock,
    tono: 'espera',
    titulo: 'Tu pago quedo pendiente',
    texto:
      'Si elegiste efectivo, tenes el cupon para pagar en Rapipago o Pago Facil. Apenas se acredite preparamos el pedido.'
  },
  error: {
    icono: XCircle,
    tono: 'mal',
    titulo: 'No se pudo completar el pago',
    texto:
      'No se hizo ningun cobro. Podes intentar con otro medio de pago o escribirnos y lo resolvemos juntos.'
  }
}

export default function PagoResultado() {
  const { estado } = useParams()
  const [params] = useSearchParams()
  const { vaciar, lineas } = useCarrito()

  const info = ESTADOS[estado] || ESTADOS.error
  const orden = params.get('orden')
  const Icono = info.icono

  // Si el pago salio bien el carrito ya no corresponde.
  useEffect(() => {
    if (estado === 'exito' && lineas.length) vaciar()
  }, [estado, lineas.length, vaciar])

  return (
    <div className="contenedor pago">
      <div className={`pago-caja ${info.tono}`}>
        <Icono size={54} strokeWidth={1.5} />
        <h1>{info.titulo}</h1>
        <p>{info.texto}</p>

        {orden && (
          <p className="pago-orden">
            Numero de pedido: <strong>{orden}</strong>
          </p>
        )}

        <div className="pago-botones">
          <Link to="/catalogo" className="btn btn-negro">
            Seguir comprando
          </Link>
          <a
            className="btn btn-linea"
            href={linkWhatsApp(
              `Hola ${TIENDA.nombre}! Consulto por el pedido ${orden || '(sin numero)'}.`
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            Escribirnos
          </a>
        </div>
      </div>
    </div>
  )
}
