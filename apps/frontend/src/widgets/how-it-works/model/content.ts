import type { Feature } from '@/shared/ui'

export const heading = {
  eyebrow: 'Как это работает',
  title: 'Три шага до нормального вечера',
  lead: 'Никаких анкет и менеджеров. Только ты, Ванёк и час.',
}

export const steps: Feature[] = [
  {
    icon: 'icon-[tabler--calendar]',
    title: 'Выбираешь формат и время',
    text: 'Онлайн, оффлайн в Питере или группа. Слоты — на странице записи.',
  },
  {
    icon: 'icon-[tabler--map-pin]',
    title: 'Встречаемся',
    text: 'Пришлю ссылку или приеду в людное место из списка.',
  },
  {
    icon: 'icon-[tabler--beer]',
    title: 'Час — твой',
    text: 'Шутим, пьём, говорим. Можно молчать. Можно плакать. Можно и то и другое.',
  },
]
