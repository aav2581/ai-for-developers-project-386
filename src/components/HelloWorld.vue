<script setup lang="ts">
defineProps<{ msg: string }>()

const currentYear = new Date().getFullYear()
</script>

<template>
  <div class="card bg-base-100 shadow-md">
    <div class="card-body items-center text-center gap-3">
      <span class="icon-[tabler--calendar] size-10 text-primary"></span>
      <p class="text-lg font-medium">{{ msg }}</p>
      <button type="button" class="btn btn-primary btn-sm">Начать</button>
      <p class="text-sm text-base-content/60">© {{ currentYear }}</p>
    </div>
  </div>
</template>
