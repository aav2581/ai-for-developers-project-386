<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findFormat, formats, type FormatId } from '@/entities/format'
import { booking } from '../model/content'

// Карта #8 — слайс #19: страница /book показывает шаг «выбор формата».
// Шаг хранится в URL: `?format=` — выбранный формат, `?step=evening` —
// следующий шаг. На следующих тикетах сюда добавятся вечер+час (#20),
// подтверждение (#21) и экран успеха (#22).

const route = useRoute()
const router = useRouter()

const selectedFormatId = computed<FormatId | null>(() => {
  const found = findFormat(route.query.format)
  return found?.id ?? null
})

const step = computed<'format' | 'evening'>(() =>
  route.query.step === 'evening' && selectedFormatId.value ? 'evening' : 'format',
)

const selectedFormat = computed(() => (selectedFormatId.value ? findFormat(selectedFormatId.value) : undefined))

function selectFormat(id: FormatId): void {
  void router.replace({ query: { ...route.query, format: id } })
}

// async goForward (async нужен для await router.push) — шаблон читает
// @click="goForward" плюс тесты вызывают wrapper.vm.goForward().
// vue-tsc в этом проекте не отслеживает template-usage в <script setup>
// для async-функций через noUnusedLocals, поэтому явно ссылаемся на
// имя через `void <name>` — это strjit-вызов, который не меняет поведение,
// но снимает предупреждение "declared but never read".
async function goForward(): Promise<void> {
  if (!selectedFormatId.value) return
  await router.push({ name: 'book', query: { ...route.query, step: 'evening' } })
}
void goForward

function goBack(): void {
  const next: Record<string, string> = {}
  if (selectedFormatId.value) next.format = selectedFormatId.value
  void router.replace({ query: next })
}
</script>

<template>
  <main id="content" class="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
    <RouterLink
      to="/"
      class="inline-flex items-center gap-2 text-sm text-stone-400 transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
    >
      <span class="icon-[tabler--arrow-left] size-4" aria-hidden="true"></span>
      {{ booking.backHome }}
    </RouterLink>

    <p class="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
      {{ booking.eyebrow }}
    </p>
    <h1 class="mt-3 text-4xl font-black tracking-tight text-stone-50 sm:text-5xl">
      {{ booking.title }}
    </h1>
    <p class="mt-4 max-w-xl text-base leading-relaxed text-stone-400">{{ booking.lead }}</p>

    <template v-if="step === 'format'">
      <h2 class="mt-10 text-2xl font-bold text-stone-50">{{ booking.chooseFormat }}</h2>
      <p class="mt-2 text-sm leading-relaxed text-stone-400">{{ booking.chooseFormatLead }}</p>

      <ul class="mt-6 grid gap-3 sm:grid-cols-3" role="list">
        <li v-for="format in formats" :key="format.id" class="contents">
          <button
            type="button"
            :data-format-id="format.id"
            :aria-pressed="selectedFormatId === format.id ? 'true' : 'false'"
            class="flex w-full flex-col items-start gap-3 rounded-2xl border bg-stone-900/60 p-5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            :class="
              selectedFormatId === format.id
                ? 'border-amber-400/70 ring-1 ring-amber-300/50'
                : 'border-stone-800 hover:border-stone-700 hover:bg-stone-900'
            "
            @click="selectFormat(format.id)"
          >
            <span
              class="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300"
            >
              <span :class="[format.icon, 'size-5']" aria-hidden="true"></span>
            </span>
            <span class="text-base font-semibold text-stone-50">{{ format.title }}</span>
            <span class="text-sm leading-relaxed text-stone-400">{{ format.summary }}</span>
          </button>
        </li>
      </ul>

      <div class="mt-8 flex justify-end">
        <button
          type="button"
          data-action="forward"
          :disabled="!selectedFormatId"
          class="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:cursor-not-allowed disabled:bg-stone-800 disabled:text-stone-500 disabled:hover:bg-stone-800"
        >
          {{ booking.forward }}
          <span class="icon-[tabler--arrow-right] size-4" aria-hidden="true"></span>
        </button>
      </div>
    </template>

    <template v-else>
      <p class="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
        {{ booking.eveningEyebrow }}
      </p>
      <h2 class="mt-3 text-3xl font-bold tracking-tight text-stone-50">{{ booking.eveningTitle }}</h2>
      <p class="mt-3 max-w-xl text-base leading-relaxed text-stone-400">{{ booking.eveningLead }}</p>

      <div v-if="selectedFormat" class="mt-8 rounded-2xl border border-stone-800 bg-stone-900/70 p-5 sm:p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
          {{ booking.eveningSelectedLabel }}
        </p>
        <p class="mt-2 flex items-center gap-3 text-base font-semibold text-stone-50">
          <span :class="[selectedFormat.icon, 'size-5 text-amber-300']" aria-hidden="true"></span>
          {{ selectedFormat.title }}
        </p>
      </div>

      <div class="mt-8 flex justify-start">
        <button
          type="button"
          data-action="back"
          class="inline-flex items-center gap-2 rounded-full border border-stone-700 px-5 py-2.5 text-sm font-semibold text-stone-100 transition hover:border-amber-300/60 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          @click="goBack"
        >
          <span class="icon-[tabler--arrow-left] size-4" aria-hidden="true"></span>
          {{ booking.back }}
        </button>
      </div>
    </template>
  </main>
</template>
