// ============================================================
// TEXTOS LEGALES
// ------------------------------------------------------------
// Los datos del titular ya estan cargados y verificados.
//
// PENDIENTE: los textos son borradores armados con lo que habitualmente se
// pide para vender online en Argentina. NO estan revisados por un abogado.
// Antes de vender en serio tienen que pasar por el contador o el abogado
// de JR Calzados.
// ============================================================

import { TIENDA } from './tienda.js'

// Titular real del negocio. "JR Calzados" es el nombre de fantasia; quien
// factura y responde legalmente es la persona.
export const RAZON_SOCIAL = 'Rapetti Alejandro Jorge'
export const CUIT = '20-30499571-9'

// Formulario oficial de Defensa del Consumidor (ventanilla unica federal).
export const LINK_DEFENSA_CONSUMIDOR =
  'https://autogestion.produccion.gob.ar/consumidores'

export const LEGALES = {
  terminos: {
    titulo: 'Terminos y condiciones',
    bajada: `Condiciones de uso y de compra en el sitio de ${TIENDA.nombre}.`,
    secciones: [
      {
        h: 'Quien vende',
        p: [
          `Este sitio es operado por ${RAZON_SOCIAL}, CUIT ${CUIT}, con domicilio en ${TIENDA.direccion}. Podes contactarnos al ${TIENDA.whatsappVisible} o a ${TIENDA.email}.`
        ]
      },
      {
        h: 'Precios y medios de pago',
        p: [
          'Todos los precios estan expresados en pesos argentinos e incluyen IVA.',
          'Los precios y las promociones pueden cambiar sin aviso previo. El precio que vale es el que figura al momento de confirmar la compra.',
          'Los pagos se procesan a traves de Mercado Pago. Aceptamos tarjetas de credito y debito, dinero en cuenta de Mercado Pago y pago en efectivo por las redes habilitadas.',
          `Las cuotas sin interes vigentes son ${TIENDA.cuotasSinInteres}, sujetas a las promociones bancarias del momento.`
        ]
      },
      {
        h: 'Disponibilidad de stock',
        p: [
          'Publicamos los productos con la mejor informacion disponible, pero puede pasar que un talle se agote entre que lo comprás y lo preparamos.',
          'Si eso ocurre te avisamos a la brevedad y te ofrecemos cambiarlo por otro talle o modelo, o devolverte el importe total.'
        ]
      },
      {
        h: 'Envios',
        p: [
          'Hacemos envios a todo el pais sin cargo.',
          'Los plazos de entrega dependen del correo y del destino. Te informamos el seguimiento cuando despachamos el pedido.',
          `Tambien podes retirar sin cargo en nuestro local de ${TIENDA.ciudad}, ${TIENDA.provincia}.`
        ]
      },
      {
        h: 'Derecho de revocacion',
        p: [
          'Segun la Ley 24.240 de Defensa del Consumidor, tenes derecho a arrepentirte de la compra dentro de los 10 dias corridos desde que recibis el producto, sin necesidad de justificar el motivo y sin cargo alguno.',
          'Para ejercerlo podes usar el boton de arrepentimiento del sitio. El producto tiene que estar sin uso y en las mismas condiciones en que lo recibiste.'
        ]
      },
      {
        h: 'Garantia',
        p: [
          'Los productos cuentan con la garantia legal por defectos de fabricacion prevista en la Ley 24.240.',
          'La garantia no cubre el desgaste por uso normal ni los danos por mal uso.'
        ]
      },
      {
        h: 'Ley aplicable',
        p: [
          'Estas condiciones se rigen por las leyes de la Republica Argentina. Ante cualquier controversia se aplican los tribunales ordinarios competentes.'
        ]
      }
    ]
  },

  cambios: {
    titulo: 'Cambios y devoluciones',
    bajada: 'Como cambiar un talle o devolver un producto.',
    secciones: [
      {
        h: 'Cambio de talle',
        p: [
          'Podes cambiar el talle dentro de los 30 dias de recibida la compra, siempre que el producto este sin uso, con su etiqueta y en su caja original.',
          `Podes acercarte al local de ${TIENDA.ciudad} o escribirnos al ${TIENDA.whatsappVisible} para coordinar.`
        ]
      },
      {
        h: 'Devolucion por arrepentimiento',
        p: [
          'Dentro de los 10 dias corridos de recibido el pedido podes devolverlo sin costo y sin dar explicaciones, como establece la Ley 24.240.',
          'El reintegro se hace por el mismo medio de pago que usaste, una vez que recibimos el producto y verificamos su estado.'
        ]
      },
      {
        h: 'Producto con falla',
        p: [
          'Si el producto tiene un defecto de fabricacion, escribinos con fotos y el numero de pedido. Lo cambiamos o te devolvemos el importe, sin costo para vos.'
        ]
      },
      {
        h: 'Que necesitamos',
        p: [
          'El numero de pedido (te llega por mail al comprar), el producto en las condiciones descriptas y, si corresponde, el comprobante de compra.'
        ]
      }
    ]
  },

  privacidad: {
    titulo: 'Politica de privacidad',
    bajada: 'Que datos pedimos y para que los usamos.',
    secciones: [
      {
        h: 'Que datos recolectamos',
        p: [
          'Para procesar una compra te pedimos nombre y apellido, mail, telefono y, si elegis envio, tu direccion de entrega. Opcionalmente el DNI.',
          'No guardamos datos de tarjetas: el pago lo procesa Mercado Pago y esos datos nunca pasan por nuestro sitio.'
        ]
      },
      {
        h: 'Para que los usamos',
        p: [
          'Unicamente para procesar el pedido, coordinar la entrega y contactarte por cuestiones relacionadas con tu compra.',
          'No vendemos ni cedemos tus datos a terceros con fines publicitarios.'
        ]
      },
      {
        h: 'Con quien los compartimos',
        p: [
          'Con Mercado Pago, para procesar el cobro, y con el correo que realiza el envio. En ambos casos solo lo necesario para completar la operacion.'
        ]
      },
      {
        h: 'Tus derechos',
        p: [
          'La Ley 25.326 de Proteccion de Datos Personales te da derecho a acceder, rectificar y suprimir tus datos. Podes ejercerlo escribiendonos a ' +
            TIENDA.email +
            '.',
          'La Agencia de Acceso a la Informacion Publica es el organo de control de la Ley 25.326 y atiende las denuncias por incumplimiento.'
        ]
      },
      {
        h: 'Cookies',
        p: [
          'El sitio guarda datos en tu navegador para recordar el contenido del carrito y los datos de envio que hayas cargado. No usamos cookies de publicidad ni de seguimiento de terceros.'
        ]
      }
    ]
  }
}
