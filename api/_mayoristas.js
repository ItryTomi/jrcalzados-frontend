// Clientes mayoristas.
//
// Un mayorista es una cuenta de Clerk que el local aprobo a mano. Registrarse
// NO alcanza: cualquiera puede crearse una cuenta, asi que hasta que alguien
// del local le da el visto bueno, la persona no ve ni un precio mayorista.

import { db, hayBase } from './_db.js'
import { usuarioDeLaPeticion } from './_auth.js'

let tablaLista = false

export async function asegurarMayoristas() {
  if (tablaLista || !hayBase()) return
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS mayoristas (
      usuario_id     text PRIMARY KEY,
      nombre         text NOT NULL,
      comercio       text NOT NULL,
      cuit           text NOT NULL,
      telefono       text NOT NULL,
      localidad      text,
      email          text,
      estado         text NOT NULL DEFAULT 'pendiente',
      nota           text,
      creado_en      timestamptz NOT NULL DEFAULT now(),
      actualizado_en timestamptz NOT NULL DEFAULT now()
    )
  `
  tablaLista = true
}

const aMayorista = (f) => ({
  usuarioId: f.usuario_id,
  nombre: f.nombre,
  comercio: f.comercio,
  cuit: f.cuit,
  telefono: f.telefono,
  localidad: f.localidad || '',
  email: f.email || '',
  estado: f.estado,
  nota: f.nota || '',
  creadoEn: f.creado_en,
  actualizadoEn: f.actualizado_en
})

// El CUIT lleva digito verificador: validarlo aca evita que entre uno mal
// tipeado y que el local se entere cuando quiere facturar.
export function cuitValido(valor) {
  const n = String(valor || '').replace(/\D/g, '')
  if (n.length !== 11) return false
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const suma = pesos.reduce((a, p, i) => a + p * Number(n[i]), 0)
  const resto = 11 - (suma % 11)
  const esperado = resto === 11 ? 0 : resto === 10 ? 9 : resto
  return esperado === Number(n[10])
}

export async function solicitudDe(usuarioId) {
  if (!usuarioId || !hayBase()) return null
  await asegurarMayoristas()
  const sql = db()
  const filas = await sql`SELECT * FROM mayoristas WHERE usuario_id = ${usuarioId}`
  return filas[0] ? aMayorista(filas[0]) : null
}

// Devuelve la solicitud solo si esta aprobada. Es la unica puerta a los
// precios mayoristas: todo endpoint que los toque pasa por aca.
export async function mayoristaAprobado(req) {
  const usuarioId = await usuarioDeLaPeticion(req)
  if (!usuarioId) return null
  const s = await solicitudDe(usuarioId)
  return s && s.estado === 'aprobado' ? s : null
}

export async function guardarSolicitud(usuarioId, datos) {
  await asegurarMayoristas()
  const sql = db()
  // Si ya estaba aprobado, actualizar los datos no lo baja a pendiente: seria
  // sacarle el acceso a un cliente por corregir un telefono.
  const filas = await sql`
    INSERT INTO mayoristas (usuario_id, nombre, comercio, cuit, telefono, localidad, email)
    VALUES (${usuarioId}, ${datos.nombre}, ${datos.comercio}, ${datos.cuit},
            ${datos.telefono}, ${datos.localidad || null}, ${datos.email || null})
    ON CONFLICT (usuario_id) DO UPDATE SET
      nombre    = EXCLUDED.nombre,
      comercio  = EXCLUDED.comercio,
      cuit      = EXCLUDED.cuit,
      telefono  = EXCLUDED.telefono,
      localidad = EXCLUDED.localidad,
      email     = EXCLUDED.email,
      estado    = CASE WHEN mayoristas.estado = 'aprobado' THEN 'aprobado' ELSE 'pendiente' END,
      actualizado_en = now()
    RETURNING *
  `
  return filas[0] ? aMayorista(filas[0]) : null
}

export async function listarMayoristas(estado) {
  await asegurarMayoristas()
  const sql = db()
  const filas = estado
    ? await sql`SELECT * FROM mayoristas WHERE estado = ${estado} ORDER BY creado_en DESC`
    : await sql`SELECT * FROM mayoristas ORDER BY creado_en DESC`
  return filas.map(aMayorista)
}

export async function cambiarEstado(usuarioId, estado, nota = null) {
  await asegurarMayoristas()
  const sql = db()
  const filas = await sql`
    UPDATE mayoristas
    SET estado = ${estado}, nota = ${nota}, actualizado_en = now()
    WHERE usuario_id = ${usuarioId}
    RETURNING *
  `
  return filas[0] ? aMayorista(filas[0]) : null
}
