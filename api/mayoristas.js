// Alta y aprobacion de clientes mayoristas.
//
//   GET    /api/mayoristas?mia=1   -> el usuario logueado consulta su estado
//   GET    /api/mayoristas         -> admin: lista de solicitudes
//   POST   /api/mayoristas         -> el usuario logueado pide el acceso
//   PATCH  /api/mayoristas         -> admin: aprueba o rechaza

import { hayBase } from './_db.js'
import { usuarioDeLaPeticion, hayCuentas } from './_auth.js'
import { verificarAdmin } from './_admin.js'
import {
  cuitValido,
  solicitudDe,
  guardarSolicitud,
  listarMayoristas,
  cambiarEstado
} from './_mayoristas.js'

const ESTADOS = ['pendiente', 'aprobado', 'rechazado']

const texto = (v, max = 120) => String(v ?? '').trim().slice(0, max)

const leerCuerpo = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body
  let crudo = ''
  for await (const trozo of req) crudo += trozo
  try {
    return crudo ? JSON.parse(crudo) : {}
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (!hayBase()) return res.status(503).json({ error: 'No disponible' })
  if (!hayCuentas()) return res.status(503).json({ error: 'Las cuentas no estan configuradas' })

  // ---- El usuario consulta su propio estado ----
  if (req.method === 'GET' && new URL(req.url, 'http://local').searchParams.get('mia')) {
    const usuarioId = await usuarioDeLaPeticion(req)
    if (!usuarioId) return res.status(401).json({ error: 'Inicia sesion' })
    const solicitud = await solicitudDe(usuarioId)
    return res.status(200).json({ solicitud })
  }

  // ---- El local lista las solicitudes ----
  if (req.method === 'GET') {
    if (!await verificarAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })
    const estado = new URL(req.url, 'http://local').searchParams.get('estado')
    const mayoristas = await listarMayoristas(ESTADOS.includes(estado) ? estado : null)
    return res.status(200).json({ mayoristas })
  }

  // ---- El usuario pide el acceso ----
  if (req.method === 'POST') {
    const usuarioId = await usuarioDeLaPeticion(req)
    if (!usuarioId) return res.status(401).json({ error: 'Inicia sesion' })

    const cuerpo = await leerCuerpo(req)
    if (!cuerpo) return res.status(400).json({ error: 'Datos invalidos' })

    const datos = {
      nombre: texto(cuerpo.nombre, 80),
      comercio: texto(cuerpo.comercio, 80),
      cuit: texto(cuerpo.cuit, 15),
      telefono: texto(cuerpo.telefono, 30),
      localidad: texto(cuerpo.localidad, 80),
      email: texto(cuerpo.email, 120)
    }

    if (!datos.nombre) return res.status(400).json({ error: 'Falta tu nombre' })
    if (!datos.comercio) return res.status(400).json({ error: 'Falta el nombre del comercio' })
    if (!cuitValido(datos.cuit)) return res.status(400).json({ error: 'El CUIT no es valido' })
    if (datos.telefono.replace(/\D/g, '').length < 8) {
      return res.status(400).json({ error: 'Falta el telefono' })
    }

    const solicitud = await guardarSolicitud(usuarioId, datos)
    return res.status(200).json({ solicitud })
  }

  // ---- El local aprueba o rechaza ----
  if (req.method === 'PATCH') {
    if (!await verificarAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })

    const cuerpo = await leerCuerpo(req)
    if (!cuerpo) return res.status(400).json({ error: 'Datos invalidos' })

    const usuarioId = texto(cuerpo.usuarioId, 120)
    const estado = texto(cuerpo.estado, 20)
    if (!usuarioId) return res.status(400).json({ error: 'Falta el usuario' })
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado invalido' })

    const solicitud = await cambiarEstado(usuarioId, estado, texto(cuerpo.nota, 200) || null)
    if (!solicitud) return res.status(404).json({ error: 'No existe esa solicitud' })
    return res.status(200).json({ solicitud })
  }

  res.setHeader('Allow', 'GET, POST, PATCH')
  return res.status(405).json({ error: 'Metodo no permitido' })
}
