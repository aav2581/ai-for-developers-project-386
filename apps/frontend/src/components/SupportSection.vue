<script setup lang="ts">
import { support } from '../data/landing'
</script>

<template>
  <section id="support" class="py-16 sm:py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div class="rounded-3xl border border-amber-400/25 bg-amber-400/10 p-8 sm:p-10">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          {{ support.eyebrow }}
        </p>
        <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-50">{{ support.title }}</h2>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-amber-100/80">{{ support.text }}</p>
      </div>
    </div>
  </section>
</template>
