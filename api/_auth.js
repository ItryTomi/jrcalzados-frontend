// Verifica la sesion del comprador (Clerk).
//
// El navegador manda un token firmado por Clerk en el header Authorization.
// Aca se valida contra Clerk con la clave secreta: nunca se confia en un
// id de usuario que venga del cliente.

import { verifyToken } from '@clerk/backend'

export const hayCuentas = () => Boolean(process.env.CLERK_SECRET_KEY)

// Devuelve el id de usuario si la sesion es valida, o null.
export async function usuarioDeLaPeticion(req) {
  const secretKey = process.env.CLERK_SECRET_KEY
  if (!secretKey) return null

  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null

  try {
    const datos = await verifyToken(token, { secretKey })
    return datos?.sub || null
  } catch {
    // Token vencido, invalido o de otra aplicacion.
    return null
  }
}
