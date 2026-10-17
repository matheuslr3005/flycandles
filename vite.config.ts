import { defineConfig } from 'vite'

// base relativa: o site funciona em qualquer caminho (ex.: usuario.github.io/flycandles/)
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 1200 },
  server: { port: 5173 },
})
