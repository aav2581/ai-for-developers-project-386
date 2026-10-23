import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildApp } from '../app.js'

// Карта #8 (тикет #26): прод-проверка DB_PATH. api.spec.ts ходит по
// :memory:, поэтому сам путь к файлу и переживание рестарта buildApp
// не покрыты. Шов тот же — HTTP через app.inject(); отличие только
// в dbPath и жизненном цикле приложения.

function dateIso(year: number, month: number, day: number, hour: number, minute = 0): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  const h = String(hour).padStart(2, '0')
  const mi = String(minute).padStart(2, '0')
  return `${year}-${m}-${d}T${h}:${mi}:00+03:00`
}

const MSK_NOON_2026_10_23 = new Date(dateIso(2026, 10, 23, 12))

describe('DB_PATH на файловой SQLite переживает рестарт buildApp', () => {
  let dir: string
  let dbPath: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'adb-'))
    dbPath = join(dir, 'app.db')
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('запись через POST /api/bookings читается обратно после закрытия и нового открытия buildApp', async () => {
    // Первый запуск приложения на tmp-файле: POST → 201.
    const app1 = await buildApp({ dbPath, now: () => MSK_NOON_2026_10_23 })
    try {
      const post = await app1.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: {
          slotId: '2026-10-23-18:00',
          format: 'online',
          guestName: 'Алиса',
          guestEmail: 'Alice@Example.com',
        },
      })
      expect(post.statusCode).toBe(201)
      // Файл БД создан на диске: это и есть «прод»-проверка DB_PATH.
      expect(statSync(dbPath).isFile()).toBe(true)
    } finally {
      await app1.close()
    }

    // Второй запуск на том же пути: читаем запись обратно через /upcoming.
    const app2 = await buildApp({ dbPath, now: () => MSK_NOON_2026_10_23 })
    try {
      const upcoming = await app2.inject({ method: 'GET', url: '/api/bookings/upcoming' })
      expect(upcoming.statusCode).toBe(200)
      const list = (
        upcoming.json() as { bookings: Array<{ startsAt: string; guestEmail: string }> }
      ).bookings
      expect(list).toHaveLength(1)
      expect(list[0]).toMatchObject({
        startsAt: dateIso(2026, 10, 23, 18),
        guestEmail: 'a***@example.com',
      })
    } finally {
      await app2.close()
    }
  })
})
