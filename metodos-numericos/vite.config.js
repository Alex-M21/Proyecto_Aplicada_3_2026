import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { platform } from 'node:os'

export default defineConfig({
  plugins: [react()],
  base: '/Proyecto_Aplicada_3_2026/',  // 👈 nombre del repo en GitHub
  server: {
    watch: {
      // Las sustituciones de archivos en Windows pueden perder eventos del watcher.
      usePolling: platform() === 'win32',
      interval: 300,
    },
  },
})
