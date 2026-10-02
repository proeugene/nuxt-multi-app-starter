import tailwindcss from '@tailwindcss/vite'

type NuxtVitePlugin = NonNullable<
  NonNullable<Parameters<typeof defineNuxtConfig>[0]['vite']>['plugins']
>[number]

const tailwindPlugin = tailwindcss() as unknown as NuxtVitePlugin

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    new URL('./nuxt/site-config-module.ts', import.meta.url).pathname,
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/eslint',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },

  css: [new URL('./assets/theme.css', import.meta.url).pathname],

  vite: {
    plugins: [tailwindPlugin],
  },
})
