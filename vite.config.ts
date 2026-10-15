import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  define: {
    'process.env.LICENSE_SERVER_URL': JSON.stringify(process.env.LICENSE_SERVER_URL || ''),
    ...(command === 'build' ? {
      'import.meta.env.DEV': false,
      'process.env.NODE_ENV': JSON.stringify('production'),
    } : {}),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: process.env.DISABLE_HMR !== 'true',
  },
}));
