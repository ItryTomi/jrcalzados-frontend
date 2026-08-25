import { useState } from 'react'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { Instagram } from '../components/IconosSociales'
import { TIENDA, linkWhatsApp } from '../data/tienda'
import './Contacto.css'

export default function Contacto() {
  const [form, setForm] = useState({ nombre: '', modelo: '', talle: '', mensaje: '' })

  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const texto = [
    `Hola ${TIENDA.nombre}!`,
    form.nombre ? `Soy ${form.nombre}.` : '',
    form.modelo ? `Consulto por: ${form.modelo}` : '',
    form.talle ? `Talle: ${form.talle}` : '',
    form.mensaje
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="contacto">
      <div className="contacto-hero">
        <div className="contenedor">
          <span className="rotulo rotulo-lima">Estamos para ayudarte</span>
          <h1>Contacto</h1>
          <p>
            Consultanos por stock, talles o envios. Te respondemos por WhatsApp en el dia.
          </p>
        </div>
      </div>

      <div className="contenedor contacto-grilla">
        <div className="contacto-datos">
          <h2>El local</h2>
          <ul>
            <li>
              <MapPin size={18} />
              <div>
                <strong>Direccion</strong>
                <span>{TIENDA.direccion}</span>
              </div>
            </li>
            <li>
              <Clock size={18} />
              <div>
                <strong>Horarios</strong>
                <span>{TIENDA.horarios}</span>
              </div>
            </li>
            <li>
              <Phone size={18} />
              <div>
                <strong>WhatsApp</strong>
                <a href={linkWhatsApp('Hola! Queria hacer una consulta.')} target="_blank" rel="noopener noreferrer">
                  {TIENDA.whatsappVisible}
                </a>
              </div>
            </li>
            <li>
              <Mail size={18} />
              <div>
                <strong>Email</strong>
                <a href={`mailto:${TIENDA.email}`}>{TIENDA.email}</a>
              </div>
            </li>
            <li>
              <Instagram size={18} />
              <div>
                <strong>Instagram</strong>
                <a
                  href={`https://instagram.com/${TIENDA.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{TIENDA.instagram}
                </a>
              </div>
            </li>
          </ul>

          <div className="contacto-mapa">
            <iframe
              title="Ubicacion de JR Calzados"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                TIENDA.direccion
              )}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="contacto-form">
          <h2>Consultar un modelo</h2>
          <p className="contacto-form-ayuda">
            Completa los datos y se abre WhatsApp con el mensaje listo para enviar.
          </p>
          <label>
            Tu nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} placeholder="Juan Perez" />
          </label>
          <label>
            Modelo que te interesa
            <input
              name="modelo"
              value={form.modelo}
              onChange={cambiar}
              placeholder="Nike Revolution 7"
            />
          </label>
          <label>
            Talle
            <input name="talle" value={form.talle} onChange={cambiar} placeholder="42" />
          </label>
          <label>
            Mensaje
            <textarea
              name="mensaje"
              rows="4"
              value={form.mensaje}
              onChange={cambiar}
              placeholder="Queria saber si tienen stock..."
            />
          </label>
          <a
            className="btn btn-lima btn-bloque"
            href={linkWhatsApp(texto)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Enviar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
