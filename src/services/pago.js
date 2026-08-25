// Habla con /api/crear-preferencia. Solo manda que producto, talle, color y
// cantidad: el precio lo pone el servidor desde el catalogo.

const CLAVE_ORDEN = 'jr-ultima-orden'

export async function iniciarPago(lineas, datos = {}) {
  const r = await fetch('/api/crear-preferencia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: lineas.map((l) => ({
        id: l.id,
        talle: l.talle,
        color: l.color,
        cantidad: l.cantidad
      })),
      comprador: datos.comprador,
      entrega: datos.entrega
    })
  })

  let data = {}
  try {
    data = await r.json()
  } catch {
    /* respuesta sin JSON */
  }

  if (!r.ok || !data.url) {
    throw new Error(data.error || 'No pudimos iniciar el pago. Proba de nuevo en un momento.')
  }

  try {
    localStorage.setItem(CLAVE_ORDEN, data.orden)
  } catch {
    /* sin localStorage no pasa nada */
  }

  return data
}

export const ultimaOrden = () => {
  try {
    return localStorage.getItem(CLAVE_ORDEN)
  } catch {
    return null
  }
}
