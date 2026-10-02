# Nuxt Multi-App Starter

Run several independent Nuxt websites from one repository.

Share common setup and code while keeping each site's pages, content and design
separate. Includes an example site, a generator for adding new sites, and automated
checks.

Built with Nuxt 4, Nuxt Layers, pnpm and Tailwind CSS.

## Quick start

Requires **Node.js 24.11+** (see `.nvmrc`) and **pnpm 12.8.1** (pinned in `package.json`).
Run commands from the workspace root.

```bash
git clone https://github.com/proeugene/nuxt-multi-app-starter.git
cd nuxt-multi-app-starter
```

```bash
pnpm install --frozen-lockfile
pnpm app:dev example-site-scaffolding
```

Open the local URL printed by Nuxt, normally **http://localhost:3000**.
You should see the “Example Site Scaffolding” landing page. Local development
needs no Cloudflare account, credentials or environment file.

The included `example-site-scaffolding` is a neutral, content-free reference app.
Create another independent site using the generator:

```bash
pnpm new:web-app my-site --dry-run
pnpm new:web-app my-site --name "My Site" --url https://my-site.example.com
pnpm install
pnpm app:dev my-site
```

Pass `--content` to include Nuxt Content, a sample blog and an RSS route:

```bash
pnpm new:web-app my-content-site --content
pnpm install
pnpm app:dev my-content-site
```

The generator refuses to overwrite an existing app. Each new site starts with
placeholder content, a favicon, local scripts and its own deployment metadata.
Replace the placeholder identity and assets before publishing a site.

## Make the site your own

For the generated `my-site` app, start here:

| Change                                             | File or directory                      |
| -------------------------------------------------- | -------------------------------------- |
| Site name, domain, contact details and default SEO | `apps/my-site/site.manifest.ts`        |
| Homepage content                                   | `apps/my-site/app/pages/index.vue`     |
| Header, footer and navigation                      | `apps/my-site/app/layouts/default.vue` |
| App styling                                        | `apps/my-site/app/assets/main.css`     |
| Favicon and static assets                          | `apps/my-site/public/`                 |
| Blog entries, when created with `--content`        | `apps/my-site/content/blog/`           |

Keep site-specific changes inside that app. Changes in `packages/site-core`
affect every app that extends the shared layer. Adding an app needs no manual
workspace or CI registration; its manifest is discovered automatically.

## Run two apps together

Use a separate terminal for each app, from the workspace root:

```bash
# Terminal 1 — http://localhost:3000
pnpm app:dev example-site-scaffolding --port 3000
```

```bash
# Terminal 2 — http://localhost:3001
pnpm app:dev my-site --port 3001
```

## Structure

```text
apps/
  example-site-scaffolding/  # Neutral reference app
packages/
  site-core/                # Shared Nuxt layer and manifest contract
scripts/
  app-command.mts           # App command wrapper using pnpm filters
  create-web-app.mts         # App generator, with optional content
  ci-plan.mts               # Discover manifests and affected apps
  smoke.mts                 # Validate generated routes and SEO assets
```

Apps extend `packages/site-core` in their local Nuxt config. The shared layer
provides Tailwind wiring, SEO modules, HTML defaults, manifest-to-runtime identity
and `useSiteIdentity()`. Layouts, pages, content schemas and branding stay local
to each app.

Workspace package names use `@nuxt-multi-app-starter/*`. They are private workspace
packages; this starter does not require publishing anything to npm.

## Site manifests

Each app owns `site.manifest.ts`, which defines its package name, site identity,
default SEO metadata, capability declarations, smoke routes and Cloudflare
Pages settings. The layer reads identity; tooling reads package, smoke and
deployment metadata. Feature declarations describe the app's capabilities;
they do not automatically install or disable every Nuxt module.

For the standard repo-root deployment model, `outputDirectory` is
`apps/<slug>/dist` and `outputBase` is `workspace`. The smoke runner also supports
app-relative output paths for apps that explicitly use that deployment model.

## Commands and validation

```bash
pnpm app:lint example-site-scaffolding
pnpm app:typecheck example-site-scaffolding
pnpm typecheck:scripts
pnpm test:ci-plan
pnpm app:generate example-site-scaffolding
pnpm exec playwright install chromium
pnpm app:smoke example-site-scaffolding
```

`app:dev`, `app:build`, `app:generate`, `app:preview`, `app:lint`,
`app:typecheck` and `app:smoke` accept an app slug or scoped package name.
`pnpm dev`, `build`, `generate`, `preview` and `smoke` target the reference app.
`pnpm lint` and `pnpm typecheck` check all workspace apps.

Smoke checks serve the generated output on a temporary local port and use
Chromium to check declared routes, page identity, canonical/Open Graph URLs,
and enabled RSS, sitemap and robots output. They are not full accessibility,
visual or physical-device tests.

## CI

`.github/workflows/ci.yml` discovers app manifests automatically. App-local
changes select that app for generation and smoke checks; shared changes select
all apps. The first push validates the full workspace.
Markdown-only documentation changes skip heavy checks, while Markdown
under an app's content directory counts as app content.

Workspace lint, app typechecks and script typechecks run for code changes.
Changes to shared packages, scripts or dependencies also validate a newly
generated content app through lint, typecheck, generation and smoke checks.
The build jobs use the Cloudflare Pages static Nitro preset. Dependency updates
are configured through Dependabot.

## Deployment

See [CLOUDFLARE_PAGES.md](CLOUDFLARE_PAGES.md) for one independently configured
Pages project per app, build watch paths and app-specific environment settings.
The manifests document deployment settings; they do not create cloud resources
or isolate runtime secrets automatically.

## Contributing

Bug reports, suggestions and pull requests are welcome.

For bugs, [open an issue](https://github.com/proeugene/nuxt-multi-app-starter/issues)
and include steps to reproduce and your Node.js and pnpm versions. For larger
changes, open an issue first so we can discuss the approach.

To contribute code, fork the repo, create a branch and open a pull request. Run the
[validation commands above](#commands-and-validation) for any apps you change.
For shared code changes, validate all apps. Documentation-only changes do not
need app builds or smoke checks.

Useful contributions include clearer documentation, generator improvements and
fixes to the shared setup.

## License

[MIT](LICENSE), copyright © 2026 Eugene Prokudin.
