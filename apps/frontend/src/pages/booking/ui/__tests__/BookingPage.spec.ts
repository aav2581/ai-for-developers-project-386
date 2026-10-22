import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BookingPage from '../BookingPage.vue'
import { routerAt } from '@/__tests__/test-router'

async function mountBooking(path: string) {
  const router = await routerAt(path)
  return mount(BookingPage, { global: { plugins: [router] } })
}

describe('BookingPage', () => {
  it('без формата предлагает выбрать один из трёх', async () => {
    const wrapper = await mountBooking('/book')
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(wrapper.text()).toContain('Сначала выбери формат')
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/book?format=online',
        '/book?format=offline',
        '/book?format=group',
      ]),
    )
  })

  it('показывает выбранный групповой формат', async () => {
    const wrapper = await mountBooking('/book?format=group')

    expect(wrapper.text()).toContain('Групповой час')
    expect(wrapper.text()).toContain('Слоты, место и подтверждение появятся в следующей версии')
  })

  it('не падает на неизвестном формате и снова предлагает выбор', async () => {
    const wrapper = await mountBooking('/book?format=party')

    expect(wrapper.text()).toContain('Сначала выбери формат')
  })
})
