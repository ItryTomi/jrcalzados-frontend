// El catalogo, en la forma que a cada uno le corresponde ver.
//
//   GET /api/catalogo                -> productos activos, publico
//   GET /api/catalogo?todo=1         -> admin: incluye desactivados y el
//                                       precio mayorista. Exige clave.
//   GET /api/catalogo?mayorista=1    -> con precio mayorista, para la lista
//                                       de comercios. Decision del local:
//                                       va sin clave.
//   GET /api/catalogo?formato=xml    -> el sitemap. Se sirve en /sitemap.xml
//                                       por el rewrite de vercel.json.
//
// Los cuatro modos viven en el mismo archivo por el limite de 12 funciones
// serverless del plan Hobby de Vercel: separados, el deploy se rechaza.
//
// Si no hay base configurada devuelve 204: el navegador se queda con el
// catalogo del archivo y la web sigue andando igual.

import { PRODUCTOS } from '../src/data/productos.js'
import { hayBase } from './_db.js'
import { leerCatalogo } from './_catalogo.js'
import { verificarAdmin } from './_admin.js'

// ---------- Sitemap ----------

const RUTAS_FIJAS = [
  ['/', 'daily', '1.0'],
  ['/catalogo', 'daily', '0.9'],
  ['/catalogo/hombre', 'weekly', '0.8'],
  ['/catalogo/mujer', 'weekly', '0.8'],
  ['/catalogo/ninos', 'weekly', '0.8'],
  ['/catalogo/sandalias', 'weekly', '0.8'],
  ['/contacto', 'monthly', '0.5'],
  ['/legales/terminos', 'yearly', '0.2'],
  ['/legales/cambios', 'yearly', '0.2'],
  ['/legales/privacidad', 'yearly', '0.2']
]

const escapar = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function responderSitemap(req, res) {
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const base = `${proto}://${host}`

  let catalogo = PRODUCTOS
  if (hayBase()) {
    try {
      const deLaBase = await leerCatalogo()
      if (deLaBase.length) catalogo = deLaBase
    } catch (e) {
      console.error('[sitemap] no se pudo leer el catalogo:', e.message)
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)

  const urls = [
    ...RUTAS_FIJAS.map(([ruta, frec, prio]) => ({ loc: base + ruta, frec, prio })),
    ...catalogo.map((p) => ({
      loc: `${base}/producto/${encodeURIComponent(p.id)}`,
      frec: 'weekly',
      prio: '0.7'
    }))
  ]

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${escapar(u.loc)}</loc>\n` +
          `    <lastmod>${hoy}</lastmod>\n` +
          `    <changefreq>${u.frec}</changefreq>\n` +
          `    <priority>${u.prio}</priority>\n  </url>`
      )
      .join('\n') +
    '\n</urlset>\n'

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
  return res.status(200).send(xml)
}

// ---------- Handler ----------

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  const params = new URL(req.url, 'http://local').searchParams

  if (params.get('formato') === 'xml') return responderSitemap(req, res)

  const todo = params.get('todo')
  const mayorista = params.get('mayorista')

  if (todo && !(await verificarAdmin(req))) {
    return res.status(401).json({ error: 'Clave incorrecta' })
  }

  if (!hayBase()) {
    if (mayorista) return res.status(503).json({ error: 'Catalogo no disponible' })
    return res.status(204).end()
  }

  // Lista mayorista. Va sin clave por decision del local (2026-09-15): se
  // prioriza que el comercio entre y vea los precios sin ningun tramite.
  // Queda fuera de Google por robots.txt, pero cualquiera con el link entra.
  if (mayorista) {
    try {
      // Van TODOS los productos activos, tengan precio mayorista o no. Los que
      // no lo tienen se muestran como "a consultar": si los escondieramos, un
      // producto al que se le olvido cargar el precio desapareceria de la lista
      // sin que nadie se entere, y las dos listas se despegarian solas.
      const productos = await leerCatalogo({ conMayorista: true })
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
      return res.status(200).json({ productos })
    } catch (e) {
      console.error('[catalogo mayorista]', e)
      return res.status(500).json({ error: 'No se pudo leer el catalogo' })
    }
  }

  try {
    // En modo admin viaja tambien el precio mayorista: es la pantalla donde
    // el local lo carga. Ese modo ya exige clave, mas arriba.
    const productos = await leerCatalogo({
      incluirInactivos: Boolean(todo),
      conMayorista: Boolean(todo)
    })
    if (!todo) {
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    }
    return res.status(200).json({ productos })
  } catch (e) {
    console.error('[catalogo]', e)
    return res.status(500).json({ error: 'No se pudo leer el catalogo' })
  }
}
