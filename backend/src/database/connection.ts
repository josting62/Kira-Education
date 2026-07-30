import mysql from 'mysql2/promise'
import { env } from '../config/env.ts'

/** Pool unico compartido por todos los repositorios. */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  charset: 'utf8mb4_unicode_ci',
})

/**
 * Valores admitidos como parametros de una consulta preparada.
 * mysql2 tipa esto de forma muy estricta, asi que lo declaramos una vez aqui.
 */
export type QueryParam = string | number | boolean | Date | null
export type QueryParams = QueryParam[]

/** SELECT que devuelve varias filas. */
export const query = async <T>(sql: string, params: QueryParams = []): Promise<T[]> => {
  const [rows] = await pool.query(sql, params)
  return rows as T[]
}

/** SELECT que devuelve una fila o null. */
export const queryOne = async <T>(sql: string, params: QueryParams = []): Promise<T | null> => {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/** INSERT / UPDATE / DELETE. Devuelve insertId y affectedRows. */
export const execute = async (
  sql: string,
  params: QueryParams = [],
): Promise<{ insertId: number; affectedRows: number }> => {
  const [result] = await pool.execute(sql, params)
  const header = result as mysql.ResultSetHeader
  return { insertId: header.insertId, affectedRows: header.affectedRows }
}

/** Ejecuta varias sentencias dentro de una transaccion. */
export const transaction = async <T>(
  handler: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await handler(conn)
    await conn.commit()
    return result
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

export const verifyConnection = async (): Promise<void> => {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
}
