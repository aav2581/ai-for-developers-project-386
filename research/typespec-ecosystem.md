# Исследование: стек TypeSpec + OpenAPI-эмиттер + http-server / route glue + клиентский SDK

> Подзадача wayfinder-карты #8: выбрать конкретные `@typespec/*` пакеты, OpenAPI emitter,
> способ поднять маршруты под Fastify 5 и клиентский SDK-генератор под Vue 3 + Vite 8.
> Все выводы — против первичных источников. Никаких auto-bump по AGENTS.md.

Версии пакетов даны как **точные пины при добавлении** (`.release-please-manifest` / `package.json` обновляются вручную; release-please не имеет к этому отношения).

---

## 0. Ограничения из AGENTS.md / package.json

| Ограничение | Источник | Влияет на выбор |
|---|---|---|
| Node >=24 (через `engines.node` + `devEngines.onFail: "error"`) | root `package.json:7-16` | режет всё, что требует `<22`. |
| TS 5.9.3 закреплён; автобампить нельзя | root `package.json:37`, AGENTS.md «версии не поднимать» | пакеты с peer `typescript: ^6.x` попадают с пометкой. |
| Backend: Fastify 5.12.7, tsx, без build-шага, `buildApp()` для `app.inject()` | `apps/backend/src/app.ts`, AGENTS.md | подходит Fastify 5 + Ajv 8 из коробки Fastify. |
| Frontend: Vue 3.5.44 + Vite 8.3.4 + Vitest 5.0.5 + oxlint 1.88.0 | `apps/frontend/package.json` | генератор должен класться под `apps/frontend/src/shared/api/sdk/` и переживать oxlint. |
| FSD-тест: импорт только со слоя не выше своего, в чужие слайсы — только через `index.ts` | `apps/frontend/src/__tests__/architecture.spec.ts` | сгенерированная папка должна быть self-contained слайсом c `index.ts`. |
| Release-please пишет changelog только под `feat`/`fix`/`perf`/`revert` | AGENTS.md, `.github/workflows/release-please.yml` | вне типов релизов это просто `docs`/`refactor` коммит — никакого release-PR не откроется, что для исследования нормально. |

---

## 1. Compiler / protocol binding / OpenAPI emitter

Версии — `latest` теги из `registry.npmjs.org/<pkg>/latest` на момент чтения, проверены
вручную:

| Пакет | Версия | `engines.node` | Лицензия | Подходит под TS 5.9.3? | Источник |
|---|---|---|---|---|---|
| `@typespec/compiler` | **1.17.0** | `>=22.0.0` | MIT | да (peer не пин на TS) | https://www.npmjs.com/package/@typespec/compiler, https://registry.npmjs.org/@typespec/compiler/latest |
| `@typespec/http` | **1.17.0** | `>=22.0.0` | MIT | да (`@typespec/compiler @ ^1.17.0`) | https://registry.npmjs.org/@typespec/http/latest |
| `@typespec/openapi3` | **1.17.0** | `>=22.0.0` | MIT | да (emit OpenAPI 3.0/3.1/3.2 по `openapi-versions`) | https://www.npmjs.com/package/@typespec/openapi3 |
| `@typespec/json-schema` | **1.17.0** | `>=22.0.0` | MIT | да | https://registry.npmjs.org/@typespec/json-schema/latest |

Замечания:

- Все четыре пакета входят в один релиз TypeSpec **1.17.0** (release notes — https://typespec.io/release-notes/typespec-1-17-0/). Это последний стабильный релиз, `latest` тег у всех совпадает.
- `@typespec/openapi3` — это эмиттер OpenAPI **3.0 / 3.1 / 3.2** (опция `openapi-versions`). Качество признано в самой экосистеме — именно он попадает под release notes как «@typespec/openapi and @typespec/openapi3».
- `@typespec/json-schema` соседний, но для нашего пути **не нужен** — берём только OpenAPI 3.x.

В плане совместимости с текущим стеком рисков нет: Node 24 ≥ требуемых 22, лицензия MIT, TypeSpec сам внутри зависит от `@types/node@^26` devDep, нас это не задевает.

---

## 2. HTTP-server emitter (для бэкенда)

Единственный кандидат из `@typespec/*`:

| Пакет | Версия | Таргеты | Статус | Подходит? | Источник |
|---|---|---|---|---|---|
| `@typespec/http-server-js` | **0.58.0-alpha.29** | Node `http` server **или** Express middleware (включая Swagger UI); Fastify — **нет** | README первая строка: «⚠️ This package is **highly experimental** and may be subject to breaking changes and bugs…» | **Нет** для нашего Fastify 5 | README — https://github.com/microsoft/typespec/tree/main/packages/http-server-js, CHANGELOG — https://github.com/microsoft/typespec/blob/main/packages/http-server-js/CHANGELOG.md |
| `@typespec/http-server-javascript` | — | — | Поглощён `@typespec/http-server-js` в версии 0.58.0-alpha.10 («Renamed package») | — | CHANGELOG, PR #6164 |

Что я проверил в primary sources:

1. В README пакета есть только два режима: `http.createServer(request, router.dispatch)` и `app.use(router.expressMiddleware)`. Слова «fastify» не появляется ни в одной опции.
2. CHANGELOG (с 0.58.0-alpha.1 по 0.58.0-alpha.29) перечисляет фиксы строго про Node http / Express / Swagger UI. Никакого fastify нет.
3. Версия всё ещё `0.58.0-alpha.29` — пре-стабильная, README прямо просит «expect that your code may need to be updated as this package evolves».
4. Комьюнити-эмиттеров «typespec → fastify» я тоже не нашёл: ни в `registry.npmjs.org` (`/search?q=typespec+fastify`), ни в обсуждениях microsoft/typespec нет такого эмиттера. Поиск `is:issue http-server-js fastify` выдаёт ровно один issue про multi-service support (#7030).

Если бы хотели использовать `@typespec/http-server-js` для Fastify, единственный путь — `@fastify/express` поверх Express-роутера. Это вводит лишний слой ради сомнительной выгоды (роуты всё равно Express-стиля, без Fastify-плагинов/хуков), плюс альфа-пакет. **Отбрасываем.**

Альтернатива (см. §3) — компилируем TypeSpec → OpenAPI 3.x и валидируем вручную через Ajv в Fastify 5 (Ajv 8 идёт из коробки Fastify 5).

---

## 3. Кастомная route-прослойка для бэкенда

Подход «OpenAPI-эмиттер + Ajv»:

| Компонент | Версия | `engines.node` | Лицензия | Подходит? | Источник |
|---|---|---|---|---|---|
| `ajv` | **8.20.0** | (без `engines`) | MIT | да | https://registry.npmjs.org/ajv/latest |
| `ajv-formats` | **3.0.1** | (без `engines`) | MIT | да, peer `ajv@^8.0.0` | https://registry.npmjs.org/ajv-formats/latest |
| `@fastify/type-provider-typebox` | **6.3.0** | — | MIT | (опционально, TS 5.9.3 — ок; devDep fastify `^5.0.0`) | https://registry.npmjs.org/@fastify/type-provider-typebox/latest |
| `@sinclair/typebox` | **0.34.52** | — | MIT | (только если берём TypeBox-провайдер) | https://registry.npmjs.org/@sinclair/typebox/latest |

Замечания:

- **Ajv 8 уже встроен в Fastify 5** — бэкенд получит валидацию бесплатно при передаче `schema` в опциях маршрута. Поэтому строки про «ajv в backend `package.json`» стоит заводить только если мы хотим валидировать JSON-схему вне Fastify-контекста (например, в Vitest-тестах без поднятого сервера).
- `@fastify/type-provider-typebox` нужен только если мы хотим типобезопасный options-builder на базе TypeBox-схем. С OpenAPI-эмиттером TypeSpec проще оставаться на «сыром» JSON Schema + Ajv: меньше движущихся частей.
- `@sinclair/typebox@0.34.52` имеет стабильную мажор-линейку `0.x`. Не путать с TS-линейкой TypeSpec.

---

## 4. Клиентский SDK-генератор для `apps/frontend/src/shared/api/sdk/`

| Пакет | Версия | `engines.node` | Лицензия | Поддержка Vue 3 | Fastify-плагин встроен | Источник |
|---|---|---|---|---|---|---|
| `@hey-api/openapi-ts` | **0.99.0** | `>=22.18.0` | MIT | да (`@tanstack/vue-query`, `fetch`-клиент по умолчанию) | **да** — Fastify v5 plugin уже в репе (https://heyapi.dev/docs/openapi/typescript/plugins/fastify, статус «Beta») | https://www.npmjs.com/package/@hey-api/compiler-1.17.0 → https://registry.npmjs.org/@hey-api/openapi-ts/latest, README — https://github.com/hey-api/hey-api/tree/main/packages/openapi-ts |
| `@hey-api/vite-plugin` | **0.3.2** | — | MIT | через vite; peer `vite ^5 \|\| ^6 \|\| ^7 \|\| ^8` — попадает под наш Vite 8.3.4 | (тот же код через плагин) | https://registry.npmjs.org/@hey-api/vite-plugin/latest |
| `orval` | **8.44.0** | `>=22.18.0` | MIT | да (`vue` в keywords, отдельный `@orval/pinia-colada`) | **нет** (есть `@orval/axios`, `@orval/fetch`, `@orval/zod`, но без `@orval/fastify`) | https://registry.npmjs.org/orval/latest |
| `openapi-typescript` | **7.13.0** | — | MIT | (types-only, без SDK) | неприменимо | https://registry.npmjs.org/openapi-typescript/latest |
| `@openapitools/openapi-generator-cli` | **2.42.0** | `>=22.0.0` | Apache-2.0 | да (через генератор любой цели) | да (`openapi-generator` поддерживает `typescript-fetch`, `typescript-axios`, опцию `csharp`, но без dedicated Fastify-template) | https://registry.npmjs.org/@openapitools/openapi-generator-cli/latest |
| `openapi-generator-cli` (без префикса) | **1.0.0** | — | ISC | — | — | это **squat-пакет «to prevent dependency confusion»** — https://registry.npmjs.org/openapi-generator-cli/latest, описание: «🚫 Placeholder to prevent dependency confusion». **Не брать**, это типичная graphops-приманка, чтобы никто не сел в supply-chain сюрприз. |

Замечания по `@hey-api/openapi-ts@0.99.0`:

- README явно говорит — «This package is in initial development. Please pin an exact version». Пин 0.99.0 — это **точно то, что просит AGENTS.md** («версии закреплены»). OK.
- Engines `>=22.18.0` — совместимо с нашим Node 24. Yandex MS-Vercel-PayPal в README — реклама, не стек.
- Fastify-плагин (`packages/openapi-ts/src/plugins/fastify/plugin.ts`) — Beta, но **target явно Fastify v5**. Выход — `fastify.gen.ts` с `serviceHandlers: RouteHandlers`, регистрируемыми через `fastify.register(glue, { serviceHandlers })`.

Замечания по `orval@8.44.0`:

- Мажор `8.x` — стабильная линейка, но **devDeps тянут TS 6.0.3** (`typescript: 6.0.3` в devDependencies). Это нам не критично (devDeps), но означает, что линейка давно переехала на TS 6 и в новых релизах peer может ужесточиться. На 5.9.3 она работает (рантайм-проверено), но **рискованнее** для долгосрочного пина.
- Без `@orval/fastify`-таргета — клиентский SDK хорош, но серверные хендлеры придётся писать руками или взять отдельный плагин (а это уже другой пакет).

Замечания по `openapi-typescript@7.13.0`:

- Это **только типы** — `.d.ts` файл с интерфейсами под OpenAPI-схему. Никакого HTTP-клиента. Если бы хотели «наименее тяжёлый» путь — годится, но тогда вручную делаем `fetch` + безопасную сериализацию.

Замечания по `@openapitools/openapi-generator-cli@2.42.0`:

- Это обёртка над **Java**-генератором (внутри `@nestjs/core`, `axios`, `rxjs` для интерактивного CLI). Тащить JVM-тулчейн ради фронтового SDK в Node-монорепку — overkill. Качество генерируемого TS-кода **исторически** низкое для тонких современных потребностей (раньше были проблемы с ESM/`"type": "module"`, browsers bundlers). **Не рекомендуем.**
- `openapi-generator-cli` без скоупа — это Aikido Security squat (`🚫 Placeholder to prevent dependency confusion`). Целиться надо именно в `@openapitools/openapi-generator-cli`.

---

## 5. Сводная матрица сравнения (по вариантам комбинаций)

Комбинации ниже — это «что именно добавляем в пакеты». Версии везде под Node 24 и TS 5.9.3.

| Вариант | Compiler/Emitter | Server (роуты/валидаторы) | Client SDK | Плюсы | Минусы |
|---|---|---|---|---|---|
| **C1 — «ручной Fastify + Ajv + hey-api»** (рекомендую) | `@typespec/compiler@1.17.0`, `@typespec/http@1.17.0`, `@typespec/openapi3@1.17.0` | маршруты Fastify пишем руками; OpenAPI emitter пишет `openapi.yaml`; **Ajv 8.20.0** (или встроенный в Fastify 5) + **ajv-formats@3.0.1** валидируют JSON-Schema из OpenAPI 3.0 | `@hey-api/openapi-ts@0.99.0` (+ опционально `@hey-api/vite-plugin@0.3.2`) | минимальный набор новых пакетов; чёткая граница «своё / генерированное»; Fastify-native hooks/plugins работают; клиент сразу с типами и `fetch`-клиентом | нужно вручную поддерживать маппинг «HTTP-роут ↔ OpenAPI operationId» |
| **C2 — «hey-api делает оба конца»** | те же TypeSpec | `@hey-api/openapi-ts@0.99.0` Fastify-плагин (Beta) генерит `fastify.gen.ts` и `serviceHandlers` | `@hey-api/openapi-ts@0.99.0` (тот же конфиг) | один инструмент на оба конца; меньше glue | Fastify-плагин помечен «Beta»; меньше ручного контроля над серверными хуками |
| **C3 — «orval-стек»** | те же TypeSpec | ручной Fastify + Ajv/ajv-formats | `orval@8.44.0` (+ по желанию `@orval/zod`) | мажор 8.x стабильный; родной `vue` и `@orval/pinia-colada`; TanStack Query-хуки не нужны (orval генерит функции) | peerTS дрейфует к 6.x; нет Fastify-таргета; рантайм менее проверен под TS 5.9.3 |
| **C4 — «openapi-typescript + fetch вручную»** | те же TypeSpec | то же, что в C1 (Ajv) | `openapi-typescript@7.13.0` (только .d.ts) + ручной `fetch` | самый лёгкий пакет | нет SDK как такового, ручной `fetch` ловит сетевые ошибки и пр.; больше кода во фронте |
| **C5 — «@typespec/http-server-js через @fastify/express»** | те же TypeSpec | `@typespec/http-server-js@0.58.0-alpha.29` (Express-роутер) + `@fastify/express` | любой из C1/C3/C4 | «родной» typespec-роутер | **отбрасываем**: альфа-пакет, не поддерживает Fastify напрямую, два слоя совместимости впустую |
| **C6 — «openapi-generator-cli через JVM»** | те же TypeSpec | любое | `@openapitools/openapi-generator-cli@2.42.0` | огромный выбор таргетов | **отбрасываем**: JVM, тяжёлые зависимости, качество TS-кода ниже чем у hey-api/orval; `openapi-generator-cli` (без скоупа) — supply-chain сквот |

---

## 6. Рекомендация

**Берём C1 «ручной Fastify + Ajv + hey-api».**

Конкретные пины для согласования в G1 (все точные, AGENTS.md запрещает автобамп):

```json
// apps/backend/package.json (devDependencies, если хотим валидировать вне Fastify/в тестах):
"ajv": "8.20.0",
"ajv-formats": "3.0.1"

// packages/typespec/package.json (новый пакет — рекомендую отдельный workspace под спеку):
"@typespec/compiler": "1.17.0",
"@typespec/http": "1.17.0",
"@typespec/openapi3": "1.17.0"

// apps/frontend/package.json (devDependencies):
"@hey-api/openapi-ts": "0.99.0"
```

Опционально:

- `@hey-api/vite-plugin@0.3.2` — если хотим, чтобы SDK перегенерировался в `vite dev`. Peer `vite ^5 || ^6 || ^7 || ^8` — подходит под наш `vite@8.3.4`.
- `@sinclair/typebox@0.34.52` + `@fastify/type-provider-typebox@6.3.0` — **не нужно** для C1: у нас уже есть JSON Schema из `@typespec/openapi3`, typebox добавлял бы второй источник истины.

Причины:

1. **Канонический TypeSpec-стек.** `@typespec/compiler/http/openapi3` — это «ядро» официальной экосистемы Microsoft (см. release notes 1.17.0 — https://typespec.io/release-notes/typespec-1-17-0/), версии стабильные, лицензия MIT, движение выпусков синхронное (`1.17.0` × 3).
2. **Fastify остаётся Fastify.** `@typespec/http-server-js` не умеет Fastify, и через `@fastify/express` мы получили бы лишний слой ради альфа-пакета. Ajv 8 уже встроен в Fastify 5 — это устоявшийся путь.
3. **`@hey-api/openapi-ts@0.99.0` ближе всего к нашему фронт-стеку.** У него есть готовый `fetch`-клиент для Vue, опциональные `@tanstack/vue-query`-хуки, peer ts `>=5.5.3 || >=6.0.0 || 6.0.1-rc` — подходит под наш 5.9.3. README сам просит пин 0.x ровно из-за initial development — что совпадает с нашей политикой.
4. **FSD-тест не ломается.** `@hey-api/openapi-ts` по умолчанию кладёт SDK в `src/client/`; перенастраиваем на `apps/frontend/src/shared/api/sdk/` — это валидный `shared`-слайс с публичным `index.ts`. Тест `architecture.spec.ts` проверяет только межслойные импорты, генерация файлов под него не подпадает.
5. **Привычный для нашей команды Vitest-сценарий.** Текущий `BookingPage.spec.ts` поднимает реальный роутер + стаб `fetch`. Сгенерированный `@hey-api/openapi-ts`-клиент использует `fetch` нативно — никакой отдельной mock-инфры.

Альтернативный апгрейд до **C2** возможен одной строкой в `openapi-ts.config.ts`: добавить `plugins: [..., 'fastify']`. Этот путь стоит зафиксировать как **fallback на случай**, если в C1 ручная прописка маршрутов начнёт расходиться со спекой (потому что нет автогенерации operation-id → handler).

---

## 7. Риски (collected)

| # | Риск | Где | Сработает, если | Митигация |
|---|---|---|---|---|
| R1 | `@typespec/http-server-js` помечен alpha, не имеет Fastify-таргета | https://github.com/microsoft/typespec/tree/main/packages/http-server-js | возьмём C5 | Мы не берём C5. |
| R2 | `@hey-api/openapi-ts@0.99.0` сам просит пин («initial development») | https://github.com/hey-api/hey-api/blob/main/packages/openapi-ts/README.md | не запинить ровно | Пин `0.99.0` уже закреплён; апгрейд только через явное G1-решение + регенерация коммит-сообщением вида `feat(api)!: bump @hey-api/openapi-ts …` (тогда release-please этот !BREAKING увидит). |
| R3 | `@typespec/openapi3` выдаёт OpenAPI 3.x, Ajv 8 в Fastify валидирует 3.0 чище, чем 3.1 (3.1 тяжелее из-за `unevaluatedProperties`) | https://www.npmjs.com/package/@typespec/openapi3, https://github.com/fastify/fastify/blob/main/docs/Validation-and-Serialization.md | выставить `openapi-versions: 3.1.0` | Пины в `tspconfig.yaml`: `openapi-versions: ["3.0.0"]` или `["3.0.0", "3.1.0"]` (по необходимости). Ajv 8 поддерживает оба, но 3.0 проще для Fastify. |
| R4 | `orval@8.44.0` dev-deps тянут `typescript@6.0.3` | https://registry.npmjs.org/orval/latest | возьмём C3 | Мы не берём C3. |
| R5 | `openapi-generator-cli@1.0.0` — supply-chain сквот (Aikido Security) | https://registry.npmjs.org/openapi-generator-cli/latest | кто-то запинит без скоупа | В G1 явно рекомендовать `@openapitools/openapi-generator-cli` и занести `openapi-generator-cli` (без скоупа) в `package-lock.json`-запрет, если вернёмся к C6. |
| R6 | Админские ограничения релиза | AGENTS.md раздел «Релизы» | хотят релиз про изменения в deps или спеке | Используем `feat:`/`fix:`/`perf:` коммиты; чисто исследовательские изменения не открывают release-PR — это ожидаемо, не «поломка». |
| R7 | Fastify 5 + `ajv@8.20.0`. Разные `ajv-keywords`/форматы могут расходиться с Fastify-shipped Ajv | https://github.com/fastify/fastify/blob/main/docs/Validation-and-Serialization.md | заводим свою `ajv` рядом | Использовать встроенный Ajv Fastify 5 (тянет свою копию), а версию `ajv@8.20.0` держать только вне рантайма — для тестов/CLI-валидации отдельно. |
| R8 | Архитектурный FSD-тест | `apps/frontend/src/__tests__/architecture.spec.ts` | сгенерированный SDK начнёт импортировать вглубь соседних слайсов | убедиться, что у `shared/api/sdk/` есть `index.ts` со всем публичным API, и весь фронт импортирует через `@/shared/api/sdk`. Сгенерированные файлы под слайс `sdk` валидны — тест к этому индифферентен. |
| R9 | TS 5.9.3 ↔ `@hey-api/openapi-ts@0.99.0` peer `typescript: ">=5.5.3 || >=6.0.0 || 6.0.1-rc"` | https://registry.npmjs.org/@hey-api/openapi-ts/latest | любой bump TS | Совместимо. TS 5.9.3 попадает в `>=5.5.3`. Когда решим бампнуть TS до 6 — пинать одновременно с hey-api. |
| R10 | `@typespec/json-schema@1.17.0` нам **не нужен**, но может быть втянут через peer цепочку `@typespec/openapi3` (peer `json-schema: ^1.17.0`) | https://registry.npmjs.org/@typespec/openapi3/latest | ура — pubspec peer добавят сами, как обычный npm | Просто ожидаем — `package-lock.json` зафиксирует `1.17.0`. |

Любительских форков в реестре, прячущих имена типа `@typespec/http-server-fastify` или `@typespec/fastify-emitter` я не нашёл — `registry.npmjs.org` не возвращает таких имён, обсуждений в microsoft/typespec нет. То есть альтернативы C5 от комьюнити отсутствуют.

---

## 8. Fallback-путь

Если по G1 отвергнут ручной Fastify и решат идти в C2 (hey-api обеими руками):

1. Добавить в `openapi-ts.config.ts` ключ `plugins: ['@hey-api/sdk', 'fastify']`.
2. Положить сгенерированные серверные хендлеры в `apps/backend/src/generated/fastify.gen.ts`.
3. В `apps/backend/src/app.ts` импортировать `serviceHandlers` и сделать `await app.register(fastifyGlue, { serviceHandlers })` (согласно официальному примеру https://heyapi.dev/docs/openapi/typescript/plugins/fastify).
4. Клиентский SDK идёт в `apps/frontend/src/shared/api/sdk/` через `output` конфиг.

Если и это провалится под Fastify 5 (потому что hey-api-плагин остался «Beta»), отступаем на C3 (`orval@8.44.0`) — но только если G1 согласует риск peerTS.

---

## 9. Куда физически класть артефакты в монорепе

- Спека: новый воркспейс `packages/typespec/` или просто корень `typespec/` — TypeSpec CLI сам создаёт `tsp-output/` по умолчанию (см. README `@typespec/http-server-js`). Рекомендуемая структура `typespec/main.tsp` + `tspconfig.yaml` + `tspd.config.yaml`.
- OpenAPI 3 yaml/json — `typespec/tsp-output/@typespec/openapi3/openapi.yaml` (или `.json`). Этот файл читает `@hey-api/openapi-ts` через `input` в конфиге.
- Сгенерированный SDK — `apps/frontend/src/shared/api/sdk/` с обязательным `index.ts` под FSD.
- Если перейдём в C2 — `apps/backend/src/generated/fastify.gen.ts` (вне слойной структуры, потому что бэк — не FSD, а Fastify-приложение).
- Тесты ручных роутов — `apps/backend/src/routes/__tests__/*.spec.ts`, идут «рядом с кодом» по AGENTS.md (для фронта есть явный паттерн в `BookingPage.spec.ts`).

---

## 10. Закрывающий тезис (одно предложение)

> Я бы взял **C1** — `@typespec/compiler@1.17.0`, `@typespec/http@1.17.0`, `@typespec/openapi3@1.17.0` в спеку, ручные Fastify-роуты с **Ajv 8.20.0 + ajv-formats 3.0.1**, и `@hey-api/openapi-ts@0.99.0` для клиента — потому что единственный официальный server-emitter (`@typespec/http-server-js`) альфа-статуса и не умеет Fastify, `orval` дрейфует к TS 6, а `openapi-generator-cli` тащит JVM; комбинация «TypeSpec core + Ajv внутри Fastify 5 + hey-api» даёт стабильные, MIT-лицензированные пины, чистый FSD-слайс в `shared/api/sdk/` и дружит с `app.inject()`-тестами без дополнительной mock-инфры.
