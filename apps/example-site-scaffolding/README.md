# Example Site Scaffolding

Neutral reference app extending the shared Nuxt layer.
Run commands from the workspace root.

## Local commands

- `pnpm app:dev example-site-scaffolding`
- `pnpm app:generate example-site-scaffolding`
- `pnpm app:smoke example-site-scaffolding`

Open the local URL printed by Nuxt (normally http://localhost:3000).
Use `pnpm app:dev example-site-scaffolding --port 3001` if port 3000 is in use.
Generate the site before running smoke checks; install Chromium once with
`pnpm exec playwright install chromium`.

## First edits

Paths are relative to the workspace root:

- Identity, URL and SEO: `apps/example-site-scaffolding/site.manifest.ts`.
- Homepage: `apps/example-site-scaffolding/app/pages/index.vue`.
- Header, footer and navigation: `apps/example-site-scaffolding/app/layouts/default.vue`.
- App styling: `apps/example-site-scaffolding/app/assets/main.css`.
- Favicon and static assets: `apps/example-site-scaffolding/public/`.

Create your own app with `pnpm new:web-app my-site` rather than renaming this
reference app. See the [workspace README](../../README.md) for the full workflow.

## Deployment

- Cloudflare Pages project: `example-site-scaffolding`
- Build command: `pnpm app:generate example-site-scaffolding`
- Root directory: repo root
- Output directory: `apps/example-site-scaffolding/dist`
