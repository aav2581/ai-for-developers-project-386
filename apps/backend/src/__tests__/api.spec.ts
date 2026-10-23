import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../app.js'

// Карта #8 фиксирует один шов: HTTP. Поэтому все сценарии — через
// buildApp() и app.inject() на in-memory SQLite с подменой «сейчас».
const VENUES = [
  { id: 'third-toast', name: 'Третий тост' },
  { id: 'mug-and-cat', name: 'Кружка и кот' },
  { id: 'on-the-corner', name: 'На углу' },
  { id: 'dusty-bar', name: 'Пыльный бар' },
  { id: 'next-yard', name: 'Соседний дворик' },
  { id: 'quiet-hour', name: 'Тихий час' },
]

function dateIso(year: number, month: number, day: number, hour: number, minute = 0): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  const h = String(hour).padStart(2, '0')
  const mi = String(minute).padStart(2, '0')
  return `${year}-${m}-${d}T${h}:${mi}:00+03:00`
}

const MSK_NOON_2026_10_23 = new Date(dateIso(2026, 10, 23, 12))

describe('GET /api/venues', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = []

  beforeEach(() => {
    while (apps.length) apps.pop()?.close()
  })
  afterEach(() => {
    while (apps.length) apps.pop()?.close()
  })

  it('возвращает фиксированный список людных мест', async () => {
    const app = await buildApp({ dbPath: ':memory:' })
    apps.push(app)
    const res = await app.inject({ method: 'GET', url: '/api/venues' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ venues: VENUES })
  })
})

describe('GET /api/evenings', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = []

  beforeEach(() => {
    while (apps.length) apps.pop()?.close()
  })
  afterEach(() => {
    while (apps.length) apps.pop()?.close()
  })

  it('возвращает восемь слотов вечера 18:00–02:00 и помечает все доступными', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({
      method: 'GET',
      url: '/api/evenings?from=2026-10-23&to=2026-10-23&format=online',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      evenings: [
        {
          date: '2026-10-23',
          availableSlots: 8,
          slots: [
            { id: '2026-10-23-18:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 18), endsAt: dateIso(2026, 10, 23, 19), timeLabel: '18:00–19:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-23-19:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 19), endsAt: dateIso(2026, 10, 23, 20), timeLabel: '19:00–20:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-23-20:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 20), endsAt: dateIso(2026, 10, 23, 21), timeLabel: '20:00–21:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-23-21:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 21), endsAt: dateIso(2026, 10, 23, 22), timeLabel: '21:00–22:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-23-22:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 22), endsAt: dateIso(2026, 10, 23, 23), timeLabel: '22:00–23:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-23-23:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 23, 23), endsAt: dateIso(2026, 10, 24, 0), timeLabel: '23:00–00:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-24-00:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 24, 0), endsAt: dateIso(2026, 10, 24, 1), timeLabel: '00:00–01:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
            { id: '2026-10-24-01:00', eveningDate: '2026-10-23', startsAt: dateIso(2026, 10, 24, 1), endsAt: dateIso(2026, 10, 24, 2), timeLabel: '01:00–02:00', capacity: 1, booked: 0, available: true, lockedFormat: null },
          ],
        },
      ],
    })
  })
})

describe('GET /api/bookings/upcoming', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = []

  beforeEach(() => {
    while (apps.length) apps.pop()?.close()
  })
  afterEach(() => {
    while (apps.length) apps.pop()?.close()
  })

  it('возвращает пустой список, если бронирований нет', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ bookings: [] })
  })
})

describe('POST /api/bookings', () => {
  const apps: Array<Awaited<ReturnType<typeof buildApp>>> = []

  beforeEach(() => {
    while (apps.length) apps.pop()?.close()
  })
  afterEach(() => {
    while (apps.length) apps.pop()?.close()
  })

  it('создаёт запись онлайн-формата и возвращает 201 с маской email', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        slotId: '2026-10-23-18:00',
        format: 'online',
        guestName: 'Алиса',
        guestEmail: 'Alice@Example.com',
      },
    })
    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.body).toMatchObject({
      slotId: '2026-10-23-18:00',
      format: 'online',
      guestName: 'Алиса',
      guestEmail: 'a***@example.com',
      startsAt: dateIso(2026, 10, 23, 18),
    })
    expect(typeof body.body.id).toBe('string')
    expect(body.body.createdAt).toMatch(/^\d{4}-10-23T\d{2}:\d{2}:00\+03:00$/)
  })

  it('повторная запись на тот же час тем же email даёт 409 already_booked', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const first = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(first.statusCode).toBe(201)
    const second = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(second.statusCode).toBe(409)
    expect(second.json()).toMatchObject({ error: { code: 'already_booked' } })
  })

  it('запись другого формата на занятый час даёт 409 slot_unavailable', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const first = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-21:00', format: 'group', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(first.statusCode).toBe(201)
    const second = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-21:00', format: 'online', guestName: 'Борис', guestEmail: 'boris@example.com' },
    })
    expect(second.statusCode).toBe(409)
    expect(second.json()).toMatchObject({ error: { code: 'slot_unavailable' } })
  })

  it('онлайн с venueId отклоняется как 400 validation_error', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com', venueId: 'third-toast' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: { code: 'validation_error' } })
  })

  it('оффлайн без venueId даёт 404 unknown_venue', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-19:00', format: 'offline', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ error: { code: 'unknown_venue' } })
  })

  it('запись в прошлом даёт 409 slot_unavailable', async () => {
    const evenLater = new Date(dateIso(2026, 10, 23, 22))
    const app = await buildApp({ dbPath: ':memory:', now: () => evenLater })
    apps.push(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json()).toMatchObject({ error: { code: 'slot_unavailable' } })
  })

  it('невалидный email даёт 400 validation_error', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-19:00', format: 'online', guestName: 'Алиса', guestEmail: 'not-an-email' },
    })
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({ error: { code: 'validation_error' } })
  })

  it('групповой формат вмещает 4 записи, пятая получает 409 slot_unavailable', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const slotId = '2026-10-23-22:00'
    const names = ['Алиса', 'Борис', 'Вика', 'Гена']
    for (const n of names) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: { slotId, format: 'group', guestName: n, guestEmail: `${n.toLowerCase()}@example.com` },
      })
      expect(res.statusCode, `book ${n}`).toBe(201)
    }
    const fifth = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId, format: 'group', guestName: 'Дмитрий', guestEmail: 'dmitriy@example.com' },
    })
    expect(fifth.statusCode).toBe(409)
    expect(fifth.json()).toMatchObject({ error: { code: 'slot_unavailable' } })
  })

  it('конкурентные POST на один слот: ровно один 201, остальные 409', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    const slotId = '2026-10-23-19:00'
    const requests = Array.from({ length: 8 }, (_, i) =>
      app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: { slotId, format: 'group', guestName: `g${i}`, guestEmail: `g${i}@example.com` },
      }),
    )
    const results = await Promise.all(requests)
    const codes = results.map((r) => r.statusCode).slice().sort()
    const success = codes.filter((c) => c === 201).length
    const conflicts = codes.filter((c) => c === 409).length
    expect(success).toBe(4)
    expect(conflicts).toBe(4)
  })

  it('GET /events возвращает только будущие записи по возрастанию времени', async () => {
    const app = await buildApp({ dbPath: ':memory:', now: () => MSK_NOON_2026_10_23 })
    apps.push(app)
    // Бронируем на сегодня (18:00) и на сегодня+1 день 21:00.
    const close = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    const later = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-24-21:00', format: 'online', guestName: 'Борис', guestEmail: 'boris@example.com' },
    })
    expect(close.statusCode).toBe(201)
    expect(later.statusCode).toBe(201)
    const res = await app.inject({ method: 'GET', url: '/api/bookings/upcoming' })
    expect(res.statusCode).toBe(200)
    const list = (res.json() as { bookings: Array<{ startsAt: string; guestEmail: string }> }).bookings
    expect(list.map((b) => b.startsAt)).toEqual([
      dateIso(2026, 10, 23, 18),
      dateIso(2026, 10, 24, 21),
    ])
    expect(list.map((b) => b.guestEmail)).toEqual(['a***@example.com', 'b***@example.com'])
  })

  it('GET /events с now позже всех будущих слотов возвращает пустой список', async () => {
    // Бронируем на вечер 18:00 (через 6 часов от полудня).
    const day = await buildApp({ dbPath: ':memory:', now: () => new Date('2026-10-23T12:00:00+03:00') })
    apps.push(day)
    const book = await day.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: '2026-10-23-18:00', format: 'online', guestName: 'Алиса', guestEmail: 'alice@example.com' },
    })
    expect(book.statusCode).toBe(201)
    // Сдвигаем «сейчас» за пределы всех будущих слотов этого вечера (после 02:00 следующего дня).
    const late = await buildApp({ dbPath: ':memory:', now: () => new Date('2026-10-24T03:00:00+03:00') })
    apps.push(late)
    const res = await late.inject({ method: 'GET', url: '/api/bookings/upcoming' })
    expect(res.json()).toEqual({ bookings: [] })
  })
})

