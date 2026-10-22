<script setup lang="ts">
import type { Feature } from './types'

withDefaults(defineProps<Feature & { index?: string }>(), {
  index: '',
})
</script>

<template>
  <div class="rounded-3xl border border-stone-800 bg-stone-900/60 p-6">
    <div class="flex items-center justify-between">
      <span class="grid size-11 place-items-center rounded-2xl bg-amber-400/15 text-amber-300">
        <span :class="[icon, 'size-5']" aria-hidden="true"></span>
      </span>
      <span v-if="index" class="text-sm font-semibold text-stone-500">{{ index }}</span>
    </div>
    <h3 class="mt-5 text-lg font-semibold text-stone-50">{{ title }}</h3>
    <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ text }}</p>
  </div>
</template>
