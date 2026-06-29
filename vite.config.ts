import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Project-page deploy: site lives at https://<user>.github.io/messyout/.
// base must match the repo name for production; dev server stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/messyout/' : '/',
  plugins: [react(), tailwindcss()],
}))
