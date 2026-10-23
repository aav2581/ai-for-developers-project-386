# Conventional Commits

Коммиты в проекте оформляются по формату [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/).

## Формат

```
тип(скоуп): описание
```

- тип и описание разделяются двоеточием и пробелом: `feat: ...`, `fix(app): ...`
- тип — одно из разрешённых слов (ниже), по-английски
- описание — по-русски, в повелительном наклонении («добавить», а не «добавил»)
- заголовок — не длиннее 100 символов
- заголовок не начинается с заглавной буквы и не заканчивается точкой
- скоуп необязателен; для изменений в конкретном пакете используйте `frontend` или `backend`

## Типы

| Тип | Когда использовать |
|---|---|
| `feat` | новая фича |
| `fix` | исправление бага |
| `docs` | только документация |
| `style` | форматирование, без изменения логики |
| `refactor` | рефакторинг без фикса и фичи |
| `perf` | улучшение производительности |
| `test` | тесты |
| `build` | сборка, зависимости |
| `ci` | CI-конфиги и хуки |
| `chore` | прочее без вышеперечисленного |
| `revert` | откат коммита |

## Примеры

```text
feat: добавить форму создания звонка
fix(calendar): исправить отображение часового пояса
docs: описать установку в README
chore: подключить husky и commitlint
```

## Структура проекта

Монорепка на npm workspaces + Turborepo:

```
apps/
  frontend/   # Vue 3 + Vite (UI)
  backend/    # Fastify (API)
```

Общие инструменты (husky, commitlint, oxlint, typescript, turbo) лежат в корневом `package.json`. Запуск `npm run <script>` в корне делегирует задачу во все пакеты через Turborepo; для одного пакета — `npm run <script> -w apps/<пакет>`.

Версии зависимостей закреплены в `package.json` без диапазонов (только проверенные версии), воспроизводимая установка — `npm ci`. Обновление зависимости: `npm install <пакет>@<версия> -w apps/<пакет> --save-exact`, затем прогон проверок и коммит `package.json` + `package-lock.json` вместе.

## Контракт и codegen

API живёт в одном месте — `api/contract.tsp`. Из этого TypeSpec-контракта генерируются `api/openapi.yaml`, json-схемы в `apps/backend/src/generated/` и клиентский SDK в `apps/frontend/src/shared/api/sdk/`. Эти файлы — артефакты эмиттеров; руками их править нельзя, дрифт ловит `npm run codegen:drift` (локально).

Порядок изменения API:

1. Поправить `api/contract.tsp` (и, если меняется поведение, `docs/spec.md` + issue #7).
2. Прогнать `npm run codegen` — обновятся OpenAPI, json-схемы и SDK.
3. Проверить `git diff` по `api/openapi.yaml`, `apps/backend/src/generated/` и `apps/frontend/src/shared/api/sdk/`. Зафиксировать артефакты в том же PR, что и изменение `contract.tsp`.
4. После `codegen` править обработчики и страницы в `apps/backend/src/server/` и `apps/frontend/src/pages/`.

Сами артефакты в коммитах смотрятся как обычные `feat`/`fix` — не выделяйте их отдельным префиксом.

## Проверка

Сообщения и код проверяются автоматически хуками Husky:

- `pre-commit` — lint-staged: `oxlint` и typecheck (`vue-tsc` для frontend, `tsc` для backend) по изменённым файлам
- `commit-msg` — commitlint: формат сообщения коммита
- `pre-push` — полная проверка: `npm run lint && npm run typecheck && npm test && npm run build`

Хук `pre-push` можно пропустить при необходимости: `git push --no-verify`.

## CI и merge в main

Ветка `main` защищена на уровне GitHub: править её можно только через pull request, прямые push запрещены (локальный `--no-verify` защищённую ветку не обходит). Перед мержем должны пройти все проверки CI (`.github/workflows/ci.yml`):

| Джоба | Команда |
|---|---|
| `lint` | `npm run lint` |
| `typecheck` | `npm run typecheck` |
| `test` | `npm test` |
| `build` | `npm run build`, стартует после трёх проверок выше |

CI запускается на pull request в `main`, на push в `main` и вручную через `workflow_dispatch`. Мерж выполняется вручную кнопкой в веб-интерфейсе GitHub после зелёного CI.
