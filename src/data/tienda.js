// Datos del local. Cambiar aca y se actualiza en toda la web.
export const TIENDA = {
  nombre: 'JR Calzados',
  ciudad: 'San Francisco',
  provincia: 'Cordoba',

  // TODO cliente: completar con los datos reales
  direccion: 'San Francisco, Cordoba',
  horarios: 'Lunes a viernes 9 a 13 y 16.30 a 20.30 hs | Sabados 9 a 13 hs',
  // Formato internacional sin + ni espacios (ej: 5493564123456)
  whatsapp: '5493564000000',
  whatsappVisible: '+54 9 3564 00-0000',
  email: 'ventas@jrcalzados.com.ar',
  instagram: 'jrcalzados',

  // Cuotas sin interes que ofrece el local.
  cuotasSinInteres: 3,

  // Envio gratis: poner en true y fijar el monto cuando el local
  // defina la politica. Mientras este en false la web solo dice
  // "envios a todo el pais", sin prometer un monto.
  envioGratisActivo: false,
  envioGratisDesde: 0
}

export const linkWhatsApp = (texto) =>
  `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(texto)}`
