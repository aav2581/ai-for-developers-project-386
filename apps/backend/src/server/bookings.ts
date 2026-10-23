import { randomUUID } from 'node:crypto'
import { isoAtMoscow, slotEveningDate, slotIdToUtcMs } from './time.js'
import type { Db } from './db.js'
import { VENUES, type VenueId } from './venues.js'
import type { FormatName } from './types.js'

const FORMAT_CAPACITY: Record<FormatName, number> = {
  online: 1,
  offline: 1,
  group: 4,
}

export function formatCapacity(format: FormatName): number {
  return FORMAT_CAPACITY[format]
}

export function isKnownVenue(id: string): id is VenueId {
  return VENUES.some((v) => v.id === id)
}

export type BookingRow = {
  id: string
  slotId: string
  startsAtIso: string
  startsAtMs: number
  format: FormatName
  guestName: string
  guestEmailMasked: string
  venueId: string | null
  createdAtIso: string
}

type DbRow = {
  id: string
  slot_id: string
  format: FormatName
  guest_name: string
  guest_email: string
  venue_id: string | null
  starts_at: number
  created_at: number
}

function rowToBooking(row: DbRow): BookingRow {
  return {
    id: row.id,
    slotId: row.slot_id,
    startsAtIso: isoAtMoscow(row.starts_at),
    startsAtMs: row.starts_at,
    format: row.format,
    guestName: row.guest_name,
    guestEmailMasked: maskEmail(row.guest_email),
    venueId: row.venue_id ?? null,
    createdAtIso: isoAtMoscow(row.created_at),
  }
}

// Маска по спеке: «только маска вида u***@example.com».
function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0 || at === email.length - 1) return email
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (!domain.includes('.')) return email
  return `${local[0]}***@${domain}`
}

export type BookingError =
  | { code: 'validation_error'; message: string }
  | { code: 'slot_unavailable'; message: string }
  | { code: 'already_booked'; message: string }
  | { code: 'unknown_venue'; message: string }
  | { code: 'not_found'; message: string }

export type CreateBookingInput = {
  slotId: string
  format: FormatName
  guestName: string
  guestEmail: string
  venueId?: string
}

export type CreateBookingResult =
  | { ok: true; booking: BookingRow }
  | { ok: false; error: BookingError }

// Создание записи. BEGIN IMMEDIATE — write lock, поэтому два параллельных
// POST /api/bookings на один слот видят одну и ту же картину существующих
// записей; один получит place 0, остальные — slot_unavailable.
export function createBooking(
  db: Db,
  input: CreateBookingInput,
  nowMs: number,
): CreateBookingResult {
  // 1. venue offline требуется, online/group — запрещён.
  if (input.format === 'offline') {
    if (!input.venueId || !isKnownVenue(input.venueId)) {
      return { ok: false, error: { code: 'unknown_venue', message: 'Людное место не найдено.' } }
    }
  } else if (input.venueId !== undefined) {
    return {
      ok: false,
      error: { code: 'validation_error', message: 'venueId допустим только для оффлайна.' },
    }
  }
  const venueId = input.format === 'offline' ? input.venueId ?? null : null

  const startsAtMs = slotIdToUtcMs(input.slotId)
  const eveningDate = slotEveningDate(input.slotId)

  db.exec('BEGIN IMMEDIATE')
  try {
    const existing = db
      .prepare('SELECT id, format, guest_email_normalized, place FROM bookings WHERE slot_id = ?')
      .all(input.slotId) as Array<{ id: string; format: FormatName; guest_email_normalized: string; place: number }>

    // повторный email на тот же час
    if (existing.some((r) => r.guest_email_normalized === input.guestEmail)) {
      return {
        ok: false,
        error: { code: 'already_booked', message: 'Этот email уже записан на этот час.' },
      }
    }

    // past или beyond horizon
    if (startsAtMs <= nowMs) {
      return {
        ok: false,
        error: { code: 'slot_unavailable', message: 'Этот час уже прошёл.' },
      }
    }
    const horizonMs = nowMs + 30 * 86_400_000
    if (startsAtMs > horizonMs) {
      return {
        ok: false,
        error: { code: 'slot_unavailable', message: 'Этот час за пределами горизонта 30 дней.' },
      }
    }

    if (existing.length === 0) {
      const row = insertBooking(db, {
        slotId: input.slotId,
        eveningDate,
        format: input.format,
        place: 0,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        venueId,
        startsAtMs,
        nowMs,
      })
      return { ok: true, booking: row }
    }

    const lockedFormat = existing[0].format
    if (lockedFormat !== input.format) {
      return {
        ok: false,
        error: {
          code: 'slot_unavailable',
          message: lockedFormat === 'group'
            ? 'Час занят групповым форматом — мест нет.'
            : 'Час занят другим форматом.',
        },
      }
    }

    const taken = new Set(existing.map((r) => r.place))
    const cap = formatCapacity(input.format)
    let place = -1
    for (let i = 0; i < cap; i++) {
      if (!taken.has(i)) {
        place = i
        break
      }
    }
    if (place < 0) {
      return {
        ok: false,
        error: { code: 'slot_unavailable', message: 'Все места на этот час заняты.' },
      }
    }

    const row = insertBooking(db, {
      slotId: input.slotId,
      eveningDate,
      format: input.format,
      place,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      venueId,
      startsAtMs,
      nowMs,
    })
    return { ok: true, booking: row }
  } finally {
    db.exec('COMMIT')
  }
}

type BookingInsert = {
  slotId: string
  eveningDate: string
  format: FormatName
  place: number
  guestName: string
  guestEmail: string
  venueId: string | null
  startsAtMs: number
  nowMs: number
}

function insertBooking(db: Db, b: BookingInsert): BookingRow {
  const id = randomUUID()
  db.prepare(`INSERT INTO bookings
    (id, slot_id, evening_date, format, place, guest_name, guest_email, guest_email_normalized, venue_id, starts_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      b.slotId,
      b.eveningDate,
      b.format,
      b.place,
      b.guestName,
      b.guestEmail,
      b.guestEmail,
      b.venueId,
      b.startsAtMs,
      b.nowMs,
    )
  const row = db
    .prepare('SELECT id, slot_id, format, guest_name, guest_email, venue_id, starts_at, created_at FROM bookings WHERE id = ?')
    .get(id) as DbRow
  return rowToBooking(row)
}

export function listUpcomingBookings(db: Db, nowMs: number): BookingRow[] {
  const rows = db
    .prepare(
      'SELECT id, slot_id, format, guest_name, guest_email, venue_id, starts_at, created_at FROM bookings WHERE starts_at > ? ORDER BY starts_at ASC',
    )
    .all(nowMs) as DbRow[]
  return rows.map(rowToBooking)
}

// Чтение слотового «состояния» для /api/evenings.
// Возвращает число записей и заблокированный формат (если есть запись).
export function slotBookingsByEvening(
  db: Db,
  eveningDate: string,
): Map<string, { booked: number; lockedFormat: FormatName | null }> {
  const rows = db
    .prepare('SELECT slot_id, format FROM bookings WHERE evening_date = ?')
    .all(eveningDate) as Array<{ slot_id: string; format: FormatName }>
  const map = new Map<string, { booked: number; lockedFormat: FormatName | null }>()
  for (const row of rows) {
    const current = map.get(row.slot_id) ?? { booked: 0, lockedFormat: null }
    current.booked += 1
    current.lockedFormat = row.format
    map.set(row.slot_id, current)
  }
  return map
}
