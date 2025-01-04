import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: { overlay: true },
    },
    // Optionally, if you want to use environment variables
    define: {
      'process.env': loadEnv(mode, process.cwd(), '')
    }
  };
});