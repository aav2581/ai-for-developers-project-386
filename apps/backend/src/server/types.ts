// Доменные типы для бэкенда. Источник истины по формам —
// apps/backend/src/generated/*.json, автогенерированный из
// api/contract.tsp через `@typespec/json-schema`. Эти типы
// используются в обработчиках и тестах; изменение формы API
// начинается с TypeSpec и заканчивается перегенерацией, а не тут.

export type FormatName = 'online' | 'offline' | 'group'

export type ApiErrorCode =
  | 'validation_error'
  | 'slot_unavailable'
  | 'already_booked'
  | 'unknown_venue'
  | 'not_found'

export type BookingRequestBody = {
  slotId: string
  format: FormatName
  guestName: string
  guestEmail: string
  venueId?: string
}

export type BookingResponseBody = {
  id: string
  slotId: string
  startsAt: string
  format: FormatName
  guestName: string
  guestEmail: string
  venueId?: string
  createdAt: string
}

export type ApiErrorResponseBody = {
  error: {
    code: ApiErrorCode
    message: string
  }
}
