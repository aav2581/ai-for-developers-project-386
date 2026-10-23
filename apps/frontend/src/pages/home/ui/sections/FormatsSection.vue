<script setup lang="ts">
import { formats } from '@/entities/format'
import FormatCard from '../FormatCard.vue'
import SectionHeading from '../SectionHeading.vue'
import { formatsOverview } from '../../model/content'
</script>

<template>
  <section id="formats" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        :eyebrow="formatsOverview.heading.eyebrow"
        :title="formatsOverview.heading.title"
        :lead="formatsOverview.heading.lead"
      />

      <ul class="mt-10 grid gap-4 md:grid-cols-3">
        <li v-for="format in formats" :key="format.id">
          <FormatCard :format="format" />
        </li>
      </ul>
    </div>
  </section>
</template>
