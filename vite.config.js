import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bottradbct/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
