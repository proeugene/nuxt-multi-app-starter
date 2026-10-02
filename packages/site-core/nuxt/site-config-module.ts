import { defineNuxtModule } from '@nuxt/kit'
import type { SiteManifest } from '../types/site'

type SiteCoreModuleOptions = {
  manifest?: SiteManifest
}

export default defineNuxtModule<SiteCoreModuleOptions>({
  meta: {
    name: 'site-core-manifest',
    configKey: 'siteCore',
  },
  defaults: {
    manifest: undefined,
  },
  setup(options, nuxt) {
    if (!options.manifest) {
      return
    }

    const site = options.manifest
    const publicSiteConfig = {
      url: site.site.url,
      name: site.site.name,
      defaultTitle: site.seo.defaultTitle,
      defaultDescription: site.seo.defaultDescription,
      defaultOgDescription: site.seo.defaultOgDescription ?? site.seo.defaultDescription,
      socialImagePath: site.seo.defaultSocialImage,
      socialHandle: site.social.handle ?? '',
      linkedInUrl: site.social.linkedInUrl ?? '',
      twitterUrl: site.social.twitterUrl ?? '',
      contactEmail: site.contact.email ?? '',
      authorName: site.author.name,
    }

    const normalizedSiteOptions =
      nuxt.options.site === false ? {} : ((nuxt.options.site || {}) as Record<string, unknown>)

    normalizedSiteOptions.url = site.site.url
    normalizedSiteOptions.name = site.site.name
    nuxt.options.site = normalizedSiteOptions as typeof nuxt.options.site

    nuxt.options.runtimeConfig.public.site = {
      ...((nuxt.options.runtimeConfig.public.site as Record<string, unknown> | undefined) ?? {}),
      ...publicSiteConfig,
    }

    if (site.features.rss) {
      const routes = nuxt.options.nitro?.prerender?.routes ?? []

      nuxt.options.nitro = {
        ...(nuxt.options.nitro || {}),
        prerender: {
          ...(nuxt.options.nitro?.prerender || {}),
          routes: routes.includes('/rss.xml') ? routes : [...routes, '/rss.xml'],
        },
      }
    }
  },
})
