// Alta, edicion y baja de productos. Solo admin.
//
//   POST   /api/productos   { producto }        -> crea o actualiza
//   DELETE /api/productos?id=xxx                -> desactiva (no borra)
//
// Los productos no se borran de verdad: se desactivan. Un pedido viejo
// puede referirse a ellos y conviene no perder ese historial.

import { hayBase } from './_db.js'
import { guardarProducto, desactivarProducto } from './_catalogo.js'
import { verificarAdmin } from './_admin.js'

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


const texto = (v, max = 120) => String(v ?? '').trim().slice(0, max)

// Del 16 al 48. El formulario ya acota, pero eso se puede saltear mandando
// el pedido a mano: sin este tope un rango absurdo llena la base y rompe
// la pagina de todos.
const TALLE_MIN = 16
const TALLE_MAX = 48

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
  if (!await verificarAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })
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

    // OJO: antes aca habia un .filter() que descartaba los colores sin nombre
    // sin decir nada. El local cargaba la foto, guardaba, le salia "listo" y
    // el color desaparecia. Ahora es un error explicito.
    const crudos = (Array.isArray(producto.colores) ? producto.colores : []).slice(0, 8)
    if (!crudos.length) return res.status(400).json({ error: 'Cargá al menos un color' })

    const sinNombre = crudos.findIndex((c) => !c || !texto(c.nombre))
    if (sinNombre !== -1) {
      return res.status(400).json({
        error: `Falta el nombre del color ${sinNombre + 1}. Escribilo y volvé a guardar.`,
        colorSinNombre: sinNombre
      })
    }

    const colores = []
    for (const [i, c] of crudos.entries()) {
      // El precio por color es opcional: vacio significa "vale lo mismo que
      // el producto". Pero si escribieron algo, tiene que ser un numero.
      let precioColor = null
      const bruto = c.precio
      if (bruto !== null && bruto !== undefined && String(bruto).trim() !== '') {
        const n = Number(bruto)
        if (!Number.isFinite(n) || n <= 0) {
          return res.status(400).json({
            error: `El precio del color ${i + 1} (${texto(c.nombre, 40)}) tiene que ser un número mayor a cero, o dejalo vacío para que valga igual que el producto.`,
            colorSinNombre: i
          })
        }
        precioColor = n
      }

      colores.push({
        nombre: texto(c.nombre, 40),
        hex: /^#[0-9a-f]{6}$/i.test(c.hex || '') ? c.hex : '#141414',
        imagen: texto(c.imagen, 400) || null,
        precio: precioColor,
        descripcion: texto(c.descripcion, 400) || ''
      })
    }

    const nombres = colores.map((c) => c.nombre.toLowerCase())
    const repetido = nombres.find((n, i) => nombres.indexOf(n) !== i)
    if (repetido) {
      return res.status(400).json({ error: `Hay dos colores llamados "${repetido}". Ponele nombres distintos.` })
    }

    const consultarTalle = Boolean(producto.consultarTalle)
    const talles = consultarTalle
      ? []
      : [
          ...new Set(
            (Array.isArray(producto.talles) ? producto.talles : [])
              .map((t) => parseInt(t, 10))
              .filter((t) => Number.isFinite(t) && t >= TALLE_MIN && t <= TALLE_MAX)
          )
        ].sort((a, b) => a - b)

    if (!consultarTalle && !talles.length) {
      return res.status(400).json({
        error: `Cargá los talles (entre ${TALLE_MIN} y ${TALLE_MAX}) o marcá "a consultar"`
      })
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
      descripcion: texto(producto.descripcion, 1500),
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
