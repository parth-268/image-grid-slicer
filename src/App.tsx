import React, { Suspense, useEffect } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { ImageUploader } from '@/components/ImageUploader'
import { Toast } from '@/components/ui/Toast'
import { CanvasFallback } from '@/components/ui/CanvasFallback'
import { formatBytes, formatDimensions } from '@/utils'
import { useRoute, type Route } from '@/core/router/hashRouter'
import { tools, findTool, lazyComponentFor } from '@/tools/registry'
import { PreviewLayout } from '@/components/PreviewLayout'
import { APP_INITIALS, APP_NAME } from '@/core/branding'
import type { SliceMode } from '@/types'

// ─── Route ↔ Mode Sync ────────────────────────────────────────────────────────

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
      const platformStr =
        (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData
          ?.platform ?? navigator.platform ?? ''
      const isMac = /mac/i.test(platformStr)
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

// ─── Slice Mode Toggle ────────────────────────────────────────────────────────

const SLICE_MODE_META: Record<Exclude<SliceMode, 'convert'>, { icon: React.ReactNode; label: string }> = {
  grid: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    label: 'Grid',
  },
  custom: {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    label: 'Custom',
  },
}

function SliceModeToggle(): React.ReactElement {
  const { mode, setMode } = useSlicerStore()
  return (
    <div className="flex items-center bg-obsidian-925 rounded-lg p-0.5 border border-obsidian-800 gap-0.5">
      {(['grid', 'custom'] as const).map((m) => {
        const meta = SLICE_MODE_META[m]
        const active = mode === m
        return (
          <button
            key={m}
            onClick={() => setMode(m)}
            title={`${meta.label} mode`}
            aria-pressed={active}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium transition-all duration-150',
              active
                ? 'bg-obsidian-800 text-obsidian-100 shadow-sm'
                : 'text-obsidian-500 hover:text-obsidian-300',
            ].join(' ')}
          >
            {meta.icon}
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Tool Tabs ────────────────────────────────────────────────────────────────

function ToolTabs({
  route,
  setRoute,
}: {
  route: Route
  setRoute: (r: Route) => void
}): React.ReactElement {
  return (
    <nav
      className="flex items-center bg-obsidian-925 rounded-lg p-0.5 border border-obsidian-800 gap-0.5 overflow-x-auto max-w-full"
      aria-label="Available tools"
    >
      {tools.map((t) => {
        const active = route === t.slug
        return (
          <button
            key={t.id}
            onClick={() => setRoute(t.slug as Route)}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium whitespace-nowrap transition-all duration-150',
              active
                ? 'bg-acid text-obsidian-975 shadow-glow-acid-sm'
                : 'text-obsidian-500 hover:text-obsidian-200 hover:bg-obsidian-800/50',
            ].join(' ')}
          >
            <span aria-hidden="true" className="hidden sm:inline">{t.icon}</span>
            <span>{t.name.replace('Image ', '')}</span>
          </button>
        )
      })}
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

  const handleMasterReset = (): void => {
    if (window.confirm('Clear the current image, regions, slices, and canvas state?')) {
      reset()
      setRoute('/slicer')
    }
  }

  const goHome = (): void => {
    reset()
    setRoute('/slicer')
  }

  return (
    <header className="flex-shrink-0 border-b border-obsidian-800/80 bg-obsidian-950/90 backdrop-blur-md safe-area-top shadow-inner-bright">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 gap-2 min-h-[48px]">

        {/* Logo — acts as home */}
        <button
          type="button"
          onClick={goHome}
          title="Go home"
          className="flex items-center gap-2.5 min-w-0 flex-shrink-0 group rounded-lg px-1 -mx-1 transition-opacity hover:opacity-80"
        >
          <div className="w-7 h-7 bg-acid rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow-acid-sm">
            <span className="text-obsidian-975 text-[11px] font-bold font-mono leading-none">{APP_INITIALS}</span>
          </div>
          <span className="font-display font-bold text-obsidian-100 text-sm sm:text-base tracking-tight leading-none">
            {APP_NAME}
          </span>
        </button>

        {/* File info chip — only on wider screens when image loaded */}
        {imageFile && (
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-obsidian-600 min-w-0">
            <span className="text-obsidian-700">·</span>
            <span className="truncate max-w-[10rem] text-obsidian-500">{imageFile.file.name}</span>
            <span className="text-obsidian-700">{formatDimensions(imageFile.width, imageFile.height)}</span>
            <span className="text-obsidian-700">{formatBytes(imageFile.sizeBytes)}</span>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 flex-wrap justify-end">
          <ToolTabs route={route} setRoute={setRoute} />

          {route === '/slicer' && mode !== 'convert' && <SliceModeToggle />}

          {imageFile && (
            <button
              type="button"
              onClick={handleMasterReset}
              title="Reset everything"
              aria-label="Master reset"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono
                text-obsidian-500 hover:text-coral hover:bg-coral/10 border border-transparent
                hover:border-coral/20 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Tool Route Renderer ─────────────────────────────────────────────────────

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
      <div className="flex flex-col min-h-screen bg-obsidian-975 text-obsidian-100 font-body">
        <ImageUploader />
        <Toast />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-obsidian-975 text-obsidian-100 font-body overflow-hidden">
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
