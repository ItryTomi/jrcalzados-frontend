// ============================================================
// CATALOGO JR CALZADOS - primera tanda (agosto 2026)
// ------------------------------------------------------------
// Datos cargados desde las fotos del local. Cada producto puede
// tener varios colores y cada color su propia foto.
//
// Para agregar un producto nuevo:
//   1. Guarda la foto en /public/productos/
//   2. Copia un bloque de abajo y cambia marca, codigo, precio,
//      talles y colores.
//
// precioAnterior: null  -> no muestra descuento.
// Si algun modelo entra en promo, pone el precio de lista ahi
// y la web calcula sola el % OFF y lo suma a la seccion Ofertas.
// ============================================================

import { TIENDA } from './tienda'

export const CATEGORIAS = [
  { slug: 'hombre', nombre: 'Hombre' },
  { slug: 'mujer', nombre: 'Mujer' },
  { slug: 'ninos', nombre: 'Ninos' },
  { slug: 'sandalias', nombre: 'Sandalias' }
]

export const TIPOS = ['Zapatillas', 'Botitas', 'Lona', 'Sandalias']
export const USOS = ['Running', 'Urbano', 'Padel', 'Confort', 'Fiesta', 'Primeros pasos']

const rango = (desde, hasta, paso = 1) => {
  const out = []
  for (let t = desde; t <= hasta; t += paso) out.push(t)
  return out
}

export const TALLES_ADULTO = rango(35, 45)
export const TALLES_NINO = rango(21, 34)

const C = {
  negro: '#141414',
  blanco: '#f2f2f0',
  azul: '#22314f',
  gris: '#9aa0a2',
  grisOsc: '#4a4d50',
  rosa: '#eab4c6',
  coral: '#f2775f',
  naranja: '#ef9331',
  menta: '#cfe6d9',
  salvia: '#a9b593',
  militar: '#6d7357',
  camel: '#c2925e',
  crema: '#e6d9c3',
  taupe: '#8d7c6a',
  plomo: '#a3a09b',
  plata: '#c6c6cc'
}

const p = (o) => ({
  precioAnterior: null,
  destacado: false,
  nuevo: false,
  consultarTalle: false,
  talles: [],
  ...o
})

export const PRODUCTOS = [
  // ---------------- HOMBRE ----------------
  p({
    id: 'pride-4', marca: 'Olympikus', nombre: 'Zapatillas Olympikus Pride 4',
    genero: 'hombre', tipo: 'Zapatillas', uso: 'Running', precio: 68500,
    talles: rango(40, 45), destacado: true, nuevo: true,
    colores: [
      { nombre: 'Blanco', hex: C.blanco, imagen: '/productos/olympikus-pride4-blanco-azul.jpg' },
      { nombre: 'Coral', hex: C.coral, imagen: '/productos/olympikus-pride4-blanco-coral.jpg' },
      { nombre: 'Gris', hex: C.gris, imagen: '/productos/olympikus-pride4-gris-naranja.jpg' }
    ]
  }),
  p({
    id: 'jaguar-9435', marca: 'Jaguar', codigo: '9435', nombre: 'Zapatillas Jaguar 9435',
    genero: 'hombre', tipo: 'Zapatillas', uso: 'Urbano', precio: 42700,
    talles: rango(40, 45), destacado: true,
    colores: [
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/jaguar-9435-negra.jpg' },
      { nombre: 'Blanco', hex: C.blanco, imagen: '/productos/jaguar-9435-blanca.jpg' },
      { nombre: 'Verde militar', hex: C.militar, imagen: '/productos/jaguar-9435-verde.jpg' }
    ]
  }),
  p({
    id: 'jaguar-9412', marca: 'Jaguar', codigo: '9412', nombre: 'Zapatillas Jaguar 9412 Retro',
    genero: 'hombre', tipo: 'Zapatillas', uso: 'Urbano', precio: 46100,
    talles: rango(40, 45), destacado: true,
    colores: [
      { nombre: 'Azul', hex: C.azul, imagen: '/productos/jaguar-9412-azul.jpg' },
      { nombre: 'Blanco', hex: C.blanco, imagen: '/productos/jaguar-9412-blanca.jpg' }
    ]
  }),
  p({
    id: 'jaguar-3128', marca: 'Jaguar', codigo: '3128', nombre: 'Zapatillas Jaguar 3128 Running',
    genero: 'hombre', tipo: 'Zapatillas', uso: 'Running', precio: 41900,
    talles: rango(40, 45),
    colores: [{ nombre: 'Gris', hex: C.gris, imagen: '/productos/jaguar-3128-gris.jpg' }]
  }),

  // ---------------- MUJER ----------------
  p({
    id: 'lance', marca: 'Olympikus', nombre: 'Zapatillas Olympikus Lance',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Running', precio: 57300,
    talles: rango(36, 41), destacado: true, nuevo: true,
    colores: [
      { nombre: 'Menta', hex: C.menta, imagen: '/productos/olympikus-lance-menta.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/olympikus-lance-negra.jpg' }
    ]
  }),
  p({
    id: 'jaguar-9394', marca: 'Jaguar', codigo: '9394', nombre: 'Zapatillas Jaguar 9394 Running',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Running', precio: 46200,
    talles: rango(35, 40), destacado: true,
    colores: [{ nombre: 'Rosa', hex: C.rosa, imagen: '/productos/jaguar-9394-rosa.jpg' }]
  }),
  p({
    id: 'jaguar-3095', marca: 'Jaguar', codigo: '3095', nombre: 'Zapatillas Jaguar 3095',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Running', precio: 45900,
    talles: rango(35, 40),
    colores: [{ nombre: 'Blanco', hex: C.blanco, imagen: '/productos/jaguar-3095-blanca.jpg' }]
  }),
  p({
    id: 'jaguar-alta', marca: 'Jaguar', nombre: 'Zapatillas Jaguar Running Alta Performance',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Running', precio: 50900,
    talles: rango(35, 40), nuevo: true,
    colores: [{ nombre: 'Verde salvia', hex: C.salvia, imagen: '/productos/jaguar-alta-verde.jpg' }]
  }),
  p({
    id: 'jaguar-3127', marca: 'Jaguar', codigo: '3127', nombre: 'Zapatillas Jaguar 3127 Running',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Running', precio: 41900,
    talles: rango(35, 40),
    colores: [{ nombre: 'Verde salvia', hex: C.salvia, imagen: '/productos/jaguar-3127-verde.jpg' }]
  }),
  p({
    id: 'gaelle-675', marca: 'Gaelle', codigo: '675', nombre: 'Zapatillas Gaelle 675 Elastizadas',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Confort', precio: 25500,
    talles: rango(36, 40), destacado: true,
    colores: [{ nombre: 'Azul', hex: C.azul, imagen: '/productos/gaelle-675-azul.jpg' }]
  }),
  p({
    id: 'jaguar-4351', marca: 'Jaguar', codigo: '4351', nombre: 'Botitas Jaguar 4351',
    genero: 'mujer', tipo: 'Botitas', uso: 'Urbano', precio: 36900,
    talles: rango(35, 40),
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/jaguar-4351-negra.jpg' }]
  }),
  p({
    id: 'ladycomfort-urbana', marca: 'Lady Comfort', nombre: 'Zapatillas Lady Comfort Urbanas',
    genero: 'mujer', tipo: 'Zapatillas', uso: 'Urbano', precio: 53900,
    talles: [27], nuevo: true,
    colores: [
      { nombre: 'Crema', hex: C.crema, imagen: '/productos/ladycomfort-urbana-crema.jpg' },
      { nombre: 'Crema y negro', hex: C.negro, imagen: '/productos/ladycomfort-urbana-crema-negro.jpg' }
    ]
  }),

  // ---------------- UNISEX ----------------
  p({
    id: 'raster', marca: 'Raster', nombre: 'Zapatillas Raster Running',
    genero: 'unisex', tipo: 'Zapatillas', uso: 'Running', precio: 23500,
    talles: rango(37, 44), destacado: true,
    colores: [
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/raster-negra.jpg' },
      { nombre: 'Gris', hex: C.grisOsc, imagen: '/productos/raster-gris.jpg' }
    ]
  }),
  p({
    id: 'jaguar-8074', marca: 'Jaguar', codigo: '8074', nombre: 'Zapatillas Jaguar 8074 de Lona',
    genero: 'unisex', tipo: 'Lona', uso: 'Urbano', precio: 21900,
    talles: rango(36, 44), destacado: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/jaguar-8074-negra.jpg' }]
  }),
  p({
    id: 'diportto-olympiadi', marca: 'Diportto', nombre: 'Zapatillas Diportto Olympiadi',
    genero: 'unisex', tipo: 'Zapatillas', uso: 'Padel', precio: 55500,
    talles: rango(35, 45), nuevo: true,
    colores: [
      { nombre: 'Azul', hex: '#1c74c4', imagen: '/productos/diportto-olympiadi-azul.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/diportto-olympiadi-negra.jpg' }
    ]
  }),
  p({
    id: 'diportto-padle', marca: 'Diportto', nombre: 'Zapatillas Diportto Padel',
    genero: 'unisex', tipo: 'Zapatillas', uso: 'Padel', precio: 55500,
    talles: rango(35, 45),
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/diportto-padle-negra.jpg' }]
  }),

  // ---------------- NINOS ----------------
  p({
    id: 'jaguar-4032', marca: 'Jaguar', codigo: '4032', nombre: 'Zapatillas Jaguar 4032 Ninos',
    genero: 'ninos', tipo: 'Zapatillas', uso: 'Urbano', precio: 36500,
    talles: rango(28, 35), destacado: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/jaguar-4032-negra.jpg' }]
  }),
  p({
    id: 'jaguar-4036', marca: 'Jaguar', codigo: '4036', nombre: 'Zapatillas Jaguar 4036 con Luces',
    genero: 'ninos', tipo: 'Zapatillas', uso: 'Urbano', precio: 45900,
    talles: rango(23, 30), destacado: true, nuevo: true,
    colores: [{ nombre: 'Rosa', hex: C.rosa, imagen: '/productos/jaguar-4036-rosa.jpg' }]
  }),
  p({
    id: 'jaguar-4037', marca: 'Jaguar', codigo: '4037', nombre: 'Zapatillas Jaguar 4037 con Luces',
    genero: 'ninos', tipo: 'Zapatillas', uso: 'Urbano', precio: 35900,
    talles: rango(23, 30), nuevo: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/jaguar-4037-negra.jpg' }]
  }),
  p({
    id: 'jaguar-4033', marca: 'Jaguar', codigo: '4033', nombre: 'Botas Jaguar 4033 Ninos',
    genero: 'ninos', tipo: 'Botitas', uso: 'Urbano', precio: 40600,
    talles: rango(28, 35),
    colores: [{ nombre: 'Rosa', hex: C.rosa, imagen: '/productos/jaguar-4033-rosa.jpg' }]
  }),
  p({
    id: 'proforce-3319', marca: 'Proforce', codigo: '3319', nombre: 'Zapatillas Proforce 3319 Ninos',
    genero: 'ninos', tipo: 'Zapatillas', uso: 'Urbano', precio: 29100,
    talles: rango(28, 34), destacado: true,
    colores: [
      { nombre: 'Gris', hex: C.gris, imagen: '/productos/proforce-3319-gris.jpg' },
      { nombre: 'Verde militar', hex: C.militar, imagen: '/productos/proforce-3319-verde.jpg' }
    ]
  }),
  p({
    id: 'upvez-nino', marca: 'UP Vez', nombre: 'Zapatillas UP Vez Primeros Pasos',
    genero: 'ninos', tipo: 'Zapatillas', uso: 'Primeros pasos', precio: 22500,
    talles: rango(21, 26),
    colores: [{ nombre: 'Camel', hex: C.camel, imagen: '/productos/upvez-nino-camel.jpg' }]
  }),

  // ---------------- SANDALIAS ----------------
  p({
    id: 'ladycomfort-velcro', marca: 'Lady Comfort', nombre: 'Sandalias Lady Comfort con Abrojo',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Confort', precio: 39100,
    consultarTalle: true, destacado: true,
    colores: [
      { nombre: 'Beige', hex: C.crema, imagen: '/productos/ladycomfort-velcro-beige.jpg' },
      { nombre: 'Taupe', hex: C.taupe, imagen: '/productos/ladycomfort-velcro-taupe.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-velcro-negra.jpg' }
    ]
  }),
  p({
    id: 'ladycomfort-elastizada', marca: 'Lady Comfort', nombre: 'Sandalias Lady Comfort Elastizadas',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Confort', precio: 39100,
    consultarTalle: true, destacado: true,
    colores: [
      { nombre: 'Crema', hex: C.crema, imagen: '/productos/ladycomfort-elastizada-crema.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-elastizada-negra.jpg' }
    ]
  }),
  p({
    id: 'ladycomfort-hebilla', marca: 'Lady Comfort', nombre: 'Sandalias Lady Comfort Taco Chino',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Urbano', precio: 36500,
    consultarTalle: true,
    colores: [
      { nombre: 'Blanco', hex: C.blanco, imagen: '/productos/ladycomfort-hebilla-blanca.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-hebilla-negra.jpg' }
    ]
  }),
  p({
    id: 'ladycomfort-5442214', marca: 'Lady Comfort', codigo: '5442214',
    nombre: 'Sandalias Lady Comfort Trenzadas',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Fiesta', precio: 39100,
    consultarTalle: true, nuevo: true,
    colores: [
      { nombre: 'Crema', hex: C.crema, imagen: '/productos/ladycomfort-5442214-crema.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-5442214-negra.jpg' }
    ]
  }),
  p({
    id: 'ladycomfort-fiesta', marca: 'Lady Comfort', nombre: 'Sandalias Lady Comfort de Fiesta',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Fiesta', precio: 63900,
    consultarTalle: true, destacado: true,
    colores: [
      { nombre: 'Plata', hex: C.plata, imagen: '/productos/ladycomfort-fiesta-plata.jpg' },
      { nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-fiesta-negra.jpg' }
    ]
  }),
  p({
    id: 'ladycomfort-204313', marca: 'Lady Comfort', codigo: '204313',
    nombre: 'Sandalias Lady Comfort Plataforma',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Urbano', precio: 39100,
    consultarTalle: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-204313-negra.jpg' }]
  }),
  p({
    id: 'ladycomfort-304218', marca: 'Lady Comfort', codigo: '304218',
    nombre: 'Sandalias Lady Comfort Cruzadas',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Confort', precio: 39100,
    consultarTalle: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/ladycomfort-304218-negra.jpg' }]
  }),
  p({
    id: 'karina-1494', marca: 'Karina', codigo: '1494', nombre: 'Sandalias Karina 1494 Plataforma',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Urbano', precio: 22900,
    talles: rango(36, 40), destacado: true,
    colores: [
      { nombre: 'Beige', hex: C.crema, imagen: '/productos/karina-1494-beige.jpg' },
      { nombre: 'Blanco', hex: C.blanco, imagen: '/productos/karina-1494-blanca.jpg' }
    ]
  }),
  p({
    id: 'karina-1630', marca: 'Karina', codigo: '1630', nombre: 'Sandalias Karina 1630 Metalizadas',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Urbano', precio: 22900,
    talles: rango(36, 40),
    colores: [{ nombre: 'Plomo', hex: C.plomo, imagen: '/productos/karina-1630-plomo.jpg' }]
  }),
  p({
    id: 'karina-1537', marca: 'Karina', codigo: '1537', nombre: 'Sandalias Karina 1537 con Apliques',
    genero: 'mujer', tipo: 'Sandalias', uso: 'Urbano', precio: 25900,
    talles: rango(36, 40), nuevo: true,
    colores: [{ nombre: 'Negro', hex: C.negro, imagen: '/productos/karina-1537-negra.jpg' }]
  })
]

export const MARCAS = [...new Set(PRODUCTOS.map((x) => x.marca))].sort()

export const TODOS_TALLES = [
  ...new Set(PRODUCTOS.flatMap((x) => x.talles))
].sort((a, b) => a - b)

export const COLORES = [
  ...new Map(PRODUCTOS.flatMap((x) => x.colores).map((c) => [c.nombre, c])).values()
].sort((a, b) => a.nombre.localeCompare(b.nombre))

export const descuento = (prod) =>
  prod.precioAnterior ? Math.round((1 - prod.precio / prod.precioAnterior) * 100) : 0

export const precioARS = (n) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const rangoTalles = (prod) => {
  if (prod.consultarTalle || !prod.talles.length) return 'Consultar talles'
  if (prod.talles.length === 1) return `Talle ${prod.talles[0]}`
  return `Talles ${prod.talles[0]} al ${prod.talles[prod.talles.length - 1]}`
}

export const CUOTAS = TIENDA.cuotasSinInteres

export const buscarProducto = (id) => PRODUCTOS.find((x) => x.id === id)
