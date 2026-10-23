// Публичный API слайса `shared/api`.
// Только этот файл импортируется из других слоёв по правилу FSD
// (см. apps/frontend/src/__tests__/architecture.spec.ts).
//
// Всё содержимое `shared/api/sdk/` генерируется из `api/openapi.yaml`
// через `npm run -w apps/frontend codegen:sdk` — руками его не править.
// Если нужен новый ре-экспорт, добавляй здесь.
export {
  bookingsCreate,
  eveningsList,
  healthOpsCheck,
  upcomingBookingsList,
  venuesList,
  type Options,
} from './sdk'
export type {
  ApiErrorBody,
  ApiErrorResponse,
  BookingCreatedResponse,
  BookingRequest,
  BookingResponse,
  Evening,
  EveningsListData,
  EveningsListResponse,
  EveningsResponse,
  FormatName,
  HealthResponse,
  HealthOpsCheckData,
  HealthOpsCheckResponse,
  MaskedEmail,
  Slot,
  UpcomingBookingsListData,
  UpcomingBookingsListResponse,
  UpcomingResponse,
  Venue,
  VenuesListData,
  VenuesListResponse,
  VenuesResponse,
} from './sdk'
