import React, { useRef } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import {
  serializeProject,
  parseProjectFile,
  projectFilename,
} from '@/core/services/projectService'

const MIN_ZOOM = 0.25
const MAX_ZOOM = 8
const ZOOM_STEP = 1.25

function ToolButton({
  active,
  title,
  onClick,
  children,
  disabled,
}: {
  active?: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}): React.ReactElement {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-8 w-8 items-center justify-center rounded-md border text-xs font-mono
        transition-colors disabled:opacity-30 disabled:cursor-not-allowed
        ${
          active
            ? 'border-acid/50 bg-acid/10 text-acid'
            : 'border-obsidian-700 bg-obsidian-900/70 text-obsidian-300 hover:enabled:border-obsidian-500 hover:enabled:text-obsidian-100'
        }
      `}
    >
      {children}
    </button>
  )
}

export function Toolbar(): React.ReactElement {
  const {
    viewport,
    setViewport,
    resetViewport,
    imageFile,
    regions,
    gridConfig,
    replaceRegions,
    setGridConfig,
    setError,
  } = useSlicerStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const zoomBy = (factor: number): void => {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewport.zoom * factor))
    setViewport({ zoom: next })
  }

  const handleSaveProject = async (): Promise<void> => {
    const blob = serializeProject({
      imageMeta: imageFile
        ? {
            name: imageFile.file.name,
            width: imageFile.width,
            height: imageFile.height,
            sizeBytes: imageFile.sizeBytes,
            mimeType: imageFile.mimeType,
          }
        : null,
      regions,
      gridConfig,
    })
    // Dynamic import — file-saver only loads when the user actually saves.
    const { saveAs } = await import('file-saver')
    saveAs(blob, projectFilename(imageFile?.file.name))
  }

  const handleLoadProject = async (file: File): Promise<void> => {
    try {
      const project = await parseProjectFile(file)
      replaceRegions(project.regions)
      setGridConfig(project.gridConfig)
    } catch (err) {
      setError({
        code: 'PROJECT_LOAD_ERROR',
        message: err instanceof Error ? err.message : 'Failed to load project file',
      })
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-lg border border-obsidian-800 bg-obsidian-900/60 p-1.5 backdrop-blur-sm"
      role="toolbar"
      aria-label="Canvas tools"
    >
      {/* Zoom group */}
      <div className="flex items-center gap-1">
        <ToolButton title="Zoom out" onClick={() => zoomBy(1 / ZOOM_STEP)}>
          −
        </ToolButton>
        <button
          type="button"
          onClick={resetViewport}
          title="Reset view (100%)"
          className="px-2 h-8 rounded-md border border-obsidian-700 bg-obsidian-900/70 text-xs font-mono text-obsidian-300 hover:border-obsidian-500 hover:text-obsidian-100 min-w-[3.5rem]"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <ToolButton title="Zoom in" onClick={() => zoomBy(ZOOM_STEP)}>
          +
        </ToolButton>
      </div>

      <div className="h-6 w-px bg-obsidian-800 mx-1" />

      {/* Toggles */}
      <ToolButton
        title="Toggle grid overlay"
        active={viewport.showGrid}
        onClick={() => setViewport({ showGrid: !viewport.showGrid })}
      >
        ⊞
      </ToolButton>
      <ToolButton
        title="Snap to grid"
        active={viewport.snapToGrid}
        onClick={() => setViewport({ snapToGrid: !viewport.snapToGrid })}
        disabled={!viewport.showGrid}
      >
        ⊟
      </ToolButton>
      <ToolButton
        title="Highlight overlapping regions"
        active={viewport.showOverlap}
        onClick={() => setViewport({ showOverlap: !viewport.showOverlap })}
      >
        ◐
      </ToolButton>

      <input
        type="number"
        min={4}
        max={512}
        value={viewport.gridSize}
        onChange={(e) =>
          setViewport({ gridSize: Math.max(4, parseInt(e.target.value, 10) || 32) })
        }
        title="Grid step in image pixels"
        className="h-8 w-14 rounded-md border border-obsidian-700 bg-obsidian-900/70 px-2 text-xs font-mono text-obsidian-200 focus:outline-none focus:border-acid/50"
      />

      <div className="h-6 w-px bg-obsidian-800 mx-1" />

      {/* Project I/O */}
      <button
        type="button"
        onClick={() => void handleSaveProject()}
        title="Save project as JSON"
        className="h-8 px-2.5 rounded-md border border-obsidian-700 bg-obsidian-900/70 text-xs font-mono text-obsidian-300 hover:border-obsidian-500 hover:text-obsidian-100"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        title="Load project from JSON"
        className="h-8 px-2.5 rounded-md border border-obsidian-700 bg-obsidian-900/70 text-xs font-mono text-obsidian-300 hover:border-obsidian-500 hover:text-obsidian-100"
      >
        Load
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleLoadProject(f)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }}
      />
    </div>
  )
}
