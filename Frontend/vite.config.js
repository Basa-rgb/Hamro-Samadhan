import { fileURLToPath, URL } from "node:url";
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@services": fileURLToPath(new URL("./services", import.meta.url)),
    },
  },
})
