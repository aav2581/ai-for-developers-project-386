<script setup lang="ts">
import { FeatureCard, SectionHeading } from '@/shared/ui'
import { heading, promises } from '../model/content'
</script>

<template>
  <section id="promises" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading :eyebrow="heading.eyebrow" :title="heading.title" :lead="heading.lead" />

      <ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="promise in promises" :key="promise.title">
          <FeatureCard :icon="promise.icon" :title="promise.title" :text="promise.text" />
        </li>
      </ul>
    </div>
  </section>
</template>
