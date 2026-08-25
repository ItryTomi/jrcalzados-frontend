# JR Calzados — web

E-commerce para **JR Calzados** (San Francisco, Córdoba).
Catálogo con filtros, ficha de producto, carrito y pago online con Mercado Pago.

Stack: React 19 + Vite + react-router + CSS por componente (mismo esquema que los otros
proyectos de Kaairo).

## Correr en local

```
npm install
npm run dev
```

Queda en http://localhost:5180

## Build

```
npm run build
```

Sale en `dist/`. `vercel.json` ya trae el rewrite para que las rutas del SPA no den 404.

---

## Catálogo

**32 productos cargados** con las 49 fotos de la primera tanda (agosto 2026), en
`src/data/productos.js`. Las imágenes viven en `public/productos/`.

Marcas: Diportto, Gaelle, Jaguar, Karina, Lady Comfort, Olympikus, Proforce, Raster, UP Vez.

Cada producto tiene marca, código, género, tipo, uso, precio, talles y una lista de
colores — **cada color con su propia foto**, así el selector de color cambia la imagen
en la grilla y en la ficha.

### Agregar un producto

1. Guardá la foto en `public/productos/`.
2. Copiá un bloque de `PRODUCTOS` en `src/data/productos.js` y cambiá los datos.

### Poner un producto en oferta

Cargale `precioAnterior` con el precio de lista. La web calcula sola el % OFF, muestra
el precio tachado y lo suma a `/catalogo/ofertas`.
**Hoy ningún producto tiene precio anterior**, así que no hay descuentos ni sección de
ofertas visible — no inventé precios tachados.

### Productos "sin talle"

Las sandalias que vinieron sin rango de talles tienen `consultarTalle: true`. En vez del
selector muestran "Consultar talles" con botón directo a WhatsApp. Cuando tengas los
rangos, sacá esa línea y cargá `talles: rango(36, 40)`.

---

## Datos del local — `src/data/tienda.js`

**Todo esto está con valores de ejemplo y hay que completarlo antes de publicar:**

| Campo | Estado |
|---|---|
| `whatsapp` | ⚠️ `5493564000000` — número inventado |
| `direccion` | ⚠️ sin calle ni altura |
| `horarios` | ⚠️ horario tipo, confirmar |
| `email` | ⚠️ `ventas@jrcalzados.com.ar` — confirmar si existe |
| `instagram` | ⚠️ `jrcalzados` — confirmar usuario |
| `cuotasSinInteres` | ⚠️ puesto en `3` por defecto |
| `MP_ACCESS_TOKEN` | ⚠️ falta cargarlo en Vercel — sin eso el botón de pago avisa que no está configurado |

El envío está en **gratis a todo el país** (`envioGratisDesde: 0`). Si algún día se pone
un mínimo, se carga ahí y la web muestra sola la barra de progreso en el carrito.

---

## Dudas de la carga de datos (para confirmar con el cliente)

1. **Pride 4 y Lance son Olympikus** (logo de los aros, "Feito por Brasileiros" en la
   caja). En los archivos figuraba solo el modelo — los cargué con marca Olympikus.
2. **Jaguar 9435**: la negra y la blanca decían `42700` y la verde `42600`.
   Unifiqué en **42700**.
3. **Diportto Olympiadi** decía "45 al 45". Asumí **35 al 45** (igual que el Padel).
4. **Raster** decía "47 al 44". Asumí **37 al 44**.
5. **Lady Comfort Urbana** decía "talle 27". Quedó cargado como talle único 27, pero
   para calzado de mujer suena raro — ¿va 37?
6. **`jrcalzados1.jpg`** es la misma foto que la Raster negra. Usé una sola.
7. **`Sandalia. cod5442214`** aparecía dos veces con el mismo código y distinto color
   (crema y negra). Las agrupé como dos colores del mismo modelo.
8. **`SandaliaGris. 63900`** en la foto es plateada, no gris. La cargué como "Plata".
9. Las sandalias sin marca en el nombre las identifiqué por la caja: **Karina**
   (cod 1494, 1537, 1630) y **Lady Comfort** (el resto).

## Pendiente técnico

- Las fotos están en 1600×1200 (~130 KB c/u, 6,3 MB en total). Cargan con `lazy` así que
  no bloquean, pero conviene redimensionarlas a ~900 px antes de publicar.

---

## Pago online (Mercado Pago)

Checkout Pro: el comprador paga con tarjeta de credito, debito, dinero en cuenta de
Mercado Pago o efectivo (Rapipago / Pago Facil). **Envio gratis a todo el pais**, sin
monto minimo.

**No hace falta un backend aparte ni Railway.** El unico codigo de servidor es
`api/crear-preferencia.js`, una funcion serverless que Vercel corre dentro del mismo
proyecto y que en el plan Hobby es gratis.

### Ponerlo a andar

1. Entra a https://www.mercadopago.com.ar/developers/panel/app y crea una aplicacion.
2. Copia el **Access Token**:
   - `TEST-...` para probar sin plata real.
   - El de produccion para cobrar de verdad.
3. En Vercel: **Settings > Environment Variables**, nombre `MP_ACCESS_TOKEN`.
4. Redeploy (las variables no se aplican a deploys ya hechos).

Para probar en local, poner el mismo token en `.env` (esta en `.gitignore`, no se sube).
Con `npm run dev` la funcion tambien se sirve, gracias al plugin `api-en-desarrollo`
de `vite.config.js`.

### Como esta hecha la seguridad

El navegador manda **solo id, talle, color y cantidad**. El precio lo pone el servidor
leyendo `src/data/productos.js`. Si alguien edita el pedido en el navegador para pagar
$1, el backend igual cobra el precio del catalogo. El Access Token nunca sale del
servidor.

El backend ademas rechaza: productos que no existen, talles que ese modelo no tiene,
carritos vacios, mas de 30 lineas y mas de 10 unidades por linea.

### Registro de ventas

`api/webhook-mp.js` es la **unica confirmacion confiable** de que algo se pago.
La vuelta del navegador a `/pago/exito` no sirve como prueba: cualquiera puede
escribir esa URL a mano. El webhook, en cambio, le vuelve a preguntar a Mercado
Pago por el pago usando el Access Token del servidor.

Flujo completo:

1. El comprador aprieta Pagar -> `crear-preferencia` calcula el total con precios
   del servidor, guarda el pedido como `iniciado` y lo manda a Mercado Pago.
2. Paga -> Mercado Pago llama a `/api/webhook-mp`.
3. El webhook consulta el pago, pasa el pedido a `pagado` y manda el mail al local.

Es idempotente: Mercado Pago puede repetir la notificacion y el mail sale una sola vez.

### Base de datos (Neon)

1. Crear una base gratis en https://neon.tech (el plan free permite uso comercial).
2. Copiar la *connection string* y cargarla como `DATABASE_URL`.

La tabla `pedidos` se crea sola en el primer uso, no hay que correr migraciones.

**La base es opcional**: si no esta configurada el cobro igual funciona, solo que
no queda registro.

### Ver los pedidos

```
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://<tu-dominio>/api/pedidos
```

Es la vista minima hasta que exista un panel con login.

### Variables de entorno

Todas van en Vercel > Settings > Environment Variables. Ver `.env.example`.

| Variable | Para que | Obligatoria |
|---|---|---|
| `MP_ACCESS_TOKEN` | Cobrar con Mercado Pago | Si |
| `DATABASE_URL` | Guardar los pedidos (Neon) | Recomendada |
| `MP_WEBHOOK_SECRET` | Validar que el webhook sea de MP | Recomendada |
| `RESEND_API_KEY` + `MAIL_AVISOS` | Mail al local en cada venta | Opcional |
| `ADMIN_TOKEN` | Consultar `/api/pedidos` | Opcional |

En el panel de Mercado Pago hay que registrar la URL del webhook:
`https://<tu-dominio>/api/webhook-mp`, evento **Pagos**.

### Checkout

`/checkout` pide los datos antes de mandar a pagar: nombre, apellido, mail, telefono,
DNI opcional, y si elige envio la direccion completa. Se guardan en el navegador para
no volver a escribirlos en la proxima compra.

Todo se **vuelve a validar en el servidor**: el formulario del navegador se puede
saltear, asi que `crear-preferencia` rechaza mails invalidos, telefonos cortos,
direcciones incompletas y codigos postales que no sean 4 numeros.

Los datos viajan a Mercado Pago como `payer` y `shipments.receiver_address`, se
guardan en el pedido y salen en el mail de aviso al local.

### Legales

Paginas en `/legales/terminos`, `/legales/cambios`, `/legales/privacidad` y
`/arrepentimiento`, enlazadas desde el pie en todas las paginas.

**Los textos son borradores, no estan revisados por un abogado.** Estan en
`src/data/legales.js` y hay dos datos por completar antes de publicar:
`RAZON_SOCIAL` y `CUIT`. Tienen que pasar por el contador o el abogado de JR.

### Lo que todavia falta

- **Control de stock.** El catalogo no lleva stock, asi que se puede vender un talle
  que ya no esta. Hay que revisar cada pedido a mano.
- **Panel de administracion.** Hoy los pedidos se ven por API o por mail.
- **Plan de Vercel.** El plan Hobby es para proyectos personales sin fines
  comerciales. Cuando la tienda empiece a cobrar hay que pasar a Pro o mudar las
  funciones a un proveedor cuyo plan gratuito permita uso comercial.

---

## Estructura

```
src/
  components/   Header, Footer, ProductCard, CartDrawer, Logo, FotoProducto, WhatsAppFAB
  context/      CartContext (carrito con persistencia en localStorage)
  data/         productos.js (catálogo) + tienda.js (datos del local)
  pages/        Home, Catalogo, Producto, Contacto, PagoResultado
  services/     pago.js (llama a la funcion que crea la preferencia)
api/            funciones serverless de Vercel
  crear-preferencia.js  arma el cobro (precios del servidor)
  webhook-mp.js         confirma el pago y avisa al local
  pedidos.js            listado para el local (con token)
  _db.js / _aviso.js    base de datos y mail
  styles/       global.css (tokens de color, tipografía, botones, grillas)
```

## Cómo funciona el pedido

Dos caminos desde el carrito:

1. **Pagar ahora** — va a Mercado Pago (ver la sección de pago online más arriba).
2. **Coordinar por WhatsApp** — arma un mensaje con los ítems (marca, modelo, talle,
   color, cantidad y total) y abre el chat con todo escrito.
