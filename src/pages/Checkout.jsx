import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Lock, Store, Truck } from 'lucide-react'
import { useCarrito } from '../context/CartContext'
import { precioARS, CUOTAS } from '../data/productos'
import { TIENDA } from '../data/tienda'
import { iniciarPago } from '../services/pago'
import FotoProducto from '../components/FotoProducto'
import './Checkout.css'

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba', 'Corrientes',
  'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquen', 'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucuman'
]

const VACIO = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dni: '',
  entrega: 'envio',
  calle: '',
  numero: '',
  piso: '',
  ciudad: '',
  provincia: 'Cordoba',
  cp: '',
  notas: ''
}

const CLAVE = 'jr-datos-envio'

export default function Checkout() {
  const { lineas, subtotal, unidades } = useCarrito()
  const navegar = useNavigate()

  const [form, setForm] = useState(() => {
    try {
      const g = localStorage.getItem(CLAVE)
      return g ? { ...VACIO, ...JSON.parse(g) } : VACIO
    } catch {
      return VACIO
    }
  })
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [errorPago, setErrorPago] = useState(null)

  useEffect(() => {
    if (!lineas.length) navegar('/catalogo', { replace: true })
  }, [lineas.length, navegar])

  const cambiar = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrores((x) => ({ ...x, [name]: null }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Poné tu nombre'
    if (!form.apellido.trim()) e.apellido = 'Poné tu apellido'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Revisá el mail'
    if (form.telefono.replace(/\D/g, '').length < 8) e.telefono = 'Poné un teléfono de contacto'

    if (form.entrega === 'envio') {
      if (!form.calle.trim()) e.calle = 'Falta la calle'
      if (!form.numero.trim()) e.numero = 'Falta la altura'
      if (!form.ciudad.trim()) e.ciudad = 'Falta la localidad'
      if (!/^\d{4}$/.test(form.cp.trim())) e.cp = 'El código postal son 4 números'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const pagar = async (ev) => {
    ev.preventDefault()
    setErrorPago(null)
    if (!validar()) {
      document.querySelector('.campo-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }

    try {
      localStorage.setItem(CLAVE, JSON.stringify(form))
    } catch {
      /* sin localStorage no pasa nada */
    }

    setEnviando(true)
    try {
      const { url } = await iniciarPago(lineas, {
        comprador: {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          dni: form.dni.trim()
        },
        entrega:
          form.entrega === 'retiro'
            ? { modo: 'retiro', notas: form.notas.trim() }
            : {
                modo: 'envio',
                calle: form.calle.trim(),
                numero: form.numero.trim(),
                piso: form.piso.trim(),
                ciudad: form.ciudad.trim(),
                provincia: form.provincia,
                cp: form.cp.trim(),
                notas: form.notas.trim()
              }
      })
      window.location.href = url
    } catch (e) {
      setErrorPago(e.message)
      setEnviando(false)
    }
  }

  const cuota = useMemo(() => Math.round(subtotal / CUOTAS), [subtotal])

  if (!lineas.length) return null

  const campo = (nombre) => (errores[nombre] ? 'campo campo-error' : 'campo')

  return (
    <div className="checkout">
      <div className="contenedor">
        <nav className="miga" aria-label="Migas de pan">
          <Link to="/">Inicio</Link>
          <ChevronRight size={13} />
          <span>Finalizar compra</span>
        </nav>

        <h1>Finalizar compra</h1>

        <form className="checkout-cuerpo" onSubmit={pagar} noValidate>
          <div className="checkout-form">
            <section className="bloque">
              <h2>Tus datos</h2>
              <div className="grilla-campos">
                <label className={campo('nombre')}>
                  Nombre
                  <input name="nombre" value={form.nombre} onChange={cambiar} autoComplete="given-name" />
                  {errores.nombre && <em>{errores.nombre}</em>}
                </label>
                <label className={campo('apellido')}>
                  Apellido
                  <input name="apellido" value={form.apellido} onChange={cambiar} autoComplete="family-name" />
                  {errores.apellido && <em>{errores.apellido}</em>}
                </label>
                <label className={campo('email')}>
                  Email
                  <input name="email" type="email" value={form.email} onChange={cambiar} autoComplete="email" />
                  {errores.email && <em>{errores.email}</em>}
                </label>
                <label className={campo('telefono')}>
                  Teléfono
                  <input name="telefono" type="tel" value={form.telefono} onChange={cambiar} autoComplete="tel" placeholder="3564 123456" />
                  {errores.telefono && <em>{errores.telefono}</em>}
                </label>
                <label className="campo">
                  DNI <span className="opcional">(opcional)</span>
                  <input name="dni" value={form.dni} onChange={cambiar} inputMode="numeric" />
                </label>
              </div>
            </section>

            <section className="bloque">
              <h2>Cómo lo recibís</h2>
              <div className="opciones-entrega">
                <label className={form.entrega === 'envio' ? 'entrega activa' : 'entrega'}>
                  <input type="radio" name="entrega" value="envio" checked={form.entrega === 'envio'} onChange={cambiar} />
                  <Truck size={20} />
                  <span>
                    <strong>Envío a domicilio</strong>
                    <em>Gratis a todo el país</em>
                  </span>
                </label>
                <label className={form.entrega === 'retiro' ? 'entrega activa' : 'entrega'}>
                  <input type="radio" name="entrega" value="retiro" checked={form.entrega === 'retiro'} onChange={cambiar} />
                  <Store size={20} />
                  <span>
                    <strong>Retiro en el local</strong>
                    <em>{TIENDA.ciudad}, {TIENDA.provincia}</em>
                  </span>
                </label>
              </div>

              {form.entrega === 'envio' && (
                <div className="grilla-campos">
                  <label className={`${campo('calle')} ancho`}>
                    Calle
                    <input name="calle" value={form.calle} onChange={cambiar} autoComplete="address-line1" />
                    {errores.calle && <em>{errores.calle}</em>}
                  </label>
                  <label className={campo('numero')}>
                    Altura
                    <input name="numero" value={form.numero} onChange={cambiar} inputMode="numeric" />
                    {errores.numero && <em>{errores.numero}</em>}
                  </label>
                  <label className="campo">
                    Piso / depto <span className="opcional">(opcional)</span>
                    <input name="piso" value={form.piso} onChange={cambiar} />
                  </label>
                  <label className={campo('ciudad')}>
                    Localidad
                    <input name="ciudad" value={form.ciudad} onChange={cambiar} autoComplete="address-level2" />
                    {errores.ciudad && <em>{errores.ciudad}</em>}
                  </label>
                  <label className="campo">
                    Provincia
                    <select name="provincia" value={form.provincia} onChange={cambiar}>
                      {PROVINCIAS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label className={campo('cp')}>
                    Código postal
                    <input name="cp" value={form.cp} onChange={cambiar} inputMode="numeric" maxLength={4} />
                    {errores.cp && <em>{errores.cp}</em>}
                  </label>
                </div>
              )}

              <label className="campo">
                Aclaraciones para la entrega <span className="opcional">(opcional)</span>
                <textarea name="notas" rows="3" value={form.notas} onChange={cambiar} placeholder="Entre calles, horarios, timbre..." />
              </label>
            </section>
          </div>

          <aside className="checkout-resumen">
            <h2>Tu pedido</h2>
            <ul>
              {lineas.map((l) => (
                <li key={l.key}>
                  <div className="resumen-figura">
                    <FotoProducto imagen={l.imagen} colorHex={l.colorHex} alt={l.nombre} className="resumen-img" />
                    <span className="resumen-cant">{l.cantidad}</span>
                  </div>
                  <div>
                    <p className="resumen-nombre">{l.nombre}</p>
                    <p className="resumen-variante">Talle {l.talle} · {l.color}</p>
                  </div>
                  <strong>{precioARS(l.precio * l.cantidad)}</strong>
                </li>
              ))}
            </ul>

            <div className="resumen-linea">
              <span>Subtotal ({unidades})</span>
              <span>{precioARS(subtotal)}</span>
            </div>
            <div className="resumen-linea">
              <span>Envío</span>
              <span className="gratis">Gratis</span>
            </div>
            <div className="resumen-total">
              <span>Total</span>
              <strong>{precioARS(subtotal)}</strong>
            </div>
            <p className="resumen-cuotas">
              Hasta {CUOTAS} cuotas sin interés de {precioARS(cuota)}
            </p>

            {errorPago && <p className="checkout-error">{errorPago}</p>}

            <button type="submit" className="btn btn-lima btn-bloque" disabled={enviando}>
              {enviando ? 'Abriendo el pago...' : 'Ir a pagar'}
            </button>
            <p className="resumen-seguro">
              <Lock size={13} /> Te lleva a Mercado Pago para completar el pago
            </p>
          </aside>
        </form>
      </div>
    </div>
  )
}
