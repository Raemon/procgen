import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const GAME_SERVER = 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: { main: 'index.html', explainer: 'explainer.html' },
    },
  },
  server: {
    proxy: {
      '/ws': { target: GAME_SERVER.replace('http', 'ws'), ws: true },
      '/api/v1': { target: GAME_SERVER },
      '/persist': { target: GAME_SERVER },
    },
  },
});
