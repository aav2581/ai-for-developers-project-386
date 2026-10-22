export type FormatId = 'online' | 'offline' | 'group'

export interface Format {
  id: FormatId
  title: string
  icon: string
  summary: string
  details: string[]
}

export interface Step {
  icon: string
  title: string
  text: string
}

export interface PromiseItem {
  icon: string
  title: string
  text: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface NavLink {
  label: string
  to: string
}

export const brand = {
  name: 'Друг на час',
  tagline: 'Сделано, чтобы никто не пил один',
  city: 'Санкт-Петербург',
}

export const friend = {
  name: 'Ванёк',
  role: 'необычный сантехник',
}

export const navLinks: NavLink[] = [
  { label: 'Форматы', to: '/#formats' },
  { label: 'Как это работает', to: '/#how' },
  { label: 'FAQ', to: '/#faq' },
]

export const hero = {
  eyebrow: 'Сантехник. Не по объявлению.',
  title: 'Привет, я Ванёк.',
  accent: 'Друг на час.',
  lead: 'Если не с кем выпить — это решаемо. Приеду в людное место в Питере или подключусь онлайн. Принесу шутки, тосты и умение слушать. Бывшая-психолог научила.',
  primaryCta: 'Записаться на час',
  secondaryCta: 'Хочу в группу',
  quickFacts: [
    { icon: 'icon-[tabler--clock]', label: 'Ровно час' },
    { icon: 'icon-[tabler--map-pin]', label: 'Питер или онлайн' },
    { icon: 'icon-[tabler--glass-full]', label: 'Пить необязательно' },
  ],
  included: [
    'Шутки — проверенные, иногда сантехнические',
    'Тосты — короткие и не очень',
    'Выслушаю без советов «соберись»',
    'Посочувствую искренне',
  ],
}

export const steps: Step[] = [
  {
    icon: 'icon-[tabler--calendar]',
    title: 'Выбираешь формат и время',
    text: 'Онлайн, оффлайн в Питере или группа. Слоты — на странице записи.',
  },
  {
    icon: 'icon-[tabler--map-pin]',
    title: 'Встречаемся',
    text: 'Пришлю ссылку на созвон или приеду в людное место из списка.',
  },
  {
    icon: 'icon-[tabler--beer]',
    title: 'Час — твой',
    text: 'Шутим, пьём, говорим. Можно молчать. Можно плакать. Можно и то и другое.',
  },
]

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
    details: ['Только людные места', 'Место пришлю после записи'],
  },
  {
    id: 'group',
    title: 'Групповой час',
    icon: 'icon-[tabler--users]',
    summary: 'Онлайн-стол на 4–6 человек, которые друг друга не знают.',
    details: ['4–6 незнакомцев', 'Один Ванёк на всех'],
  },
]

export const promises: PromiseItem[] = [
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

export const safety = {
  eyebrow: 'Безопасность',
  title: 'Только людные места',
  text: 'Я не приезжаю домой и не зову в гости. Встречаемся там, где есть люди: бар, кафе, веранда. Так спокойнее и тебе, и мне.',
  points: [
    'Никаких квартир и закрытых дверей.',
    'Место выбираешь из списка — все проверены на людность.',
    'Домашний адрес я не спрашиваю.',
    'Если что-то пошло не так — просто уходи, вопросов не будет.',
  ],
}

export const faq: FaqItem[] = [
  {
    question: 'Сколько стоит час?',
    answer:
      'Цены нет. Если вечер зашёл — отблагодари, как считаешь нужным. Если не зашёл — тоже нормально.',
  },
  {
    question: 'А если я не пью?',
    answer: 'Можно чай, лимонад или ничего. Я не уговариваю и не обижаюсь.',
  },
  {
    question: 'А если не хочу говорить?',
    answer:
      'Можно молчать. Час всё равно твой: посидим, посмотрим на людей, я что-нибудь расскажу.',
  },
  {
    question: 'Что, если я опоздаю?',
    answer: 'Напиши мне. Постараюсь сохранить час целиком, но лучше не опаздывать.',
  },
  {
    question: 'Кто такой Ванёк?',
    answer: 'Сантехник. Шучу, слушаю и сочувствую. Говорят, это от бывшей-психолога.',
  },
  {
    question: 'Где встречаемся оффлайн?',
    answer:
      'В людном месте из списка: «Третий тост», «Кружка и кот», «На углу», «Пыльный бар», «Соседний дворик» или «Тихий час». Конкретное место пришлю после записи.',
  },
]

export const venues = [
  'Третий тост',
  'Кружка и кот',
  'На углу',
  'Пыльный бар',
  'Соседний дворик',
  'Тихий час',
]

export const support = {
  eyebrow: 'Спасибо',
  title: 'Поддержать друга',
  text: 'Если вечер зашёл — скажи Ваньку. Он подскажет, как отблагодарить. Без сумм и обязательств.',
}

export const booking = {
  eyebrow: 'Запись',
  title: 'Запись на час',
  lead: 'Один час: онлайн, оффлайн в Питере или группой. Дальше — время, место и подтверждение.',
  chooseFormat: 'Сначала выбери формат',
  chooseFormatLead: 'Онлайн, оффлайн в Питере или групповой час. Разница — в компании и месте.',
  selectedFormat: 'Выбранный формат',
  nextStepsTitle: 'Что будет дальше',
  nextSteps: ['Выбрать время', 'Указать место, если оффлайн', 'Получить подтверждение'],
  stubNote:
    'Слоты, место и подтверждение появятся в следующей версии. Пока это заглушка — но формат уже выбран.',
  backHome: 'На главную',
  chooseAnother: 'Выбрать другой формат',
}

export function findFormat(id: unknown): Format | undefined {
  return formats.find((format) => format.id === id)
}
