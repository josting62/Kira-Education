import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.ts'
import { UPLOADS_DIR } from './config/uploads.ts'
import { apiRoutes } from './routes/index.ts'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.ts'

export const createApp = () => {
  const app = express()

  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  // Imagenes subidas (avatares y encabezados de clase).
  // Va bajo /api para que el proxy de Vite las alcance sin configuracion extra.
  app.use(
    '/api/uploads',
    express.static(UPLOADS_DIR, {
      maxAge: '7d',
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff')
        // Un SVG o HTML subido no puede ejecutar scripts ni pedir recursos:
        // asi un archivo de un usuario no se convierte en XSS almacenado.
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
      },
    }),
  )

  app.use('/api', apiRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
