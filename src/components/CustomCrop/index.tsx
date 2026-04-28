import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { generateId, clamp } from '@/utils'
import type { CustomRegion, ImageFile } from '@/types'

const HANDLE_SIZE = 8
const MIN_REGION_SIZE = 0.02

// ─── Canvas Drawing ───────────────────────────────────────────────────────────

function drawRegions(
  ctx: CanvasRenderingContext2D,
  regions: CustomRegion[],
  selectedId: string | null,
  w: number,
  h: number,
  focusRect?: { x: number; y: number; w: number; h: number } | null
): void {
  ctx.clearRect(0, 0, w, h)

  // Dim overlay
  ctx.save()
  ctx.fillStyle = focusRect ? 'rgba(8,10,15,0.68)' : 'rgba(8,10,15,0.16)'
  ctx.fillRect(0, 0, w, h)
  if (focusRect && focusRect.w > 0 && focusRect.h > 0) {
    const fx = focusRect.x * w
    const fy = focusRect.y * h
    const fw = focusRect.w * w
    const fh = focusRect.h * h
    ctx.clearRect(fx, fy, fw, fh)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.strokeRect(fx + 0.5, fy + 0.5, Math.max(fw - 1, 0), Math.max(fh - 1, 0))
  }
  ctx.restore()

  // Regions
  regions.forEach((region, idx) => {
    const x = region.x * w
    const y = region.y * h
    const rw = region.width * w
    const rh = region.height * h
    const isSelected = region.id === selectedId

    ctx.fillStyle = isSelected ? 'rgba(198,241,53,0.12)' : 'rgba(56,189,248,0.08)'
    ctx.fillRect(x, y, rw, rh)

    ctx.strokeStyle = isSelected ? '#c6f135' : '#38bdf8'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.setLineDash(isSelected ? [] : [4, 4])
    ctx.strokeRect(x, y, rw, rh)
    ctx.setLineDash([])

    ctx.fillStyle = isSelected ? '#c6f135' : '#38bdf8'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(region.label || `R${idx + 1}`, x + 4, y + 4)

    if (isSelected) {
      const corners = [
        { x, y },
        { x: x + rw, y },
        { x, y: y + rh },
        { x: x + rw, y: y + rh },
      ]
      corners.forEach((c) => {
        ctx.fillStyle = '#c6f135'
        ctx.fillRect(c.x - HANDLE_SIZE / 2, c.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      })
    }
  })
}

function drawSelectionInfo(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  imageFile: ImageFile,
  canvasW: number,
  canvasH: number
): void {
  const pw = Math.round(rect.w * imageFile.width)
  const ph = Math.round(rect.h * imageFile.height)
  const px = Math.round(rect.x * imageFile.width)
  const py = Math.round(rect.y * imageFile.height)
  const line1 = `${pw} × ${ph} px`
  const line2 = `${Math.round(rect.w * 100)}% × ${Math.round(rect.h * 100)}%  at (${px}, ${py})`

  ctx.save()
  ctx.font = 'bold 10px JetBrains Mono, monospace'

  const pad = 8
  const lineH = 14
  const boxH = pad * 2 + lineH * 2 + 2
  const boxW = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + pad * 2

  const selCX = (rect.x + rect.w / 2) * canvasW
  const selTop = rect.y * canvasH
  const selBot = (rect.y + rect.h) * canvasH
  let bx = selCX - boxW / 2
  let by = selTop - boxH - 6
  if (by < 4) by = selBot + 6
  bx = clamp(bx, 4, canvasW - boxW - 4)
  by = clamp(by, 4, canvasH - boxH - 4)

  ctx.fillStyle = 'rgba(8,10,15,0.88)'
  ctx.fillRect(bx, by, boxW, boxH)
  ctx.strokeStyle = 'rgba(198,241,53,0.5)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1)

  ctx.fillStyle = '#c6f135'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(line1, bx + boxW / 2, by + pad)

  ctx.fillStyle = 'rgba(198,241,53,0.65)'
  ctx.font = '9px JetBrains Mono, monospace'
  ctx.fillText(line2, bx + boxW / 2, by + pad + lineH + 2)

  ctx.restore()
}

// ─── Hit Testing ──────────────────────────────────────────────────────────────

function getCornerHit(
  region: CustomRegion,
  nx: number,
  ny: number,
  w: number,
  h: number
): string | null {
  const rx = region.x * w
  const ry = region.y * h
  const rw = region.width * w
  const rh = region.height * h
  const mx = nx * w
  const my = ny * h
  const hs = HANDLE_SIZE + 4

  const corners: Record<string, { x: number; y: number }> = {
    nw: { x: rx, y: ry },
    ne: { x: rx + rw, y: ry },
    sw: { x: rx, y: ry + rh },
    se: { x: rx + rw, y: ry + rh },
  }
  for (const [name, pos] of Object.entries(corners)) {
    if (Math.abs(mx - pos.x) <= hs && Math.abs(my - pos.y) <= hs) return name
  }
  return null
}

function getRegionHit(regions: CustomRegion[], nx: number, ny: number): CustomRegion | null {
  for (let i = regions.length - 1; i >= 0; i--) {
    const r = regions[i]
    if (nx >= r.x && nx <= r.x + r.width && ny >= r.y && ny <= r.y + r.height) return r
  }
  return null
}

// ─── Drag State ───────────────────────────────────────────────────────────────

interface DragState {
  type: 'drawing' | 'moving' | 'resizing'
  startX: number
  startY: number
  regionId?: string
  corner?: string
  initialRegion?: CustomRegion
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomCropEditor(): React.ReactElement | null {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const [currentDraw, setCurrentDraw] = useState<{
    x: number; y: number; w: number; h: number
  } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  const {
    imageFile,
    regions,
    selectedRegionId,
    addRegion,
    updateRegion,
    selectRegion,
    removeRegion,
    commitHistory,
  } = useSlicerStore()

  // ── Normalised coordinates ────────────────────────────────────────────────

  const getNormalized = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { nx: number; ny: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { nx: 0, ny: 0 }
      const rect = canvas.getBoundingClientRect()
      return {
        nx: clamp((e.clientX - rect.left) / rect.width, 0, 1),
        ny: clamp((e.clientY - rect.top) / rect.height, 0, 1),
      }
    },
    []
  )

  // ── Redraw ────────────────────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height

    const selectedRegion = regions.find((r) => r.id === selectedRegionId) ?? null
    const focusRect = isDrawing
      ? currentDraw
      : selectedRegion
        ? { x: selectedRegion.x, y: selectedRegion.y, w: selectedRegion.width, h: selectedRegion.height }
        : null

    drawRegions(ctx, regions, selectedRegionId, w, h, focusRect)

    if (currentDraw && isDrawing) {
      const { x, y, w: rw, h: rh } = currentDraw
      ctx.strokeStyle = '#c6f135'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 3])
      ctx.strokeRect(x * w, y * h, rw * w, rh * h)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(198,241,53,0.08)'
      ctx.fillRect(x * w, y * h, rw * w, rh * h)
    }

    if (currentDraw && isDrawing && imageFile && currentDraw.w > 0.005 && currentDraw.h > 0.005) {
      drawSelectionInfo(ctx, currentDraw, imageFile, w, h)
    }
  }, [regions, selectedRegionId, currentDraw, isDrawing, imageFile])

  // ── Canvas sizing ─────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (canvasRef.current) {
        canvasRef.current.width = width
        canvasRef.current.height = height
        redraw()
      }
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw])

  useEffect(() => { redraw() }, [redraw])

  // ── Keyboard: Delete / Backspace ──────────────────────────────────────────

  useEffect(() => {
    if (!selectedRegionId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      removeRegion(selectedRegionId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedRegionId, removeRegion])

  // ── Keyboard: Escape cancels in-progress draw ─────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragRef.current?.type === 'drawing') {
        dragRef.current = null
        setCurrentDraw(null)
        setIsDrawing(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Mouse handlers ────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { nx, ny } = getNormalized(e)

      if (selectedRegionId) {
        const sel = regions.find((r) => r.id === selectedRegionId)
        if (sel && canvasRef.current) {
          const corner = getCornerHit(sel, nx, ny, canvasRef.current.width, canvasRef.current.height)
          if (corner) {
            dragRef.current = { type: 'resizing', startX: nx, startY: ny, regionId: sel.id, corner, initialRegion: { ...sel } }
            return
          }
        }
      }

      const hit = getRegionHit(regions, nx, ny)
      if (hit) {
        selectRegion(hit.id)
        dragRef.current = { type: 'moving', startX: nx, startY: ny, regionId: hit.id, initialRegion: { ...hit } }
        return
      }

      selectRegion(null)
      dragRef.current = { type: 'drawing', startX: nx, startY: ny }
      setIsDrawing(true)
    },
    [getNormalized, regions, selectedRegionId, selectRegion]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag) return
      const { nx, ny } = getNormalized(e)

      if (drag.type === 'drawing') {
        setCurrentDraw({
          x: Math.min(drag.startX, nx),
          y: Math.min(drag.startY, ny),
          w: Math.abs(nx - drag.startX),
          h: Math.abs(ny - drag.startY),
        })
      } else if (drag.type === 'moving' && drag.regionId && drag.initialRegion) {
        const dx = nx - drag.startX
        const dy = ny - drag.startY
        const r = drag.initialRegion
        updateRegion(drag.regionId, {
          x: clamp(r.x + dx, 0, 1 - r.width),
          y: clamp(r.y + dy, 0, 1 - r.height),
        })
      } else if (drag.type === 'resizing' && drag.regionId && drag.initialRegion && drag.corner) {
        const r = drag.initialRegion
        let { x, y, width, height } = r
        if (drag.corner.includes('e')) width = clamp(r.x + r.width + (nx - drag.startX) - r.x, MIN_REGION_SIZE, 1 - x)
        if (drag.corner.includes('s')) height = clamp(r.y + r.height + (ny - drag.startY) - r.y, MIN_REGION_SIZE, 1 - y)
        if (drag.corner.includes('w')) {
          const newX = clamp(r.x + (nx - drag.startX), 0, r.x + r.width - MIN_REGION_SIZE)
          width = r.x + r.width - newX
          x = newX
        }
        if (drag.corner.includes('n')) {
          const newY = clamp(r.y + (ny - drag.startY), 0, r.y + r.height - MIN_REGION_SIZE)
          height = r.y + r.height - newY
          y = newY
        }
        updateRegion(drag.regionId, { x, y, width, height })
      }
    },
    [getNormalized, updateRegion]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!drag) return

      if (drag.type === 'drawing') {
        const { nx, ny } = getNormalized(e)
        const x = Math.min(drag.startX, nx)
        const y = Math.min(drag.startY, ny)
        const w = Math.abs(nx - drag.startX)
        const h = Math.abs(ny - drag.startY)
        if (w >= MIN_REGION_SIZE && h >= MIN_REGION_SIZE) {
          const newRegion: CustomRegion = {
            id: generateId(),
            label: `Region ${regions.length + 1}`,
            x, y, width: w, height: h,
          }
          addRegion(newRegion)
          selectRegion(newRegion.id)
        }
        setCurrentDraw(null)
        setIsDrawing(false)
      } else if (drag.type === 'moving' || drag.type === 'resizing') {
        commitHistory()
      }

      dragRef.current = null
    },
    [getNormalized, regions.length, addRegion, selectRegion, commitHistory]
  )

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => { handleMouseUp(e) },
    [handleMouseUp]
  )

  // ── Hint text ─────────────────────────────────────────────────────────────

  const hintText = isDrawing
    ? 'Release to create slice  ·  Esc to cancel'
    : selectedRegionId
      ? 'Drag to move  ·  Corners to resize  ·  Del to remove'
      : 'Drag on the image to draw a slice  ·  Click a slice to select it'

  if (!imageFile) return null

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ paddingBottom: `${(imageFile.height / imageFile.width) * 100}%` }}
    >
      <img
        src={imageFile.url}
        alt="Source"
        className="absolute inset-0 w-full h-full object-contain rounded-lg"
        draggable={false}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-lg cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        aria-label="Custom crop canvas — drag to draw slice regions"
        role="img"
      />
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className="rounded-md border border-obsidian-700/80 bg-obsidian-950/85 px-3 py-2 text-xs font-mono text-obsidian-300 shadow-lg backdrop-blur-sm">
          {hintText}
        </div>
      </div>
    </div>
  )
}
