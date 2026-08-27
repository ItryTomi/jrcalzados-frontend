// Actualizacion de precios. Solo admin.
//
//   POST /api/precios  { accion: 'simular', porcentaje, marca?, tipo?, redondeo? }
//     -> devuelve el antes y despues, sin tocar nada
//
//   POST /api/precios  { accion: 'aplicar', cambios: [{id, nuevo}] }
//     -> escribe los precios
//
//   POST /api/precios  { accion: 'uno', id, precio, precioAnterior? }
//     -> cambia un producto suelto
//
// El aumento nunca se aplica directo: primero se simula y el panel muestra
// la lista para revisar. Tocar 32 precios de una es algo que conviene ver
// antes de confirmar.

import { hayBase } from './_db.js'
import { simularAumento, aplicarAumento, actualizarPrecio } from './_catalogo.js'
import { verificarAdmin } from './_admin.js'

const MAX_PORCENTAJE = 300

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
  if (!await verificarAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })
  if (!hayBase()) return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })

  try {
    const cuerpo = await leerCuerpo(req)
    const { accion } = cuerpo

    if (accion === 'simular') {
      const porcentaje = Number(cuerpo.porcentaje)
      if (!Number.isFinite(porcentaje) || Math.abs(porcentaje) > MAX_PORCENTAJE) {
        return res.status(400).json({ error: `El porcentaje tiene que estar entre -${MAX_PORCENTAJE} y ${MAX_PORCENTAJE}` })
      }
      const cambios = await simularAumento({
        porcentaje,
        marca: cuerpo.marca || null,
        tipo: cuerpo.tipo || null,
        redondeo: cuerpo.redondeo || 'peso'
      })
      return res.status(200).json({ cambios })
    }

    if (accion === 'aplicar') {
      const { cambios } = cuerpo
      if (!Array.isArray(cambios) || !cambios.length) {
        return res.status(400).json({ error: 'No hay cambios para aplicar' })
      }
      if (cambios.length > 500) return res.status(400).json({ error: 'Demasiados productos' })

      const validos = cambios.filter(
        (c) => c && c.id && Number.isFinite(Number(c.nuevo)) && Number(c.nuevo) >= 0
      )
      const n = await aplicarAumento(
        validos.map((c) => ({ id: c.id, nuevo: Number(c.nuevo) })),
        cuerpo.redondeo || 'peso'
      )
      return res.status(200).json({ actualizados: n })
    }

    if (accion === 'uno') {
      const { id, precio, precioAnterior } = cuerpo
      if (!id || !Number.isFinite(Number(precio)) || Number(precio) < 0) {
        return res.status(400).json({ error: 'Precio invalido' })
      }
      const prod = await actualizarPrecio(
        id,
        Number(precio),
        precioAnterior === '' || precioAnterior === null || precioAnterior === undefined
          ? undefined
          : Number(precioAnterior)
      )
      if (!prod) return res.status(404).json({ error: 'No encontramos ese producto' })
      return res.status(200).json({ producto: prod })
    }

    return res.status(400).json({ error: 'Accion desconocida' })
  } catch (e) {
    console.error('[precios]', e)
    return res.status(500).json({ error: 'No se pudieron actualizar los precios' })
  }
}
