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
      '/api': {target: 'https://localhost:3000', changeOrigin: true},
      '/foto-profil': {target: 'https://localhost:3000', changeOrigin: true},
      '/uploads': {target: 'https://localhost:3000', changeOrigin: true},
      '/payments': {target: 'https://localhost:3000', changeOrigin: true}
    }
  }
})