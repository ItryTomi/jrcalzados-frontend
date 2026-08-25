// Datos del local. Cambiar aca y se actualiza en toda la web.
export const TIENDA = {
  nombre: 'JR Calzados',
  ciudad: 'San Francisco',
  provincia: 'Cordoba',
  direccion: 'Av. Libertador Norte 000, San Francisco, Cordoba',
  horarios: 'Lunes a viernes 9 a 13 y 16.30 a 20.30 hs | Sabados 9 a 13 hs',
  // Formato internacional sin + ni espacios (ej: 5493564123456)
  whatsapp: '5493564000000',
  whatsappVisible: '+54 9 3564 00-0000',
  email: 'ventas@jrcalzados.com.ar',
  instagram: 'jrcalzados',
  facebook: 'jrcalzados',
  envioGratisDesde: 149999,
  cuotasSinInteres: 6
}

export const linkWhatsApp = (texto) =>
  `https://wa.me/${TIENDA.whatsapp}?text=${encodeURIComponent(texto)}`
