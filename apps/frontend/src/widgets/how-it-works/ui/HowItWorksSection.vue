<script setup lang="ts">
import { FeatureCard, SectionHeading } from '@/shared/ui'
import { heading, steps } from '../model/content'
</script>

<template>
  <section id="how" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading :eyebrow="heading.eyebrow" :title="heading.title" :lead="heading.lead" />

      <ol class="mt-10 grid gap-4 md:grid-cols-3">
        <li v-for="(step, index) in steps" :key="step.title">
          <FeatureCard
            :icon="step.icon"
            :title="step.title"
            :text="step.text"
            :index="`0${index + 1}`"
          />
        </li>
      </ol>
    </div>
  </section>
</template>
