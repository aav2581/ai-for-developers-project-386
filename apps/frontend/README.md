# Frontend

Vue 3 + Vite на Feature-Sliced Design.

## Слои

Сверху вниз: `app → pages → widgets → features → entities → shared`. Импорт разрешён только вниз (или внутри своего слоя через публичный API слайса).

| Слой | Что лежит |
| --- | --- |
| `app` | точка входа, роутер, глобальные стили, `App.vue` |
| `pages` | экраны: `home`, `booking` |
| `widgets` | самостоятельные блоки страниц: шапка, подвал, hero, форматы, FAQ |
| `features` | действия гостя: `choose-format` — карточка формата с переходом в запись |
| `entities` | доменные сущности: `format`, `friend`, `venue` |
| `shared` | UI-кит (`ui`), конфиг приложения (`config`), без бизнес-логики |

## Правила

- У каждого слайса есть `index.ts` — публичный API. Импорт из другого слоя только через него: `@/entities/format`, а не `@/entities/format/model/formats`.
- Слайсы одного слоя не импортируют друг друга (кроме `shared`, где сегменты независимы).
- Внутри слайса — сегменты `ui`, `model`, `api`, `lib`, `config` по необходимости.
- Тексты и данные — в `model` того слайса, который их показывает. Общие вещи — в `shared/config` или в `entities`.
- Тесты — рядом с кодом в `__tests__`; один тест: `npx vitest run --root apps/frontend src/pages/home/ui/__tests__/HomePage.spec.ts`.
- Границы слоёв проверяет `src/__tests__/architecture.spec.ts` — он падает при импорте вверх или глубоком импорте через `@/`.

## Новый экран

1. `pages/<name>/ui/<Name>Page.vue` + `pages/<name>/index.ts`.
2. Маршрут в `app/router/index.ts`.
3. Если нужен новый блок — `widgets/<name>/{ui,model}` с публичным API.
4. Если нужно действие — `features/<name>`, данные — `entities/<name>`.
