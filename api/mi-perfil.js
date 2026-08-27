// Datos de envio guardados del comprador.
//   GET  -> los trae
//   POST -> los guarda
//
// Aca NO se guardan datos de tarjeta. Eso es territorio PCI-DSS y lo
// resuelve Mercado Pago del lado de ellos: nosotros nunca vemos el numero.

import { hayBase, leerPerfil, guardarPerfil } from './_db.js'
import { usuarioDeLaPeticion, hayCuentas } from './_auth.js'

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

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }
  if (!hayCuentas()) return res.status(503).json({ error: 'Las cuentas no estan configuradas' })

  const usuarioId = await usuarioDeLaPeticion(req)
  if (!usuarioId) return res.status(401).json({ error: 'Inicia sesion' })
  if (!hayBase()) return res.status(503).json({ error: 'Falta configurar DATABASE_URL' })

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ perfil: await leerPerfil(usuarioId) })
    }

    const cuerpo = await leerCuerpo(req)
    const datos = cuerpo.datos || {}
    const limpio = {
      telefono: texto(datos.telefono, 30),
      dni: texto(datos.dni, 15),
      calle: texto(datos.calle, 80),
      numero: texto(datos.numero, 12),
      piso: texto(datos.piso, 20),
      ciudad: texto(datos.ciudad, 60),
      provincia: texto(datos.provincia, 60),
      cp: texto(datos.cp, 8),
      notas: texto(datos.notas, 300)
    }
    return res.status(200).json({ perfil: await guardarPerfil(usuarioId, limpio) })
  } catch (e) {
    console.error('[mi-perfil]', e)
    return res.status(500).json({ error: 'No pudimos guardar tus datos' })
  }
}
