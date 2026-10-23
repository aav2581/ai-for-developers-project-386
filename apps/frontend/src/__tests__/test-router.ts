import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@/app/router'

export async function routerAt(path: string) {
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  return router
}
