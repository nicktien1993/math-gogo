import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 移除 define process.env，以免蓋掉環境變數中的 API_KEY
  server: {
    port: 3000,
    host: true
  }
});