# pet

Little animated pets for your apps: web apps, desktop apps (Electron, Tauri) and websites.

| Path | What |
| ---- | ---- |
| [`packages/pet`](packages/pet) | **`@markwylde/pet`**, the library (zero dependencies, optional React bindings). Start with its [README](packages/pet/README.md). |
| [`apps/demo`](apps/demo) | A playground built on the library: every animation, every character, a mock streaming assistant, a tray dock. |
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

Published to npmjs and GitHub Packages by `.github/workflows/publish.yml` whenever a `v*` tag is pushed. Bump the version in `packages/pet/package.json`, commit, then:

```sh
git tag v0.1.1 && git push origin v0.1.1
```

To install it, point the `@markwylde` scope at GitHub Packages (needs a token with `read:packages`):

```sh
echo "@markwylde:registry=https://npm.pkg.github.com" >> .npmrc
npm install @markwylde/pet
```
