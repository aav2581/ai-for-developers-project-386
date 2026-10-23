import { describe, it, expect } from 'vitest'
import type { DOMWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import BookingPage from '../BookingPage.vue'
import { routerAt } from '@/__tests__/test-router'

async function mountBooking(path: string) {
  const router = await routerAt(path)
  return mount(BookingPage, { global: { plugins: [router] } })
}

const FORMAT_TITLES = ['Онлайн', 'Оффлайн', 'Групповой час']

function findCards(wrapper: Awaited<ReturnType<typeof mountBooking>>) {
  return wrapper.findAll('button[data-format-id]')
}

function selectedFormatIds(cards: Array<DOMWrapper<Element>>): string[] {
  return cards.filter((c) => c.attributes('aria-pressed') === 'true').map((c) => c.attributes('data-format-id') ?? '')
}

describe('BookingPage — шаг «выбор формата»', () => {
  it('на /book показывает три карточки без выбора и disabled «Дальше»', async () => {
    const wrapper = await mountBooking('/book')

    const cards = findCards(wrapper)
    expect(cards).toHaveLength(3)

    const titles = cards.map((c) => c.text())
    expect(titles.join(' ')).toContain('Онлайн')
    expect(titles.join(' ')).toContain('Оффлайн')
    expect(titles.join(' ')).toContain('Групповой час')

    expect(selectedFormatIds(cards)).toEqual([])

    const forward = wrapper.find('button[data-action="forward"]')
    expect(forward.exists()).toBe(true)
    expect(forward.attributes('disabled')).toBeDefined()
  })

  it('на /book?format=group помечает групповой формат и активирует «Дальше»', async () => {
    const wrapper = await mountBooking('/book?format=group')

    const cards = findCards(wrapper)
    expect(cards).toHaveLength(3)
    expect(selectedFormatIds(cards)).toEqual(['group'])

    const forward = wrapper.find('button[data-action="forward"]')
    expect(forward.attributes('disabled')).toBeUndefined()
  })

  it('на невалидном ?format=party показывает три карточки без выбора и disabled «Дальше»', async () => {
    const wrapper = await mountBooking('/book?format=party')

    const cards = findCards(wrapper)
    expect(cards).toHaveLength(3)
    expect(selectedFormatIds(cards)).toEqual([])
    expect(wrapper.find('button[data-action="forward"]').attributes('disabled')).toBeDefined()
  })

  it('клик по карточке «Онлайн» обновляет ?format=online и помечает её', async () => {
    const wrapper = await mountBooking('/book')

    const onlineCard = wrapper.find('button[data-format-id="online"]')
    await onlineCard.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Дальше')
    expect(selectedFormatIds(findCards(wrapper))).toEqual(['online'])
    expect(wrapper.find('button[data-action="forward"]').attributes('disabled')).toBeUndefined()
  })

  it('«Дальше» переключает шаг: в URL появляется step=evening, формат сохраняется', async () => {
    const router = await routerAt('/book?format=group')
    const wrapper = mount(BookingPage, { global: { plugins: [router] } })
    await router.isReady()

    // click-обработчик в SFC не дожидается async-функции в Vue Test Utils;
    // вызываем метод напрямую, как если бы триггер его дождался.
    await (wrapper.vm as unknown as { goForward: () => Promise<void> }).goForward()

    expect(router.currentRoute.value.fullPath).toBe('/book?format=group&step=evening')
    // Шаг формата помечен как пройденный — группа осталась выбранной.
    expect(wrapper.text()).toMatch(/Групповой час|выбран/i)
  })

  it('возврат со шага «вечер» снимает step=evening и возвращает на выбор формата', async () => {
    const wrapper = await mountBooking('/book?format=group&step=evening')
    const router = (wrapper.vm as unknown as { $router: { currentRoute: { value: { fullPath: string } } } }).$router

    const back = wrapper.find('button[data-action="back"]')
    expect(back.exists()).toBe(true)
    await back.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.fullPath).toBe('/book?format=group')
    expect(selectedFormatIds(findCards(wrapper))).toEqual(['group'])
  })

  it('сохраняет имена всех трёх форматов (онлайн/оффлайн/групповой)', async () => {
    const wrapper = await mountBooking('/book')
    const text = wrapper.text()
    for (const title of FORMAT_TITLES) {
      expect(text).toContain(title)
    }
  })
})
