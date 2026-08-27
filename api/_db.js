// Conexion a Neon (Postgres gestionado). No es un servidor que haya que
// mantener prendido: se conecta por HTTP cuando alguna funcion la necesita.
//
// La base es OPCIONAL: si no hay DATABASE_URL la web sigue cobrando, solo
// que no guarda el pedido. Asi el checkout nunca se cae por la base.

import { neon } from '@neondatabase/serverless'

let conexion = null
let tablasListas = false

export const hayBase = () => Boolean(process.env.DATABASE_URL)

export const db = () => {
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL')
  if (!conexion) conexion = neon(process.env.DATABASE_URL)
  return conexion
}

// Se ejecuta una vez por arranque en frio. Evita tener que correr
// migraciones a mano para una sola tabla.
export async function asegurarTablas() {
  if (tablasListas) return
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS pedidos (
      orden          text PRIMARY KEY,
      estado         text NOT NULL DEFAULT 'iniciado',
      total          numeric(12,2) NOT NULL,
      items          jsonb NOT NULL,
      comprador      jsonb,
      preferencia_id text,
      pago_id        text,
      medio_pago     text,
      creado_en      timestamptz NOT NULL DEFAULT now(),
      actualizado_en timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entrega jsonb`
  // Estado de la preparacion del pedido, aparte del estado del pago.
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS envio_estado text NOT NULL DEFAULT 'pendiente'`
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS seguimiento text`
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nota_local text`
  // Bandera para no descontar stock dos veces si MP repite la notificacion.
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS stock_descontado boolean NOT NULL DEFAULT false`
  await sql`CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos (estado, creado_en DESC)`

  // Pedidos ligados a la cuenta del comprador (queda null si compro como
  // invitado, que sigue siendo el camino por defecto).
  await sql`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS usuario_id text`
  await sql`CREATE INDEX IF NOT EXISTS pedidos_usuario_idx ON pedidos (usuario_id, creado_en DESC)`

  // Datos de envio guardados por comprador. Aca NO va nada de tarjetas.
  await sql`
    CREATE TABLE IF NOT EXISTS perfiles (
      usuario_id     text PRIMARY KEY,
      datos          jsonb NOT NULL DEFAULT '{}'::jsonb,
      actualizado_en timestamptz NOT NULL DEFAULT now()
    )
  `

  // Stock por variante. Si una variante NO tiene fila, se considera sin
  // control: se puede vender. Asi el sistema queda inerte hasta que el
  // local cargue las cantidades desde el panel.
  await sql`
    CREATE TABLE IF NOT EXISTS stock (
      producto_id    text NOT NULL,
      color          text NOT NULL,
      talle          integer NOT NULL,
      cantidad       integer NOT NULL DEFAULT 0,
      actualizado_en timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (producto_id, color, talle)
    )
  `
  tablasListas = true
}

export async function guardarPedidoIniciado({
  orden,
  total,
  items,
  preferenciaId,
  comprador,
  entrega,
  usuarioId
}) {
  await asegurarTablas()
  const sql = db()
  await sql`
    INSERT INTO pedidos (orden, estado, total, items, preferencia_id, comprador, entrega, usuario_id)
    VALUES (${orden}, 'iniciado', ${total}, ${JSON.stringify(items)}, ${preferenciaId},
            ${JSON.stringify(comprador || null)}, ${JSON.stringify(entrega || null)},
            ${usuarioId || null})
    ON CONFLICT (orden) DO UPDATE
      SET preferencia_id = EXCLUDED.preferencia_id,
          comprador      = COALESCE(EXCLUDED.comprador, pedidos.comprador),
          entrega        = COALESCE(EXCLUDED.entrega, pedidos.entrega),
          actualizado_en = now()
  `
}

// Devuelve el estado anterior para no mandar el aviso dos veces cuando
// Mercado Pago reintenta la notificacion.
export async function actualizarEstadoPedido({ orden, estado, pagoId, medioPago, comprador }) {
  await asegurarTablas()
  const sql = db()
  const previo = await sql`SELECT estado FROM pedidos WHERE orden = ${orden}`
  const estadoPrevio = previo[0]?.estado || null

  const filas = await sql`
    INSERT INTO pedidos (orden, estado, total, items, comprador, pago_id, medio_pago)
    VALUES (${orden}, ${estado}, 0, '[]'::jsonb, ${JSON.stringify(comprador || null)},
            ${pagoId}, ${medioPago})
    ON CONFLICT (orden) DO UPDATE
      SET estado         = EXCLUDED.estado,
          comprador      = COALESCE(pedidos.comprador, EXCLUDED.comprador),
          pago_id        = EXCLUDED.pago_id,
          medio_pago     = EXCLUDED.medio_pago,
          actualizado_en = now()
    RETURNING *
  `
  return { pedido: filas[0], estadoPrevio }
}

export async function listarPedidos({ limite = 100, estado = null } = {}) {
  await asegurarTablas()
  const sql = db()
  if (estado) {
    return sql`
      SELECT * FROM pedidos WHERE estado = ${estado}
      ORDER BY creado_en DESC LIMIT ${limite}
    `
  }
  return sql`SELECT * FROM pedidos ORDER BY creado_en DESC LIMIT ${limite}`
}

const ENVIO_ESTADOS = ['pendiente', 'preparado', 'despachado', 'entregado']

export async function actualizarEnvio({ orden, envioEstado, seguimiento, notaLocal }) {
  await asegurarTablas()
  if (envioEstado && !ENVIO_ESTADOS.includes(envioEstado)) {
    throw new Error('Estado de envio invalido')
  }
  const sql = db()
  const filas = await sql`
    UPDATE pedidos SET
      envio_estado   = COALESCE(${envioEstado ?? null}, envio_estado),
      seguimiento    = COALESCE(${seguimiento ?? null}, seguimiento),
      nota_local     = COALESCE(${notaLocal ?? null}, nota_local),
      actualizado_en = now()
    WHERE orden = ${orden}
    RETURNING *
  `
  return filas[0] || null
}


// ============================================================
//  STOCK
// ============================================================

export async function leerStock() {
  await asegurarTablas()
  const sql = db()
  return sql`SELECT producto_id, color, talle, cantidad FROM stock ORDER BY producto_id, color, talle`
}

// Cuando queda poco lo decimos ("queda 1"), pero nunca publicamos el
// numero exacto si hay de sobra: no le sirve al comprador y le regala el
// inventario a la competencia.
export const UMBRAL_BAJO = 3

export async function leerDisponibilidad() {
  await asegurarTablas()
  const sql = db()
  const filas = await sql`
    SELECT producto_id, color, talle, cantidad FROM stock WHERE cantidad <= ${UMBRAL_BAJO}
  `
  return {
    agotados: filas.filter((f) => f.cantidad <= 0).map(({ cantidad, ...r }) => r),
    bajos: filas.filter((f) => f.cantidad > 0)
  }
}

export async function guardarStock(filas) {
  await asegurarTablas()
  const sql = db()
  const consultas = filas.map(
    (f) => sql`
      INSERT INTO stock (producto_id, color, talle, cantidad)
      VALUES (${f.producto_id}, ${f.color}, ${Number(f.talle)}, ${Math.max(0, Number(f.cantidad) || 0)})
      ON CONFLICT (producto_id, color, talle) DO UPDATE
        SET cantidad = EXCLUDED.cantidad, actualizado_en = now()
    `
  )
  if (consultas.length) await sql.transaction(consultas)
  return consultas.length
}

// Devuelve las lineas que no se pueden cubrir. Las variantes sin fila en
// la tabla se dan por disponibles.
export async function faltantesDeStock(items) {
  await asegurarTablas()
  const sql = db()
  const filas = await sql`SELECT producto_id, color, talle, cantidad FROM stock`
  const mapa = new Map(filas.map((f) => [`${f.producto_id}|${f.color}|${f.talle}`, f.cantidad]))

  const faltan = []
  for (const i of items) {
    const clave = `${i.producto_id}|${i.color}|${i.talle}`
    if (!mapa.has(clave)) continue
    const hay = mapa.get(clave)
    if (hay < i.cantidad) faltan.push({ ...i, disponible: hay })
  }
  return faltan
}

// Descuenta una sola vez por pedido, aunque el webhook se repita.
export async function descontarStock(orden, items) {
  await asegurarTablas()
  const sql = db()

  const previo = await sql`SELECT stock_descontado FROM pedidos WHERE orden = ${orden}`
  if (!previo[0] || previo[0].stock_descontado) return false

  const consultas = items.map(
    (i) => sql`
      UPDATE stock SET cantidad = GREATEST(0, cantidad - ${i.cantidad}), actualizado_en = now()
      WHERE producto_id = ${i.producto_id} AND color = ${i.color} AND talle = ${Number(i.talle)}
    `
  )
  consultas.push(sql`UPDATE pedidos SET stock_descontado = true WHERE orden = ${orden}`)
  await sql.transaction(consultas)
  return true
}


// ============================================================
//  CUENTAS DE COMPRADOR
// ============================================================

// Solo los pedidos de ese usuario, y solo los campos que le importan a el.
export async function pedidosDeUsuario(usuarioId) {
  await asegurarTablas()
  const sql = db()
  return sql`
    SELECT orden, estado, total, items, entrega, envio_estado, seguimiento, creado_en
    FROM pedidos
    WHERE usuario_id = ${usuarioId}
    ORDER BY creado_en DESC
    LIMIT 100
  `
}

export async function leerPerfil(usuarioId) {
  await asegurarTablas()
  const sql = db()
  const filas = await sql`SELECT datos FROM perfiles WHERE usuario_id = ${usuarioId}`
  return filas[0]?.datos || null
}

export async function guardarPerfil(usuarioId, datos) {
  await asegurarTablas()
  const sql = db()
  const filas = await sql`
    INSERT INTO perfiles (usuario_id, datos)
    VALUES (${usuarioId}, ${JSON.stringify(datos)})
    ON CONFLICT (usuario_id) DO UPDATE
      SET datos = EXCLUDED.datos, actualizado_en = now()
    RETURNING datos
  `
  return filas[0]?.datos || null
}
