// Cambiar la clave del panel desde el propio panel.
// POST /api/clave  { nueva }   con la clave actual en el header.

import { hayBase } from './_db.js'
import { verificarAdmin, guardarClave, esDebil, MINIMO, RECOMENDADO } from './_admin.js'

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }
  if (!(await verificarAdmin(req))) return res.status(401).json({ error: 'Clave incorrecta' })
  if (!hayBase()) {
    return res.status(503).json({
      error: 'Para cambiar la clave desde aca hace falta la base de datos configurada'
    })
  }

  const { nueva } = await leerCuerpo(req)
  const clave = String(nueva || '').trim()

  if (clave.length < MINIMO) {
    return res.status(400).json({ error: `La clave tiene que tener al menos ${MINIMO} caracteres` })
  }
  if (clave.length > 200) return res.status(400).json({ error: 'La clave es demasiado larga' })

  try {
    await guardarClave(clave)
    return res.status(200).json({
      ok: true,
      debil: esDebil(clave),
      recomendado: RECOMENDADO
    })
  } catch (e) {
    console.error('[clave]', e)
    return res.status(500).json({ error: 'No se pudo guardar la clave' })
  }
}
