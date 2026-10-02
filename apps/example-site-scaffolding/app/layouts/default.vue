<template>
  <div class="starter-shell">
    <header class="starter-header starter-container">
      <NuxtLink to="/" class="starter-brand">Nuxt starter</NuxtLink>
      <a href="https://github.com/proeugene/nuxt-multi-app-starter" class="starter-source">
        View on GitHub <span aria-hidden="true">↗</span>
      </a>
    </header>

    <main class="starter-main starter-container">
      <slot />
    </main>

    <footer class="starter-footer starter-container">
      <p>Built by <a href="https://eugene.digital">Eugene Prokudin</a></p>
      <a href="https://github.com/proeugene/nuxt-multi-app-starter/blob/main/LICENSE">
        MIT licensed
      </a>
    </footer>
  </div>
</template>
