<script setup lang="ts">
withDefaults(defineProps<{ eyebrow: string; title: string; lead?: string }>(), { lead: '' })
</script>

<template>
  <div class="max-w-2xl">
    <p class="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
      <span class="h-px w-6 bg-amber-300/60" aria-hidden="true"></span>
      {{ eyebrow }}
    </p>
    <h2 class="text-3xl font-bold tracking-tight text-stone-50 sm:text-4xl">{{ title }}</h2>
    <p v-if="lead" class="mt-4 text-base leading-relaxed text-stone-400">{{ lead }}</p>
  </div>
</template>
