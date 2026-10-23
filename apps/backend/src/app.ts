import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { registerRoutes } from './server/routes.js'
import { openDb, type Db } from './server/db.js'

export type BuildAppOptions = {
  /** Путь к файлу SQLite или ':memory:' для тестов. По умолчанию ':memory:'. */
  dbPath?: string
  /** Подмена «сейчас» для детерминированных тестов. */
  now?: () => Date
}

declare module 'fastify' {
  interface FastifyInstance {
    now: () => Date
    db: Db
  }
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const now = options.now ?? (() => new Date())
  const db = openDb(options.dbPath ?? ':memory:')

  const app = Fastify({ logger: false })

  app.decorate('now', now)
  app.decorate('db', db)

  await app.register(cors)
  await registerRoutes(app)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
