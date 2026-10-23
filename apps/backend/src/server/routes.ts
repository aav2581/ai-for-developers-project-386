import type { FastifyInstance } from 'fastify'
import { VENUES } from './venues.js'
import { buildSlots, offsetDate, partsInMoscow, todayInMoscow, horizonEndMs } from './time.js'
import type { FormatName } from './types.js'
import { createBooking, listUpcomingBookings, slotBookingsByEvening } from './bookings.js'
import { parseBookingRequest } from './validation.js'

const FORMAT_VALUES = new Set<FormatName>(['online', 'offline', 'group'])

function parseFormat(value: unknown): FormatName | undefined {
  return typeof value === 'string' && FORMAT_VALUES.has(value as FormatName) ? (value as FormatName) : undefined
}

function isDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function cmpDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function apiError(code: import('./types.js').ApiErrorCode, message: string) {
  return { error: { code, message } }
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/venues', async () => ({ venues: [...VENUES] }))

  app.get('/api/evenings', async (req, reply) => {
    const q = req.query as Record<string, unknown>
    const format = parseFormat(q.format)
    const from = typeof q.from === 'string' ? q.from : ''
    const to = typeof q.to === 'string' ? q.to : ''

    if (!isDate(from) || !isDate(to) || !format) {
      return reply.code(400).send(
        apiError('validation_error', 'Параметры from, to и format обязательны; ожидаются YYYY-MM-DD и один из online|offline|group.'),
      )
    }

    if (cmpDate(from, to) > 0) {
      return reply.code(400).send(apiError('validation_error', 'Дата from должна быть не позже to.'))
    }

    const nowMs = app.now().getTime()
    const today = todayInMoscow(new Date(nowMs))
    const horizonMsValue = horizonEndMs(nowMs)
    const horizonEndParts = partsInMoscow(new Date(horizonMsValue))
    const horizonEnd = `${horizonEndParts.year}-${String(horizonEndParts.month).padStart(2, '0')}-${String(horizonEndParts.day).padStart(2, '0')}`

    const start = cmpDate(from, today) < 0 ? today : from
    const end = cmpDate(to, today) < 0 ? today : cmpDate(to, horizonEnd) > 0 ? horizonEnd : to

    const evenings: Array<{ date: string; availableSlots: number; slots: ReturnType<typeof buildSlots> }> = []
    for (let cursor = start; cmpDate(cursor, end) <= 0; cursor = offsetDate(cursor, 1)) {
      const state = slotBookingsByEvening(app.db, cursor)
      const slots = buildSlots(cursor, format, state, nowMs, horizonMsValue)
      evenings.push({
        date: cursor,
        availableSlots: slots.filter((s) => s.available).length,
        slots,
      })
    }

    return { evenings }
  })

  app.get('/api/bookings/upcoming', async () => {
    const nowMs = app.now().getTime()
    const bookings = listUpcomingBookings(app.db, nowMs)
    return {
      bookings: bookings.map((b) => ({
        id: b.id,
        slotId: b.slotId,
        startsAt: b.startsAtIso,
        format: b.format,
        guestName: b.guestName,
        guestEmail: b.guestEmailMasked,
        venueId: b.venueId ?? undefined,
        createdAt: b.createdAtIso,
      })),
    }
  })

  app.post('/api/bookings', async (req, reply) => {
    const parsed = parseBookingRequest(req.body)
    if (!parsed.ok) {
      return reply.code(400).send(apiError('validation_error', parsed.message))
    }

    const body = parsed.value
    const result = createBooking(app.db, body, app.now().getTime())
    if (!result.ok) {
      const statusByCode: Record<typeof result.error.code, number> = {
        validation_error: 400,
        unknown_venue: 404,
        already_booked: 409,
        slot_unavailable: 409,
        not_found: 404,
      } as const
      const status = statusByCode[result.error.code] ?? 400
      return reply.code(status).send(apiError(result.error.code, result.error.message))
    }

    const b = result.booking
    return reply.code(201).send({
      body: {
        id: b.id,
        slotId: b.slotId,
        startsAt: b.startsAtIso,
        format: b.format,
        guestName: b.guestName,
        guestEmail: b.guestEmailMasked,
        venueId: b.venueId ?? undefined,
        createdAt: b.createdAtIso,
      },
    })
  })
}
