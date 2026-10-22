<script setup lang="ts">
import { promises } from '../data/landing'
import SectionHeading from './SectionHeading.vue'
</script>

<template>
  <section id="promises" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Без мелкого шрифта"
        title="Что обещаю"
        lead="Час — это не терапия и не коучинг. Но и не просто «посидеть рядом»."
      />

      <ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="promise in promises"
          :key="promise.title"
          class="rounded-3xl border border-stone-800 bg-stone-900/60 p-6"
        >
          <span class="grid size-11 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
            <span :class="[promise.icon, 'size-5']" aria-hidden="true"></span>
          </span>
          <h3 class="mt-5 text-lg font-semibold text-stone-50">{{ promise.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ promise.text }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>
