# Календарь звонков


[![hexlet-check](https://github.com/aav2581/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/aav2581/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- [TypeScript](https://www.typescriptlang.org/)
- [Monorepo](https://docs.npmjs.com/cli/using-npm/workspaces): npm workspaces + [Turborepo](https://turborepo.com/)
- Frontend: [Vue 3](https://vuejs.org/), [Vite 8](https://vite.dev/) — сборка на [Rolldown](https://rolldown.rs/), транспиляция через [oxc](https://oxc.rs/), [Tailwind CSS 4](https://tailwindcss.com/), [FlyonUI](https://flyonui.com/), [Tabler Icons](https://icon-sets.iconify.design/tabler/) через [Iconify](https://iconify.design/)
- Backend: [Fastify 5](https://fastify.dev/)
- [Vitest](https://vitest.dev/) — тесты
- [oxlint](https://oxc.rs/docs/guide/usage/linter) — линтинг

## Структура

```
apps/
  frontend/   # Vue 3 + Vite (UI)
  backend/    # Fastify (API)
```

## Установка

Требуется Node.js 24+ (см. `.nvmrc`; при использовании nvm — `nvm use`). Версии зависимостей закреплены точно в `package.json` — воспроизводимая установка через `npm ci`.

```bash
git clone https://github.com/aav2581/ai-for-developers-project-386.git
cd ai-for-developers-project-386
npm ci
```

## Использование

```bash
npm run dev        # dev-серверы фронтенда и бэкенда (Turborepo)
npm run build      # production-сборка всех пакетов
npm run preview    # предпросмотр production-сборки
npm test           # прогон тестов
npm run test:watch # тесты в watch-режиме
npm run lint       # линтинг (oxlint)
npm run typecheck  # проверка типов (vue-tsc / tsc)
```

Команды можно запускать для одного пакета: `npm run dev -w apps/backend`, `npm test -w apps/frontend` и т.д.

Бэкенд слушает `http://localhost:3000` (`GET /health`), дев-сервер фронтенда проксирует `/api` на бэкенд.

## Участие в разработке

Коммиты оформляются по [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/), формат описан в [CONTRIBUTING.md](./CONTRIBUTING.md). Код проверяется хуками Husky: lint и типы перед коммитом, формат сообщения, полная сборка и тесты перед пушем.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
