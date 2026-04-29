import { lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react'

/**
 * Tool registry — single source of truth for every utility tool exposed by the
 * app. Adding a new tool is a one-entry change here plus a component module.
 *
 *   1. Add a `Tool` entry below.
 *   2. Use React.lazy so the tool's bundle is only fetched when its route loads.
 *   3. The router (src/core/router) and the home grid both read from this list,
 *      so the tool surfaces everywhere automatically.
 */

export type ToolCategory = 'image' | 'text' | 'data' | 'pdf' | 'misc'
export type ToolStatus = 'stable' | 'beta' | 'planned'

export interface Tool {
  /** Stable identifier — never change after release; used for analytics / persistence. */
  id: string
  /** URL fragment, e.g. `/slicer`. Must start with `/` and be lowercase-kebab. */
  slug: string
  /** Human-readable name. */
  name: string
  /** One-line description for cards and headers. */
  description: string
  /** Single-character / SVG mark rendered in cards. Keep small. */
  icon: ReactNode
  category: ToolCategory
  status: ToolStatus
  /** Lazy-loaded component. Returns the route's full layout. */
  load: () => Promise<{ default: ComponentType }>
  /** Optional keywords for fuzzy search. */
  keywords?: string[]
}

// ── Tool entries ────────────────────────────────────────────────────────────

export const tools: Tool[] = [
  {
    id: 'slicer',
    slug: '/slicer',
    name: 'Image Slicer',
    description: 'Cut images into a grid or freeform regions. Overlapping slices supported.',
    icon: '⊞',
    category: 'image',
    status: 'stable',
    keywords: ['grid', 'crop', 'split', 'tile'],
    load: () => import('@/features/slicer/SlicerLayout'),
  },
  {
    id: 'converter',
    slug: '/converter',
    name: 'Image Converter',
    description: 'Bulk-convert images between PNG, JPEG and WebP.',
    icon: '⇄',
    category: 'image',
    status: 'stable',
    keywords: ['png', 'jpeg', 'webp', 'format'],
    load: () => import('@/features/converter/ConverterLayout'),
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

const slugIndex = new Map(tools.map((t) => [t.slug, t]))

export function findTool(slug: string): Tool | undefined {
  return slugIndex.get(slug)
}

export function defaultTool(): Tool {
  return tools[0]
}

/** React.lazy wrapper memoised per tool, so route remounts re-use the chunk. */
const lazyCache = new Map<string, LazyExoticComponent<ComponentType>>()
export function lazyComponentFor(tool: Tool): LazyExoticComponent<ComponentType> {
  const cached = lazyCache.get(tool.id)
  if (cached) return cached
  const lz = lazy(tool.load) as LazyExoticComponent<ComponentType>
  lazyCache.set(tool.id, lz)
  return lz
}
