import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // El .env vive en la raiz del proyecto, no en frontend/.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    root: 'frontend',
    envDir: path.resolve(process.cwd()),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'frontend/src'),
      },
    },
    server: {
      port: 5173,
      // Proxy para llamar a la API con rutas relativas (/api/...) desde el front.
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT ?? 4000}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  }
})
