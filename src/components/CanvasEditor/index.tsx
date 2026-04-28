import React, { useRef, useEffect, useCallback } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { calculateGridCells } from '@/hooks/useGridCalculator'
import type { GridCell } from '@/types'

// ─── Grid Overlay Renderer ────────────────────────────────────────────────────

function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  cells: GridCell[],
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number
): void {
  const scaleX = canvasW / imgW
  const scaleY = canvasH / imgH

  ctx.clearRect(0, 0, canvasW, canvasH)

  // Cell fills
  cells.forEach((cell, i) => {
    const cx = cell.x * scaleX
    const cy = cell.y * scaleY
    const cw = cell.width * scaleX
    const ch = cell.height * scaleY

    // Alternating subtle highlight
    ctx.fillStyle = i % 2 === 0 ? 'rgba(198,241,53,0.04)' : 'rgba(198,241,53,0.02)'
    ctx.fillRect(cx, cy, cw, ch)
  })

  // Grid lines
  ctx.strokeStyle = 'rgba(198,241,53,0.7)'
  ctx.lineWidth = 1
  ctx.setLineDash([])

  const drawn = new Set<string>()
  cells.forEach((cell) => {
    const cx = cell.x * scaleX
    const cy = cell.y * scaleY
    const cw = cell.width * scaleX
    const ch = cell.height * scaleY

    const lines = [
      { x1: cx, y1: cy, x2: cx + cw, y2: cy },       // top
      { x1: cx, y1: cy + ch, x2: cx + cw, y2: cy + ch }, // bottom
      { x1: cx, y1: cy, x2: cx, y2: cy + ch },         // left
      { x1: cx + cw, y1: cy, x2: cx + cw, y2: cy + ch }, // right
    ]

    lines.forEach((l) => {
      const key = `${Math.round(l.x1)},${Math.round(l.y1)},${Math.round(l.x2)},${Math.round(l.y2)}`
      if (drawn.has(key)) return
      drawn.add(key)
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    })

    // Cell label
    ctx.fillStyle = 'rgba(198,241,53,0.5)'
    ctx.font = `${Math.min(10, cw * 0.12)}px JetBrains Mono, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${cell.row + 1},${cell.col + 1}`, cx + cw / 2, cy + ch / 2)
  })

  // Outer border
  ctx.strokeStyle = 'rgba(198,241,53,0.9)'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, canvasW, canvasH)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CanvasEditor(): React.ReactElement | null {
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { imageFile, gridConfig, mode } = useSlicerStore()

  const redraw = useCallback(() => {
    const canvas = overlayRef.current
    if (!canvas || !imageFile || mode !== 'grid') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cells = calculateGridCells(imageFile, gridConfig)
    drawGridOverlay(ctx, cells, canvas.width, canvas.height, imageFile.width, imageFile.height)
  }, [imageFile, gridConfig, mode])

  // Resize observer to keep canvas in sync
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry || !overlayRef.current) return
      const { width, height } = entry.contentRect
      overlayRef.current.width = width
      overlayRef.current.height = height
      redraw()
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  if (!imageFile) return null

  const aspectRatio = imageFile.height / imageFile.width

  return (
    <div className="relative w-full" ref={containerRef} style={{ paddingBottom: `${aspectRatio * 100}%` }}>
      {/* Base image */}
      <img
        src={imageFile.url}
        alt="Source"
        className="absolute inset-0 w-full h-full object-contain rounded-lg"
        draggable={false}
      />
      {/* Grid overlay canvas */}
      {mode === 'grid' && (
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
        />
      )}
    </div>
  )
}
