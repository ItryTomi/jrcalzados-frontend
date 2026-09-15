// Catalogo con precios mayoristas.
//
// Solo responde a cuentas que el local aprobo. Es un endpoint aparte a
// proposito: /api/catalogo es publico y no debe conocer estos precios ni por
// accidente.

import { hayBase } from './_db.js'
import { leerCatalogo } from './_catalogo.js'
import { mayoristaAprobado } from './_mayoristas.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  if (!hayBase()) return res.status(503).json({ error: 'Catalogo no disponible' })

  const mayorista = await mayoristaAprobado(req)
  if (!mayorista) return res.status(403).json({ error: 'Tu cuenta todavia no esta habilitada' })

  try {
    const todos = await leerCatalogo({ conMayorista: true })
    // Un producto sin precio mayorista cargado no se ofrece: mostrarlo sin
    // precio invita a preguntar por algo que el local todavia no definio.
    const productos = todos.filter((p) => p.precioMayorista != null)

    // Nunca cachear: la respuesta depende de quien pregunta.
    res.setHeader('Cache-Control', 'private, no-store')
    return res.status(200).json({ productos, mayorista: { comercio: mayorista.comercio } })
  } catch (e) {
    console.error('[catalogo-mayorista]', e)
    return res.status(500).json({ error: 'No se pudo leer el catalogo' })
  }
}
