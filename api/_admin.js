// Clave del panel.
//
// Vive en la base para que el local pueda cambiarla desde el panel, sin
// tocar Vercel ni esperar un redeploy. Se guarda como hash con scrypt:
// aunque alguien lea la base, no obtiene la clave.
//
// Si todavia no se cambio nunca, vale la de la variable ADMIN_TOKEN. Asi
// hay con que entrar la primera vez.

import crypto from 'node:crypto'
import { hayBase, db, asegurarTablas } from './_db.js'

const DEBILES = [
  'jrcalzados', 'jr calzados', 'jrcalzados2026', 'calzados', 'admin',
  'administrador', 'clave', 'password', 'contrasena', '1234', '123456',
  'clave-de-prueba', 'prueba', 'test'
]

export const MINIMO = 8
export const RECOMENDADO = 16

export const esDebil = (clave) => {
  const t = String(clave || '')
  return t.length < RECOMENDADO || DEBILES.includes(t.toLowerCase())
}

// ---------- Hash ----------

const hashear = (clave, sal) =>
  crypto.scryptSync(clave, sal, 32).toString('hex')

export const armarHash = (clave) => {
  const sal = crypto.randomBytes(16).toString('hex')
  return `scrypt$${sal}$${hashear(clave, sal)}`
}

const coincide = (clave, guardado) => {
  const [algo, sal, esperado] = String(guardado).split('$')
  if (algo !== 'scrypt' || !sal || !esperado) return false
  const a = Buffer.from(hashear(clave, sal))
  const b = Buffer.from(esperado)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// ---------- Lectura y escritura ----------

let cacheConfig = null
let cacheHasta = 0

async function leerConfig() {
  if (!hayBase()) return null
  if (cacheConfig !== null && Date.now() < cacheHasta) return cacheConfig
  await asegurarTablas()
  const sql = db()
  const filas = await sql`SELECT valor FROM config WHERE clave = 'panel'`
  cacheConfig = filas[0]?.valor || null
  cacheHasta = Date.now() + 30_000
  return cacheConfig
}

export async function guardarClave(nueva) {
  await asegurarTablas()
  const sql = db()
  const valor = { hash: armarHash(nueva), debil: esDebil(nueva) }
  await sql`
    INSERT INTO config (clave, valor) VALUES ('panel', ${JSON.stringify(valor)})
    ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = now()
  `
  cacheConfig = valor
  cacheHasta = Date.now() + 30_000
  return valor
}

// ---------- Verificacion ----------

// scrypt es lento a proposito. Recordamos los tokens que ya validaron para
// no rehashear en cada llamada del panel.
const yaValidados = new Map()
const TTL = 5 * 60 * 1000

const bearer = (req) => String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')

export async function verificarAdmin(req) {
  const enviado = bearer(req)
  if (!enviado) return false

  const visto = yaValidados.get(enviado)
  if (visto && Date.now() - visto < TTL) return true

  let ok = false
  try {
    const cfg = await leerConfig()
    if (cfg?.hash) ok = coincide(enviado, cfg.hash)
    else ok = Boolean(process.env.ADMIN_TOKEN) && enviado === process.env.ADMIN_TOKEN
  } catch {
    // Si la base falla, al menos que la variable siga sirviendo.
    ok = Boolean(process.env.ADMIN_TOKEN) && enviado === process.env.ADMIN_TOKEN
  }

  if (ok) yaValidados.set(enviado, Date.now())
  return ok
}

// Si nunca se cambio, se juzga la de la variable de entorno.
export async function claveActualEsDebil() {
  try {
    const cfg = await leerConfig()
    if (cfg) return Boolean(cfg.debil)
  } catch {
    /* sin base, cae abajo */
  }
  return esDebil(process.env.ADMIN_TOKEN || '')
}

export const hayClave = () => Boolean(process.env.ADMIN_TOKEN) || hayBase()
