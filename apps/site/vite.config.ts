import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// Served from https://markwylde.com/pet/ (GitHub Pages project site), so assets live under /pet/.
// The site builds straight from the library source, so it always shows the latest pet.
export default defineConfig({
  base: '/pet/',
  resolve: {
    alias: [{ find: /^@markwylde\/pet$/, replacement: fileURLToPath(new URL('../../packages/pet/src/index.ts', import.meta.url)) }],
  },
})
