import { createRouter, createWebHistory, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import BookPage from './pages/BookPage.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/book', name: 'book', component: BookPage },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function createAppRouter(history: RouterHistory = createWebHistory()) {
  return createRouter({
    history,
    routes,
    scrollBehavior(to) {
      if (to.hash) {
        return {
          el: to.hash,
          top: 88,
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        }
      }

      return { top: 0 }
    },
  })
}
