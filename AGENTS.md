# AGENTS.md

## Команды

Корневые скрипты делегируют в пакеты через Turborepo; одного пакета — `npm test -w apps/backend` и т.п.
Один тест: `npx vitest run --root apps/frontend src/components/__tests__/HelloWorld.spec.ts`.
`npm run dev` поднимает vite (:5173, проксирует `/api` → :3000) и fastify (:3000) параллельно; у backend нет build-скрипта.

## Структура

- `apps/frontend` — Vue 3 + Vite 8, тесты рядом с кодом в `src/**/__tests__/`, Vitest настроен в `vite.config.ts`.
- `apps/backend` — Fastify 5 на tsx, без шага сборки: `src/app.ts` экспортирует `buildApp()` (для тестов через `app.inject()`), `src/server.ts` только слушает порт. Пока только `GET /health`.

## Хуки и коммиты

- Формат сообщений — в `CONTRIBUTING.md` (Conventional Commits на русском); проверяет commitlint в хуке `commit-msg`.
- `pre-commit` — lint-staged (`lint-staged.config.js`): oxlint + typecheck по staged-файлам. Typecheck-задачи там намеренно объявлены функциями: lint-staged дописывает пути в команду, а `tsc -p` явные файлы не принимает. Не заменять их строками.
- `pre-push` — полная проверка (`lint → typecheck → test → build`); пропустить: `git push --no-verify`.

## Ограничения и особенности

- `.github/workflows/hexlet-check.yml` сгенерирован Хекслетом — не удалять и не редактировать.
- Не переносить `release-please-config.json` и `.release-please-manifest.json` из корня — их читает workflow.
- Node >=24 обязателен: `devEngines.onFail: "error"` в корневом `package.json` блокирует `npm install`/`npm ci` на старее версии (падает с `EBADDEVENGINES`); нужная версия — в `.nvmrc`.
- `apps/frontend/src/style/main.css` подключает FlyonUI через относительный путь `../../../../node_modules/flyonui/...`: bare-спецификаторы не резолвятся и молча дают CSS без стилей JS-компонентов. После любых перемещений проверять размер CSS-бандла: ~89 КБ (ок) против ~23 КБ (импорт потерялся).
- Backend в режиме NodeNext — относительные импорты с расширением `.js`.
- Корневой `dist/` — остаток сборки до монорепки, можно удалить.
- Стек-версии не поднимать без согласования.

## Agent skills

### Issue tracker

Issues живут в GitHub Issues этого репо; все операции через `gh` CLI. См. `docs/agents/issue-tracker.md`.

### Triage labels

Пять дефолтных канонических лейблов: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `GLOSSARY-MAP.md` в корне + по `GLOSSARY.md` и `docs/adr/` на каждый пакет в `apps/*`. См. `docs/agents/domain.md`.
