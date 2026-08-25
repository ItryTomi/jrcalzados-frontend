// Crea la preferencia de pago en Mercado Pago (Checkout Pro).
//
// Corre en el servidor (funcion serverless de Vercel), nunca en el navegador:
// el Access Token no puede salir del backend.
//
// REGLA IMPORTANTE: los precios se toman SIEMPRE del catalogo del servidor.
// Lo que manda el navegador son solo id, talle, color y cantidad. Si
// confiaramos en el precio que llega del cliente, cualquiera podria editar
// el pedido y pagar $1.

import { PRODUCTOS } from '../src/data/productos.js'

const MAX_UNIDADES_POR_LINEA = 10
const MAX_LINEAS = 30

const urlBase = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `${proto}://${host}`
}

const leerCuerpo = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  let crudo = ''
  for await (const trozo of req) crudo += trozo
  try {
    return crudo ? JSON.parse(crudo) : {}
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) {
    return res.status(503).json({
      error: 'El pago online todavia no esta configurado. Escribinos por WhatsApp.'
    })
  }

  const cuerpo = await leerCuerpo(req)
  if (!cuerpo) return res.status(400).json({ error: 'Pedido invalido' })

  const { items } = cuerpo
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito esta vacio' })
  }
  if (items.length > MAX_LINEAS) {
    return res.status(400).json({ error: 'Demasiados productos en el pedido' })
  }

  const base = urlBase(req)
  const detalle = []

  for (const linea of items) {
    const prod = PRODUCTOS.find((p) => p.id === linea.id)
    if (!prod) {
      return res.status(400).json({ error: 'Hay un producto que ya no esta disponible' })
    }

    const color = prod.colores.find((c) => c.nombre === linea.color) || prod.colores[0]

    const talle = Number(linea.talle)
    if (!prod.consultarTalle && !prod.talles.includes(talle)) {
      return res.status(400).json({ error: `El talle elegido de ${prod.nombre} no esta disponible` })
    }

    const cantidad = Math.min(
      Math.max(parseInt(linea.cantidad, 10) || 1, 1),
      MAX_UNIDADES_POR_LINEA
    )

    detalle.push({
      id: prod.id,
      title: `${prod.marca} ${prod.nombre}`.slice(0, 250),
      description: `Talle ${talle || 'a confirmar'} - Color ${color.nombre}`,
      category_id: 'fashion',
      quantity: cantidad,
      currency_id: 'ARS',
      unit_price: prod.precio, // <- precio del catalogo del servidor
      picture_url: color.imagen ? `${base}${color.imagen}` : undefined
    })
  }

  const orden = `JR-${Date.now().toString(36).toUpperCase()}`

  const preferencia = {
    items: detalle,
    external_reference: orden,
    statement_descriptor: 'JRCALZADOS',
    back_urls: {
      success: `${base}/pago/exito?orden=${orden}`,
      failure: `${base}/pago/error?orden=${orden}`,
      pending: `${base}/pago/pendiente?orden=${orden}`
    },
    auto_return: 'approved',
    // Envio gratis a todo el pais: el costo va en 0 y se coordina despues.
    shipments: { cost: 0, mode: 'not_specified' },
    metadata: { orden, envio: 'gratis' }
  }

  try {
    const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orden
      },
      body: JSON.stringify(preferencia)
    })

    const data = await r.json()

    if (!r.ok) {
      console.error('Mercado Pago rechazo la preferencia:', r.status, data)
      return res.status(502).json({ error: 'No pudimos iniciar el pago. Proba de nuevo.' })
    }

    // Con credenciales de prueba hay que mandar al checkout de sandbox.
    const esPrueba = token.startsWith('TEST-')
    const url = esPrueba ? data.sandbox_init_point || data.init_point : data.init_point

    return res.status(200).json({ url, orden, prueba: esPrueba })
  } catch (e) {
    console.error('Error creando la preferencia:', e)
    return res.status(502).json({ error: 'No pudimos conectar con Mercado Pago. Proba de nuevo.' })
  }
}
