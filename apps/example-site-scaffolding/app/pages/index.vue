<template>
  <div>
    <section class="starter-intro" aria-labelledby="starter-title">
      <p class="starter-status">Your example site is running.</p>
      <h1 id="starter-title">Nuxt Multi-App Starter</h1>
      <p class="starter-description">
        Run several independent Nuxt websites from one repo. Share the setup, keep each site's pages
        and design separate.
      </p>
      <a
        href="https://github.com/proeugene/nuxt-multi-app-starter#quick-start"
        class="starter-guide"
      >
        Read the guide <span aria-hidden="true">→</span>
      </a>
    </section>

    <section class="starter-steps" aria-labelledby="next-steps-title">
      <h2 id="next-steps-title">Make it yours</h2>
      <ol>
        <li>
          <h3>Edit this page</h3>
          <p>
            Change the homepage in <code>apps/example-site-scaffolding/app/pages/index.vue</code>.
          </p>
        </li>
        <li>
          <h3>Create another site</h3>
          <p>Run these commands from the repo root:</p>
          <pre><code>pnpm new:web-app my-site
pnpm install</code></pre>
        </li>
        <li>
          <h3>Run both sites</h3>
          <p>Keep this site running and start the new one in another terminal:</p>
          <pre><code>pnpm app:dev my-site --port 3002</code></pre>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
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
