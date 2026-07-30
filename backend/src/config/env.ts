import 'dotenv/config'

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback
  if (value === undefined) throw new Error(`Falta la variable de entorno ${key}`)
  return value
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', '4000')),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(required('DB_PORT', '3306')),
    user: required('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '',
    database: required('DB_NAME', 'classroom_db'),
  },
  jwt: {
    secret: required('JWT_SECRET', 'classroom-dev-secret'),
    expiresIn: required('JWT_EXPIRES_IN', '7d'),
  },
} as const
