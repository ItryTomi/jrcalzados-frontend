// Catalogo publico.
//   GET /api/catalogo            -> productos activos
//   GET /api/catalogo?todo=1     -> admin: incluye los desactivados
//
// Si no hay base configurada devuelve 204: el navegador se queda con el
// catalogo del archivo y la web sigue andando igual.

import { hayBase } from './_db.js'
import { leerCatalogo } from './_catalogo.js'

const esAdmin = (req) => {
  const esperado = process.env.ADMIN_TOKEN
  if (!esperado) return false
  const enviado = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  return Boolean(enviado) && enviado === esperado
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const todo = new URL(req.url, 'http://local').searchParams.get('todo')
  if (todo && !esAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })

  if (!hayBase()) return res.status(204).end()

  try {
    const productos = await leerCatalogo({ incluirInactivos: Boolean(todo) })
    if (!todo) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    }
    return res.status(200).json({ productos })
  } catch (e) {
    console.error('[catalogo]', e)
    return res.status(500).json({ error: 'No se pudo leer el catalogo' })
  }
}
