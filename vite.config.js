import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Las funciones de /api solo existen cuando corre en Vercel. Este plugin
// las sirve tambien con `npm run dev`, asi el checkout se puede probar local.
const apiEnDesarrollo = () => ({
  name: 'api-en-desarrollo',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) return next()

      const ruta = req.url.split('?')[0].replace(/^\/api\//, '')
      try {
        const mod = await server.ssrLoadModule(`/api/${ruta}.js`)

        // Shim minimo de los helpers que da Vercel (res.status / res.json).
        res.status = (codigo) => {
          res.statusCode = codigo
          return res
        }
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(obj))
          return res
        }

        await mod.default(req, res)
      } catch (e) {
        server.config.logger.error(`[api] ${ruta}: ${e.message}`)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Error interno en la funcion de /api' }))
      }
    })
  }
})

export default defineConfig(({ mode }) => {
  // Carga el .env para que process.env.MP_ACCESS_TOKEN exista en dev.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [react(), apiEnDesarrollo()],
    server: { port: 5180 }
  }
})
