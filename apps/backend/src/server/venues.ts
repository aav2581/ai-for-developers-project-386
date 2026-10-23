// Фиксированный список людных мест для оффлайн-формата.
// Источник истины — issue #7, раздел «Данные» → «Оффлайн требует
// людное место из фиксированного списка». Изменения только через PR
// к спецификации.
export const VENUES = [
  { id: 'third-toast', name: 'Третий тост' },
  { id: 'mug-and-cat', name: 'Кружка и кот' },
  { id: 'on-the-corner', name: 'На углу' },
  { id: 'dusty-bar', name: 'Пыльный бар' },
  { id: 'next-yard', name: 'Соседний дворик' },
  { id: 'quiet-hour', name: 'Тихий час' },
] as const

export type VenueId = (typeof VENUES)[number]['id']
