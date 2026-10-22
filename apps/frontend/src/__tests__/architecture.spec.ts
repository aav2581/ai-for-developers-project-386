import { describe, expect, it } from 'vitest'

const modules = import.meta.glob('/src/**/*.{ts,vue}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const layers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'] as const
type Layer = (typeof layers)[number]

const slicedLayers = new Set<Layer>(['entities', 'features', 'widgets', 'pages'])

function isLayer(value: string | undefined): value is Layer {
  return layers.includes(value as Layer)
}

function layerOf(path: string): Layer | undefined {
  const first = path.split('/')[2]
  return isLayer(first) ? first : undefined
}

function sliceOf(path: string): string | undefined {
  return path.split('/')[3]
}

function importsOf(source: string): string[] {
  return [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
}

const files = Object.entries(modules)
  .map(([path, source]) => ({ path, source, layer: layerOf(path), slice: sliceOf(path) }))
  .filter((file): file is { path: string; source: string; layer: Layer; slice: string | undefined } =>
    file.layer !== undefined,
  )

describe('границы FSD', () => {
  it('импортирует только слои не выше своего', () => {
    const violations: string[] = []

    for (const file of files) {
      for (const specifier of importsOf(file.source)) {
        if (!specifier.startsWith('@/')) {
          continue
        }

        const targetLayer = specifier.slice(2).split('/')[0]
        if (!isLayer(targetLayer)) {
          continue
        }

        if (layers.indexOf(targetLayer) > layers.indexOf(file.layer)) {
          violations.push(`${file.path} → ${specifier}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it('ходит в чужие слайсы только через публичный API', () => {
    const violations: string[] = []

    for (const file of files) {
      for (const specifier of importsOf(file.source)) {
        if (!specifier.startsWith('@/')) {
          continue
        }

        const parts = specifier.slice(2).split('/')
        const targetLayer = parts[0]
        if (!isLayer(targetLayer)) {
          continue
        }

        if (parts.length !== 2) {
          violations.push(`${file.path} → ${specifier}: глубокий импорт`)
          continue
        }

        if (
          slicedLayers.has(targetLayer) &&
          targetLayer === file.layer &&
          parts[1] !== file.slice
        ) {
          violations.push(`${file.path} → ${specifier}: импорт соседнего слайса`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})
