import siteManifest from './site.manifest'

export default defineNuxtConfig({
  extends: ['../../packages/site-core'],

  siteCore: {
    manifest: siteManifest,
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: siteManifest.site.icon }],
    },
  },

  css: ['~/assets/main.css'],
})
