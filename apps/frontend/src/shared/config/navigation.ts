export interface NavLink {
  label: string
  to: string
}

export const navLinks: NavLink[] = [
  { label: 'Форматы', to: '/#formats' },
  { label: 'Как это работает', to: '/#how' },
  { label: 'FAQ', to: '/#faq' },
]
