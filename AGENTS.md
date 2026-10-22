# AGENTS.md

## Команды

Корневые скрипты делегируют в пакеты через Turborepo; одного пакета — `npm test -w apps/backend` и т.п.
Один тест: `npx vitest run --root apps/frontend src/pages/home/ui/__tests__/HomePage.spec.ts`.
`npm run dev` поднимает vite (:5173, проксирует `/api` → :3000) и fastify (:3000) параллельно; у backend нет build-скрипта.

## Структура

- `apps/frontend` — Vue 3 + Vite 8 на FSD (`app → pages → widgets → features → entities → shared`), у слайсов публичный API через `index.ts`; тесты рядом с кодом в `src/**/__tests__/`, границы слоёв проверяет `src/__tests__/architecture.spec.ts`.
- `apps/backend` — Fastify 5 на tsx, без шага сборки: `src/app.ts` экспортирует `buildApp()` (для тестов через `app.inject()`), `src/server.ts` только слушает порт. Пока только `GET /health`.

## Хуки и коммиты

- Формат сообщений — в `CONTRIBUTING.md` (Conventional Commits на русском); проверяет commitlint в хуке `commit-msg`.
- `pre-commit` — lint-staged (`lint-staged.config.js`): oxlint + typecheck по staged-файлам. Typecheck-задачи там намеренно объявлены функциями: lint-staged дописывает пути в команду, а `tsc -p` явные файлы не принимает. Не заменять их строками.
- `pre-push` — полная проверка (`lint → typecheck → test → build`); пропустить: `git push --no-verify`.

## Релизы

- Релизы ведёт release-please (`.github/workflows/release-please.yml`, запуск на push в `main`). `main` защищена: только PR, прямые push запрещены.
- release-please не пишет `CHANGELOG.md` в `main` напрямую. Он открывает Release PR (`chore: release main`), внутри которого `CHANGELOG.md`, бамп версии в `package.json` и правка `.release-please-manifest.json`. Пока этот PR не смержен, файла в `main` нет.
- В changelog попадают только `feat`/`feature`, `fix`, `perf`, `revert`. Типы `docs`, `chore`, `ci`, `build`, `style`, `refactor`, `test` скрыты по умолчанию, а коммиты вне Conventional Commits release-please молча отбрасывает.
- Если с прошлого релиза набрались только скрытые типы, release-please логирует `No user facing commits found since beginning of time - skipping` и не открывает Release PR. Это норма, а не поломка: ждать `feat`/`fix` (или любого коммита с `!`/`BREAKING CHANGE` — он виден всегда).

## Ограничения и особенности

- `.github/workflows/hexlet-check.yml` сгенерирован Хекслетом — не удалять и не редактировать.
- Не переносить `release-please-config.json` и `.release-please-manifest.json` из корня — их читает workflow.
- `.release-please-manifest.json` содержит `".": "0.0.0"` — это трактуется как «релизов не было». Первая версия берётся не от `0.1.0` из `package.json`, а из `initialReleaseVersion()` (`strategies/base.ts`, стратегия `node` её не переопределяет) — то есть сразу **`1.0.0`**, причём независимо от типа коммита. Если нужен бамп от текущей версии, вписать `0.1.0` в манифест до первого релиза.
- В настройках репозитория выключено «Allow GitHub Actions to create and approve pull requests» (`can_approve_pull_request_reviews: false`), поэтому release-please не сможет открыть первый Release PR — символ ошибки «GitHub Actions is not permitted to create or approve pull requests». `permissions: pull-requests: write` в workflow этого не обходит. Включается в Settings → Actions → General → Workflow permissions.
- Node >=24 обязателен: `devEngines.onFail: "error"` в корневом `package.json` блокирует `npm install`/`npm ci` на старее версии (падает с `EBADDEVENGINES`); нужная версия — в `.nvmrc`.
- `apps/frontend/src/app/styles/main.css` подключает FlyonUI через относительный путь `../../../../../node_modules/flyonui/...`: bare-спецификаторы не резолвятся и молча дают CSS без стилей JS-компонентов. После любых перемещений проверять размер CSS-бандла: ~89 КБ (ок) против ~23 КБ (импорт потерялся).
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
