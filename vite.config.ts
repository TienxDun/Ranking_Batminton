import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      // HMR có thể được tắt qua biến môi trường DISABLE_HMR khi agent chỉnh sửa file để tránh flickering.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Tắt tính năng xem thay đổi file (file watching) khi DISABLE_HMR để tiết kiệm CPU.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
