import { defineConfig } from 'vite';
export default defineConfig({ server: { host: '127.0.0.1', port: 5174, strictPort: true, proxy: { '/api/mp': { target: 'http://127.0.0.1:8790', ws: true } } } });
