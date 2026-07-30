/**
 * Crea la base de datos y carga los datos de prueba sin abrir Workbench.
 *
 *   npm run db:setup    -> schema + seed
 *   npm run db:reset    -> lo mismo (el schema hace DROP DATABASE primero)
 *
 * Requiere que MySQL de XAMPP este iniciado.
 */
import 'dotenv/config'
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const files = [
  'backend/src/database/migrations/001_schema.sql',
  'backend/src/database/seeds/002_seed.sql',
]

const run = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  }).catch((error) => {
    console.error('\nNo se pudo conectar a MySQL. Inicia MySQL en el panel de XAMPP.\n')
    throw error
  })

  for (const file of files) {
    const sql = await readFile(path.resolve(process.cwd(), file), 'utf8')
    await connection.query(sql)
    console.log(`  OK  ${file}`)
  }

  const [rows] = await connection.query(
    `SELECT COUNT(*) AS tablas FROM information_schema.tables
     WHERE table_schema = ?`,
    [process.env.DB_NAME ?? 'classroom_db'],
  )
  console.log(`\nBase de datos lista: ${rows[0].tablas} tablas/vistas en ${process.env.DB_NAME ?? 'classroom_db'}`)
  console.log('Usuarios demo (contrasena 123456):')
  console.log('  admin@classroom.test    -> admin')
  console.log('  gersson@classroom.test  -> docente')
  console.log('  jostin@classroom.test   -> estudiante')

  await connection.end()
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
