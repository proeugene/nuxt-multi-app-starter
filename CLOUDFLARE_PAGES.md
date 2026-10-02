# Cloudflare Pages

Use one Pages project per app, connected to the same repository. Keep the build
root at the repository root and use each app's manifest-backed command.

## Reference app

- Project name: choose an available name (the manifest example is `example-site-scaffolding`).
- Root directory: repository root.
- Build command: `pnpm app:generate example-site-scaffolding`.
- Output directory: `apps/example-site-scaffolding/dist`.
- Node.js version: 24.11 or newer (within Node 24).
- pnpm version: 12.8.1, as pinned by the root package metadata.
- Nitro preset: `cloudflare-pages-static` (CI sets `NITRO_PRESET` explicitly).

For a new app, replace the slug and output directory with values from its
`site.manifest.ts`. Set its real site URL and identity before deploying.

## Build watch paths

In each Pages project's build settings, replace the default `*` include with:

```text
apps/<app-slug>/*
packages/*
scripts/*
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
.npmrc
.nvmrc
tsconfig.json
```

Leave exclusions empty. These paths are repository-relative. Shared code and
dependency changes intentionally trigger every project; app-local changes
trigger the relevant project. GitHub CI selection and Cloudflare's build
triggers are separate settings.

See the provider's [monorepo documentation](https://developers.cloudflare.com/pages/configuration/monorepos/)
and [build watch path documentation](https://developers.cloudflare.com/pages/configuration/build-watch-paths/).

## Environment and verification

Keep secrets in each Pages project's environment settings. The manifest's
`envPrefix` is a naming convention, not automatic secret routing. The starter
contains no credentials or contact-form backend.

Create a preview deployment, then check routes, canonical URLs, `robots.txt`,
`sitemap.xml` and `rss.xml` for content-enabled apps. Check HTTPS and the actual
site URL before connecting a production domain. Local generation and smoke
checks do not establish deployed Preview or Production behavior.
