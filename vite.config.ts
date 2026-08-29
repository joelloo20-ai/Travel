import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves this project from /Travel/, not from the domain root.
  base: process.env.GITHUB_ACTIONS ? '/Travel/' : '/',
  plugins: [react()],
})
