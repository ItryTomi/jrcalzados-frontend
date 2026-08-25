import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Undo2 } from 'lucide-react'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import './Legales.css'

// Boton de arrepentimiento: es obligatorio para vender online en Argentina
// y tiene que estar accesible desde el inicio (Resolucion 424/2020).

export default function Arrepentimiento() {
  const [form, setForm] = useState({ nombre: '', orden: '', producto: '', motivo: '' })

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const texto = [
    `Hola ${TIENDA.nombre}, quiero ejercer el boton de arrepentimiento.`,
    '',
    form.nombre ? `Nombre: ${form.nombre}` : '',
    form.orden ? `Numero de pedido: ${form.orden}` : '',
    form.producto ? `Producto: ${form.producto}` : '',
    form.motivo ? `Comentario: ${form.motivo}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  const asunto = encodeURIComponent(`Arrepentimiento de compra ${form.orden || ''}`.trim())

  return (
    <div className="legales">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <span>Boton de arrepentimiento</span>
        </nav>

        <header className="legales-top">
          <h1>
            <Undo2 size={30} strokeWidth={2} /> Boton de arrepentimiento
          </h1>
          <p>
            Tenes derecho a arrepentirte de tu compra dentro de los 10 dias corridos desde que
            recibis el producto, sin costo y sin necesidad de justificar el motivo (Ley 24.240).
          </p>
        </header>

        <div className="arrepentimiento">
          <form className="arrep-form" onSubmit={(e) => e.preventDefault()}>
            <h2>Solicitar la cancelacion</h2>
            <label className="campo">
              Nombre y apellido
              <input name="nombre" value={form.nombre} onChange={cambiar} />
            </label>
            <label className="campo">
              Numero de pedido
              <input
                name="orden"
                value={form.orden}
                onChange={cambiar}
                placeholder="JR-XXXXXX"
              />
            </label>
            <label className="campo">
              Producto
              <input name="producto" value={form.producto} onChange={cambiar} />
            </label>
            <label className="campo">
              Comentario <span className="opcional">(opcional)</span>
              <textarea name="motivo" rows="3" value={form.motivo} onChange={cambiar} />
            </label>

            <div className="arrep-botones">
              <a
                className="btn btn-lima"
                href={linkWhatsApp(texto)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enviar por WhatsApp
              </a>
              <a
                className="btn btn-linea"
                href={`mailto:${TIENDA.email}?subject=${asunto}&body=${encodeURIComponent(texto)}`}
              >
                Enviar por mail
              </a>
            </div>
          </form>

          <aside className="arrep-info">
            <h2>Como sigue</h2>
            <ol>
              <li>Recibimos tu solicitud y te confirmamos por el mismo medio.</li>
              <li>Coordinamos el retiro o la devolucion del producto, sin costo para vos.</li>
              <li>
                Una vez que lo recibimos, te reintegramos el importe por el mismo medio de pago
                que usaste.
              </li>
            </ol>
            <p className="arrep-nota">
              El producto tiene que estar sin uso y en las mismas condiciones en que lo recibiste.
            </p>
            <p className="arrep-nota">
              Tambien podes escribirnos al {TIENDA.whatsappVisible} o a {TIENDA.email}.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
