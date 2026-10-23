import { defineConfig } from '@hey-api/openapi-ts'

// Генерируется из api/contract.tsp через `npm run codegen:oas`.
// Ручные правки файлов в src/shared/api/sdk/ запрещены — это сгенерированный артефакт.
export default defineConfig({
  input: '../../api/openapi.yaml',
  output: {
    path: './src/shared/api/sdk',
    format: null,
    lint: null,
  },
  plugins: ['@hey-api/typescript', '@hey-api/sdk'],
})
