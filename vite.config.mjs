import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { PORT = '2000' } = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    // Keep this in sync with app.js, which starts Express on PORT.
    server: {
      proxy: {
        '/api': `https://56wr8545-2000.inc1.devtunnels.ms/`
      }
    }
  }
})
