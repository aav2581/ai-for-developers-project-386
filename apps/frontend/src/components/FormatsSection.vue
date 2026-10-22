<script setup lang="ts">
import { formats } from '../data/landing'
import ActionLink from './ActionLink.vue'
import SectionHeading from './SectionHeading.vue'
</script>

<template>
  <section id="formats" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Форматы"
        title="Три способа не пить в одиночестве"
        lead="Выбери, как удобнее: с дивана, в баре или в компании незнакомцев."
      />

      <ul class="mt-10 grid gap-4 md:grid-cols-3">
        <li
          v-for="format in formats"
          :key="format.id"
          class="flex flex-col rounded-3xl border border-stone-800 bg-stone-900/60 p-6 transition hover:border-amber-300/40"
        >
          <span class="grid size-11 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
            <span :class="[format.icon, 'size-5']" aria-hidden="true"></span>
          </span>
          <h3 class="mt-5 text-lg font-semibold text-stone-50">{{ format.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ format.summary }}</p>

          <ul class="mt-5 space-y-2">
            <li
              v-for="detail in format.details"
              :key="detail"
              class="flex items-start gap-2 text-sm text-stone-400"
            >
              <span class="icon-[tabler--check] mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden="true"></span>
              {{ detail }}
            </li>
          </ul>

          <div class="mt-auto pt-6">
            <ActionLink
              :to="{ name: 'book', query: { format: format.id } }"
              variant="outline"
              size="sm"
              class="w-full"
            >
              Выбрать
            </ActionLink>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
