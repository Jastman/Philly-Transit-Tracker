import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  base: '/Philly-Transit-Tracker/',
  plugins: [
    react(),
    cesium(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/septa-api': {
        target: 'https://www3.septa.org/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/septa-api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
})
