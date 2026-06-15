import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 41023,
    proxy: {
      '/api': {
        target: 'http://localhost:41123',
        changeOrigin: true
      }
    }
  }
})
