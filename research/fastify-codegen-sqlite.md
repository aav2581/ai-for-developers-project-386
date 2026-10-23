# R2 (wayfinder): Fastify codegen + node:sqlite

- Issue: https://github.com/aav2581/ai-for-developers-project-386/issues/10
- Parent map: https://github.com/aav2581/ai-for-developers-project-386/issues/8
- Scope of this file: research only. Code in `main` is unchanged.
- Audience: orchestrator and follow-up implementers of map #8.

## TL;DR

For the four endpoints defined in #7, run two TypeSpec emitters side by side from the same `api/contract.tsp`: `@typespec/openapi3` (already implied by map #8 for `api/openapi.yaml`) and `@typespec/json-schema` (`file-type: json`, `emitAllModels: true`) producing a single `apps/backend/src/generated/openapi3.json`. On the backend, `buildApp()` reads that file once, calls `fastify.addSchema(...)` for every model, and references them from route options with `$ref`. This kills the "2×6 schemas" duplication and gives Ajv 8 a single chokepoint. Configure Ajv via `Fastify({ ajv: { customOptions: { removeAdditional: false, coerceTypes: false, allErrors: true, useDefaults: true, strict: true }, plugins: [[addFormats, { mode: 'fast' }]] } })` and unify errors through `setSchemaErrorFormatter` + `setErrorHandler` returning `{ error: { code, message } }`. For SQLite, use the built-in `node:sqlite` (`DatabaseSync`). On Node 24.14.0 (this repo's `.nvmrc`), importing it does emit `ExperimentalWarning` (verified locally); suppress selectively with a `process.emitWarning` patch scoped to `ExperimentalWarning` whose message contains `SQLite`. Run the container as the `node` user (UID 1000; see repo `Dockerfile` line 32); `buildApp()` `mkdirSync(..., { recursive: true })` the parent dir before `new DatabaseSync` (verified: `node:sqlite` does *not* create parent directories). Enable `PRAGMA journal_mode = WAL` and a 5 s `busy_timeout` via the `new DatabaseSync(path, { timeout: 5000 })` constructor option on file-backed paths. Pass `:memory:` into `buildApp({ dbPath })` in tests so `app.inject()` runs against an isolated, empty DB seeded by the same idempotent migration as production. Risks: `node:sqlite` is still officially "Release candidate" / fires the warning on v24.14; the `@typespec/http-server-js` emitter is "highly experimental" and bypasses Fastify entirely, so it would re-route through its own router rather than compose with our `buildApp()` — choose OpenAPI/JSON-Schema instead. Fallback: switch to `better-sqlite3` (compiled, stable) or `@libsql/client` without changing the calling pattern.

## Background: what we need to glue together

### Repo facts (verified)

- `apps/backend/src/app.ts` exports `buildApp()` returning a `Fastify` instance; `apps/backend/src/server.ts` calls `listen`. Tests use `app.inject({ method, url, payload })`. (src: `apps/backend/src/app.ts`, `apps/backend/src/server.ts`)
- Fastify `5.12.7`, Ajv `8` (via `ajv-compiler`); `@fastify/cors@11.3.1` registered; `GET /health` already stubbed. (src: `apps/backend/package.json`)
- Node is pinned to `>=24`; `.nvmrc` says `24.14.0`; `devEngines.onFail: "error"`. (src: `package.json`, `.nvmrc`)
- The `backend` Docker target uses `FROM node:24-alpine` then `USER node` (UID 1000); the shipped `compose.yaml` does not mount a volume yet — that's the hook for `./data:/app/data`. (src: `Dockerfile`, `compose.yaml`)
- Map #8 fixes three regenerable artifact trees:
  - `api/openapi.yaml` (single source of truth for the wire format),
  - `apps/frontend/src/shared/api/sdk/` (client SDK),
  - `apps/backend/src/generated/` — explicitly named in #8 as `Fastify-схемы, валидаторы запросов и заготовки маршрутов`.

This document maps the third tree: how those Fastify-shaped artifacts interlace with `buildApp()`, and how `node:sqlite` behaves under `node:24-alpine`.

## Option A: use `@typespec/http-server-js` directly

**What it is.** Microsoft's first-party JavaScript server emitter generates a static router that you bind to a plain `node:http` server (`server.on('request', router.dispatch)`) or to Express through an `express: true` option. (src: `packages/http-server-js/README.md`)

**Fit with our stack.** *None, as a primary path.* `http-server-js` owns routing end-to-end; Fastify would have to forward to it (no adapter exists in the official package). The README itself flags the package as "highly experimental". It is also not Fastify-shaped: it responds with HTTP itself, won't compose with our `setErrorHandler`, CORS, future metrics, or `attachValidation`.

**Use case.** Don't choose this. Mention only as a fallback if a follow-up task decides to drop Fastify entirely.

## Option B: OpenAPI 3.0 + JSON Schema → Fastify (recommended)

**What it is.** Two emitters run side by side from the same `api/contract.tsp`:

1. `@typespec/openapi3` (already implied by map #8) → `api/openapi.yaml`. Used by the frontend SDK.
2. `@typespec/json-schema` (file-type `json`, `bundleId: 'booking-api'`, `emitAllModels: true`) → `apps/backend/src/generated/openapi3.json`. Used by `buildApp()` to `fastify.addSchema(...)` once, then `$ref`-d from route `schema: { body, params, querystring }`.

Sources:
- `@typespec/openapi3` — official package in `packages/openapi3` of the TypeSpec monorepo (verified by listing `microsoft/typespec/packages`).
- `@typespec/json-schema` — official package, authored in TypeSpec monorepo, supports bundling and per-type formatting options. (src: `packages/json-schema/README.md`)

**Why this matches `buildApp()`.** Three reasons:

1. **Single chokepoint.** `buildApp()` does `for (const s of Object.values(generated.components?.schemas ?? {})) app.addSchema(s)` at startup. Each generated `$id` becomes resolvable through Fastify's `addSchema`, so routes can reference it as `{ $ref: 'http://.../schemas/Slot.json' }` without copying bytes.
2. **No 2×6 duplication.** #7 lists 4 endpoints with `request` + `200/201/4xx` response each = ~16–24 schemas. Hand-typing means copy-pasting; `$ref` + `addSchema` collapses to O(1) registration and O(N) routes pointing at them.
3. **Tests stay symmetric.** When a TypeSpec model changes, `npm run codegen` rewrites `openapi3.json`; `buildApp()` picks it up; `app.inject()` then sees the *same* validator the production binary sees. There is no second hand-written copy to drift.

**Concrete code shape (what `apps/backend/src/app.ts` becomes).**

```ts
// apps/backend/src/app.ts (illustrative — not committed)
import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import addFormats from 'ajv-formats'
import { createDb } from './db.js'
import { migrate } from './migrate.js'
import { registerRoutes } from './routes.js'
import generated from './generated/openapi3.json' with { type: 'json' }

export type BuildAppOptions = {
  /** Path to the SQLite file or `':memory:'`. Default: 'data/app.db'. */
  dbPath?: string
  /** Default: false in tests, true in server.ts. */
  logger?: boolean
  /** Override the wall-clock for tests (capacity/horizon rules). */
  now?: () => Date
}

export const buildApp = async (opts: BuildAppOptions = {}): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: opts.logger ?? false,
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,    // strict — ISO strings must arrive as strings
        allErrors: true,
        useDefaults: true,
        strict: true,
      },
      plugins: [[addFormats, { mode: 'fast' }]],
    },
  })

  // one Ajv message formatter → one validation_error message format
  app.setSchemaErrorFormatter((errors, dataVar) => {
    const first = errors[0]
    return new Error(
      first
        ? `${dataVar}: ${first.instancePath || '/'}: ${first.message}`
        : `${dataVar}: validation failed`,
    )
  })

  app.setErrorHandler((err, req, reply) => {
    if (err.validation || err.code === 'FST_ERR_VALIDATION') {
      return reply.code(400).send({
        error: { code: 'validation_error', message: err.message },
      })
    }
    if (typeof err.statusCode === 'number' && typeof err.code === 'string') {
      return reply.code(err.statusCode).send({
        error: { code: err.code, message: err.message },
      })
    }
    req.log.error({ err }, 'unhandled')
    return reply.code(500).send({ error: { code: 'internal_error', message: 'internal error' } })
  })

  await app.register(cors)

  const db = createDb({ dbPath: opts.dbPath ?? 'data/app.db' })
  migrate(db)

  for (const schema of Object.values(generated.components?.schemas ?? {})) {
    app.addSchema(schema)
  }
  app.get('/health', async () => ({ status: 'ok' }))

  await registerRoutes(app, { db, now: opts.now ?? (() => new Date()) })
  return app
}
```

Each handler then *only* declares `$ref`:

```ts
// apps/backend/src/routes.ts (excerpt)
import type { FastifyInstance } from 'fastify'

export async function registerRoutes(app: FastifyInstance, ctx) {
  app.get('/api/venues', {
    schema: { response: { 200: { '$ref': 'VenueList.json' } } },
  }, async () => ({ venues: VENUES }))

  app.get('/api/evenings', {
    schema: {
      querystring: { '$ref': 'EveningsQuery.json' },
      response: { 200: { '$ref': 'EveningsResponse.json' } },
    },
  }, async (req) => listEvenings(req.query, ctx))

  app.post('/api/bookings', {
    schema: {
      body: { '$ref': 'BookingRequest.json' },
      response: { 201: { '$ref': 'BookingResponse.json' } },
    },
  }, async (req, reply) => {
    try {
      return reply.code(201).send(await createBooking(req.body, ctx))
    } catch (e) {
      throw e   // mapped by setErrorHandler to { error: { code, message } }
    }
  })

  app.get('/api/bookings/upcoming', {
    schema: { response: { 200: { '$ref': 'BookingsUpcomingResponse.json' } } },
  }, async () => listUpcoming(ctx))
}
```

**Trade-offs.**

- Pro: `addSchema` indexes schemas by `$id`; TypeSpec / `openapi3` already emits stable `$id`s per model.
- Pro: `json-schema` emitter is "official", not "highly experimental" like `http-server-js`.
- Con: We lose TS-typed handlers unless we layer `@fastify/type-provider-json-schema-to-ts` (with `as const`) — see Option C.

## Option C: type-provider (TypeBox) co-located with TypeSpec

**What it is.** Install `typebox` + `@fastify/type-provider-typebox`. Decorate handlers with `Type.Object({...})` instead of raw JSON Schema; Fastify infers `req.body` types automatically. (src: `https://fastify.dev/docs/latest/Reference/Type-Providers/` — page selector `v5.12.7` matches the installed version.)

**Pros.** Type-safe handlers (the compiler enforces name, type, optional/required). Same Ajv 8 baseline as raw JSON Schema; no special compiler.

**Cons.** Requires a hand-written translation between TypeSpec types and TypeBox constructors, which is *exactly the duplication* we are trying to remove. There is no built-in `TypeSpec → TypeBox` generator in the `@typespec/*` monorepo (verified by listing `microsoft/typespec/packages`). Two parallel sources of truth arise if OpenAPI is also produced.

**Recommendation.** Use TypeBox only for ad-hoc internal routes that aren't in TypeSpec (e.g. the `/health` probe, which is already hand-written). For the four spec endpoints, stay on Option B; if a contributor wants IDE autocomplete in handlers, add `@fastify/type-provider-json-schema-to-ts` *on top* of the OpenAPI route inputs to recover types from the JSON Schema literal via `as const`.

## Ajv configuration: how validation closes the type loop

Fastify's Ajv baseline (verified in the official docs):

```
{
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
  uriResolver: require('fast-uri'),
  addUsedSchema: false,
  allErrors: false     // explicitly false to mitigate DoS
}
```

Source: `https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/` (page selector: `v5.12.7`).

For our domain, override via `Fastify({ ajv: { customOptions: {...} } })`:

| Option | Default | Ours | Rationale |
|---|---|---|---|
| `coerceTypes` | `'array'` | `false` | We want `"2026-10-23"` to fail validation, not become a `Date`. The spec requires strict ISO-8601 strings on the wire. |
| `removeAdditional` | `true` | `false` | We want to detect typos in client requests, not silently drop fields. For `body` we can override per-compiler to `'all'`. |
| `allErrors` | `false` | `true` | The Fastify baseline is explicit: `allErrors: false` mitigates a documented DoS. We accept the cost on a low-risk public surface; we get consolidated field-level errors that map to one `validation_error` block. If traffic economics change, switch back. |
| `useDefaults` | `true` | `true` unchanged | Lets TypeSpec `... = 'pending'` defaults apply when the client omits optional fields. |
| `strict` | undefined | `true` | Catches typos in generated schemas themselves before runtime. |
| `ajv-formats` plugin | not loaded | load with `mode: 'fast'` | Adds `"date"`, `"date-time"`, `"email"`, `"uri"`, `"uuid"`. Required for the slot-id ISO check and for email validation. `ajv-formats` (current) targets Ajv 8, which is what Fastify 5 ships — no version mismatch. |

`setSchemaErrorFormatter` collapses Ajv errors into a single human message (one instance, applied to all schemas — no 2×6 drift). Example already in the Option B snippet.

### How the generated type and validation close together

1. `api/contract.tsp` declares `model Slot { id: string; format: Format; guestName: string; ... }` with `@pattern("^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}:[0-9]{2}$")` and `@format("email")` on `guestEmail`.
2. `@typespec/json-schema` emits the same constraints as JSON Schema. Verify by sampling a generated file once after running `npm run codegen`.
3. `buildApp()` registers each schema under its `$id` via `addSchema({ $id: 'Slot.json', ... })`. Handlers reference them by `$ref`.
4. Ajv validates; `setSchemaErrorFormatter` produces one consolidated message; `setErrorHandler` wraps it as `validation_error`.
5. The SDK layer (frontend) imports the same `openapi.yaml` so the TS type seen by the form code is the schema Ajv enforces — no drift.

If a future revision of TypeSpec adds a constraint Ajv cannot enforce (e.g. cross-field consistency between `format` and `venueId`), keep it out of JSON Schema and enforce it in a `preHandler` on the relevant routes — `attachValidation: true` prevents a 400-then-500, and the same `setErrorHandler` shape maps it to `validation_error` still.

## Unified error shape `{ error: { code, message } }`

`setErrorHandler` (full snippet in Option B) catches:

- `err.validation` / `err.code === 'FST_ERR_VALIDATION'` → `400 validation_error`. Fastify populates these properties on any Ajv-validator failure — verified in the Fastify docs *Validation and Serialization → Error Handling*. The handler can also read `err.validationContext` (`'body'`, `'querystring'`, `'params'`, `'headers'`) to enrich the message; the contract only mandates `code + message`, so we drop it today.
- Apps-thrown codes (`slot_unavailable`, `already_booked`, `unknown_venue`) → map `err.statusCode` and `err.code` directly. To avoid hand-rolling the catalogue, generate the codes from a TypeSpec `enum Errors` and `app.decorate('errors', errors)` so handlers `throw app.errors.slotUnavailable(...)`.
- `404 unknown_venue` from a `preHandler` doing `if (!VENUES.includes(id))` becomes `throw app.errors.unknownVenue(id)` — same shape.
- Anything else → `500 internal_error`, with the full `err` logged but the response not leaking stack traces.

**Why this passes the acceptance-list (#7) point 8 ("понятные ошибки у полей").** `err.message` is built once by `setSchemaErrorFormatter` from the same Ajv `errors[]` for all schemas. There is one — not six — message format.

## `node:sqlite` under `node:24-alpine`

**Presence.** `node:sqlite` is part of Node's built-in modules since v22.5.0 (alpha) → v24 ships it as a release-candidate module. Verified locally on `v24.14.0` (the project's `.nvmrc` value) and on the Node.js v24.22.1 docs page (`/docs/latest-v24.x/api/sqlite.html`). It is statically linked into the Node binary; no native build step; Alpine/musl is fine.

**API surface we will use.**

- `import { DatabaseSync } from 'node:sqlite'` — synchronous SQL execution, no callback/Promise overhead.
- `new DatabaseSync(path, { timeout, defensive: true, enableForeignKeyConstraints: true })` — single connection per `buildApp()` call.
- `database.exec(sql)` — idempotent migrations.
- `database.prepare(sql)` — repeated queries; cache one statement per route. Avoid `prepare` in the hot path unless we adopt `createTagStore` (the LRU `createTagStore` API exists since v24.9.0 if we later need hot-loop optimization).

Sources: `https://nodejs.org/docs/latest-v24.x/api/sqlite.html` and local exec tests on Node 24.14.0.

## Suppressing the `node:sqlite` `ExperimentalWarning`

Verified: importing `node:sqlite` from a clean process on Node 24.14.0 prints:

```
(node:43666) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

`node --no-warnings` silences it cleanly but **carries the risk of hiding future legitimate warnings** (deprecated APIs, third-party libs, etc.). The targeted approach is safer:

```ts
// apps/backend/src/db.ts (illustrative)
const origEmit = process.emitWarning.bind(process)
process.emitWarning = function (msg, name, ctor) {
  if (name === 'ExperimentalWarning' && /SQLite/.test(String(msg))) return
  return origEmit(msg, name ?? 'Warning', ctor)
} as typeof process.emitWarning

export { DatabaseSync } from 'node:sqlite'
```

Verified locally: this patch suppresses exactly the SQLite warning (count=1) while letting all others through.

Place the patch *before the first `import` of `node:sqlite`* — the warning fires at first import, not at first `new DatabaseSync(...)`. Other experimental warnings still surface.

Alternative: invoke `node` with `--no-warnings`. Trade-off documented under `process.emitWarning` in Node's docs.

## WAL, `busy_timeout`, `journal_mode`

Verified locally on Node 24.14.0:

- On **an in-memory open** (`':memory:'`) the requested `PRAGMA journal_mode = WAL` is reported back as `'memory'`. WAL doesn't apply to in-memory DBs — verify by `database.prepare('PRAGMA journal_mode').get()` returning `{ journal_mode: 'memory' }`.
- On **a file-backed open** the same PRAGMA sticks: `journal_mode: 'wal'`, and `-wal` / `-shm` sidecars appear once enough transactions commit.
- `PRAGMA busy_timeout = 5000` is settable both as PRAGMA and via the `timeout` constructor option. After both: `database.prepare('PRAGMA busy_timeout').get()` returns `{ timeout: 5000 }`.
- `PRAGMA user_version` is readable and writable. Round trip `0 → 1` confirmed.

Putting both in one place: on file-backed paths, run `db.exec('PRAGMA journal_mode = WAL')` once after construction; the `timeout` is set via the constructor so we don't race against the first statement.

## Container volume and user permission (compose)

The repo's `Dockerfile` ends with `USER node` (UID 1000). The shipped `compose.yaml` does not mount the SQLite path yet. Our `compose.yaml` should:

1. Add `volumes: ['./data:/app/data']` to the `backend` service.
2. Document on the host: `mkdir -p ./data && chown 1000:1000 ./data` (the `node` user cannot create a directory inside a `:ro` mount and cannot `chown` a host directory).
3. Pass `DB_PATH=/app/data/app.db` (matches the default `'data/app.db'` resolved against the working directory `/app`).

Inside `buildApp()`, before `new DatabaseSync(opts.dbPath)`:

```ts
if (dbPath !== ':memory:') {
  mkdirSync(dirname(dbPath), { recursive: true })
}
```

This covers the fresh-install case without bind-mount (e.g. on a host where the operator forgets to `mkdir`). Verified locally: omitting the `mkdir` yields `unable to open database file` on the first open.

Alternative entries to the same logic: a one-shot `entrypoint.sh` that runs `mkdir -p /app/data && chown -R node:node /app/data && exec "$@"`. Lighter than an init container.

For WAL specifically, bind-mount the *directory* (not the file) so the `-wal` / `-shm` siblings are visible on the host and survive container restarts. Mounting only `app.db` (without the sidecars) yields `SQLITE_IOERR_DELETE` on rollback during a crash.

## Recommended DB pattern

```ts
// apps/backend/src/db.ts (illustrative)
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// single-target experimental warning patch (see §Suppressing the …)
const origEmit = process.emitWarning.bind(process)
process.emitWarning = function (msg, name, ctor) {
  if (name === 'ExperimentalWarning' && /SQLite/.test(String(msg))) return
  return origEmit(msg, name ?? 'Warning', ctor)
} as typeof process.emitWarning

export type CreateDbOptions = {
  /** `:memory:` for an in-memory database; otherwise a filesystem path. */
  dbPath: string
  /** SQLite busy_timeout. Default: 5000 ms. */
  timeoutMs?: number
}

export const createDb = (opts: CreateDbOptions): DatabaseSync => {
  const { dbPath, timeoutMs = 5000 } = opts
  const isMemory = dbPath === ':memory:'

  if (!isMemory) {
    mkdirSync(dirname(dbPath), { recursive: true })
  }

  const db = new DatabaseSync(dbPath, {
    timeout: timeoutMs,
    defensive: true,                 // default true on v24; explicit for clarity
    enableForeignKeyConstraints: false, // no FKs in #7 spec
  })

  if (!isMemory) {
    db.exec('PRAGMA journal_mode = WAL')
  }
  return db
}
```

```ts
// apps/backend/src/migrate.ts (illustrative)
import type { DatabaseSync } from 'node:sqlite'

const SCHEMA_VERSION = 1

export const migrate = (db: DatabaseSync): void => {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number }
  if (row.user_version >= SCHEMA_VERSION) return

  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      slot_id TEXT NOT NULL,
      evening_date TEXT NOT NULL,
      format TEXT NOT NULL,
      seat INTEGER,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_email_norm TEXT NOT NULL,
      venue_id TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (slot_id, seat),
      UNIQUE (slot_id, guest_email_norm)
    );
    CREATE INDEX IF NOT EXISTS idx_bookings_slot ON bookings (slot_id);
  `)
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`)
}
```

**Properties this gives us.**

- Single `mkdir`-then-`new DatabaseSync` boundary keeps the parent directory in our control; `node:sqlite` does *not* create directories for you (verified).
- `PRAGMA user_version` (verified writable) becomes the future migration knob; no need for a metadata table.
- `:memory:` is one branch: no `mkdir`, no WAL pragma, single fresh DB. Tests get isolation for free.
- `timeout` is mapped to the `busy_timeout` SQLite pragma via the constructor option; one knob.

## Tests on `:memory:` via `buildApp({ dbPath })`

`buildApp({ dbPath: ':memory:' })` runs identical production code paths (`Fastify({...})`, `addSchema`, route registration, error handler) on a single in-memory SQLite instance. `app.inject(...)` resolves against that Fastify instance, which means:

- No file state survives across tests.
- Each `describe` can call `await buildApp({ dbPath: ':memory:' })`. `addHook('onClose', async () => db.close())` on the Fastify instance closes the DB.
- Fake clock: `buildApp({ now: () => new Date('2026-10-23T18:00:00+03:00') })` overrides the "now" helper used by capacity/horizon rules (#7). Vitest has `vi.useFakeTimers` too — the `now` option is the lowest-friction path because the type lives at the framework boundary.

This kills the #7 acceptance-list boilerplate: one shared `buildTestApp()` helper, per-test seed runs the same `migrate(db)` that production does, each acceptance item is `await app.inject(...)` + assertion.

## Endpoint tips (from issue #7)

These are the four endpoints named in #7 and the small wrinkles each surfaces.

### `GET /api/venues`

- The list is *static* (#7 enumerates six names). Two natural codegen strategies:
  1. Embed the list in TypeSpec and let `@typespec/json-schema` emit a `Venue` enum-like model; the route is hydrated by constants in a hand-written module imported by the route handler.
  2. Read the list from a future table if/when venues become configurable; today a hand-maintained `apps/backend/src/venues.ts` that imports nothing from TypeSpec keeps schema and data cleanly separated.
- Recommended: **(1) with a hardcoded array in `apps/backend/src/venues.ts` and a TypeSpec enum for the `id`**. Validation falls out for free; `unknown_venue` lerps from `req.params.id` (when present) or `req.body.venueId` not being in the list.

### `POST /api/bookings`

- The only `body` validation route. With `allErrors: true` + `ajv-formats`, all five fields (`slotId`, `format`, `guestName`, `guestEmail`, optional `venueId`) get checked in one pass; `setSchemaErrorFormatter` produces one consolidated message.
- **Email masking before persistence.** #7 requires `u***@example.com`. Normalize in a `preHandler` (after Ajv) — not in a hook on the schema — so we keep Ajv strict and the masking logic isolated:
  - `guestEmail` → `guestEmailNorm = guestEmail.toLowerCase()` plus `maskedEmail = local[0] + '***' + '@' + domain`. Persist `guestEmailNorm`; return `maskedEmail`.
- **Concurrency guarantee.** "ровно один 201, остальные 409". Use the SQLite `UNIQUE` constraints defined in the migrate script (`UNIQUE (slot_id, seat)`, `UNIQUE (slot_id, guest_email_norm)`). The duplicate `INSERT` raises `ERR_SQLITE_ERROR` with code `SQLITE_CONSTRAINT_UNIQUE`; translate to `throw app.errors.alreadyBooked()`.
- Capacity rule (1/1/4) is *server-side*, not a SQL constraint: read `SELECT count(*) FROM bookings WHERE slot_id = ?` then compare to the format's capacity inside a transaction. `node:sqlite` does not expose a helper for transactions, so call `db.exec('BEGIN IMMEDIATE')` + manual `commit/rollback` (`db.exec('COMMIT')` / `db.exec('ROLLBACK')`).
- Slot-format lock: `SELECT format FROM bookings WHERE slot_id = ?`. If a row exists and `format !== req.body.format`, throw `slot_unavailable` — *no second booking of any format on a formatted slot*. A `WHERE NOT EXISTS`-style guard inside the same transaction is cheaper than two roundtrips.

### `GET /api/evenings`

- The query schema has a *range* constraint (`from` ≤ `to` and `to` ≤ `from + 30d`). Ajv 8 has no native range-between predicate. Choose one:
  - `properties.to.maximum = properties.from + 30*86400` — but `properties.to` is an ISO date string, so this doesn't apply.
  - JSON Schema `if/then` plus a custom keyword via `ajv-keywords@5.x` (Ajv 8-compatible).
  - **Simplest: keep Ajv out of range checking; do it in `preHandler` with `attachValidation: true`** — if range fails, throw `validation_error` with a sensible message and let `setErrorHandler` shape the envelope. This keeps the generated JSON Schema free of cross-field rules, isolating them to one file.
- `availableSlots` is a derived count. Compute server-side from persisted bookings: `SELECT count(*) FROM bookings WHERE slot_id IN (...)`. If we want fewer roundtrips, denormalize later — out of scope per #7.

### `GET /api/bookings/upcoming`

- "Только записи с началом позже текущего момента" — uses our `now` (overridable in tests for fake timers).
- Sorting: `ORDER BY slot_id ASC` works because the slot id is lexicographically the same as temporal ordering for `YYYY-MM-DD-HH:mm`. No TimeZone math is needed at the SQL level because the slot id is constructed in Europe/Moscow once.
- Mask emails in `preSerialization` (or a tiny `serializerCompiler` swap for the `2xx` response schema) so no future route accidentally returns a raw email.

## Risks

1. **`node:sqlite` is still experimental in Node 24.** The official docs page lists it as "Release candidate" but the warning fires on v24.14.0 specifically. Two-stage mitigation:
   - Short term: keep the warning suppression pattern in §"Suppressing …".
   - Long term: keep the import inside `apps/backend/src/db.ts` so a future bump is one file. The actual API surface we use (`DatabaseSync`, `prepare`, `exec`, PRAGMA `user_version` / `journal_mode` / `busy_timeout`) has been stable since v22.5.0.
2. **Generated schema drift between OpenAPI and JSON Schema.** Two emitters from the same TypeSpec, so drift is theoretically impossible; CI runs `npm run codegen` and fails if outputs are uncommitted (per map #8's T6 ticket direction). Pair with `git diff` checks in CI if desired.
3. **`@typespec/json-schema` is official but doesn't ship TypeScript types.** Option B does not require TS types (we trust Ajv), but if a contributor wants IDE autocomplete in handlers, layer `@fastify/type-provider-json-schema-to-ts` with `as const` over the imported JSON. The typecast is artificially narrow.
4. **`@typespec/http-server-js` is "highly experimental".** If someone pulls it in because it shows up first in a search, they would re-route through Node's `http` server and bypass Fastify entirely. Add an `AGENTS.md`-level warning to prevent that.
5. **WAL + volume mount.** SQLite WAL on the bind-mounted `./data` works, but ensure the bind is to a directory on a local filesystem (overlayfs or NFS can produce `SQLITE_IOERR` under load). Document this in `compose.yaml` comments.
6. **Container permissions.** The repo's `Dockerfile` switches to `USER node` (UID 1000). Bind-mounting `./data` from a Linux host works if the host directory is `chown 1000:1000` (or `chmod 777`). Without this, `mkdir -p data/` inside the container fails once the bind is mounted read-only. Document the host step in `compose.yaml` and in the runbook.
7. **`setErrorHandler` must come after `setSchemaErrorFormatter` and before routes.** Fastify evaluates handlers left-to-right; encapsulation makes this robust — the snippet in §Option B is correct.

## Fallback path

If `node:sqlite` blocks production:

- **`better-sqlite3`**: drop-in synchronous lib (≥7.x supports Node 24); requires a build step. The `createDb`, `migrate`, and route-level signatures stay identical because `node:sqlite` was synchronous already. Switch the import in `apps/backend/src/db.ts` and add `better-sqlite3` to `apps/backend/package.json`. The Dockerfile's alpine stage now needs `python3 make g++` for the `node-gyp` build — minimal pain.
- **`@libsql/client` (file mode `file:./data/app.db`)**: async API (`db.execute(...)`), would force a review of the Fastify handler signatures to ensure they `await` (they already do). Same data shape.

Among generated routes, if Option B is hard for any reason (a niche TypeSpec feature that the OpenAPI 3 emitter can't express), use Option C (TypeBox) for that one route family. The Ajv baseline stays the same; only the schema source changes for that route group. **Do not** use Option A: replacing the Fastify router with `@typespec/http-server-js` discards the existing investments.

## Sources (primary)

- Node.js v24 `node:sqlite` docs — `https://nodejs.org/docs/latest-v24.x/api/sqlite.html`
- Node.js main `node:sqlite` docs — `https://nodejs.org/api/sqlite.html`
- Fastify `Validation and Serialization` — `https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/` (page selector: `v5.12.7`)
- Fastify `Type Providers` — `https://fastify.dev/docs/latest/Reference/Type-Providers/`
- TypeSpec `@typespec/http-server-js` README — `https://github.com/microsoft/typespec/blob/main/packages/http-server-js/README.md`
- TypeSpec `@typespec/json-schema` README — `https://github.com/microsoft/typespec/blob/main/packages/json-schema/README.md`
- TypeSpec `@typespec/http` reference — `https://typespec.io/docs/libraries/http/reference/`
- Repo facts (verified locally):
  - `apps/backend/src/app.ts`, `apps/backend/src/server.ts`
  - `apps/backend/package.json`, `apps/backend/tsconfig.json`, `apps/backend/tsconfig.build.json`
  - `Dockerfile`, `compose.yaml`, `.nvmrc`, `package.json`
- Reproductions (done in this session, on Node v24.14.0 = project's pinned version):
  - `node:sqlite` import warning firing at first import.
  - `process.emitWarning` patch suppressing only the SQLite experimental warning while leaving others visible.
  - WAL: `journal_mode = wal` on file, `'memory'` on in-memory.
  - `busy_timeout` writable via PRAGMA and via constructor `timeout`.
  - `user_version = 0` → `1` round trip.
  - ENOENT on `new DatabaseSync('/tmp/walcheck2/app.db')` when parent dir missing.
