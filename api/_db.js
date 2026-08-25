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
  await sql`CREATE INDEX IF NOT EXISTS pedidos_estado_idx ON pedidos (estado, creado_en DESC)`
  tablasListas = true
}

export async function guardarPedidoIniciado({ orden, total, items, preferenciaId }) {
  await asegurarTablas()
  const sql = db()
  await sql`
    INSERT INTO pedidos (orden, estado, total, items, preferencia_id)
    VALUES (${orden}, 'iniciado', ${total}, ${JSON.stringify(items)}, ${preferenciaId})
    ON CONFLICT (orden) DO UPDATE
      SET preferencia_id = EXCLUDED.preferencia_id,
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
          comprador      = COALESCE(EXCLUDED.comprador, pedidos.comprador),
          pago_id        = EXCLUDED.pago_id,
          medio_pago     = EXCLUDED.medio_pago,
          actualizado_en = now()
    RETURNING *
  `
  return { pedido: filas[0], estadoPrevio }
}

export async function listarPedidos(limite = 100) {
  await asegurarTablas()
  const sql = db()
  return sql`SELECT * FROM pedidos ORDER BY creado_en DESC LIMIT ${limite}`
}
