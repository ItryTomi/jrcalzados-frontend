// Mapa del sitio para los buscadores.
//
// Se sirve en /sitemap.xml gracias al rewrite de vercel.json. Se arma en
// vivo con el catalogo: cada producto que carga el local entra solo, sin
// que nadie tenga que acordarse de actualizar un archivo.

import { PRODUCTOS } from '../src/data/productos.js'
import { hayBase } from './_db.js'
import { leerCatalogo } from './_catalogo.js'

const FIJAS = [
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

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
    ...FIJAS.map(([ruta, frec, prio]) => ({ loc: base + ruta, frec, prio })),
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
