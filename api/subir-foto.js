// Firma para subir una foto a Cloudinary.
//
// La foto NO pasa por esta funcion: el navegador se la manda directo a
// Cloudinary con esta firma. Dos motivos: las funciones de Vercel tienen
// tope de tamano de cuerpo (una foto de celular lo pasa facil) y asi la
// subida no consume tiempo de ejecucion.
//
// El API Secret nunca sale del servidor: solo viaja la firma, que sirve
// una sola vez y para esos parametros exactos.

import crypto from 'node:crypto'
import { verificarAdmin } from './_admin.js'

const CARPETA = 'jr-calzados'
const PRESET = 'jr-productos'


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }
  if (!await verificarAdmin(req)) return res.status(401).json({ error: 'Clave incorrecta' })

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({
      error: 'Falta configurar Cloudinary (CLOUDINARY_CLOUD_NAME, _API_KEY y _API_SECRET)'
    })
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Cloudinary firma los parametros ordenados alfabeticamente.
  const aFirmar = `folder=${CARPETA}&timestamp=${timestamp}&upload_preset=${PRESET}`
  const signature = crypto.createHash('sha1').update(aFirmar + apiSecret).digest('hex')

  return res.status(200).json({
    url: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    timestamp,
    signature,
    folder: CARPETA,
    preset: PRESET
  })
}
