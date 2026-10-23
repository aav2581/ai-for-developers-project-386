<script setup lang="ts">
import AppFooter from './ui/AppFooter.vue'
import AppHeader from './ui/AppHeader.vue'
</script>

<template>
  <div class="min-h-screen bg-stone-950 text-stone-100 antialiased">
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-amber-400 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-stone-950"
    >
      К содержанию
    </a>
    <AppHeader />
    <RouterView />
    <AppFooter />
  </div>
</template>
