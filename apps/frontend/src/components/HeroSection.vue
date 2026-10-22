<script setup lang="ts">
import { friend, hero } from '../data/landing'
import ActionLink from './ActionLink.vue'
</script>

<template>
  <section aria-labelledby="hero-title" class="relative overflow-hidden">
    <div
      class="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-amber-400/15 blur-3xl"
      aria-hidden="true"
    ></div>
    <div
      class="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-orange-500/10 blur-3xl"
      aria-hidden="true"
    ></div>

    <div
      class="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center"
    >
      <div>
        <p
          class="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-300"
        >
          <span class="icon-[tabler--beer] size-4" aria-hidden="true"></span>
          {{ hero.eyebrow }}
        </p>

        <h1 id="hero-title" class="mt-6 text-4xl font-black tracking-tight text-stone-50 sm:text-6xl">
          {{ hero.title }}
          <span class="block text-amber-300">{{ hero.accent }}</span>
        </h1>

        <p class="mt-6 max-w-xl text-lg leading-relaxed text-stone-300">{{ hero.lead }}</p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <ActionLink to="/book" size="lg">{{ hero.primaryCta }}</ActionLink>
          <ActionLink :to="{ name: 'book', query: { format: 'group' } }" variant="outline" size="lg">
            {{ hero.secondaryCta }}
          </ActionLink>
        </div>

        <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-400">
          <li v-for="fact in hero.quickFacts" :key="fact.label" class="flex items-center gap-2">
            <span :class="[fact.icon, 'size-4 text-amber-300']" aria-hidden="true"></span>
            {{ fact.label }}
          </li>
        </ul>
      </div>

      <aside class="rounded-3xl border border-stone-800 bg-stone-900/70 p-6 sm:p-8">
        <p class="text-sm font-medium text-stone-400">Час с {{ friend.name }} — это</p>
        <ul class="mt-5 space-y-4">
          <li v-for="item in hero.included" :key="item" class="flex gap-3">
            <span
              class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-300"
            >
              <span class="icon-[tabler--check] size-4" aria-hidden="true"></span>
            </span>
            <span class="text-sm leading-relaxed text-stone-200">{{ item }}</span>
          </li>
        </ul>
        <p class="mt-8 border-t border-stone-800 pt-5 text-sm text-stone-500">
          {{ friend.role }}. Пиво — декорация, разговор — главное.
        </p>
      </aside>
    </div>
  </section>
</template>
