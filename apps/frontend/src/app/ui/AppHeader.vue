<script setup lang="ts">
import { brand, cta, navLinks } from '@/shared/config'
import { ActionLink } from '@/shared/ui'
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <RouterLink to="/" class="flex items-center gap-2.5 text-stone-50">
        <span class="grid size-9 place-items-center rounded-full bg-amber-400 text-stone-950">
          <span class="icon-[tabler--beer] size-5" aria-hidden="true"></span>
        </span>
        <span class="font-semibold tracking-tight">{{ brand.name }}</span>
      </RouterLink>

      <nav aria-label="Основная навигация" class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-full px-3 py-2 text-sm text-stone-300 transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <ActionLink to="/book" size="sm">{{ cta.book }}</ActionLink>
    </div>
  </header>
</template>
