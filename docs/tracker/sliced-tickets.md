# Нарезка реализации (T8)

> Здесь копия вертикальных тикетов из #18 — нужна для поиска по
> репозиторию (зеркало, как и `docs/spec.md`). Источник правды —
> issue [#18](https://github.com/aav2581/ai-for-developers-project-386/issues/18)
> и карта [#8](https://github.com/aav2581/ai-for-developers-project-386/issues/8).
> При появлении расхождений правьте в issue, а зеркало синхронизируйте в одном PR.

## Принцип нарезки

Каждый тикет — tracer-bullet вертикаль: один срез проходит через нужные слои (`routes` + `page` + `test` + `glossary`), демонстрируется сам по себе. Блокировки — естественные (без репозитория не сделать страницу с реальными данными; без `/events` не показывается маскировка; и т. п.).

Все тикеты ниже:

- имеют лейбл `ready-for-agent`;
- ссылаются на `docs/spec.md` и нужные компоненты OpenAPI;
- показывают свой шов явно (HTTP seam для backend, страница для frontend).

## Вертикальные тикеты

| # | Заголовок | Шов |
|---|---|---|
| [#19](https://github.com/aav2581/ai-for-developers-project-386/issues/19) | BookingPage — шаг «выбор формата» (?format= + три карточки) | страница `/book`, без сети |
| [#20](https://github.com/aav2581/ai-for-developers-project-386/issues/20) | BookingPage — шаг «вечер + час» + глоссарий «Вечер» | страница + SDK `eveningsList` |
| [#21](https://github.com/aav2581/ai-for-developers-project-386/issues/21) | BookingPage — шаг «подтверждение» + глоссарий «Место в группе» | страница + SDK `createBooking` |
| [#22](https://github.com/aav2581/ai-for-developers-project-386/issues/22) | BookingPage — экран «успех» + переход в /events | страница + state |
| [#23](https://github.com/aav2581/ai-for-developers-project-386/issues/23) | Страница /events — список предстоящих + состояния | страница + SDK `upcomingBookingsList` |
| [#24](https://github.com/aav2581/ai-for-developers-project-386/issues/24) | Шапка «Предстоящие события» + landing-CTA на /book | layout `app/ui/` + главная |
| [#25](https://github.com/aav2581/ai-for-developers-project-386/issues/25) | A11y + адаптив от 360 px через все шаги /book и /events | страницы и UI-компоненты |
| [#26](https://github.com/aav2581/ai-for-developers-project-386/issues/26) | Backend — DB_PATH env + on-disk SQLite sanity | HTTP на файловой SQLite |

## Доменный долг, закрываемый в этих тикетах

- **Глоссарий** (`apps/frontend/GLOSSARY.md`) получит термины, прописанные в [#7 «Further Notes»](https://github.com/aav2581/ai-for-developers-project-386/issues/7): «Вечер» добавляется в #20, «Место в группе» — в #21.
- **Доменные правила времени** (Europe/Moscow, без перехода, хранение в локальном MSK-формате) уже закреплены в T5; в этих тикетах не пересматриваются.

## Связи внутри карты #8

Восемь новых тикетов — sub-issue [#8](https://github.com/aav2581/ai-for-developers-project-386/issues/8) (живая карта). [#18](https://github.com/aav2581/ai-for-developers-project-386/issues/18) теперь закрыт; #8 продолжает смотреть по всем актуальным тикетам.

## Заодно закрытые в рамках T8

Закрыты как completed в одном коммите с нарезкой:

- [#14](https://github.com/aav2581/ai-for-developers-project-386/issues/14) (T4) — SDK в `apps/frontend/src/shared/api/sdk/`. Реализован коммитом `dbd1ed0`.
- [#15](https://github.com/aav2581/ai-for-developers-project-386/issues/15) (T5) — серверные артефакты Fastify + маршруты на `node:sqlite`. Реализован коммитом `04c0b57`.
- [#16](https://github.com/aav2581/ai-for-developers-project-386/issues/16) (T6) — `npm run codegen` + drift-check в CI. Реализован коммитом `2461d01`.
- [#17](https://github.com/aav2581/ai-for-developers-project-386/issues/17) (T7) — зеркало спеки в `docs/spec.md`. Реализован коммитом `7bdb71d`.
- [#18](https://github.com/aav2581/ai-for-developers-project-386/issues/18) (T8) — этот тикет. Закрывается коммитом на ветке `chore/typespec-contract`.
