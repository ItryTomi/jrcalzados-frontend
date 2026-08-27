// Pedidos del comprador que esta logueado.
// Solo devuelve los pedidos cuyo usuario_id coincide con el de la sesion.

import { hayBase, pedidosDeUsuario } from './_db.js'
import { usuarioDeLaPeticion, hayCuentas } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }
  if (!hayCuentas()) return res.status(503).json({ error: 'Las cuentas no estan configuradas' })

  const usuarioId = await usuarioDeLaPeticion(req)
  if (!usuarioId) return res.status(401).json({ error: 'Inicia sesion para ver tus pedidos' })

  if (!hayBase()) return res.status(200).json({ pedidos: [] })

  try {
    return res.status(200).json({ pedidos: await pedidosDeUsuario(usuarioId) })
  } catch (e) {
    console.error('[mis-pedidos]', e)
    return res.status(500).json({ error: 'No pudimos traer tus pedidos' })
  }
}
