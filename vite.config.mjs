import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // proxy only applies to "npm run dev": the browser calls /api on its own origin (http://localhost:5173)
  // and vite forwards it to the express backend, so CORS never comes into play in development
  server: {
    proxy: {
      '/api': 'http://localhost:2000'
    }
  },
})
