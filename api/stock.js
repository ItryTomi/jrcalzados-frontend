// Stock por variante (producto + color + talle).
//
//   GET  /api/stock              -> publico: solo que esta agotado
//   GET  /api/stock?todo=1       -> admin: cantidades completas
//   POST /api/stock              -> admin: guarda cantidades
//
// Una variante SIN fila en la tabla se considera sin control de stock y se
// puede vender. El sistema queda inerte hasta que el local cargue cantidades.

import { hayBase, leerAgotados, leerStock, guardarStock } from './_db.js'

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

const esAdmin = (req) => {
  const esperado = process.env.ADMIN_TOKEN
  if (!esperado) return false
  const enviado = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  return Boolean(enviado) && enviado === esperado
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const todo = new URL(req.url, 'http://local').searchParams.get('todo')
  const necesitaClave = req.method === 'POST' || Boolean(todo)

  // La clave se revisa antes que la base: un pedido de admin sin clave tiene
  // que dar 401, y no contarle a quien pregunta como esta configurado el sitio.
  if (necesitaClave && !esAdmin(req)) {
    return res.status(401).json({ error: 'Clave incorrecta' })
  }

  // Sin base no hay control de stock: nada agotado.
  if (!hayBase()) {
    if (req.method === 'GET' && !todo) {
      return res.status(200).json({ agotados: [], control: false })
    }
    return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })
  }

  try {
    if (req.method === 'GET') {
      if (todo) return res.status(200).json({ stock: await leerStock() })
      const agotados = await leerAgotados()
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
      return res.status(200).json({ agotados, control: true })
    }

    const { filas } = await leerCuerpo(req)
    if (!Array.isArray(filas)) return res.status(400).json({ error: 'Formato invalido' })
    if (filas.length > 2000) return res.status(400).json({ error: 'Demasiadas filas' })

    const validas = filas.filter(
      (f) => f && f.producto_id && f.color && Number.isFinite(Number(f.talle))
    )
    const guardadas = await guardarStock(validas)
    return res.status(200).json({ guardadas })
  } catch (e) {
    console.error('[stock]', e)
    return res.status(500).json({ error: 'Error con el stock' })
  }
}
