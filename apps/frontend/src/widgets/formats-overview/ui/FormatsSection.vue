<script setup lang="ts">
import { formats } from '@/entities/format'
import { FormatCard } from '@/features/choose-format'
import { SectionHeading } from '@/shared/ui'
import { heading } from '../model/content'
</script>

<template>
  <section id="formats" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading :eyebrow="heading.eyebrow" :title="heading.title" :lead="heading.lead" />

      <ul class="mt-10 grid gap-4 md:grid-cols-3">
        <li v-for="format in formats" :key="format.id">
          <FormatCard :format="format" />
        </li>
      </ul>
    </div>
  </section>
</template>
