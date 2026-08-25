// Avisa al local por mail cuando entra una venta.
// Usa Resend (plan gratis 3.000 mails/mes, permite uso comercial).
// Si no hay RESEND_API_KEY simplemente no manda nada y no rompe el webhook.

const pesos = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export async function avisarVenta(pedido) {
  const clave = process.env.RESEND_API_KEY
  const destino = process.env.MAIL_AVISOS
  if (!clave || !destino) {
    console.log(`[aviso] Venta ${pedido.orden} sin notificar: falta RESEND_API_KEY o MAIL_AVISOS`)
    return
  }

  const items = Array.isArray(pedido.items) ? pedido.items : []
  const filas = items
    .map(
      (i) =>
        `<tr>
           <td style="padding:6px 10px;border-bottom:1px solid #eee">${i.title || ''}</td>
           <td style="padding:6px 10px;border-bottom:1px solid #eee">${i.description || ''}</td>
           <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
           <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${pesos(
             (i.unit_price || 0) * (i.quantity || 1)
           )}</td>
         </tr>`
    )
    .join('')

  const comprador = pedido.comprador || {}

  const html = `
    <div style="font-family:Arial,sans-serif;color:#141414;max-width:640px">
      <h2 style="margin:0 0 4px">Nueva venta en la web</h2>
      <p style="margin:0 0 18px;color:#666">Pedido <strong>${pedido.orden}</strong></p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f4f5f4">
            <th style="padding:8px 10px;text-align:left">Producto</th>
            <th style="padding:8px 10px;text-align:left">Variante</th>
            <th style="padding:8px 10px">Cant.</th>
            <th style="padding:8px 10px;text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <p style="font-size:18px;margin:18px 0 24px">
        <strong>Total cobrado: ${pesos(pedido.total)}</strong>
      </p>

      <h3 style="margin:0 0 6px;font-size:15px">Comprador</h3>
      <p style="margin:0 0 4px;font-size:14px">${comprador.nombre || 'Sin nombre'}</p>
      <p style="margin:0 0 4px;font-size:14px">${comprador.email || 'Sin mail'}</p>
      <p style="margin:0 0 18px;font-size:14px">${comprador.telefono || 'Sin telefono'}</p>

      <p style="font-size:13px;color:#666">
        Medio de pago: ${pedido.medio_pago || 'no informado'}<br>
        Pago Mercado Pago: ${pedido.pago_id || '-'}
      </p>
      <p style="font-size:13px;color:#666">
        Recorda coordinar el envio con el comprador: la web no pide la direccion.
      </p>
    </div>
  `

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clave}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.MAIL_REMITENTE || 'JR Calzados <onboarding@resend.dev>',
        to: destino.split(',').map((x) => x.trim()),
        subject: `Nueva venta ${pedido.orden} - ${pesos(pedido.total)}`,
        html
      })
    })
    if (!r.ok) console.error('[aviso] Resend respondio', r.status, await r.text())
  } catch (e) {
    // Un fallo del mail no puede tumbar el webhook: la venta ya esta guardada.
    console.error('[aviso] No se pudo enviar el mail:', e.message)
  }
}
