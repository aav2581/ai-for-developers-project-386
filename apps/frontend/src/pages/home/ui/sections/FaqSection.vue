<script setup lang="ts">
import SectionHeading from '../SectionHeading.vue'
import { faq } from '../../model/content'
</script>

<template>
  <section id="faq" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        :eyebrow="faq.heading.eyebrow"
        :title="faq.heading.title"
        :lead="faq.heading.lead"
      />

      <div class="mt-10 divide-y divide-stone-800 rounded-3xl border border-stone-800 bg-stone-900/60 px-5 sm:px-6">
        <details
          v-for="(item, index) in faq.items"
          :key="item.question"
          class="group"
          :open="index === 0"
        >
          <summary
            class="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium text-stone-100 marker:content-none"
          >
            {{ item.question }}
            <span
              class="icon-[tabler--chevron-down] size-5 shrink-0 text-amber-300 transition-transform group-open:rotate-180"
              aria-hidden="true"
            ></span>
          </summary>
          <p class="pb-5 text-sm leading-relaxed text-stone-400">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
