import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Proyecto_Aplicada_3_2026/',  // 👈 nombre del repo en GitHub
})
