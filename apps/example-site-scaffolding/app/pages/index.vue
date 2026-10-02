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
          <span
            class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900"
            >Nuxt 4</span
          >
          <span
            class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900"
            >Tailwind v4</span
          >
          <span
            class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900"
            >Cloudflare Pages</span
          >
          <span
            class="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-900"
            >Manifest-driven</span
          >
        </div>
        <div class="mt-10 grid gap-3 md:grid-cols-3">
          <div class="rounded-2xl bg-slate-950 px-4 py-4 text-slate-50">
            <p class="text-xs uppercase tracking-[0.28em] text-emerald-300/80">Shared layer</p>
            <p class="mt-3 text-lg font-semibold">One technical core</p>
            <p class="mt-2 text-sm leading-6 text-slate-300">
              Nuxt config, SEO, and build conventions stay consistent while each app stays
              independent.
            </p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white/70 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Starter UX</p>
            <p class="mt-3 text-lg font-semibold text-slate-950">Nuxt-style launch pad</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              A landing page baseline that feels product-oriented instead of inheriting the flagship
              app aesthetic.
            </p>
          </div>
          <div class="rounded-2xl border border-emerald-950/10 bg-white/70 px-4 py-4">
            <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Deployment</p>
            <p class="mt-3 text-lg font-semibold text-slate-950">Cloudflare-ready</p>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Each app keeps its own build command, smoke routes, and output target in the manifest.
            </p>
          </div>
        </div>
      </div>

      <aside class="code-panel p-6 md:p-8">
        <div class="mb-6 flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span class="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">
          Project capsule
        </p>
        <div class="mt-6 space-y-5">
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Slug</p>
            <p class="mt-2 text-xl font-semibold">{{ siteManifest.slug }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Workspace package</p>
            <p class="mt-2 font-medium text-slate-100">{{ siteManifest.packageName }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Commands</p>
            <div class="mt-2 space-y-2">
              <p class="command-pill">pnpm app:dev example-site-scaffolding</p>
              <p class="command-pill">{{ siteManifest.deployment.buildCommand }}</p>
              <p class="command-pill">pnpm app:smoke example-site-scaffolding</p>
            </div>
          </div>
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-slate-400">Preview URL</p>
            <p class="mt-2 text-sm text-slate-300">{{ site.url }}</p>
          </div>
        </div>
      </aside>
    </div>

    <div class="mt-6 grid gap-6 md:grid-cols-3">
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Starter goal</p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Look like a product from day one.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          The scaffold ships with a landing-page shell, reusable surfaces, and a clearer default
          information hierarchy.
        </p>
      </div>
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
          Developer flow
        </p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Manifest-backed by default.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Identity, smoke routes, deployment metadata, and app commands stay local to the app.
        </p>
      </div>
      <div class="soft-panel p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Next step</p>
        <p class="mt-3 text-xl font-semibold text-slate-950">Replace the placeholder story.</p>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Keep the shell or strip it back, but start from a stronger default than a blank app page.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import siteManifest from '../../site.manifest'

const site = useSiteIdentity()
const socialImage = site.absoluteUrl(site.socialImagePath)

useHead({
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
