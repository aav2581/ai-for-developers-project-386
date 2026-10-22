<script setup lang="ts">
import { safety } from '../model/content'
</script>

<template>
  <section id="safety" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <p class="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          <span class="h-px w-6 bg-amber-300/60" aria-hidden="true"></span>
          {{ safety.eyebrow }}
        </p>
        <h2 class="text-3xl font-bold tracking-tight text-stone-50 sm:text-4xl">
          {{ safety.title }}
        </h2>
        <p class="mt-4 max-w-lg text-base leading-relaxed text-stone-400">{{ safety.text }}</p>
      </div>

      <ul class="space-y-4 rounded-3xl border border-stone-800 bg-stone-900/60 p-6 sm:p-8">
        <li v-for="point in safety.points" :key="point" class="flex gap-3">
          <span
            class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-300"
          >
            <span class="icon-[tabler--shield-check] size-4" aria-hidden="true"></span>
          </span>
          <span class="text-sm leading-relaxed text-stone-200">{{ point }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
