import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 4001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Use esbuild for minification — much faster than Rollup's terser
    minify: 'esbuild',
    // Suppress chunk size warnings for intentionally large 3D vendor libs
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        // Split heavy vendors into separate chunks processed in parallel.
        // Keeps Three.js in its own chunk so Rollup doesn't tree-shake
        // 38 MB of source on every rebuild.
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-three':  ['three'],
          'vendor-r3f':    ['@react-three/fiber', '@react-three/drei'],
          'vendor-socket': ['socket.io-client'],
        },
      },
    },
  },
})
