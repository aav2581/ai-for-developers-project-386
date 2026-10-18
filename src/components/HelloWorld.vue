<script setup lang="ts">
defineProps<{ msg: string }>()

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="hello">
    <p>{{ msg }}</p>
    <p>© {{ currentYear }}</p>
  </div>
</template>

<style scoped>
.hello {
  font-family: system-ui, sans-serif;
}
</style>
