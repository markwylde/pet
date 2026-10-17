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

Releases are cut by the **Trigger Release** workflow (`.github/workflows/publish.yml`): open the
Actions tab, pick it and hit *Run workflow*. semantic-release works out the next version from the
[conventional commits](https://www.conventionalcommits.org) since the last `v*` tag (`fix:` → patch,
`feat:` → minor, `feat!:` / `BREAKING CHANGE:` → major), publishes `@markwylde/pet` to npmjs and
GitHub Packages, commits the version bump, tags it and writes the GitHub release. Commits like
`chore:`, `docs:` or `ci:` alone don't trigger a release.
