import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // modern browsers only: smaller, faster JavaScript (no legacy transforms or polyfills)
    target: 'es2022',
    cssCodeSplit: true,
    modulePreload: { polyfill: false },
    reportCompressedSize: false,
  },
})
