import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset URLs, so the same build works at the domain root, at a
  // GitHub Pages project subpath (/time-calculator/), or opened from disk.
  // Nothing here hardcodes the repository name.
  base: './',
})
