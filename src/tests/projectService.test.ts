import { serializeProject, parseProjectFile, PROJECT_VERSION } from '@/core/services/projectService'
import type { CustomRegion, GridConfig } from '@/types'

const sampleRegions: CustomRegion[] = [
  { id: 'a', label: 'Hero', x: 0, y: 0, width: 0.5, height: 0.5, zIndex: 1 },
  { id: 'b', label: 'Footer', x: 0.5, y: 0.5, width: 0.5, height: 0.5, zIndex: 2 },
]
const gridConfig: GridConfig = { rows: 2, cols: 2, paddingPx: 0, outputFormat: 'png' }

function blobToFile(blob: Blob, name = 'project.json'): File {
  return new File([blob], name, { type: 'application/json' })
}

describe('projectService', () => {
  test('serialize → parse round-trip preserves regions and grid', async () => {
    const blob = serializeProject({
      imageMeta: { name: 'a.png', width: 100, height: 100, sizeBytes: 1, mimeType: 'image/png' },
      regions: sampleRegions,
      gridConfig,
    })
    const parsed = await parseProjectFile(blobToFile(blob))
    expect(parsed.version).toBe(PROJECT_VERSION)
    expect(parsed.regions).toEqual(sampleRegions)
    expect(parsed.gridConfig).toEqual(gridConfig)
  })

  test('rejects invalid version', async () => {
    const bad = new Blob([JSON.stringify({ version: 999, regions: [], gridConfig })], {
      type: 'application/json',
    })
    await expect(parseProjectFile(blobToFile(bad))).rejects.toThrow(/Unsupported project version/)
  })

  test('rejects malformed JSON', async () => {
    const bad = new Blob(['{not valid'], { type: 'application/json' })
    await expect(parseProjectFile(blobToFile(bad))).rejects.toThrow(/parse project JSON/)
  })

  test('rejects missing required fields', async () => {
    const bad = new Blob([JSON.stringify({ version: PROJECT_VERSION })], {
      type: 'application/json',
    })
    await expect(parseProjectFile(blobToFile(bad))).rejects.toThrow()
  })
})
