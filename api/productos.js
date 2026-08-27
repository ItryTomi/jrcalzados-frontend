// Alta, edicion y baja de productos. Solo admin.
//
//   POST   /api/productos   { producto }        -> crea o actualiza
//   DELETE /api/productos?id=xxx                -> desactiva (no borra)
//
// Los productos no se borran de verdad: se desactivan. Un pedido viejo
// puede referirse a ellos y conviene no perder ese historial.

import { hayBase } from './_db.js'
import { guardarProducto, desactivarProducto } from './_catalogo.js'

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

const texto = (v, max = 120) => String(v ?? '').trim().slice(0, max)

// De "Zapatillas Jaguar 9412" sale "zapatillas-jaguar-9412".
const aSlug = (s) =>
  texto(s, 80)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }
  if (!esAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })
  if (!hayBase()) return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })

  try {
    if (req.method === 'DELETE') {
      const id = new URL(req.url, 'http://local').searchParams.get('id')
      if (!id) return res.status(400).json({ error: 'Falta el id' })
      const ok = await desactivarProducto(id)
      if (!ok) return res.status(404).json({ error: 'No encontramos ese producto' })
      return res.status(200).json({ ok: true })
    }

    const { producto } = await leerCuerpo(req)
    if (!producto) return res.status(400).json({ error: 'Falta el producto' })

    const nombre = texto(producto.nombre, 120)
    const marca = texto(producto.marca, 60)
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre' })
    if (!marca) return res.status(400).json({ error: 'Falta la marca' })

    const precio = Number(producto.precio)
    if (!Number.isFinite(precio) || precio <= 0) {
      return res.status(400).json({ error: 'El precio tiene que ser mayor a cero' })
    }

    const colores = (Array.isArray(producto.colores) ? producto.colores : [])
      .filter((c) => c && texto(c.nombre))
      .slice(0, 8)
      .map((c) => ({
        nombre: texto(c.nombre, 40),
        hex: /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '#141414',
        imagen: texto(c.imagen, 400) || null
      }))
    if (!colores.length) return res.status(400).json({ error: 'Cargá al menos un color' })

    const consultarTalle = Boolean(producto.consultarTalle)
    const talles = consultarTalle
      ? []
      : [
          ...new Set(
            (Array.isArray(producto.talles) ? producto.talles : [])
              .map((t) => parseInt(t, 10))
              .filter((t) => Number.isFinite(t) && t > 0 && t < 60)
          )
        ].sort((a, b) => a - b)

    if (!consultarTalle && !talles.length) {
      return res.status(400).json({ error: 'Cargá los talles o marcá "a consultar"' })
    }

    const guardado = await guardarProducto({
      id: texto(producto.id) || aSlug(`${marca} ${nombre}`),
      marca,
      codigo: texto(producto.codigo, 30) || null,
      nombre,
      genero: ['hombre', 'mujer', 'ninos', 'unisex'].includes(producto.genero)
        ? producto.genero
        : 'unisex',
      tipo: texto(producto.tipo, 30) || 'Zapatillas',
      uso: texto(producto.uso, 30) || 'Urbano',
      precio,
      precioAnterior:
        producto.precioAnterior === '' || producto.precioAnterior == null
          ? null
          : Number(producto.precioAnterior) || null,
      talles,
      colores,
      consultarTalle,
      destacado: Boolean(producto.destacado),
      nuevo: Boolean(producto.nuevo),
      activo: producto.activo !== false
    })

    return res.status(200).json({ producto: guardado })
  } catch (e) {
    console.error('[productos]', e)
    return res.status(500).json({ error: 'No se pudo guardar el producto' })
  }
}
