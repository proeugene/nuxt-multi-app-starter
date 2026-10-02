import type { SiteManifest } from '../../packages/site-core/types/site'

const siteManifest = {
  slug: 'example-site-scaffolding',
  packageName: '@nuxt-multi-app-starter/example-site-scaffolding',
  displayName: 'Example Site Scaffolding',
  site: {
    url: 'https://example-site-scaffolding.example.com',
    name: 'Example Site Scaffolding',
    icon: '/favicon.svg',
  },
  author: {
    name: 'Example Site Scaffolding',
  },
  seo: {
    defaultTitle: 'Example Site Scaffolding',
    defaultDescription: 'Reference scaffold app generated from the shared monorepo layer.',
    defaultOgDescription: 'Reference scaffold app generated from the shared monorepo layer.',
    defaultSocialImage: '/favicon.svg',
  },
  social: {},
  contact: {
    email: 'hello@example.com',
  },
  feeds: {
    rss: {
      title: 'Example Site Scaffolding',
      description: 'Placeholder feed metadata for the scaffold reference app.',
    },
  },
  features: {
    content: false,
    rss: false,
    sitemap: true,
    robots: true,
    smoke: true,
  },
  smoke: {
    routes: ['/'],
  },
  deployment: {
    provider: 'cloudflare-pages',
    projectName: 'example-site-scaffolding',
    rootDirectory: '.',
    buildCommand: 'pnpm app:generate example-site-scaffolding',
    outputDirectory: 'apps/example-site-scaffolding/dist',
    outputBase: 'workspace',
    envPrefix: 'EXAMPLE_SITE_SCAFFOLDING_',
  },
} satisfies SiteManifest

export default siteManifest
