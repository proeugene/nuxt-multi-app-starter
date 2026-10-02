import { access, mkdir, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDir, '..')

const args = process.argv.slice(2)
const positionalArgs = args.filter((value) => !value.startsWith('--'))
const slug = positionalArgs[0]

const hasFlag = (flag: string): boolean => args.includes(flag)

const getOption = (flag: string): string | undefined => {
  const index = args.indexOf(flag)

  if (index === -1) {
    return undefined
  }

  return args[index + 1]
}

const printUsage = () => {
  console.log(
    'Usage: pnpm new:web-app <site-slug> [--name "Display Name"] [--url https://example.com] [--email hello@example.com] [--content] [--dry-run]',
  )
}

if (!slug || hasFlag('--help')) {
  printUsage()
  process.exit(slug ? 0 : 1)
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  throw new Error(`Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`)
}

const toTitleCase = (value: string): string =>
  value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')

const displayName = getOption('--name') ?? toTitleCase(slug)
const siteUrl = getOption('--url') ?? `https://${slug}.example.com`
const contactEmail = getOption('--email') ?? 'hello@example.com'
const withContent = hasFlag('--content')
const dryRun = hasFlag('--dry-run')

const tsString = (value: string): string => JSON.stringify(value)
const yamlString = (value: string): string => JSON.stringify(value)
const xmlEscape = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const appRoot = resolve(workspaceRoot, 'apps', slug)
const packageName = `@nuxt-multi-app-starter/${slug}`
const socialImagePath = '/favicon.svg'

const ensureAppDoesNotExist = async () => {
  try {
    await access(appRoot, constants.F_OK)
    throw new Error(`App directory already exists: ${appRoot}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return
    }

    throw error
  }
}

const siteManifestTemplate =
  () => `import type { SiteManifest } from '../../packages/site-core/types/site'

const siteManifest = {
  slug: ${tsString(slug)},
  packageName: ${tsString(packageName)},
  displayName: ${tsString(displayName)},
  site: {
    url: ${tsString(siteUrl)},
    name: ${tsString(displayName)},
    icon: ${tsString(socialImagePath)},
  },
  author: {
    name: ${tsString(displayName)},
  },
  seo: {
    defaultTitle: ${tsString(displayName)},
    defaultDescription: 'Placeholder site generated from the shared monorepo scaffold.',
    defaultOgDescription: 'Placeholder site generated from the shared monorepo scaffold.',
    defaultSocialImage: ${tsString(socialImagePath)},
  },
  social: {},
  contact: {
    email: ${tsString(contactEmail)},
  },
  feeds: {
    rss: {
      title: ${tsString(displayName)},
      description: ${tsString(`Placeholder feed metadata for ${displayName}.`)},
    },
  },
  features: {
    content: ${withContent},
    rss: ${withContent},
    sitemap: true,
    robots: true,
    smoke: true,
  },
  smoke: {
    routes: ${withContent ? "['/', '/blog', '/blog/hello-world']" : "['/']"},
  },
  deployment: {
    provider: 'cloudflare-pages',
    projectName: ${tsString(slug)},
    rootDirectory: '.',
    buildCommand: ${tsString(`pnpm app:generate ${slug}`)},
    outputDirectory: ${tsString(`apps/${slug}/dist`)},
    outputBase: 'workspace',
    envPrefix: ${tsString(`${slug.replace(/-/g, '_').toUpperCase()}_`)},
  },
} satisfies SiteManifest

export default siteManifest
`

const normalizedPackageJsonTemplate = () => {
  const dependencies: Record<string, string> = {
    '@nuxt-multi-app-starter/site-core': 'workspace:*',
    nuxt: '4.5.2',
  }

  const devDependencies: Record<string, string> = {
    '@nuxt/eslint': '1.17.0',
    '@nuxtjs/robots': '6.2.4',
    '@nuxtjs/sitemap': '8.6.1',
    '@tailwindcss/typography': '0.5.20',
    '@tailwindcss/vite': '4.3.3',
    eslint: '10.11.0',
    playwright: '1.63.0',
    tailwindcss: '4.3.3',
    typescript: '6.0.3',
    'vue-tsc': '3.3.12',
  }

  if (withContent) {
    dependencies['@nuxt/content'] = '3.16.1'
    dependencies['better-sqlite3'] = '13.0.3'
    devDependencies.zod = '4.6.5'
  }

  return `${JSON.stringify(
    {
      name: packageName,
      version: '2.0.0',
      private: true,
      license: 'MIT',
      type: 'module',
      scripts: {
        dev: 'nuxt dev',
        build: 'nuxt build',
        generate: 'nuxt generate',
        preview: 'nuxt preview',
        lint: 'nuxt prepare && eslint .',
        typecheck: 'nuxt typecheck',
        smoke: 'node --experimental-strip-types ../../scripts/smoke.mts',
      },
      dependencies,
      devDependencies,
    },
    null,
    2,
  )}\n`
}

const nuxtConfigTemplate = () => `import siteManifest from './site.manifest'

export default defineNuxtConfig({
  extends: ['../../packages/site-core'],

  siteCore: {
    manifest: siteManifest,
  },

  ${withContent ? "modules: ['@nuxt/content'],\n\n  " : ''}app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: siteManifest.site.icon }],
    },
  },

  css: ['~/assets/main.css'],

  ${
    withContent
      ? `content: {
    build: {
      markdown: {
        highlight: {
          theme: 'github-dark',
          langs: ['javascript', 'typescript', 'vue', 'html', 'css', 'json', 'bash', 'markdown'],
        },
      },
    },
  },
`
      : ''
  }})
`

const mainCssTemplate = () => `@reference "@nuxt-multi-app-starter/site-core/assets/theme.css";

@layer base {
  :root {
    color-scheme: light;
  }

  body {
    @apply text-slate-950 antialiased;
    background:
      radial-gradient(circle at top left, rgba(52, 211, 153, 0.24), transparent 24rem),
      radial-gradient(circle at top right, rgba(16, 185, 129, 0.18), transparent 20rem),
      linear-gradient(180deg, #f7fffb 0%, #ecfdf5 46%, #ffffff 100%);
  }
}

@layer components {
  .app-shell {
    @apply relative min-h-screen overflow-hidden;
  }

  .soft-panel {
    @apply border border-emerald-950/8 bg-white/86 backdrop-blur;
    border-radius: 1.5rem;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
  }

  .hero-badge {
    @apply inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-900;
  }

  .code-panel {
    @apply border border-slate-950/8 bg-slate-950 text-slate-50;
    border-radius: 1.5rem;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.16);
  }

  .command-pill {
    @apply rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-emerald-200;
  }
}

::selection {
  background: rgba(16, 185, 129, 0.2);
  color: #0f172a;
}

a {
  @apply transition-colors duration-200;
}

.prose {
  --tw-prose-body: #334155;
  --tw-prose-headings: #0f172a;
  --tw-prose-lead: #475569;
  --tw-prose-links: #047857;
  --tw-prose-bold: #0f172a;
  --tw-prose-code: #047857;
  --tw-prose-counters: #64748b;
  --tw-prose-bullets: rgba(15, 23, 42, 0.22);
  --tw-prose-hr: rgba(15, 23, 42, 0.12);
  --tw-prose-quotes: #0f172a;
  --tw-prose-quote-borders: rgba(15, 23, 42, 0.18);
  --tw-prose-pre-code: #e2e8f0;
  --tw-prose-pre-bg: #0f172a;
}
`

const layoutTemplate = () => `
<template>
  <div class="app-shell">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-white/30 blur-3xl" />
    <div class="pointer-events-none absolute -left-8 top-24 h-64 w-64 rounded-full bg-emerald-300/35 blur-3xl" />
    <div class="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl" />

    <header class="relative z-10">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <NuxtLink to="/" class="flex items-center gap-4 text-slate-950">
          <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15">
            N
          </span>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Nuxt Starter</p>
            <p class="text-lg font-semibold tracking-tight">{{ site.name }}</p>
          </div>
        </NuxtLink>
        <div class="flex items-center gap-3">
          ${withContent ? '<NuxtLink to="/blog" class="hidden rounded-full border border-emerald-950/10 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:text-slate-950 sm:inline-flex">Blog</NuxtLink>' : ''}
          <a
            :href="site.emailHref"
            class="inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
          >
            Contact
          </a>
        </div>
      </div>
    </header>

    <main class="relative z-10">
      <slot />
    </main>

    <footer class="relative z-10 mt-16 border-t border-slate-900/10">
      <div class="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="font-semibold text-slate-900">{{ site.name }}</p>
          <p>Generated from the shared Nuxt layer with app-owned deployment settings.</p>
        </div>
        <div class="flex flex-wrap items-center gap-4">
          <a :href="site.url" class="hover:text-slate-950">{{ site.url }}</a>
          <a :href="site.emailHref" class="hover:text-slate-950">{{ site.contactEmail }}</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const site = useSiteIdentity()
</script>
`

const indexPageTemplate = () => `
<template>
  <section class="mx-auto max-w-6xl px-6 pb-20 pt-8 md:pt-12">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(21rem,0.8fr)]">
      <div class="soft-panel p-8 md:p-10">
        <p class="hero-badge mb-6">Generated starter</p>
        <h1 class="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">
          Start {{ site.name }} with a cleaner Nuxt landing page.
        </h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {{ site.defaultDescription }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a
            :href="site.emailHref"
            class="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
          >
            Contact the team
          </a>
          <a
            :href="site.url"
            class="inline-flex rounded-full border border-emerald-950/10 bg-white/80 px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-950"
          >
            Open preview URL
          </a>
        </div>
        <div class="mt-10 flex flex-wrap gap-2">
          <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900">Nuxt 4</span>
          <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900">Tailwind v4</span>
          <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900">Cloudflare Pages</span>
          <span class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900">Manifest-driven</span>
        </div>
        <div class="mt-10 grid gap-3 md:grid-cols-3">
          <div class="rounded-2xl bg-slate-950 px-4 py-4 text-slate-50">
            <p class="text-xs uppercase tracking-[0.28em] text-emerald-300/80">Shared layer</p>
            <p class="mt-3 text-lg font-semibold">One technical core</p>
            <p class="mt-2 text-sm leading-6 text-slate-300">Nuxt config, SEO, and build conventions stay consistent while each app stays independent.</p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white/70 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Starter UX</p>
            <p class="mt-3 text-lg font-semibold text-slate-950">Nuxt-style launch pad</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">A landing page baseline that feels product-oriented instead of inheriting the flagship app aesthetic.</p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white/70 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Deployment</p>
            <p class="mt-3 text-lg font-semibold text-slate-950">Cloudflare-ready</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">Each app keeps its own build command, smoke routes, and output target in the manifest.</p>
          </div>
        </div>
      </div>

      <aside class="code-panel p-6 md:p-8">
        <div class="mb-6 flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span class="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">Project capsule</p>
        <div class="mt-6 space-y-5">
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Slug</p>
            <p class="mt-2 text-xl font-semibold">{{ appManifest.slug }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Workspace package</p>
            <p class="mt-2 font-medium text-slate-100">{{ appManifest.packageName }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Commands</p>
            <div class="mt-2 space-y-2">
              <p class="command-pill">pnpm app:dev ${slug}</p>
              <p class="command-pill">{{ appManifest.deployment.buildCommand }}</p>
              <p class="command-pill">pnpm app:smoke ${slug}</p>
            </div>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Preview URL</p>
            <p class="mt-2 text-sm text-slate-300">{{ site.url }}</p>
          </div>
        </div>
      </aside>
    </div>

    ${
      withContent
        ? `<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section class="soft-panel p-8">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Latest writing</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-950">Content-ready from the first scaffold</h2>
          </div>
          <NuxtLink to="/blog" class="text-sm font-medium text-emerald-700 hover:text-emerald-900">Open blog</NuxtLink>
        </div>
        <div v-if="posts?.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <BlogCard v-for="post in posts" :key="post.path" :post="post" />
        </div>
        <div v-else class="rounded-[1.5rem] border border-dashed border-slate-900/10 bg-white/40 px-6 py-10 text-center">
          <p class="text-lg font-medium text-slate-900">No posts yet.</p>
          <p class="mt-2 text-sm leading-6 text-slate-600">Create content under <span class="font-mono">content/blog</span> and the journal will populate automatically.</p>
        </div>
      </section>

      <div class="space-y-4">
        <div class="soft-panel p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Checklist</p>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Swap in your favicon and domain.</li>
            <li>Replace placeholder SEO copy in the manifest.</li>
            <li>Publish the first post to make the journal live.</li>
          </ul>
        </div>
        <div class="soft-panel p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Output</p>
          <p class="mt-3 text-sm leading-6 text-slate-600">The scaffold keeps content optional, but the layout is ready for a content-first launch.</p>
        </div>
      </div>
    </div>`
        : `<div class="mt-6 grid gap-6 md:grid-cols-3">
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Starter goal</p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Look like a product from day one.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">The scaffold ships with a landing-page shell, reusable surfaces, and a clearer default information hierarchy.</p>
      </div>
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Developer flow</p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Manifest-backed by default.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">Identity, smoke routes, deployment metadata, and app commands stay local to the app.</p>
      </div>
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Next step</p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Replace the placeholder story.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">Keep the shell or strip it back, but start from a stronger default than a blank app page.</p>
      </div>
    </div>`
    }
  </section>
</template>

<script setup lang="ts">
${withContent ? "import type { BlogPostListItem } from '~/types/site'\n" : ''}import siteManifest from '../../site.manifest'

const appManifest = siteManifest
const site = useSiteIdentity()
const socialImage = site.absoluteUrl(site.socialImagePath)

${
  withContent
    ? `const fetchLatestPosts = (): Promise<BlogPostListItem[]> =>
  queryCollection('blog')
    .where('draft', '<>', true)
    .order('date', 'DESC')
    .limit(3)
    .select('title', 'description', 'date', 'tags', 'path')
    .all()

const { data: posts } = await useAsyncData<BlogPostListItem[]>('latest-posts', fetchLatestPosts)

`
    : ''
}useHead({
  link: [{ rel: 'canonical', href: site.absoluteUrl('/') }],
})

useSeoMeta({
  title: site.defaultTitle,
  description: site.defaultDescription,
  ogTitle: site.defaultTitle,
  ogDescription: site.defaultOgDescription,
  ogUrl: site.url,
  ogImage: socialImage,
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
</script>
`

const blogCardTemplate = () => `
<template>
  <NuxtLink
    :to="post.path"
    class="soft-panel group block p-5 hover:border-emerald-800/15 hover:bg-white/95"
  >
    <div class="mb-2 flex items-start justify-between gap-4">
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in post.tags"
          :key="tag"
          class="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-900"
        >
          {{ tag }}
        </span>
      </div>
      <time class="shrink-0 text-sm text-slate-500" :datetime="post.date">{{ formatDate(post.date) }}</time>
    </div>
    <h2 class="mb-1.5 text-lg font-semibold text-slate-950 group-hover:text-emerald-900">{{ post.title }}</h2>
    <p class="text-sm leading-7 text-slate-600">{{ post.description }}</p>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { BlogPostListItem } from '~/types/site'

defineProps<{
  post: BlogPostListItem
}>()

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
</script>
`

const blogIndexTemplate = () => `
<template>
  <section class="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pt-12">
    <div class="soft-panel p-8 md:p-10">
      <p class="hero-badge mb-6">Blog</p>
      <h1 class="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">Writing from {{ site.name }}</h1>
      <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Notes, experiments, and launch updates for ${displayName}.</p>
    </div>
    <div v-if="posts?.length" class="mt-6 space-y-4">
      <BlogCard v-for="post in posts" :key="post.path" :post="post" />
    </div>
    <div v-else class="soft-panel mt-6 px-6 py-16 text-center">
      <p class="text-lg font-medium text-slate-900">No posts yet.</p>
      <p class="mt-2 text-sm leading-6 text-slate-600">Add your first entry under <span class="font-mono">content/blog</span>.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { BlogPostListItem } from '~/types/site'

const site = useSiteIdentity()
const socialImage = site.absoluteUrl(site.socialImagePath)

const fetchPosts = (): Promise<BlogPostListItem[]> =>
  queryCollection('blog')
    .where('draft', '<>', true)
    .order('date', 'DESC')
    .select('title', 'description', 'date', 'tags', 'path')
    .all()

const { data: posts } = await useAsyncData<BlogPostListItem[]>('all-posts', fetchPosts)

useHead({
  link: [{ rel: 'canonical', href: site.absoluteUrl('/blog') }],
})

useSeoMeta({
  title: 'Writing - ' + site.name,
  description: 'Writing from ' + site.name + '.',
  ogTitle: 'Writing - ' + site.name,
  ogDescription: 'Writing from ' + site.name + '.',
  ogUrl: site.absoluteUrl('/blog'),
  ogImage: socialImage,
  twitterCard: 'summary_large_image',
  twitterImage: socialImage,
})
</script>
`

const blogPostTemplate = () => `
<template>
  <section class="mx-auto max-w-5xl px-6 pb-20 pt-8 md:pt-12">
    <article v-if="post" class="soft-panel p-8 md:p-12">
      <NuxtLink to="/blog" class="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-900">Back to blog</NuxtLink>
      <div class="mt-8 max-w-3xl">
        <p class="hero-badge mb-6">Article</p>
        <h1 class="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{{ post.title }}</h1>
        <p v-if="post.description" class="mt-5 text-lg leading-8 text-slate-600">{{ post.description }}</p>
        <time class="mt-6 block text-sm text-slate-500" :datetime="post.date">{{ formatDate(post.date) }}</time>
      </div>
      <div class="mt-10 border-t border-slate-900/10 pt-10">
        <ContentRenderer :value="post" class="prose prose-slate max-w-none" />
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { BlogPostDetail } from '~/types/site'

const route = useRoute()
const site = useSiteIdentity()
const socialImage = site.absoluteUrl(site.socialImagePath)

const fetchPost = (): Promise<BlogPostDetail | null> =>
  queryCollection('blog').path(route.path).where('draft', '<>', true).first()

const { data: postData } = await useAsyncData<BlogPostDetail | null>('blog-' + route.path, fetchPost)

const requirePost = (value: BlogPostDetail | null | undefined): BlogPostDetail => {
  if (!value) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  return value
}

const post = computed(() => requirePost(postData.value))

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

useHead(() => ({
  link: [{ rel: 'canonical', href: site.absoluteUrl(route.path) }],
}))

useSeoMeta({
  title: () => post.value.title + ' - ' + site.name,
  description: () => post.value.description,
  ogTitle: () => post.value.title,
  ogDescription: () => post.value.description,
  ogUrl: site.absoluteUrl(route.path),
  ogImage: () => post.value.cover || socialImage,
  twitterCard: 'summary_large_image',
  twitterImage: () => post.value.cover || socialImage,
})
</script>
`

const blogTypesTemplate = () => `export interface BlogPostListItem {
  title: string
  description: string
  date: string
  tags: string[]
  path: string
}

export interface BlogPostDetail extends BlogPostListItem {
  cover?: string
}
`

const contentConfigTemplate =
  () => `import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),
        tags: z.array(z.string()).default([]),
        cover: z.string().optional(),
        draft: z.boolean().default(false),
      }),
    }),
  },
})
`

const helloWorldPostTemplate = () => `---
title: ${yamlString('Hello, World')}
description: ${yamlString(`First post scaffolded for ${displayName}.`)}
date: 2026-05-14
tags: [launch]
---

This post was generated by \
the monorepo scaffold.

Start editing under \`apps/${slug}/content/blog\`.
`

const rssTemplate = () => `import { queryCollection } from '@nuxt/content/server'
import siteManifest from '../../site.manifest'

const siteUrl = siteManifest.site.url

const escapeXml = (value = '') =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'blog')
    .where('draft', '<>', true)
    .order('date', 'DESC')
    .select('title', 'description', 'date', 'path')
    .all()

  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')

  const items = posts
    .map((post) => {
      const url = siteUrl + post.path

      return [
        '<item>',
        '<title>' + escapeXml(post.title) + '</title>',
        '<description>' + escapeXml(post.description) + '</description>',
        '<link>' + url + '</link>',
        '<guid>' + url + '</guid>',
        '<pubDate>' + new Date(post.date).toUTCString() + '</pubDate>',
        '</item>',
      ].join('')
    })
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    '<title>' + escapeXml(siteManifest.feeds.rss.title) + '</title>',
    '<description>' + escapeXml(siteManifest.feeds.rss.description) + '</description>',
    '<link>' + siteUrl + '</link>',
    items,
    '</channel>',
    '</rss>',
  ].join('')
})
`

const readmeTemplate = () => `# ${displayName}

Scaffolded Nuxt app that extends the shared monorepo layer.
Run commands from the workspace root.

## Local commands

- \`pnpm app:dev ${slug}\`
- \`pnpm app:generate ${slug}\`
- \`pnpm app:smoke ${slug}\`

Open the local URL printed by Nuxt (normally http://localhost:3000).
Use \`pnpm app:dev ${slug} --port 3001\` when another app is running on port 3000.
Generate the site before running smoke checks; install Chromium once with
\`pnpm exec playwright install chromium\`.

## First edits

Paths are relative to the workspace root:

- Identity, URL and SEO: \`apps/${slug}/site.manifest.ts\`.
- Homepage: \`apps/${slug}/app/pages/index.vue\`.
- Header, footer and navigation: \`apps/${slug}/app/layouts/default.vue\`.
- App styling: \`apps/${slug}/app/assets/main.css\`.
- Favicon and static assets: \`apps/${slug}/public/\`.
${withContent ? '- Blog entries: \`apps/' + slug + '/content/blog/\`.\n' : ''}

## Deployment

- Cloudflare Pages project: \`${slug}\`
- Build command: \`pnpm app:generate ${slug}\`
- Root directory: repo root
- Output directory: \`apps/${slug}/dist\`
`

const faviconTemplate =
  () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title">
  <title>${xmlEscape(displayName)}</title>
  <defs>
    <linearGradient id="${slug}-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#34d399" />
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="18" fill="#111827" />
  <circle cx="32" cy="32" r="20" fill="url(#${slug}-gradient)" />
  <circle cx="32" cy="32" r="9" fill="#111827" />
</svg>
`

const jsconfigTemplate = () => `{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"],
      "@/*": ["./app/*"],
      "~~/*": ["./*"],
      "@@/*": ["./*"]
    }
  },
  "exclude": ["node_modules", ".nuxt", "dist"]
}
`

const tsconfigTemplate = () => `{
  "extends": "./.nuxt/tsconfig.json"
}
`

const eslintConfigTemplate = () => `import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
  },
})
`

const files = new Map<string, string>([
  [resolve(appRoot, 'package.json'), normalizedPackageJsonTemplate()],
  [resolve(appRoot, 'site.manifest.ts'), siteManifestTemplate()],
  [resolve(appRoot, 'nuxt.config.ts'), nuxtConfigTemplate()],
  [resolve(appRoot, 'app/assets/main.css'), mainCssTemplate()],
  [resolve(appRoot, 'app/layouts/default.vue'), layoutTemplate()],
  [resolve(appRoot, 'app/pages/index.vue'), indexPageTemplate()],
  [resolve(appRoot, 'public/favicon.svg'), faviconTemplate()],
  [resolve(appRoot, 'README.md'), readmeTemplate()],
  [resolve(appRoot, 'jsconfig.json'), jsconfigTemplate()],
  [resolve(appRoot, 'tsconfig.json'), tsconfigTemplate()],
  [resolve(appRoot, 'eslint.config.mjs'), eslintConfigTemplate()],
])

if (withContent) {
  files.set(resolve(appRoot, 'content.config.ts'), contentConfigTemplate())
  files.set(resolve(appRoot, 'app/components/BlogCard.vue'), blogCardTemplate())
  files.set(resolve(appRoot, 'app/pages/blog/index.vue'), blogIndexTemplate())
  files.set(resolve(appRoot, 'app/pages/blog/[...slug].vue'), blogPostTemplate())
  files.set(resolve(appRoot, 'app/types/site.ts'), blogTypesTemplate())
  files.set(resolve(appRoot, 'content/blog/hello-world.md'), helloWorldPostTemplate())
  files.set(resolve(appRoot, 'server/routes/rss.xml.ts'), rssTemplate())
}

await ensureAppDoesNotExist()

if (dryRun) {
  console.log(`Would create ${files.size} files for ${slug}:`)

  for (const filePath of files.keys()) {
    console.log(`- ${filePath.replace(`${workspaceRoot}/`, '')}`)
  }

  process.exit(0)
}

for (const [filePath, contents] of files) {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, contents, 'utf8')
}

console.log(`Created app scaffold at apps/${slug}`)
console.log(`Next steps:`)
console.log(`- pnpm install`)
console.log(`- pnpm app:generate ${slug}`)
console.log(`- pnpm app:smoke ${slug}`)
