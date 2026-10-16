# pet

Little animated desktop pets for the web, in the spirit of Microsoft Agent.

| Path | What |
| ---- | ---- |
| [`packages/pet`](packages/pet) | **`@markwylde/pet`**, the library (zero dependencies, optional React bindings). Start with its [README](packages/pet/README.md). |
| [`apps/demo`](apps/demo) | A playground built on the library: every animation, both characters, a mock streaming assistant, a tray dock. |
| [`apps/site`](apps/site) | The landing page at [markwylde.com/pet](https://markwylde.com/pet/). Plain TypeScript, no framework. Deployed to GitHub Pages by `.github/workflows/pages.yml`. |

```sh
npm install
npm run dev        # demo at http://localhost:5173, hot-reloading the library source
npm run site       # landing page at http://localhost:5173/pet/
npm test           # library tests
npm run build      # build the library (packages/pet/dist) and the demo
npm run lint
```

## Publishing

```sh
cd packages/pet
npm publish --access public   # runs typecheck, tests and build first (prepublishOnly)
```
