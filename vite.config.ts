import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Keep the 3D and motion stacks in their own chunks so the first paint is
    // not blocked by them.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/framer-motion') || id.includes('node_modules/lenis')) return 'motion'
          return undefined
        },
      },
    },
  },
})
