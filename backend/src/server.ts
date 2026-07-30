import { createApp } from './app.ts'
import { env } from './config/env.ts'
import { pool, verifyConnection } from './database/connection.ts'

const start = async () => {
  try {
    await verifyConnection()
    console.log(`[db] conectado a ${env.db.database} en ${env.db.host}:${env.db.port}`)
  } catch (error) {
    console.error('[db] no se pudo conectar a MySQL. Inicia MySQL en el panel de XAMPP.')
    console.error(error)
    process.exit(1)
  }

  const server = createApp().listen(env.port, () => {
    console.log(`[api] http://localhost:${env.port}/api  (${env.nodeEnv})`)
  })

  const shutdown = async (signal: string) => {
    console.log(`\n[api] ${signal} recibido, cerrando...`)
    server.close()
    await pool.end()
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

void start()
