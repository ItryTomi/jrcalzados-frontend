// Catalogo en la base. El archivo src/data/productos.js pasa a ser la
// semilla: si la tabla esta vacia se carga desde ahi una sola vez, y de
// ahi en mas la base manda.

import { db, asegurarTablas } from './_db.js'
import { PRODUCTOS as SEMILLA } from '../src/data/productos.js'

let tablaLista = false

export async function asegurarCatalogo() {
  if (tablaLista) return
  await asegurarTablas()
  const sql = db()

  await sql`
    CREATE TABLE IF NOT EXISTS productos (
      id              text PRIMARY KEY,
      marca           text NOT NULL,
      codigo          text,
      nombre          text NOT NULL,
      genero          text NOT NULL,
      tipo            text NOT NULL,
      uso             text NOT NULL,
      precio          numeric(12,2) NOT NULL,
      precio_anterior numeric(12,2),
      talles          jsonb NOT NULL DEFAULT '[]'::jsonb,
      colores         jsonb NOT NULL DEFAULT '[]'::jsonb,
      consultar_talle boolean NOT NULL DEFAULT false,
      destacado       boolean NOT NULL DEFAULT false,
      nuevo           boolean NOT NULL DEFAULT false,
      activo          boolean NOT NULL DEFAULT true,
      orden           integer NOT NULL DEFAULT 0,
      actualizado_en  timestamptz NOT NULL DEFAULT now()
    )
  `

  // La descripcion se agrego despues de la primera version, por eso va como
  // ALTER y no dentro del CREATE: las bases que ya existen no se recrean.
  await sql`ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion text`

  // Precio para los clientes mayoristas. Va en NULL mientras el local no lo
  // cargue: un producto sin precio mayorista no se ofrece en /mayorista.
  await sql`ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_mayorista numeric(12,2)`

  const hay = await sql`SELECT count(*)::int AS n FROM productos`
  if (hay[0].n === 0) await sembrar()

  tablaLista = true
}

async function sembrar() {
  const sql = db()
  const consultas = SEMILLA.map((p, i) => sql`
    INSERT INTO productos (id, marca, codigo, nombre, genero, tipo, uso, precio,
                           precio_anterior, talles, colores, consultar_talle,
                           destacado, nuevo, orden)
    VALUES (${p.id}, ${p.marca}, ${p.codigo || null}, ${p.nombre}, ${p.genero},
            ${p.tipo}, ${p.uso}, ${p.precio}, ${p.precioAnterior},
            ${JSON.stringify(p.talles)}, ${JSON.stringify(p.colores)},
            ${p.consultarTalle}, ${p.destacado}, ${p.nuevo}, ${i})
    ON CONFLICT (id) DO NOTHING
  `)
  if (consultas.length) await sql.transaction(consultas)
  console.log(`[catalogo] Sembrados ${consultas.length} productos desde el archivo`)
}

// Pasa de la forma de la base a la forma que usa el navegador.
// `conMayorista` decide si el precio mayorista viaja o no. Por defecto NO.
//
// Esto es lo unico de todo el modulo que no se puede equivocar: el precio
// mayorista es informacion comercial y no puede salir por /api/catalogo, que
// es publico. Esconderlo en el navegador no serviria de nada, cualquiera lo
// ve abriendo el inspector. Se filtra en el servidor y se acabo.
const aProducto = (f, conMayorista = false) => ({
  id: f.id,
  marca: f.marca,
  codigo: f.codigo || undefined,
  nombre: f.nombre,
  genero: f.genero,
  tipo: f.tipo,
  uso: f.uso,
  descripcion: f.descripcion || '',
  precio: Number(f.precio),
  precioAnterior: f.precio_anterior === null ? null : Number(f.precio_anterior),
  ...(conMayorista
    ? {
        precioMayorista:
          f.precio_mayorista === null || f.precio_mayorista === undefined
            ? null
            : Number(f.precio_mayorista)
      }
    : {}),
  talles: f.talles || [],
  colores: f.colores || [],
  consultarTalle: f.consultar_talle,
  destacado: f.destacado,
  nuevo: f.nuevo,
  activo: f.activo
})

export async function leerCatalogo({ incluirInactivos = false, conMayorista = false } = {}) {
  await asegurarCatalogo()
  const sql = db()
  const filas = incluirInactivos
    ? await sql`SELECT * FROM productos ORDER BY orden, nombre`
    : await sql`SELECT * FROM productos WHERE activo ORDER BY orden, nombre`
  return filas.map((f) => aProducto(f, conMayorista))
}

export async function buscarProductoBase(id) {
  await asegurarCatalogo()
  const sql = db()
  const filas = await sql`SELECT * FROM productos WHERE id = ${id} AND activo`
  return filas[0] ? aProducto(filas[0]) : null
}

// ---------- Precios ----------

const redondearA = (n, modo) => {
  if (modo === 'centena') return Math.round(n / 100) * 100
  if (modo === 'mil') return Math.round(n / 1000) * 1000
  if (modo === 'noventa') return Math.floor(n / 1000) * 1000 + 900
  return Math.round(n)
}

export async function simularAumento({ porcentaje, marca, tipo, redondeo }) {
  await asegurarCatalogo()
  const sql = db()
  let filas = await sql`SELECT id, marca, tipo, nombre, precio FROM productos ORDER BY marca, nombre`
  if (marca) filas = filas.filter((f) => f.marca === marca)
  if (tipo) filas = filas.filter((f) => f.tipo === tipo)

  const factor = 1 + Number(porcentaje) / 100
  return filas.map((f) => {
    const actual = Number(f.precio)
    return {
      id: f.id,
      marca: f.marca,
      nombre: f.nombre,
      actual,
      nuevo: Math.max(0, redondearA(actual * factor, redondeo))
    }
  })
}

// ---------- Precio mayorista ----------
//
// El precio de venta al publico se arma sumandole al precio base el IVA y el
// margen. Para volver al base hay que DIVIDIR por esos porcentajes, no
// restarlos: si al base se le sumo 21% y despues 35%, restarle 21% y 35% al
// precio final da un numero mas bajo y distinto. Con un par de $111.895 la
// diferencia entre dividir y restar son $11.000 regalados.
export async function simularMayorista({ porcentajes, marca, tipo, redondeo }) {
  await asegurarCatalogo()
  const sql = db()
  let filas = await sql`
    SELECT id, marca, tipo, nombre, precio, precio_mayorista
    FROM productos WHERE activo ORDER BY marca, nombre
  `
  if (marca) filas = filas.filter((f) => f.marca === marca)
  if (tipo) filas = filas.filter((f) => f.tipo === tipo)

  const divisor = porcentajes.reduce((a, p) => a * (1 + Number(p) / 100), 1)

  return filas.map((f) => {
    const publico = Number(f.precio)
    return {
      id: f.id,
      marca: f.marca,
      nombre: f.nombre,
      actual: publico,
      actualMayorista: f.precio_mayorista === null ? null : Number(f.precio_mayorista),
      nuevo: Math.max(0, redondearA(publico / divisor, redondeo))
    }
  })
}

export async function aplicarMayorista(cambios) {
  await asegurarCatalogo()
  const sql = db()
  const consultas = cambios.map(
    (c) => sql`
      UPDATE productos
      SET precio_mayorista = ${c.nuevo}, actualizado_en = now()
      WHERE id = ${c.id}
    `
  )
  await Promise.all(consultas)
  return cambios.length
}

// Sube los precios propios de cada color en la misma proporcion que el del
// producto. Si no se hiciera, un aumento del 20% dejaria a la zapatilla
// blanca con el precio del mes pasado.
const escalarColores = (colores, factor, redondeo) =>
  (Array.isArray(colores) ? colores : []).map((c) => {
    const propio = Number(c?.precio)
    if (!Number.isFinite(propio) || propio <= 0) return c
    return { ...c, precio: Math.max(0, redondearA(propio * factor, redondeo)) }
  })

export async function aplicarAumento(cambios, redondeo = 'peso') {
  await asegurarCatalogo()
  const sql = db()

  const ids = cambios.map((c) => c.id)
  const actuales = await sql`SELECT id, precio, colores FROM productos WHERE id = ANY(${ids})`
  const porId = new Map(actuales.map((f) => [f.id, f]))

  const consultas = cambios.map((c) => {
    const fila = porId.get(c.id)
    const antes = Number(fila?.precio)
    const factor = Number.isFinite(antes) && antes > 0 ? c.nuevo / antes : 1
    const colores = escalarColores(fila?.colores, factor, redondeo)
    return sql`
      UPDATE productos
      SET precio = ${c.nuevo},
          colores = ${JSON.stringify(colores)},
          actualizado_en = now()
      WHERE id = ${c.id}
    `
  })
  if (consultas.length) await sql.transaction(consultas)
  return consultas.length
}

export async function actualizarPrecio(id, precio, precioAnterior) {
  await asegurarCatalogo()
  const sql = db()

  const previas = await sql`SELECT precio, colores FROM productos WHERE id = ${id}`
  const antes = Number(previas[0]?.precio)
  const factor = Number.isFinite(antes) && antes > 0 ? Number(precio) / antes : 1
  const colores = escalarColores(previas[0]?.colores, factor, 'peso')

  const filas = await sql`
    UPDATE productos SET
      precio          = ${Number(precio)},
      precio_anterior = ${precioAnterior === undefined ? null : precioAnterior},
      colores         = ${JSON.stringify(colores)},
      actualizado_en  = now()
    WHERE id = ${id}
    RETURNING *
  `
  return filas[0] ? aProducto(filas[0]) : null
}

// ---------- Alta y edicion ----------

export async function guardarProducto(p) {
  await asegurarCatalogo()
  const sql = db()
  const filas = await sql`
    INSERT INTO productos (id, marca, codigo, nombre, genero, tipo, uso, descripcion,
                           precio, precio_anterior, precio_mayorista, talles, colores,
                           consultar_talle, destacado, nuevo, activo)
    VALUES (${p.id}, ${p.marca}, ${p.codigo}, ${p.nombre}, ${p.genero}, ${p.tipo},
            ${p.uso}, ${p.descripcion || null}, ${p.precio}, ${p.precioAnterior},
            ${p.precioMayorista ?? null},
            ${JSON.stringify(p.talles)}, ${JSON.stringify(p.colores)},
            ${p.consultarTalle}, ${p.destacado}, ${p.nuevo}, ${p.activo})
    ON CONFLICT (id) DO UPDATE SET
      marca           = EXCLUDED.marca,
      codigo          = EXCLUDED.codigo,
      nombre          = EXCLUDED.nombre,
      genero          = EXCLUDED.genero,
      tipo            = EXCLUDED.tipo,
      uso             = EXCLUDED.uso,
      descripcion     = EXCLUDED.descripcion,
      precio          = EXCLUDED.precio,
      precio_anterior = EXCLUDED.precio_anterior,
      precio_mayorista = EXCLUDED.precio_mayorista,
      talles          = EXCLUDED.talles,
      colores         = EXCLUDED.colores,
      consultar_talle = EXCLUDED.consultar_talle,
      destacado       = EXCLUDED.destacado,
      nuevo           = EXCLUDED.nuevo,
      activo          = EXCLUDED.activo,
      actualizado_en  = now()
    RETURNING *
  `
  return filas[0] ? aProducto(filas[0], true) : null
}

// No se borra: se desactiva. Los pedidos viejos siguen apuntando a el.
export async function desactivarProducto(id) {
  await asegurarCatalogo()
  const sql = db()
  const filas = await sql`
    UPDATE productos SET activo = false, actualizado_en = now()
    WHERE id = ${id} RETURNING id
  `
  return filas.length > 0
}
