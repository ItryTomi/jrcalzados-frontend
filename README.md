# JR Calzados — web

E-commerce de calzado deportivo para **JR Calzados** (San Francisco, Córdoba).
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

## Qué hay que cargar antes de publicar

1. **Logo real** → guardar el PNG del cliente como `public/logo.png`.
   El componente `Logo` lo busca ahí primero; si no está usa `public/logo.svg`
   (recreación aproximada) y como último recurso un wordmark tipográfico.

2. **Datos del local** → `src/data/tienda.js`.
   Ahí están el WhatsApp, la dirección, los horarios, el mail y el Instagram.
   El WhatsApp va en formato internacional sin `+` ni espacios: `5493564123456`.
   **Hoy está el número de ejemplo `5493564000000` y la dirección con altura `000`.**

3. **Productos** → `src/data/productos.js`.
   Cada producto tiene marca, nombre, género, deporte, precio, precio anterior,
   colores, talles y stock. Para poner la foto real: guardarla en
   `public/productos/` y setear `imagen: '/productos/archivo.jpg'`.
   Mientras `imagen` sea `null` se dibuja un placeholder vectorial con el color
   del producto (por eso la grilla se ve completa sin fotos todavía).

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

No hay pasarela de pago. El carrito arma un mensaje con los ítems (marca, modelo,
talle, color, cantidad y total) y abre WhatsApp con todo escrito. Si más adelante
quieren Mercado Pago, se reemplaza el botón del `CartDrawer` por el checkout.
