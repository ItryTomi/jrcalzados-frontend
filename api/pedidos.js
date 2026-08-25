// Listado de pedidos para el local. Protegido con un token propio:
// GET /api/pedidos  con header  Authorization: Bearer <ADMIN_TOKEN>
//
// Es la vista minima hasta que exista un panel con login.

import { hayBase, listarPedidos } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const esperado = process.env.ADMIN_TOKEN
  if (!esperado) return res.status(503).json({ error: 'Falta configurar ADMIN_TOKEN' })

  const enviado = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (enviado !== esperado) return res.status(401).json({ error: 'No autorizado' })

  if (!hayBase()) return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })

  try {
    const limite = Math.min(parseInt(new URL(req.url, 'http://local').searchParams.get('limite'), 10) || 100, 500)
    const pedidos = await listarPedidos(limite)
    return res.status(200).json({ total: pedidos.length, pedidos })
  } catch (e) {
    console.error('[pedidos]', e)
    return res.status(500).json({ error: 'No se pudieron leer los pedidos' })
  }
}
