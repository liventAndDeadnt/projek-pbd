import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // Cookie sesi hanya jalan kalau browser menganggap frontend dan API satu origin,
    // jadi semua /api diteruskan ke Go lewat proxy ini.
    proxy: { '/api': 'http://localhost:8080' },
  },
  build: {
    // hasil build ditaruh di backend supaya bisa di-embed ke binary Go
    outDir: '../backend/web/dist',
    emptyOutDir: true,
  },
})
