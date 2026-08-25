// Pedidos para el local.
//   GET  /api/pedidos?estado=pagado&limite=100   -> listado
//   POST /api/pedidos  { orden, envioEstado, seguimiento, notaLocal }
//
// Protegido con ADMIN_TOKEN. No es un login con usuarios: alcanza para que
// solo el local entre, pero conviene rotar el token si se filtra.

import { hayBase, listarPedidos, actualizarEnvio } from './_db.js'

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

export default async function handler(req, res) {
  const esperado = process.env.ADMIN_TOKEN
  if (!esperado) return res.status(503).json({ error: 'Falta configurar ADMIN_TOKEN' })

  const enviado = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!enviado || enviado !== esperado) {
    return res.status(401).json({ error: 'Clave incorrecta' })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  if (!hayBase()) return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })

  try {
    if (req.method === 'GET') {
      const params = new URL(req.url, 'http://local').searchParams
      const limite = Math.min(parseInt(params.get('limite'), 10) || 100, 500)
      const estado = params.get('estado') || null
      const pedidos = await listarPedidos({ limite, estado })
      return res.status(200).json({ total: pedidos.length, pedidos })
    }

    if (req.method === 'POST') {
      const { orden, envioEstado, seguimiento, notaLocal } = await leerCuerpo(req)
      if (!orden) return res.status(400).json({ error: 'Falta el numero de pedido' })
      const pedido = await actualizarEnvio({ orden, envioEstado, seguimiento, notaLocal })
      if (!pedido) return res.status(404).json({ error: 'No encontramos ese pedido' })
      return res.status(200).json({ pedido })
    }
  } catch (e) {
    console.error('[pedidos]', e)
    return res.status(500).json({ error: e.message || 'Error consultando los pedidos' })
  }
}
