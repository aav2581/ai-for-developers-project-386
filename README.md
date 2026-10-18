# Календарь звонков


[![hexlet-check](https://github.com/aav2581/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/aav2581/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- [TypeScript](https://www.typescriptlang.org/)
- [Vue 3](https://vuejs.org/)
- [Vite 8](https://vite.dev/) — сборка на [Rolldown](https://rolldown.rs/), транспиляция через [oxc](https://oxc.rs/)
- [Tailwind CSS 4](https://tailwindcss.com/) — утилитарные стили
- [FlyonUI](https://flyonui.com/) — UI-компоненты на Tailwind
- [Tabler Icons](https://icon-sets.iconify.design/tabler/) через [Iconify](https://iconify.design/) — иконки
- [Vitest](https://vitest.dev/) — тесты
- [oxlint](https://oxc.rs/docs/guide/usage/linter) — линтинг

## Установка

```bash
git clone https://github.com/aav2581/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm install
```

## Использование

```bash
npm run dev        # dev-сервер
npm run build      # production-сборка
npm run preview    # предпросмотр production-сборки
npm test           # прогон тестов
npm run test:watch # тесты в watch-режиме
npm run lint       # линтинг (oxlint)
npm run typecheck  # проверка типов (vue-tsc)
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
