import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const GAME_SERVER = 'http://localhost:8080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The game server writes edited docs back into data/*.json. Watching them
    // would full-reload the page on every save, killing the game socket.
    watch: { ignored: ['**/data/**'] },
    proxy: {
      '/ws': { target: GAME_SERVER.replace('http', 'ws'), ws: true },
      '/api/v1': { target: GAME_SERVER },
      '/persist': { target: GAME_SERVER },
    },
  },
});
