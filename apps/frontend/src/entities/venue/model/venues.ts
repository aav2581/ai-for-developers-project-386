export const venues = [
  'Третий тост',
  'Кружка и кот',
  'На углу',
  'Пыльный бар',
  'Соседний дворик',
  'Тихий час',
]

export function formatVenues(): string {
  return venues.map((venue) => `«${venue}»`).join(', ')
}
