import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from '../HelloWorld.vue'

describe('HelloWorld', () => {
  it('renders the msg prop', () => {
    const wrapper = mount(HelloWorld, { props: { msg: 'Hello' } })
    expect(wrapper.text()).toContain('Hello')
  })

  it('renders the current year', () => {
    const wrapper = mount(HelloWorld, { props: { msg: 'Hello' } })
    expect(wrapper.text()).toContain(String(new Date().getFullYear()))
  })
})
