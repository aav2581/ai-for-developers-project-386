import "@typespec/http";
import "@typespec/rest";

using TypeSpec.Http;

@service(#{ title: "FriendForAnHour" })
@server("http://localhost:3000", "Локальный dev-сервер")
namespace FriendForAnHour;

enum FormatName {
  online,
  offline,
  group,
}

@doc("Маска email: u***@example.com. Полный email через GET не возвращается.")
scalar MaskedEmail extends string;

model Slot {
  @doc("Идентификатор слота: YYYY-MM-DD-HH:mm по фактическому времени начала.")
  id: string;

  @doc("Дата вечера, к которому относится слот (для слотов 00:00–02:00 — предыдущий день).")
  eveningDate: string;

  @doc("Начало в Europe/Moscow, ISO с +03:00.")
  startsAt: string;

  @doc("Конец в Europe/Moscow.")
  endsAt: string;

  @doc("Подпись, как её видит гость (например '09:00–10:00').")
  timeLabel: string;

  capacity: int32;
  booked: int32;

  @doc("Свободен ли слот в выбранном формате с учётом «сейчас» и горизонта.")
  available: boolean;

  @doc("Формат, зафиксированный первой записью. Если null — слот доступен для любого формата.")
  lockedFormat: FormatName | null;
}

model Evening {
  date: string;
  availableSlots: int32;
  slots: Slot[];
}

model Venue {
  id: string;
  name: string;
}

model BookingRequest {
  slotId: string;
  format: FormatName;
  guestName: string;
  guestEmail: string;
  venueId?: string;
}

model BookingResponse {
  id: string;
  slotId: string;
  startsAt: string;
  format: FormatName;
  guestName: string;
  guestEmail: MaskedEmail;
  venueId?: string;
  createdAt: string;
}

model EveningsResponse { evenings: Evening[]; }
model VenuesResponse { venues: Venue[]; }
model UpcomingResponse { bookings: BookingResponse[]; }
model HealthResponse { status: "ok"; }

@doc("Единый формат ошибки.")
model ApiErrorBody {
  code:
    | "validation_error"
    | "slot_unavailable"
    | "already_booked"
    | "unknown_venue"
    | "not_found";
  message: string;
}
model ApiErrorResponse { error: ApiErrorBody; }

@route("/health")
interface HealthOps {
  @get check(): HealthResponse;
}

@route("/api/venues")
interface Venues {
  @get list(): VenuesResponse;
}

@route("/api/evenings")
interface Evenings {
  @get list(
    @query from: string,
    @query to: string,
    @query format: FormatName,
  ): EveningsResponse;
}

@route("/api/bookings")
interface Bookings {
  @post create(@body request: BookingRequest): BookingResponse;
}

@route("/api/bookings/upcoming")
interface UpcomingBookings {
  @get list(): UpcomingResponse;
}
