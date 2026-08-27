// Datos del local. Cambiar aca y se actualiza en toda la web.
export const TIENDA = {
  nombre: 'JR Calzados',
  ciudad: 'San Francisco',
  provincia: 'Cordoba',

  // TODO: falta la calle y la altura del local.
  direccion: 'San Francisco, Cordoba',
  horarios: 'Lunes a viernes de 9 a 16 hs',

  // Numero al que van todos los botones de WhatsApp de la tienda.
  // Formato internacional sin + ni espacios.
  // OJO: hay que confirmar que la linea de Ventas tenga WhatsApp. Si es
  // un fijo, todos los botones del sitio no llegan a ningun lado.
  whatsapp: '5493564607522',
  whatsappVisible: '3564 60-7522',

  telefonos: [
    { rol: 'Ventas', numero: '3564 60-7522', linea: '5493564607522' },
    { rol: 'Indumentaria', numero: '3564 67-3810', linea: '5493564673810' },
    { rol: 'Administracion', numero: '3564 61-2460', linea: '5493564612460' }
  ],

  email: 'jrcalzados.sanfco@gmail.com',
  instagram: 'jrcalzados',

  // Cuotas sin interes que ofrece el local.
  cuotasSinInteres: 3,

  // Envio gratis a todo el pais, sin monto minimo.
  envioGratisActivo: true,
  envioGratisDesde: 0
}

export const linkWhatsApp = (texto, linea = TIENDA.whatsapp) =>
  `https://wa.me/${linea}?text=${encodeURIComponent(texto)}`
