import { buildApp } from './app.js'

const port = Number(process.env.PORT ?? 3000)
const dbPath = process.env.DB_PATH ?? 'data/app.db'

const app = await buildApp({ dbPath })

app
  .listen({ port, host: '0.0.0.0' })
  .catch((error: unknown) => {
    app.log.error(error)
    process.exit(1)
  })
