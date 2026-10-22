<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    to: RouteLocationRaw
    variant?: 'primary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { variant: 'primary', size: 'md' },
)

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300'

const variants = {
  primary: 'bg-amber-400 text-stone-950 hover:bg-amber-300',
  outline: 'border border-stone-700 text-stone-100 hover:border-amber-300/60 hover:text-amber-200',
  ghost: 'text-stone-300 hover:text-amber-200',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}
</script>

<template>
  <RouterLink :to="to" :class="[base, variants[variant], sizes[size]]">
    <slot />
  </RouterLink>
</template>
