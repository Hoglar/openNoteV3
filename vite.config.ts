import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxy = Object.fromEntries(['/api', '/accounts', '/_allauth'].map(path => [path, {
  target: 'http://127.0.0.1:8000', changeOrigin: false,
}]));

export default defineConfig({ plugins: [react()], server: { proxy }, preview: { proxy } });
