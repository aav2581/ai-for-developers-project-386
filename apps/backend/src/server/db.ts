import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, basename } from 'node:path'

// Спека #7 и R2 фиксируют узкое подавление ExperimentalWarning только
// под /SQLite/. Глобально глушить предупреждения нельзя — теряем
// обратную связь по другим экспериментальным API. Поэтому регистрируем
// фильтрующий слушатель один раз на весь процесс.
let warningFilterInstalled = false
if (!warningFilterInstalled) {
  process.on('warning', (warning) => {
    if (warning.name === 'ExperimentalWarning' && /SQLite/i.test(String(warning.message))) {
      return
    }
    console.warn(`(${warning.name}) ${warning.message}`)
  })
  warningFilterInstalled = true
}

export type Db = DatabaseSync

// `dbPath` — путь к файлу или ':memory:' для тестов. Каталог
// создаётся идемпотентно при первом открытии файла. TDD-сценарии
// spec #7 и R2 проходят на ':memory:', прод — на DB_PATH env.
export function openDb(dbPath: string): Db {
  if (dbPath !== ':memory:') {
    const dir = dirname(dbPath)
    mkdirSync(dir, { recursive: true })
  }
  const db = new DatabaseSync(dbPath)

  // Идемпотентная схема (R2): одна таблица + два уникальных индекса.
  // Версия схемы (user_version) и миграции — TODO после T8.
  db.exec(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    slot_id TEXT NOT NULL,
    evening_date TEXT NOT NULL,
    format TEXT NOT NULL CHECK(format IN ('online','offline','group')),
    place INTEGER NOT NULL,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_email_normalized TEXT NOT NULL,
    venue_id TEXT,
    starts_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`)
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_place ON bookings(slot_id, place)`)
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_email ON bookings(slot_id, guest_email_normalized)`)

  return db
}

export function describeDbPath(dbPath: string): string {
  return dbPath === ':memory:' ? 'in-memory' : basename(dbPath)
}
