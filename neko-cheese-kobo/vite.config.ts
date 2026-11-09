import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 章ごとのシーンは React.lazy で分割読み込みする。
// three / R3F / drei は共通チャンクにまとめ、章を切り替えても再ダウンロードしない。
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  server: { host: true },
  preview: { host: true },
});
