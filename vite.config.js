import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Proxy API calls to the Pi FastAPI during local dev (npm run dev)
  server: {
    proxy: {
      '/state':    'http://localhost:8080',
      '/data':     'http://localhost:8080',
      '/settings': 'http://localhost:8080',
      '/video':    'http://localhost:8080',
      '/camera':   'http://localhost:8080',
      '/measurement': 'http://localhost:8080',
    },
  },
  // Output into microcontroller-api/static so FastAPI serves it directly
  build: {
    outDir: '../microcontroller-api/static',
    emptyOutDir: true,
  },
})
