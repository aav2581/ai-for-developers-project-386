export type FormatId = 'online' | 'offline' | 'group'

export interface Format {
  id: FormatId
  title: string
  icon: string
  summary: string
  details: string[]
}

export const formats: Format[] = [
  {
    id: 'online',
    title: 'Онлайн',
    icon: 'icon-[tabler--video]',
    summary: 'Созвон откуда угодно: с дивана, из командировки, с балкона.',
    details: ['Ссылку пришлю после записи', 'Пиво — своё'],
  },
  {
    id: 'offline',
    title: 'Оффлайн',
    icon: 'icon-[tabler--beer]',
    summary: 'Санкт-Петербург. Приеду в людное место — бар или кафе из списка.',
    details: ['Только людные места', 'Место выбираешь из списка'],
  },
  {
    id: 'group',
    title: 'Групповой час',
    icon: 'icon-[tabler--users]',
    summary: 'Онлайн-стол на 4–6 человек, которые друг друга не знают.',
    details: ['4–6 незнакомцев', 'Один Ванёк на всех'],
  },
]

export function findFormat(id: unknown): Format | undefined {
  if (typeof id !== 'string') {
    return undefined
  }

  return formats.find((format) => format.id === id)
}
