import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const lib = (p: string) => fileURLToPath(new URL(`../../packages/pet/src/${p}`, import.meta.url))

// The demo runs straight off the library's source, so edits there hot-reload here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@markwylde\/pet\/react$/, replacement: lib('react.tsx') },
      { find: /^@markwylde\/pet$/, replacement: lib('index.ts') },
    ],
  },
})
