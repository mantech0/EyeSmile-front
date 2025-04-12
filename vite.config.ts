import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/mediapipe-proxy': {
        target: 'https://cdn.jsdelivr.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mediapipe-proxy/, '')
      }
    },
    cors: true,
    hmr: {
      overlay: true,
    },
    headers: {
      'Content-Security-Policy': "default-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob: https://cdn.jsdelivr.net; media-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net blob:; worker-src 'self' blob:;"
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@mediapipe/face_mesh', '@mediapipe/camera_utils', '@mediapipe/drawing_utils']
  },
}) 