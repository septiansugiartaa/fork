import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  server: {
    proxy: {
      '/api': {target: 'https://55ggsk56-3000.asse.devtunnels.ms', changeOrigin: true},
      '/foto-profil': {target: 'https://55ggsk56-3000.asse.devtunnels.ms', changeOrigin: true},
      '/uploads': {target: 'https://55ggsk56-3000.asse.devtunnels.ms', changeOrigin: true},
      '/payments': {target: 'https://55ggsk56-3000.asse.devtunnels.ms', changeOrigin: true}
    }
  }
})