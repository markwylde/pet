# Contributing

This is an npm workspaces monorepo: the library lives in `packages/pet`, the demo in `apps/demo`
and the landing page in `apps/site`.

## Development

```sh
npm install
npm run dev        # demo at http://localhost:5173, hot-reloading the library source
npm run site       # landing page at http://localhost:5173/pet/
npm test           # library tests
npm run typecheck
npm run build      # build the library (packages/pet/dist), the demo and the site
npm run lint
```

The landing page is deployed to GitHub Pages by `.github/workflows/pages.yml`.

## Publishing

Published to npmjs and GitHub Packages by `.github/workflows/publish.yml` whenever a `v*` tag is
pushed. Bump the version in `packages/pet/package.json`, commit, then:

```sh
git tag v0.1.2 && git push origin v0.1.2
```
