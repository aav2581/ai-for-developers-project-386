import type { Feature } from '@/shared/ui'

export const heading = {
  eyebrow: 'Без мелкого шрифта',
  title: 'Что обещаю',
  lead: 'Час — это не терапия и не коучинг. Но и не просто «посидеть рядом».',
}

export const promises: Feature[] = [
  {
    icon: 'icon-[tabler--mood-smile]',
    title: 'Шутки',
    text: 'Проверенные. Иногда сантехнические.',
  },
  {
    icon: 'icon-[tabler--glass-full]',
    title: 'Тосты',
    text: 'Короткие и не очень. Смысл в людях, а не в градусах.',
  },
  {
    icon: 'icon-[tabler--ear]',
    title: 'Выслушать',
    text: 'Без советов «соберись» и «прокачайся».',
  },
  {
    icon: 'icon-[tabler--heart]',
    title: 'Посочувствовать',
    text: 'Искренне. Бывшая-психолог подтверждает.',
  },
]
