<script setup lang="ts">
import FeatureCard from '../FeatureCard.vue'
import SectionHeading from '../SectionHeading.vue'
import { howItWorks } from '../../model/content'
</script>

<template>
  <section id="how" class="border-t border-stone-800/70 py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <SectionHeading
        :eyebrow="howItWorks.heading.eyebrow"
        :title="howItWorks.heading.title"
        :lead="howItWorks.heading.lead"
      />

      <ol class="mt-10 grid gap-4 md:grid-cols-3">
        <li v-for="(step, index) in howItWorks.steps" :key="step.title">
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
