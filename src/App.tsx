import React, { Suspense, useEffect } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { ImageUploader } from '@/components/ImageUploader'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { CanvasFallback } from '@/components/ui/CanvasFallback'
import { formatBytes, formatDimensions } from '@/utils'
import { useRoute, type Route } from '@/core/router/hashRouter'
import { tools, findTool, lazyComponentFor } from '@/tools/registry'
import { PreviewLayout } from '@/components/PreviewLayout'
import { APP_INITIALS, APP_NAME } from '@/core/branding'
import type { SliceMode } from '@/types'

// ─── Route ↔ Mode Sync ────────────────────────────────────────────────────────

/**
 * The hash route is the single source of truth for "which tool". Mode is
 * derived from it, one-way. Tabs / programmatic navigation should call
 * setRoute(); never call setMode('convert') directly to switch tools.
 */
function useRouteSync(): { route: Route; setRoute: (r: Route) => void } {
  const [route, setRoute] = useRoute()
  const { mode, setMode } = useSlicerStore()

  useEffect(() => {
    if (route === '/converter' && mode !== 'convert') {
      setMode('convert')
    } else if (route === '/slicer' && mode === 'convert') {
      setMode('grid')
    }
  }, [route, mode, setMode])

  return { route, setRoute }
}

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────

function useGlobalShortcuts(): void {
  const { mode, undo, redo } = useSlicerStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (mode !== 'custom') return
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const mod = isMac ? e.metaKey : e.ctrlKey
      if (!mod) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, undo, redo])
}

// ─── Slice mode toggle ────────────────────────────────────────────────────────

const SLICE_MODE_LABELS: Record<Exclude<SliceMode, 'convert'>, string> = {
  grid: '⊞ Grid',
  custom: '⬚ Custom',
}

function SliceModeToggle(): React.ReactElement {
  const { mode, setMode } = useSlicerStore()
  return (
    <div className="flex items-center bg-obsidian-900 rounded-lg p-0.5 border border-obsidian-700">
      {(['grid', 'custom'] as const).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`
            px-3 py-1.5 rounded text-xs font-mono font-medium transition-all
            ${
              mode === m
                ? 'bg-obsidian-700 text-obsidian-100 shadow'
                : 'text-obsidian-500 hover:text-obsidian-300'
            }
          `}
        >
          {SLICE_MODE_LABELS[m]}
        </button>
      ))}
    </div>
  )
}

// ─── Tool tabs ────────────────────────────────────────────────────────────────

function ToolTabs({
  route,
  setRoute,
}: {
  route: Route
  setRoute: (r: Route) => void
}): React.ReactElement {
  return (
    <nav
      className="flex items-center bg-obsidian-900 rounded-lg p-0.5 border border-obsidian-700 overflow-x-auto max-w-full"
      aria-label="Available tools"
    >
      {tools.map((t) => (
        <button
          key={t.id}
          onClick={() => setRoute(t.slug as Route)}
          aria-current={route === t.slug ? 'page' : undefined}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-all
            ${
              route === t.slug
                ? 'bg-acid text-obsidian-950 shadow'
                : 'text-obsidian-500 hover:text-obsidian-300'
            }
          `}
        >
          <span aria-hidden="true">{t.icon}</span>
          <span>{t.name.replace('Image ', '')}</span>
        </button>
      ))}
    </nav>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  route,
  setRoute,
}: {
  route: Route
  setRoute: (r: Route) => void
}): React.ReactElement {
  const { imageFile, reset, mode } = useSlicerStore()
  const resetToHome = (): void => {
    reset()
    setRoute('/slicer')
  }

  const handleMasterReset = (): void => {
    const confirmed = window.confirm(
      'Clear the current image, custom regions, generated slices, and canvas view?'
    )
    if (confirmed) resetToHome()
  }

  return (
    <header className="bg-obsidian-900/80 backdrop-blur-sm border-b border-obsidian-800 flex-shrink-0 safe-area-top">
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 bg-acid rounded flex items-center justify-center flex-shrink-0">
            <span className="text-obsidian-950 text-xs font-bold">{APP_INITIALS}</span>
          </div>
          <span className="font-display font-bold text-obsidian-100 text-base sm:text-lg tracking-tight">
            {APP_NAME}
          </span>
          {imageFile && (
            <div className="hidden lg:flex items-center gap-2 ml-3 min-w-0">
              <span className="text-obsidian-700">·</span>
              <span className="text-xs font-mono text-obsidian-500 truncate max-w-[12rem]">
                {imageFile.file.name}
              </span>
              <span className="text-xs font-mono text-obsidian-600">
                {formatDimensions(imageFile.width, imageFile.height)}
              </span>
              <span className="text-xs font-mono text-obsidian-600">
                {formatBytes(imageFile.sizeBytes)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={resetToHome} title="Back to home">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"
              />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Button>
          <ToolTabs route={route} setRoute={setRoute} />
          {route === '/slicer' && mode !== 'convert' && <SliceModeToggle />}
          {imageFile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMasterReset}
              title="Master reset"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span className="hidden sm:inline">Master Reset</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Tool route renderer ─────────────────────────────────────────────────────

function ToolRoute({ route }: { route: Route }): React.ReactElement {
  const tool = findTool(route) ?? tools[0]
  const Component = lazyComponentFor(tool)
  return (
    <Suspense fallback={<CanvasFallback />}>
      <Component />
    </Suspense>
  )
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export function App(): React.ReactElement {
  const { stage } = useSlicerStore()
  const { route, setRoute } = useRouteSync()
  useGlobalShortcuts()

  if (stage === 'upload') {
    return (
      <div className="flex flex-col min-h-screen bg-obsidian-950 text-obsidian-100 font-body">
        <ImageUploader />
        <Toast />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen h-screen bg-obsidian-950 text-obsidian-100 font-body overflow-hidden">
      <Header route={route} setRoute={setRoute} />
      {stage === 'configure' ? (
        <ToolRoute route={route} />
      ) : (
        <PreviewLayout />
      )}
      <Toast />
    </div>
  )
}
