<template>
  <div class="app-shell">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-72 bg-white/30 blur-3xl" />
    <div
      class="pointer-events-none absolute -left-8 top-24 h-64 w-64 rounded-full bg-emerald-300/35 blur-3xl"
    />
    <div
      class="pointer-events-none absolute right-0 top-12 h-72 w-72 rounded-full bg-lime-300/30 blur-3xl"
    />

    <header class="relative z-10">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <NuxtLink to="/" class="flex items-center gap-4 text-slate-950">
          <span
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15"
          >
            N
          </span>
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Nuxt Starter
            </p>
            <p class="text-lg font-semibold tracking-tight">{{ site.name }}</p>
          </div>
        </NuxtLink>
        <a
          :href="site.emailHref"
          class="inline-flex rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
        >
          Contact
        </a>
      </div>
    </header>

    <main class="relative z-10">
      <slot />
    </main>

    <footer class="relative z-10 mt-16 border-t border-slate-900/10">
      <div
        class="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
      >
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
