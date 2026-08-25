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
  await sql`CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos (estado, creado_en DESC)`
  tablasListas = true
}

export async function guardarPedidoIniciado({
  orden,
  total,
  items,
  preferenciaId,
  comprador,
  entrega
}) {
  await asegurarTablas()
  const sql = db()
  await sql`
    INSERT INTO pedidos (orden, estado, total, items, preferencia_id, comprador, entrega)
    VALUES (${orden}, 'iniciado', ${total}, ${JSON.stringify(items)}, ${preferenciaId},
            ${JSON.stringify(comprador || null)}, ${JSON.stringify(entrega || null)})
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
