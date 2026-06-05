import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react(), tailwindcss()],

    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
    },

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://192.168.20.83:3001',
          changeOrigin: true,
          secure: false,
        },
      },
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});