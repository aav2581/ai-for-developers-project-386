import type { FormatName } from './types.js'

// Europe/Moscow жёстко как UTC+3: «без перехода» по спеке #7.
// Моделируем сдвигом UTC, без Intl — наш внутренний формат хранения
// всегда локальный для Москвы.

const MSK_OFFSET_HOURS = 3

export type MoscowParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

function pad(n: number, w = 2): string {
  return String(n).padStart(w, '0')
}

export function dc(date: string): { y: number; mo: number; d: number } {
  const parts = date.split('-')
  return { y: Number(parts[0]), mo: Number(parts[1]), d: Number(parts[2]) }
}

export function partsInMoscow(instant: Date): MoscowParts {
  // Сдвигаем UTC на +3 часа, читаем как UTC-компоненты — это и есть
  // стенное московское время.
  const shifted = new Date(instant.getTime() + MSK_OFFSET_HOURS * 3600_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  }
}

export function todayInMoscow(instant: Date): string {
  const p = partsInMoscow(instant)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

export function dateString(parts: MoscowParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

// Вечерняя сетка ВСЕГДА: 18,19,20,21,22,23 (тот же фактический день)
// и 00,01 (фактически следующий день). eveningDate — дата ВЕЧЕРА, к
// которому относятся все 8 слотов: для 00:00 и 01:00 это предыдущий
// день, не начало слота.
export const EVENING_HOURS = [18, 19, 20, 21, 22, 23, 0, 1] as const
type Hour = (typeof EVENING_HOURS)[number]

// Слот, который заканчивается в час H следующих суток (00:00–01:00 по
// стенному времени 23:00–02:00), имеет разные eveningDate и фактический
// день начала. Здесь — один общий список нормализованных часов начала:
const ACTUAL_HOURS: Record<Hour, { startHour: number; dateShift: number }> = {
  18: { startHour: 18, dateShift: 0 },
  19: { startHour: 19, dateShift: 0 },
  20: { startHour: 20, dateShift: 0 },
  21: { startHour: 21, dateShift: 0 },
  22: { startHour: 22, dateShift: 0 },
  23: { startHour: 23, dateShift: 0 },
  0: { startHour: 0, dateShift: 1 },
  1: { startHour: 1, dateShift: 1 },
}

function eveningHourDate(eveningDate: string, hour: Hour): string {
  const spec = ACTUAL_HOURS[hour]
  return offsetDate(eveningDate, spec.dateShift)
}

export function offsetDate(date: string, days: number): string {
  const { y, mo, d } = dc(date)
  const utc = Date.UTC(y, mo - 1, d) + days * 86_400_000
  return dateString(partsInMoscow(new Date(utc)))
}

function utcMsForMoscowWall(year: number, month: number, day: number, hour: number, minute: number): number {
  return Date.UTC(year, month - 1, day, hour, minute) - MSK_OFFSET_HOURS * 3600_000
}

export function fmtTimeLabel(startHour: number): string {
  const endHour = (startHour + 1) % 24
  return `${pad(startHour)}:00–${pad(endHour)}:00`
}

export type SlotView = {
  id: string
  eveningDate: string
  startsAt: string
  endsAt: string
  timeLabel: string
  capacity: number
  booked: number
  available: boolean
  lockedFormat: FormatName | null
}

export type SlotState = {
  booked: number
  lockedFormat: FormatName | null
}

const FORMAT_CAPACITY: Record<FormatName, number> = {
  online: 1,
  offline: 1,
  group: 4,
}

export function formatCapacity(format: FormatName): number {
  return FORMAT_CAPACITY[format]
}

export function buildSlots(
  eveningDate: string,
  requestedFormat: FormatName,
  state: Map<string, SlotState>,
  nowMs: number,
  horizonMaxMs: number,
): SlotView[] {
  const slots: SlotView[] = []
  for (const hour of EVENING_HOURS) {
    const actualDate = eveningHourDate(eveningDate, hour)
    const { y, mo, d } = dc(actualDate)
    const startUtc = utcMsForMoscowWall(y, mo, d, hour, 0)
    const endUtc = startUtc + 3600_000
    const id = `${actualDate}-${pad(hour)}:00`
    const slotState = state.get(id) ?? { booked: 0, lockedFormat: null }
    // Ёмкость зависит от lockedFormat:
    //  - нет записей → ёмкость запрашиваемого формата (формат ещё не зафиксирован).
    //  - lockedFormat совпадает с запрашиваемым → ёмкость этого формата минус занято.
    //  - lockedFormat отличается → ёмкость для чужого формата = 0.
    const capacity = slotState.lockedFormat === null
      ? formatCapacity(requestedFormat)
      : slotState.lockedFormat === requestedFormat
        ? formatCapacity(requestedFormat)
        : 0
    const remaining = slotState.lockedFormat === requestedFormat
      ? capacity - slotState.booked
      : slotState.lockedFormat === null
        ? capacity
        : 0
    const available =
      startUtc > nowMs &&
      startUtc <= horizonMaxMs &&
      remaining > 0
    slots.push({
      id,
      eveningDate,
      startsAt: isoAtMoscow(startUtc),
      endsAt: isoAtMoscow(endUtc),
      timeLabel: fmtTimeLabel(hour),
      capacity,
      booked: slotState.booked,
      available,
      lockedFormat: slotState.lockedFormat,
    })
  }
  return slots
}

export const HORIZON_DAYS = 30

export function horizonEndMs(nowMs: number): number {
  return nowMs + HORIZON_DAYS * 86_400_000
}

export function isoAtMoscow(ms: number): string {
  const p = partsInMoscow(new Date(ms))
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:00+03:00`
}

export function slotIdToUtcMs(id: string): number {
  // YYYY-MM-DD-HH:mm — фактический час начала в Europe/Moscow.
  const [yStr, mStr, dStr, hm] = id.split('-')
  const [hStr, minStr] = hm.split(':')
  return Date.UTC(Number(yStr), Number(mStr) - 1, Number(dStr), Number(hStr), Number(minStr)) - 3 * 3600_000
}

export function isValidSlotId(id: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$/.test(id)
}

export function slotEveningDate(id: string): string {
  // id в фактических MSK-компонентах; eveningDate для слотов 18..23
  // совпадает с фактической датой, для слотов 00..01 — за день до.
  const [yStr, mStr, dStr, hm] = id.split('-')
  const hour = Number(hm.split(':')[0])
  const date = `${yStr}-${mStr}-${dStr}`
  return hour < 18 ? offsetDate(date, -1) : date
}
