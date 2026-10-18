// Конфиг lint-staged: https://github.com/lint-staged/lint-staged
// Typecheck-задачи объявлены функциями, чтобы lint-staged не дописывал
// список файлов в команду — проектный typecheck не принимает явные пути.
export default {
  'apps/frontend/**/*.{ts,vue}': [
    'oxlint',
    () => 'vue-tsc --noEmit -p apps/frontend/tsconfig.json',
  ],
  'apps/backend/**/*.ts': [
    'oxlint',
    () => 'tsc --noEmit -p apps/backend/tsconfig.json',
  ],
}
