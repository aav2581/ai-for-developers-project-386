<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { findFormat, formats } from '@/entities/format'
import { ActionLink } from '@/shared/ui'
import { booking } from '../model/content'

const route = useRoute()
const selectedFormat = computed(() => findFormat(route.query.format))
</script>

<template>
  <main id="content" class="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm text-stone-400 transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
    >
      <span class="icon-[tabler--arrow-left] size-4" aria-hidden="true"></span>
      {{ booking.backHome }}
    </RouterLink>

    <p class="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
      {{ booking.eyebrow }}
    </p>
    <h1 class="mt-3 text-4xl font-black tracking-tight text-stone-50 sm:text-5xl">
      {{ booking.title }}
    </h1>
    <p class="mt-4 max-w-xl text-base leading-relaxed text-stone-400">{{ booking.lead }}</p>

    <div v-if="selectedFormat" class="mt-10 rounded-3xl border border-stone-800 bg-stone-900/70 p-6 sm:p-8">
      <div class="flex items-start gap-4">
        <span class="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
          <span :class="[selectedFormat.icon, 'size-6']" aria-hidden="true"></span>
        </span>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            {{ booking.selectedFormat }}
          </p>
          <h2 class="mt-1 text-2xl font-bold text-stone-50">{{ selectedFormat.title }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ selectedFormat.summary }}</p>
        </div>
      </div>

      <ul class="mt-6 grid gap-2 sm:grid-cols-2">
        <li
          v-for="detail in selectedFormat.details"
          :key="detail"
          class="flex items-start gap-2 text-sm text-stone-300"
        >
          <span class="icon-[tabler--check] mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true"></span>
          {{ detail }}
        </li>
      </ul>

      <div class="mt-8 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
        <p class="text-sm leading-relaxed text-amber-100">{{ booking.stubNote }}</p>
      </div>

      <div class="mt-8">
        <h3 class="text-sm font-semibold uppercase tracking-[0.18em] text-stone-400">
          {{ booking.nextStepsTitle }}
        </h3>
        <ol class="mt-3 space-y-2">
          <li
            v-for="(step, index) in booking.nextSteps"
            :key="step"
            class="flex items-center gap-3 text-sm text-stone-300"
          >
            <span class="grid size-6 place-items-center rounded-full bg-stone-800 text-xs text-stone-400">
              {{ index + 1 }}
            </span>
            {{ step }}
          </li>
        </ol>
      </div>

      <div class="mt-8">
        <ActionLink to="/book" variant="outline" size="sm">{{ booking.chooseAnother }}</ActionLink>
      </div>
    </div>

    <div v-else class="mt-10">
      <h2 class="text-2xl font-bold text-stone-50">{{ booking.chooseFormat }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ booking.chooseFormatLead }}</p>

      <ul class="mt-6 grid gap-3 sm:grid-cols-3">
        <li v-for="format in formats" :key="format.id">
          <ActionLink
            :to="{ name: 'book', query: { format: format.id } }"
            variant="outline"
            class="w-full"
          >
            <span :class="[format.icon, 'size-4']" aria-hidden="true"></span>
            {{ format.title }}
          </ActionLink>
        </li>
      </ul>
    </div>
  </main>
</template>
