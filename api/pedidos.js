// Pedidos para el local.
//   GET  /api/pedidos?estado=pagado&limite=100   -> listado
//   POST /api/pedidos  { orden, envioEstado, seguimiento, notaLocal }
//
// Protegido con la clave del panel (ver _admin.js). Es una clave compartida,
// no un login con usuarios, pero el local puede cambiarla desde el panel.

import { hayBase, listarPedidos, actualizarEnvio } from './_db.js'
import { verificarAdmin, claveActualEsDebil, hayClave } from './_admin.js'

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
  if (!hayClave()) return res.status(503).json({ error: 'Falta configurar ADMIN_TOKEN' })
  if (!(await verificarAdmin(req))) return res.status(401).json({ error: 'Clave incorrecta' })

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
      return res
        .status(200)
        .json({ total: pedidos.length, pedidos, claveDebil: await claveActualEsDebil() })
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
