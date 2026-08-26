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
import { hayBase, guardarPedidoIniciado, faltantesDeStock } from './_db.js'

const MAX_UNIDADES_POR_LINEA = 10
const MAX_LINEAS = 30

const texto = (v, max = 120) => String(v ?? '').trim().slice(0, max)
const esMail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// El formulario ya valida del lado del navegador, pero eso se puede saltear:
// aca se vuelve a validar antes de crear el cobro.
function revisarDatos(comprador, entrega) {
  if (!comprador) return 'Faltan tus datos de contacto'
  if (!texto(comprador.nombre)) return 'Falta el nombre'
  if (!texto(comprador.apellido)) return 'Falta el apellido'
  if (!esMail(texto(comprador.email))) return 'El mail no es valido'
  if (texto(comprador.telefono).replace(/\D/g, '').length < 8) return 'Falta el telefono'

  if (!entrega || !['envio', 'retiro'].includes(entrega.modo)) return 'Elegi como recibir el pedido'
  if (entrega.modo === 'envio') {
    if (!texto(entrega.calle)) return 'Falta la calle'
    if (!texto(entrega.numero)) return 'Falta la altura'
    if (!texto(entrega.ciudad)) return 'Falta la localidad'
    if (!/^\d{4}$/.test(texto(entrega.cp))) return 'El codigo postal es invalido'
  }
  return null
}

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

  const { items, comprador, entrega } = cuerpo
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito esta vacio' })
  }
  if (items.length > MAX_LINEAS) {
    return res.status(400).json({ error: 'Demasiados productos en el pedido' })
  }

  const problema = revisarDatos(comprador, entrega)
  if (problema) return res.status(400).json({ error: problema })

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
      // se usa para descontar stock; MP lo ignora
      variante: { producto_id: prod.id, color: color.nombre, talle, cantidad },
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

  // Antes de cobrar: revisar que haya stock. Las variantes sin cantidad
  // cargada se consideran disponibles.
  if (hayBase()) {
    try {
      const faltan = await faltantesDeStock(detalle.map((d) => d.variante))
      if (faltan.length) {
        const f = faltan[0]
        const prod = PRODUCTOS.find((p) => p.id === f.producto_id)
        return res.status(409).json({
          error:
            f.disponible > 0
              ? `De ${prod?.nombre || 'ese modelo'} talle ${f.talle} nos quedan ${f.disponible}. Ajusta la cantidad.`
              : `Se agoto ${prod?.nombre || 'ese modelo'} en talle ${f.talle}. Sacalo del carrito para seguir.`,
          agotado: { id: f.producto_id, color: f.color, talle: f.talle, disponible: f.disponible }
        })
      }
    } catch (e) {
      // Si falla la consulta de stock no bloqueamos la venta.
      console.error('No se pudo verificar el stock:', e.message)
    }
  }

  const orden = `JR-${Date.now().toString(36).toUpperCase()}`
  const total = detalle.reduce((a, i) => a + i.unit_price * i.quantity, 0)

  const itemsMP = detalle.map(({ variante, ...i }) => i)

  const preferencia = {
    items: itemsMP,
    external_reference: orden,
    statement_descriptor: 'JRCALZADOS',
    back_urls: {
      success: `${base}/pago/exito?orden=${orden}`,
      failure: `${base}/pago/error?orden=${orden}`,
      pending: `${base}/pago/pendiente?orden=${orden}`
    },
    auto_return: 'approved',
    payer: {
      name: texto(comprador.nombre, 60),
      surname: texto(comprador.apellido, 60),
      email: texto(comprador.email, 120),
      phone: { area_code: '', number: texto(comprador.telefono, 30) },
      ...(texto(comprador.dni)
        ? { identification: { type: 'DNI', number: texto(comprador.dni, 15) } }
        : {})
    },
    // Por aca Mercado Pago avisa si el pago se aprobo. Es la unica
    // confirmacion confiable: la vuelta del navegador no alcanza.
    notification_url: `${base}/api/webhook-mp`,
    // Envio gratis a todo el pais: el costo va en 0.
    shipments:
      entrega.modo === 'envio'
        ? {
            cost: 0,
            mode: 'not_specified',
            receiver_address: {
              street_name: texto(entrega.calle, 80),
              street_number: texto(entrega.numero, 12),
              floor: texto(entrega.piso, 20),
              zip_code: texto(entrega.cp, 8),
              city_name: texto(entrega.ciudad, 60),
              state_name: texto(entrega.provincia, 60)
            }
          }
        : { cost: 0, mode: 'not_specified' },
    metadata: { orden, entrega: entrega.modo }
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

    // Guarda el pedido antes de mandar a pagar, asi el webhook despues sabe
    // que se compro. Si la base no esta configurada el cobro igual sigue.
    if (hayBase()) {
      try {
        await guardarPedidoIniciado({
          orden,
          total,
          items: detalle,
          preferenciaId: data.id,
          comprador: {
            nombre: `${texto(comprador.nombre, 60)} ${texto(comprador.apellido, 60)}`.trim(),
            email: texto(comprador.email, 120),
            telefono: texto(comprador.telefono, 30),
            documento: texto(comprador.dni, 15) || null
          },
          entrega
        })
      } catch (e) {
        console.error('No se pudo guardar el pedido:', e.message)
      }
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
