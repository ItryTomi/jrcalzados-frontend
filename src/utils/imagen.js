// Las fotos de Cloudinary se piden ya optimizadas: formato moderno segun el
// navegador, calidad automatica y el ancho que hace falta. Asi una foto de
// celular de 3 MB le llega al comprador pesando unos pocos cientos de KB.
//
// Las fotos que viven en /public (las 49 de la primera tanda) pasan tal cual.

export function optimizar(url, ancho = 800) {
  if (!url || !url.includes('res.cloudinary.com') || url.includes('/upload/f_auto')) {
    return url
  }
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${ancho}/`)
}
