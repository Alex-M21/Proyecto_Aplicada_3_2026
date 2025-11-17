import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 👇 IMPORTANTE: nombre del repo en GitHub
  base: '/Proyecto_Aplicada_3_2026/',
})
