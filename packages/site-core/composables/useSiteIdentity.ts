import type { SiteRuntimeConfig } from '../types/site'

export const useSiteIdentity = () => {
  const runtimeConfig = useRuntimeConfig()
  const site = runtimeConfig.public.site as SiteRuntimeConfig

  return {
    ...site,
    absoluteUrl: (path = '/') => new URL(path, site.url).toString(),
    emailHref: site.contactEmail ? `mailto:${site.contactEmail}` : '',
  }
}
