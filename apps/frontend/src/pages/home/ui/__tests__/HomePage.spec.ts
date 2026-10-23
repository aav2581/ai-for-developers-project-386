import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HomePage from '../HomePage.vue'
import { routerAt } from '@/__tests__/test-router'

async function mountHome() {
  const router = await routerAt('/')
  return mount(HomePage, { global: { plugins: [router] } })
}

describe('HomePage', () => {
  it('показывает героя и бренд', async () => {
    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('Привет, я Ванёк')
    expect(wrapper.text()).toContain('Друг на час')
  })

  it('ведёт на запись в каждом формате', async () => {
    const wrapper = await mountHome()
    const hrefs = wrapper.findAll('a').map((link) => link.attributes('href'))

    expect(hrefs).toContain('/book')
    expect(hrefs).toContain('/book?format=online')
    expect(hrefs).toContain('/book?format=offline')
    expect(hrefs).toContain('/book?format=group')
  })

  it('отвечает на вопросы о цене и о том, кто такой Ванёк', async () => {
    const wrapper = await mountHome()

    expect(wrapper.text()).toContain('Сколько стоит час?')
    expect(wrapper.text()).toContain('Кто такой Ванёк?')
  })
})
