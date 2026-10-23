import { Ajv, type ValidateFunction } from 'ajv'

import bookingRequestSchema from '../generated/BookingRequest.json' with { type: 'json' }
import bookingResponseSchema from '../generated/BookingResponse.json' with { type: 'json' }
import bookingCreatedResponseSchema from '../generated/BookingCreatedResponse.json' with { type: 'json' }
import apiErrorResponseSchema from '../generated/ApiErrorResponse.json' with { type: 'json' }
import apiErrorBodySchema from '../generated/ApiErrorBody.json' with { type: 'json' }
import formatNameSchema from '../generated/FormatName.json' with { type: 'json' }
import maskedEmailSchema from '../generated/MaskedEmail.json' with { type: 'json' }

// Ajv v8: все json-схемы из api/contract.tsp регистрируем по $id.
// Это позволяет внутри BookingRequest $ref FormatName.json и
// MaskedEmail.json и т.д. корректно резолвиться. `$schema: draft-2020-12`
// от TypeSpec — Ajv 8 core-словаря достаточно для наших ключевых слов
// (type/properties/required/const/$ref); валидацию самой meta-схемы
// отключаем, чтобы не тащить отдельный дистрибутив ajv/dist/2020.
// ajv-formats не подключаем: email-формат проверяется ниже руками
// (`EMAIL_RE`), чтобы не возиться с шим-пакетом ради одного поля.
const ajv = new Ajv({
  removeAdditional: false,
  coerceTypes: false,
  allErrors: true,
  useDefaults: true,
  strict: true,
  validateSchema: false,
})
ajv.addSchema(bookingRequestSchema)
ajv.addSchema(bookingResponseSchema)
ajv.addSchema(bookingCreatedResponseSchema)
ajv.addSchema(apiErrorResponseSchema)
ajv.addSchema(apiErrorBodySchema)
ajv.addSchema(formatNameSchema)
ajv.addSchema(maskedEmailSchema)

const validateBookingRequest: ValidateFunction = ajv.compile(bookingRequestSchema)

export type BookingRequestBody = {
  slotId: string
  format: 'online' | 'offline' | 'group'
  guestName: string
  guestEmail: string
  venueId?: string
}

export type ValidationResult =
  | { ok: true; value: BookingRequestBody }
  | { ok: false; message: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseBookingRequest(input: unknown): ValidationResult {
  if (input === null || typeof input !== 'object') {
    return { ok: false, message: 'Тело запроса должно быть объектом.' }
  }
  if (!validateBookingRequest(input)) {
    const first = validateBookingRequest.errors?.[0]
    const path = first?.instancePath ?? ''
    const reason = first?.message ?? 'неверный формат'
    return { ok: false, message: `Поле ${path || '(корень)'}: ${reason}`.trim() }
  }
  const body = input as BookingRequestBody
  const name = body.guestName.trim()
  if (name.length < 1 || name.length > 80) {
    return { ok: false, message: 'Имя должно быть от 1 до 80 символов после пробелов.' }
  }
  const emailTrimmed = body.guestEmail.trim()
  if (!EMAIL_RE.test(emailTrimmed)) {
    return { ok: false, message: 'Поле guestEmail: некорректный формат email.' }
  }
  return {
    ok: true,
    value: { ...body, guestName: name, guestEmail: emailTrimmed.toLowerCase() },
  }
}
