// Catalogo de JR Calzados.
// Para cargar fotos reales: pone el archivo en /public/productos/ y escribi
// imagen: '/productos/nombre-del-archivo.jpg'. Si imagen es null se dibuja
// un placeholder vectorial con los colores del producto.

export const CATEGORIAS = [
  { slug: 'hombre', nombre: 'Hombre' },
  { slug: 'mujer', nombre: 'Mujer' },
  { slug: 'ninos', nombre: 'Ninos' },
  { slug: 'ofertas', nombre: 'Ofertas' }
]

export const DEPORTES = ['Running', 'Training', 'Urbano', 'Futbol', 'Basquet', 'Tenis']

export const TALLES_ADULTO = [37, 38, 39, 40, 41, 42, 43, 44, 45]
export const TALLES_NINO = [28, 29, 30, 31, 32, 33, 34, 35, 36]

const p = (o) => ({
  destacado: false,
  nuevo: false,
  envioGratis: false,
  imagen: null,
  ...o
})

export const PRODUCTOS = [
  p({
    id: 'jr-001', marca: 'Nike', nombre: 'Zapatillas Nike Revolution 7',
    genero: 'hombre', deporte: 'Running', precio: 149999, precioAnterior: 189999,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Gris', hex: '#8b8f8a' }],
    talles: TALLES_ADULTO, stock: 12, destacado: true, envioGratis: true
  }),
  p({
    id: 'jr-002', marca: 'adidas', nombre: 'Zapatillas adidas Runfalcon 5',
    genero: 'hombre', deporte: 'Running', precio: 134999, precioAnterior: 164999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Azul', hex: '#2b4f9e' }],
    talles: TALLES_ADULTO, stock: 8, destacado: true
  }),
  p({
    id: 'jr-003', marca: 'Puma', nombre: 'Zapatillas Puma Softride Enzo',
    genero: 'hombre', deporte: 'Training', precio: 119999, precioAnterior: null,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Verde', hex: '#a3cc1e' }],
    talles: TALLES_ADULTO, stock: 5, nuevo: true
  }),
  p({
    id: 'jr-004', marca: 'Topper', nombre: 'Zapatillas Topper Squat III',
    genero: 'hombre', deporte: 'Training', precio: 79999, precioAnterior: 99999,
    colores: [{ nombre: 'Gris', hex: '#8b8f8a' }],
    talles: TALLES_ADULTO, stock: 20, destacado: true
  }),
  p({
    id: 'jr-005', marca: 'Nike', nombre: 'Zapatillas Nike Court Vision Low',
    genero: 'hombre', deporte: 'Urbano', precio: 159999, precioAnterior: 179999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Negro', hex: '#141414' }],
    talles: TALLES_ADULTO, stock: 9, envioGratis: true, destacado: true
  }),
  p({
    id: 'jr-006', marca: 'New Balance', nombre: 'Zapatillas New Balance 480',
    genero: 'hombre', deporte: 'Urbano', precio: 174999, precioAnterior: null,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Marron', hex: '#7a5c43' }],
    talles: TALLES_ADULTO, stock: 4, nuevo: true, envioGratis: true
  }),
  p({
    id: 'jr-007', marca: 'adidas', nombre: 'Botines adidas Predator Club FG',
    genero: 'hombre', deporte: 'Futbol', precio: 129999, precioAnterior: 159999,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Rojo', hex: '#c62828' }],
    talles: TALLES_ADULTO, stock: 7
  }),
  p({
    id: 'jr-008', marca: 'Puma', nombre: 'Botines Puma King Match FG',
    genero: 'hombre', deporte: 'Futbol', precio: 114999, precioAnterior: null,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }],
    talles: TALLES_ADULTO, stock: 6
  }),
  p({
    id: 'jr-009', marca: 'Fila', nombre: 'Zapatillas Fila Racer Motion',
    genero: 'mujer', deporte: 'Running', precio: 94999, precioAnterior: 124999,
    colores: [{ nombre: 'Rosa', hex: '#e08fa8' }, { nombre: 'Blanco', hex: '#f2f2f0' }],
    talles: TALLES_ADULTO, stock: 11, destacado: true
  }),
  p({
    id: 'jr-010', marca: 'Nike', nombre: 'Zapatillas Nike Downshifter 13',
    genero: 'mujer', deporte: 'Running', precio: 144999, precioAnterior: 169999,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Celeste', hex: '#63b3d6' }],
    talles: TALLES_ADULTO, stock: 10, envioGratis: true
  }),
  p({
    id: 'jr-011', marca: 'adidas', nombre: 'Zapatillas adidas Grand Court 2.0',
    genero: 'mujer', deporte: 'Urbano', precio: 124999, precioAnterior: null,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }],
    talles: TALLES_ADULTO, stock: 14, nuevo: true
  }),
  p({
    id: 'jr-012', marca: 'Puma', nombre: 'Zapatillas Puma Carina Street',
    genero: 'mujer', deporte: 'Urbano', precio: 109999, precioAnterior: 139999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Rosa', hex: '#e08fa8' }],
    talles: TALLES_ADULTO, stock: 3, destacado: true
  }),
  p({
    id: 'jr-013', marca: 'Reebok', nombre: 'Zapatillas Reebok Energen Tech',
    genero: 'mujer', deporte: 'Training', precio: 99999, precioAnterior: 129999,
    colores: [{ nombre: 'Violeta', hex: '#7c5ba6' }],
    talles: TALLES_ADULTO, stock: 8
  }),
  p({
    id: 'jr-014', marca: 'Under Armour', nombre: 'Zapatillas UA Charged Pursuit 3',
    genero: 'mujer', deporte: 'Running', precio: 154999, precioAnterior: null,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Verde', hex: '#a3cc1e' }],
    talles: TALLES_ADULTO, stock: 5, envioGratis: true
  }),
  p({
    id: 'jr-015', marca: 'Topper', nombre: 'Zapatillas Topper Wells Kids',
    genero: 'ninos', deporte: 'Urbano', precio: 59999, precioAnterior: 74999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Azul', hex: '#2b4f9e' }],
    talles: TALLES_NINO, stock: 18, destacado: true
  }),
  p({
    id: 'jr-016', marca: 'adidas', nombre: 'Zapatillas adidas Tensaur Sport Kids',
    genero: 'ninos', deporte: 'Training', precio: 69999, precioAnterior: null,
    colores: [{ nombre: 'Negro', hex: '#141414' }],
    talles: TALLES_NINO, stock: 12, nuevo: true
  }),
  p({
    id: 'jr-017', marca: 'Nike', nombre: 'Zapatillas Nike Star Runner 4 Kids',
    genero: 'ninos', deporte: 'Running', precio: 84999, precioAnterior: 104999,
    colores: [{ nombre: 'Gris', hex: '#8b8f8a' }, { nombre: 'Verde', hex: '#a3cc1e' }],
    talles: TALLES_NINO, stock: 9
  }),
  p({
    id: 'jr-018', marca: 'Puma', nombre: 'Botines Puma Vamos Kids TF',
    genero: 'ninos', deporte: 'Futbol', precio: 64999, precioAnterior: 79999,
    colores: [{ nombre: 'Naranja', hex: '#e07b39' }],
    talles: TALLES_NINO, stock: 7
  }),
  p({
    id: 'jr-019', marca: 'Nike', nombre: 'Zapatillas Nike Precision 7 Basquet',
    genero: 'hombre', deporte: 'Basquet', precio: 189999, precioAnterior: 219999,
    colores: [{ nombre: 'Negro', hex: '#141414' }, { nombre: 'Blanco', hex: '#f2f2f0' }],
    talles: TALLES_ADULTO, stock: 4, envioGratis: true
  }),
  p({
    id: 'jr-020', marca: 'Head', nombre: 'Zapatillas Head Sprint Team Tenis',
    genero: 'hombre', deporte: 'Tenis', precio: 139999, precioAnterior: null,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Azul', hex: '#2b4f9e' }],
    talles: TALLES_ADULTO, stock: 6, nuevo: true
  }),
  p({
    id: 'jr-021', marca: 'Fila', nombre: 'Zapatillas Fila Disruptor II',
    genero: 'mujer', deporte: 'Urbano', precio: 129999, precioAnterior: 159999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }],
    talles: TALLES_ADULTO, stock: 8, destacado: true
  }),
  p({
    id: 'jr-022', marca: 'New Balance', nombre: 'Zapatillas New Balance 574',
    genero: 'hombre', deporte: 'Urbano', precio: 199999, precioAnterior: 239999,
    colores: [{ nombre: 'Gris', hex: '#8b8f8a' }, { nombre: 'Negro', hex: '#141414' }],
    talles: TALLES_ADULTO, stock: 2, envioGratis: true, destacado: true
  }),
  p({
    id: 'jr-023', marca: 'Reebok', nombre: 'Zapatillas Reebok Club C 85',
    genero: 'mujer', deporte: 'Urbano', precio: 149999, precioAnterior: null,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Verde', hex: '#a3cc1e' }],
    talles: TALLES_ADULTO, stock: 5, nuevo: true
  }),
  p({
    id: 'jr-024', marca: 'Topper', nombre: 'Zapatillas Topper Tie Break',
    genero: 'hombre', deporte: 'Tenis', precio: 74999, precioAnterior: 94999,
    colores: [{ nombre: 'Blanco', hex: '#f2f2f0' }, { nombre: 'Negro', hex: '#141414' }],
    talles: TALLES_ADULTO, stock: 15
  })
]

export const MARCAS = [...new Set(PRODUCTOS.map((x) => x.marca))].sort()

export const descuento = (prod) =>
  prod.precioAnterior ? Math.round((1 - prod.precio / prod.precioAnterior) * 100) : 0

export const precioARS = (n) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const CUOTAS = 6

export const buscarProducto = (id) => PRODUCTOS.find((x) => x.id === id)
