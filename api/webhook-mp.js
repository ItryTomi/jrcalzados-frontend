// Webhook de Mercado Pago: la unica fuente confiable de "esto se pago".
//
// La vuelta del navegador a /pago/exito NO sirve como prueba: cualquiera
// puede escribir esa URL a mano. Aca, en cambio, se le vuelve a preguntar a
// Mercado Pago por el pago usando el Access Token del servidor.
//
// Mercado Pago reintenta la notificacion si no recibe 200, y puede mandarla
// varias veces por el mismo pago: por eso todo es idempotente.

import crypto from 'node:crypto'
import { hayBase, actualizarEstadoPedido } from './_db.js'
import { avisarVenta } from './_aviso.js'

const ESTADOS = {
  approved: 'pagado',
  authorized: 'pagado',
  pending: 'pendiente',
  in_process: 'pendiente',
  in_mediation: 'en_disputa',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'devuelto',
  charged_back: 'contracargo'
}

const leerCuerpo = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  let crudo = ''
  for await (const t of req) crudo += t
  try {
    return crudo ? JSON.parse(crudo) : {}
  } catch {
    return {}
  }
}

// Firma opcional. Si MP_WEBHOOK_SECRET esta cargado, se valida que la
// notificacion venga realmente de Mercado Pago.
function firmaValida(req, idRecurso) {
  const secreto = process.env.MP_WEBHOOK_SECRET
  if (!secreto) return true

  const firma = req.headers['x-signature']
  const idPedido = req.headers['x-request-id']
  if (!firma) return false

  const partes = Object.fromEntries(
    String(firma)
      .split(',')
      .map((p) => p.split('=').map((x) => x.trim()))
  )
  const ts = partes.ts
  const v1 = partes.v1
  if (!ts || !v1) return false

  const manifiesto = `id:${idRecurso};request-id:${idPedido};ts:${ts};`
  const esperado = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex')

  const a = Buffer.from(esperado)
  const b = Buffer.from(v1)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const token = process.env.MP_ACCESS_TOKEN
  if (!token) return res.status(503).json({ error: 'Sin credenciales de Mercado Pago' })

  const cuerpo = await leerCuerpo(req)
  const url = new URL(req.url, 'http://local')

  const tipo = cuerpo.type || cuerpo.topic || url.searchParams.get('type')
  const pagoId =
    cuerpo?.data?.id || url.searchParams.get('data.id') || url.searchParams.get('id')

  // Solo interesan las notificaciones de pago; al resto se le contesta 200
  // para que Mercado Pago deje de reintentar.
  if (tipo !== 'payment' || !pagoId) return res.status(200).json({ ok: true, ignorado: true })

  if (!firmaValida(req, pagoId)) {
    console.warn('[webhook] Firma invalida para el pago', pagoId)
    return res.status(401).json({ error: 'Firma invalida' })
  }

  try {
    const r = await fetch(`https://api.mercadopago.com/v1/payments/${pagoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!r.ok) {
      // 404 = pago de otra cuenta o de prueba: no tiene sentido reintentar.
      if (r.status === 404) return res.status(200).json({ ok: true, desconocido: true })
      console.error('[webhook] MP respondio', r.status)
      return res.status(500).json({ error: 'No se pudo consultar el pago' })
    }

    const pago = await r.json()
    const orden = pago.external_reference
    if (!orden) return res.status(200).json({ ok: true, sinOrden: true })

    const estado = ESTADOS[pago.status] || pago.status

    if (!hayBase()) {
      console.log(`[webhook] Pedido ${orden} -> ${estado} (sin base configurada)`)
      return res.status(200).json({ ok: true, guardado: false })
    }

    const comprador = {
      nombre: [pago.payer?.first_name, pago.payer?.last_name].filter(Boolean).join(' ') || null,
      email: pago.payer?.email || null,
      telefono: [pago.payer?.phone?.area_code, pago.payer?.phone?.number]
        .filter(Boolean)
        .join(' ') || null,
      documento: pago.payer?.identification?.number || null
    }

    const { pedido, estadoPrevio } = await actualizarEstadoPedido({
      orden,
      estado,
      pagoId: String(pagoId),
      medioPago: pago.payment_method_id || null,
      comprador
    })

    // Avisa una sola vez, aunque MP repita la notificacion.
    if (estado === 'pagado' && estadoPrevio !== 'pagado') {
      await avisarVenta(pedido)
    }

    return res.status(200).json({ ok: true, orden, estado })
  } catch (e) {
    console.error('[webhook] Error procesando la notificacion:', e)
    // 500 hace que Mercado Pago reintente, que es lo que queremos si fue
    // un problema puntual de red o de la base.
    return res.status(500).json({ error: 'Error procesando la notificacion' })
  }
}
