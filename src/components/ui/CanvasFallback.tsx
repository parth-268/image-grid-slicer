import React from 'react'

export function CanvasFallback(): React.ReactElement {
  return (
    <div className="relative w-full rounded-lg bg-obsidian-900/50 border border-obsidian-800 overflow-hidden">
      <div className="aspect-video animate-pulse" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-mono text-obsidian-500">Loading editor…</span>
      </div>
    </div>
  )
}
