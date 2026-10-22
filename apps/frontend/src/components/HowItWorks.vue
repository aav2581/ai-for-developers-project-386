<script setup lang="ts">
import { steps } from '../data/landing'
import SectionHeading from './SectionHeading.vue'
</script>

<template>
  <section id="how" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Как это работает"
        title="Три шага до нормального вечера"
        lead="Никаких анкет и созвонов с менеджером. Только ты, Ванёк и час."
      />

      <ol class="mt-10 grid gap-4 md:grid-cols-3">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="rounded-3xl border border-stone-800 bg-stone-900/60 p-6"
        >
          <div class="flex items-center justify-between">
            <span class="grid size-11 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
              <span :class="[step.icon, 'size-5']" aria-hidden="true"></span>
            </span>
            <span class="text-sm font-semibold text-stone-500">0{{ index + 1 }}</span>
          </div>
          <h3 class="mt-5 text-lg font-semibold text-stone-50">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ step.text }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
