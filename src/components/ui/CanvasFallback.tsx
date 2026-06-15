import React from 'react'

export function CanvasFallback(): React.ReactElement {
  return (
    <div className="relative w-full rounded-xl border border-obsidian-800 overflow-hidden bg-obsidian-925">
      {/* Shimmer skeleton */}
      <div className="aspect-video shimmer-bg" aria-hidden="true" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <svg
          className="w-5 h-5 text-obsidian-700 animate-spin-slow"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        <span className="text-[10px] font-mono text-obsidian-600" aria-live="polite">Loading…</span>
      </div>
    </div>
  )
}
