import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    // allow the dev server to be reachable from the host network (helps WSL/docker)
    host: true,
    // HMR options: use clientPort for more reliable websocket connection routing
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 3000
    },
    // fallback to polling when filesystem events are unreliable
    watch: {
      usePolling: true,
      interval: 100
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});