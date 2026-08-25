# JR Calzados — web

E-commerce para **JR Calzados** (San Francisco, Córdoba).
Catálogo con filtros, ficha de producto, carrito y cierre de pedido por WhatsApp.

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
| `envioGratisActivo` | `false` — la web dice "envíos a todo el país" sin prometer monto |

Cuando el local defina el envío gratis: poné `envioGratisActivo: true` y el monto en
`envioGratisDesde`. Se activa solo la barra de progreso del carrito y el aviso del header.

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

### Lo que falta para operar en serio

- **Webhook de confirmacion.** Hoy la web muestra "pago aprobado" en base a la vuelta de
  Mercado Pago. Para registrar la venta del lado del local hay que agregar
  `api/webhook-mp.js` y guardar los pedidos en algun lado.
- **Control de stock.** El catalogo no lleva stock, asi que se puede vender un talle que
  ya no esta. Por ahora hay que revisar cada pedido a mano.
- **Datos de envio.** Checkout Pro pide nombre, mail y telefono, pero no la direccion de
  entrega. Hoy se coordina por WhatsApp despues del pago.

---

## Estructura

```
src/
  components/   Header, Footer, ProductCard, CartDrawer, Logo, FotoProducto, WhatsAppFAB
  context/      CartContext (carrito con persistencia en localStorage)
  data/         productos.js (catálogo) + tienda.js (datos del local)
  pages/        Home, Catalogo, Producto, Contacto
  styles/       global.css (tokens de color, tipografía, botones, grillas)
```

## Cómo funciona el pedido

No hay pasarela de pago. El carrito arma un mensaje con los ítems (marca, modelo, talle,
color, cantidad y total) y abre WhatsApp con todo escrito. Si más adelante quieren
Mercado Pago, se reemplaza el botón del `CartDrawer` por el checkout.
