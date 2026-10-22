<script setup lang="ts">
import { brand, cta, navLinks } from '@/shared/config'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-stone-800/70">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p class="flex items-center gap-2 font-semibold text-stone-100">
          <span class="icon-[tabler--beer] size-4 text-amber-300" aria-hidden="true"></span>
          {{ brand.name }}
        </p>
        <p class="mt-1 text-sm text-stone-500">{{ brand.tagline }} · {{ brand.city }}</p>
      </div>

      <nav aria-label="Навигация в подвале" class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-400">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {{ link.label }}
        </RouterLink>
        <RouterLink
          to="/book"
          class="transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {{ cta.book }}
        </RouterLink>
      </nav>

      <p class="text-sm text-stone-500">© {{ currentYear }} {{ brand.name }}</p>
    </div>
  </footer>
</template>
