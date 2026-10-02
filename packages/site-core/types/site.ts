export interface SiteManifest {
  slug: string
  packageName: string
  displayName: string
  site: {
    url: string
    name: string
    icon: string
  }
  author: {
    name: string
  }
  seo: {
    defaultTitle: string
    defaultDescription: string
    defaultOgDescription?: string
    defaultSocialImage: string
  }
  social: {
    handle?: string
    linkedInUrl?: string
    twitterUrl?: string
  }
  contact: {
    email?: string
  }
  feeds?: {
    rss?: {
      title: string
      description: string
    }
  }
  features: {
    content: boolean
    rss: boolean
    sitemap: boolean
    robots: boolean
    smoke: boolean
  }
  smoke?: {
    routes: string[]
    absentRoutes?: string[]
    sitemapRoutes?: string[]
    personSchema?: boolean
  }
  deployment: {
    provider: 'cloudflare-pages'
    projectName: string
    rootDirectory: string
    buildCommand: string
    outputDirectory: string
    outputBase?: 'app' | 'workspace'
    envPrefix: string
  }
}

export interface SiteRuntimeConfig {
  url: string
  name: string
  defaultTitle: string
  defaultDescription: string
  defaultOgDescription: string
  socialImagePath: string
  socialHandle: string
  linkedInUrl: string
  twitterUrl: string
  contactEmail: string
  authorName: string
}
