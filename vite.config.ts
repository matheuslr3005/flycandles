import { defineConfig } from 'vite'

export default defineConfig({
  build: { chunkSizeWarningLimit: 1200 },
  server: { port: 5173 },
})
