import React, { useRef, useCallback, useEffect, useState } from 'react'
import { useSlicerStore } from '@/store/slicerStore'
import { generateId } from '@/utils'
import {
  clamp,
  clampRect,
  constrainSquare,
  overlapMap,
  rectFromCorners,
  resizeCorner,
  snapRect,
  type Rect,
  type Point,
} from '@/core/geometry'
import type { CustomRegion, ImageFile, Viewport } from '@/types'

const HANDLE_SIZE_MOUSE = 8
const HANDLE_SIZE_TOUCH = 18
const HANDLE_HIT_PAD_TOUCH = 16
const HANDLE_HIT_PAD_MOUSE = 4
const MIN_REGION_SIZE = 0.005 // normalized image space
const MIN_ZOOM = 0.25
const MAX_ZOOM = 8

const isCoarsePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const COLORS = {
  selected: '#c6f135',
  unselected: '#38bdf8',
  overlap: 'rgba(244,114,182,0.22)',
  grid: 'rgba(255,255,255,0.06)',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DragKind = 'drawing' | 'moving' | 'resizing' | 'panning'

interface DragState {
  kind: DragKind
  start: Point // image-normalized
  regionId?: string
  corner?: string
  initialRegion?: CustomRegion
  /** For panning, store viewport snapshot at drag start. */
  initialPan?: { panX: number; panY: number }
  /** Pixel screen-space anchor at drag start (for panning). */
  screenStart?: Point
}

// ─── Renderer (pure, takes a context + state) ────────────────────────────────

interface RenderState {
  regions: CustomRegion[]
  selectedId: string | null
  draftRect: Rect | null
  pointer: Point | null
  imageFile: ImageFile
  viewport: Viewport
  cssWidth: number
  cssHeight: number
  hoverRegionId: string | null
  handleSize: number
}

function applyViewportTransform(
  ctx: CanvasRenderingContext2D,
  vp: Viewport,
  cssWidth: number,
  cssHeight: number
): void {
  // Pan in CSS px, then scale around top-left. Image fills (0..1)×(0..1) in normalized coords;
  // we render against (0..cssWidth, 0..cssHeight) and viewport stretches around centre.
  const cx = cssWidth / 2
  const cy = cssHeight / 2
  ctx.translate(cx + vp.panX, cy + vp.panY)
  ctx.scale(vp.zoom, vp.zoom)
  ctx.translate(-cx, -cy)
}

function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  imageFile: ImageFile,
  viewport: Viewport,
  cssWidth: number,
  cssHeight: number
): void {
  if (!viewport.showGrid || viewport.gridSize <= 0) return
  const stepX = (viewport.gridSize / imageFile.width) * cssWidth
  const stepY = (viewport.gridSize / imageFile.height) * cssHeight
  if (stepX < 4 || stepY < 4) return // refuse to draw a wall of pixels

  ctx.save()
  ctx.strokeStyle = COLORS.grid
  ctx.lineWidth = 1 / viewport.zoom
  ctx.beginPath()
  for (let x = 0; x <= cssWidth + 0.5; x += stepX) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, cssHeight)
  }
  for (let y = 0; y <= cssHeight + 0.5; y += stepY) {
    ctx.moveTo(0, y)
    ctx.lineTo(cssWidth, y)
  }
  ctx.stroke()
  ctx.restore()
}

function drawOverlapHighlights(
  ctx: CanvasRenderingContext2D,
  regions: CustomRegion[],
  cssWidth: number,
  cssHeight: number
): void {
  const overlaps = overlapMap(regions)
  if (overlaps.length === 0) return
  ctx.save()
  ctx.fillStyle = COLORS.overlap
  for (const o of overlaps) {
    ctx.fillRect(o.x * cssWidth, o.y * cssHeight, o.width * cssWidth, o.height * cssHeight)
  }
  ctx.restore()
}

function drawRegion(
  ctx: CanvasRenderingContext2D,
  region: CustomRegion,
  index: number,
  selected: boolean,
  hovered: boolean,
  cssWidth: number,
  cssHeight: number,
  zoomInv: number,
  handleSize: number
): void {
  const x = region.x * cssWidth
  const y = region.y * cssHeight
  const w = region.width * cssWidth
  const h = region.height * cssHeight
  const accent = region.color ?? (selected ? COLORS.selected : COLORS.unselected)

  // Body fill — stronger when selected, faint when not
  ctx.fillStyle = selected
    ? 'rgba(198,241,53,0.12)'
    : hovered
      ? 'rgba(56,189,248,0.14)'
      : 'rgba(56,189,248,0.06)'
  ctx.fillRect(x, y, w, h)

  // Border
  ctx.save()
  ctx.strokeStyle = accent
  ctx.lineWidth = (selected ? 2 : 1) * zoomInv
  if (region.locked) ctx.setLineDash([2 * zoomInv, 4 * zoomInv])
  else if (!selected) ctx.setLineDash([4 * zoomInv, 4 * zoomInv])
  ctx.strokeRect(x, y, w, h)
  ctx.restore()

  // Label
  const fontPx = 10 * zoomInv
  ctx.fillStyle = accent
  ctx.font = `${fontPx}px JetBrains Mono, ui-monospace, monospace`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(region.label || `R${index + 1}`, x + 4 * zoomInv, y + 4 * zoomInv)

  // Selected handles
  if (selected && !region.locked) {
    const hs = handleSize * zoomInv
    const corners: Point[] = [
      { x, y },
      { x: x + w, y },
      { x, y: y + h },
      { x: x + w, y: y + h },
    ]
    ctx.fillStyle = accent
    for (const c of corners) ctx.fillRect(c.x - hs / 2, c.y - hs / 2, hs, hs)
  }
}

function drawDraftRect(
  ctx: CanvasRenderingContext2D,
  draft: Rect,
  cssWidth: number,
  cssHeight: number,
  zoomInv: number
): void {
  ctx.save()
  ctx.strokeStyle = COLORS.selected
  ctx.lineWidth = 2 * zoomInv
  ctx.setLineDash([6 * zoomInv, 3 * zoomInv])
  ctx.strokeRect(
    draft.x * cssWidth,
    draft.y * cssHeight,
    draft.width * cssWidth,
    draft.height * cssHeight
  )
  ctx.fillStyle = 'rgba(198,241,53,0.08)'
  ctx.fillRect(
    draft.x * cssWidth,
    draft.y * cssHeight,
    draft.width * cssWidth,
    draft.height * cssHeight
  )
  ctx.restore()
}

function drawSizeBadge(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  imageFile: ImageFile,
  cssWidth: number,
  cssHeight: number,
  zoomInv: number
): void {
  if (rect.width < 0.005 || rect.height < 0.005) return
  const pw = Math.round(rect.width * imageFile.width)
  const ph = Math.round(rect.height * imageFile.height)
  const px = Math.round(rect.x * imageFile.width)
  const py = Math.round(rect.y * imageFile.height)
  const line1 = `${pw} × ${ph} px`
  const line2 = `at (${px}, ${py})`

  ctx.save()
  const fontPx = 10 * zoomInv
  ctx.font = `bold ${fontPx}px JetBrains Mono, ui-monospace, monospace`

  const pad = 8 * zoomInv
  const lineH = 14 * zoomInv
  const w1 = ctx.measureText(line1).width
  const w2 = ctx.measureText(line2).width
  const boxW = Math.max(w1, w2) + pad * 2
  const boxH = pad * 2 + lineH * 2

  const cx = (rect.x + rect.width / 2) * cssWidth
  const top = rect.y * cssHeight
  const bot = (rect.y + rect.height) * cssHeight
  let bx = cx - boxW / 2
  let by = top - boxH - 6 * zoomInv
  if (by < 4 * zoomInv) by = bot + 6 * zoomInv
  bx = clamp(bx, 4 * zoomInv, cssWidth - boxW - 4 * zoomInv)
  by = clamp(by, 4 * zoomInv, cssHeight - boxH - 4 * zoomInv)

  ctx.fillStyle = 'rgba(8,10,15,0.88)'
  ctx.fillRect(bx, by, boxW, boxH)
  ctx.strokeStyle = 'rgba(198,241,53,0.5)'
  ctx.lineWidth = 1 * zoomInv
  ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1)

  ctx.fillStyle = '#c6f135'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(line1, bx + boxW / 2, by + pad)
  ctx.fillStyle = 'rgba(198,241,53,0.65)'
  ctx.font = `${fontPx * 0.9}px JetBrains Mono, ui-monospace, monospace`
  ctx.fillText(line2, bx + boxW / 2, by + pad + lineH)
  ctx.restore()
}

function drawPointerGuide(
  ctx: CanvasRenderingContext2D,
  pointer: Point,
  cssWidth: number,
  cssHeight: number,
  zoomInv: number
): void {
  const x = pointer.x * cssWidth
  const y = pointer.y * cssHeight

  ctx.save()
  ctx.strokeStyle = 'rgba(198,241,53,0.72)'
  ctx.lineWidth = 1 * zoomInv
  ctx.setLineDash([4 * zoomInv, 4 * zoomInv])
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, cssHeight)
  ctx.moveTo(0, y)
  ctx.lineTo(cssWidth, y)
  ctx.stroke()

  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(8,10,15,0.9)'
  ctx.lineWidth = 3 * zoomInv
  ctx.beginPath()
  ctx.arc(x, y, 5 * zoomInv, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = COLORS.selected
  ctx.lineWidth = 1.5 * zoomInv
  ctx.beginPath()
  ctx.arc(x, y, 5 * zoomInv, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function render(ctx: CanvasRenderingContext2D, state: RenderState, dpr: number): void {
  const {
    regions,
    selectedId,
    draftRect,
    pointer,
    imageFile,
    viewport,
    cssWidth,
    cssHeight,
    hoverRegionId,
    handleSize,
  } = state

  // Reset to identity, clear, then apply DPR + viewport.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, cssWidth * dpr, cssHeight * dpr)
  ctx.scale(dpr, dpr)
  applyViewportTransform(ctx, viewport, cssWidth, cssHeight)

  // Slight veil so regions stand out without hiding source.
  ctx.fillStyle = 'rgba(8,10,15,0.16)'
  ctx.fillRect(0, 0, cssWidth, cssHeight)

  drawGridOverlay(ctx, imageFile, viewport, cssWidth, cssHeight)
  if (viewport.showOverlap) drawOverlapHighlights(ctx, regions, cssWidth, cssHeight)

  const sorted = [...regions].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
  const zoomInv = 1 / viewport.zoom
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i]
    drawRegion(
      ctx,
      r,
      regions.indexOf(r),
      r.id === selectedId,
      r.id === hoverRegionId && r.id !== selectedId,
      cssWidth,
      cssHeight,
      zoomInv,
      handleSize
    )
  }

  if (draftRect) {
    drawDraftRect(ctx, draftRect, cssWidth, cssHeight, zoomInv)
    drawSizeBadge(ctx, draftRect, imageFile, cssWidth, cssHeight, zoomInv)
  } else if (selectedId) {
    const sel = regions.find((r) => r.id === selectedId)
    if (sel) {
      drawSizeBadge(
        ctx,
        { x: sel.x, y: sel.y, width: sel.width, height: sel.height },
        imageFile,
        cssWidth,
        cssHeight,
        zoomInv
      )
    }
  }

  if (pointer) drawPointerGuide(ctx, pointer, cssWidth, cssHeight, zoomInv)
}

// ─── Hit-testing ─────────────────────────────────────────────────────────────

function topRegionAt(regions: CustomRegion[], p: Point): CustomRegion | null {
  // iterate by descending zIndex
  let best: CustomRegion | null = null
  for (const r of regions) {
    if (
      p.x >= r.x &&
      p.x <= r.x + r.width &&
      p.y >= r.y &&
      p.y <= r.y + r.height
    ) {
      if (!best || (r.zIndex ?? 0) > (best.zIndex ?? 0)) best = r
    }
  }
  return best
}

function cornerAt(
  region: CustomRegion,
  p: Point,
  cssWidth: number,
  cssHeight: number,
  zoom: number,
  hitPad: number
): string | null {
  const tolPxX = hitPad / cssWidth / zoom
  const tolPxY = hitPad / cssHeight / zoom
  const corners: Record<string, Point> = {
    nw: { x: region.x, y: region.y },
    ne: { x: region.x + region.width, y: region.y },
    sw: { x: region.x, y: region.y + region.height },
    se: { x: region.x + region.width, y: region.y + region.height },
  }
  for (const [name, c] of Object.entries(corners)) {
    if (Math.abs(p.x - c.x) <= tolPxX && Math.abs(p.y - c.y) <= tolPxY) return name
  }
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomCropEditor(): React.ReactElement | null {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const draftRectRef = useRef<Rect | null>(null)
  const dirtyRef = useRef(true)
  const rafRef = useRef(0)
  const dprRef = useRef(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1)
  const sizeRef = useRef({ width: 0, height: 0 })

  const [draftRect, setDraftRect] = useState<Rect | null>(null)
  const [hoverRegionId, setHoverRegionId] = useState<string | null>(null)
  const [hoverCorner, setHoverCorner] = useState<string | null>(null)
  const [pointerImage, setPointerImage] = useState<Point | null>(null)
  const [interactionKind, setInteractionKind] = useState<DragKind | null>(null)
  const [shiftHeld, setShiftHeld] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [coarsePointer, setCoarsePointer] = useState(() => isCoarsePointer())

  // Active pointers — used for multi-touch pinch-zoom on touch devices.
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartRef = useRef<{
    distance: number
    zoom: number
    center: { x: number; y: number }
    panX: number
    panY: number
  } | null>(null)

  const {
    imageFile,
    regions,
    selectedRegionId,
    viewport,
    addRegion,
    updateRegion,
    selectRegion,
    removeRegion,
    commitHistory,
    setViewport,
  } = useSlicerStore()

  const markDirty = useCallback(() => {
    dirtyRef.current = true
  }, [])

  const setDraft = useCallback((rect: Rect | null) => {
    draftRectRef.current = rect
    setDraftRect(rect)
  }, [])

  // ── Coordinate conversions ───────────────────────────────────────────────

  const screenToImage = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const sx = clientX - rect.left
      const sy = clientY - rect.top
      const cssW = rect.width
      const cssH = rect.height
      const cx = cssW / 2
      const cy = cssH / 2
      // invert: translate(cx+pan) scale(zoom) translate(-cx)
      const ux = (sx - cx - viewport.panX) / viewport.zoom + cx
      const uy = (sy - cy - viewport.panY) / viewport.zoom + cy
      return { x: clamp(ux / cssW, 0, 1), y: clamp(uy / cssH, 0, 1) }
    },
    [viewport.panX, viewport.panY, viewport.zoom]
  )

  // ── rAF render loop ──────────────────────────────────────────────────────

  useEffect(() => {
    const loop = (): void => {
      if (dirtyRef.current && canvasRef.current && imageFile) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          render(
            ctx,
            {
              regions,
              selectedId: selectedRegionId,
              draftRect,
              pointer: coarsePointer ? null : pointerImage,
              imageFile,
              viewport,
              cssWidth: sizeRef.current.width,
              cssHeight: sizeRef.current.height,
              hoverRegionId,
              handleSize: coarsePointer ? HANDLE_SIZE_TOUCH : HANDLE_SIZE_MOUSE,
            },
            dprRef.current
          )
        }
        dirtyRef.current = false
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [
    regions,
    selectedRegionId,
    draftRect,
    pointerImage,
    imageFile,
    viewport,
    hoverRegionId,
    coarsePointer,
  ])

  // Track changes to coarse-pointer media query (e.g. plugging in a mouse on iPad).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(pointer: coarse)')
    const onChange = (): void => setCoarsePointer(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  useEffect(() => {
    markDirty()
  }, [
    regions,
    selectedRegionId,
    draftRect,
    pointerImage,
    viewport,
    hoverRegionId,
    markDirty,
  ])

  // ── Resize handling (DPR-aware) ──────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const apply = (cssW: number, cssH: number): void => {
      if (cssW <= 0 || cssH <= 0) return
      const dpr = window.devicePixelRatio || 1
      dprRef.current = dpr
      sizeRef.current = { width: cssW, height: cssH }
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      markDirty()
    }

    const ro = new ResizeObserver((entries) => {
      const target = entries[0]?.target
      if (!(target instanceof HTMLElement)) return
      const { width, height } = target.getBoundingClientRect()
      apply(width, height)
    })
    ro.observe(container)
    const r = container.getBoundingClientRect()
    apply(r.width, r.height)

    return () => ro.disconnect()
  }, [markDirty])

  // ── Keyboard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const onDown = (e: KeyboardEvent): void => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Shift') setShiftHeld(true)
      if (e.code === 'Space') {
        setSpaceHeld(true)
        e.preventDefault()
      }
      if (e.key === 'Escape') {
        if (dragRef.current?.kind === 'drawing') {
          dragRef.current = null
          setInteractionKind(null)
          setDraft(null)
        } else if (selectedRegionId) {
          selectRegion(null)
        }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionId) {
        e.preventDefault()
        removeRegion(selectedRegionId)
      }
    }
    const onUp = (e: KeyboardEvent): void => {
      if (e.key === 'Shift') setShiftHeld(false)
      if (e.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [selectedRegionId, removeRegion, selectRegion, setDraft])

  // ── Wheel zoom (cursor-anchored) ─────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left - rect.width / 2
      const sy = e.clientY - rect.top - rect.height / 2
      const factor = Math.exp(-e.deltaY * 0.0015)
      const nextZoom = clamp(viewport.zoom * factor, MIN_ZOOM, MAX_ZOOM)
      const ratio = nextZoom / viewport.zoom
      // keep the point under the cursor stationary
      const nextPanX = sx - (sx - viewport.panX) * ratio
      const nextPanY = sy - (sy - viewport.panY) * ratio
      setViewport({ zoom: nextZoom, panX: nextPanX, panY: nextPanY })
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [viewport.zoom, viewport.panX, viewport.panY, setViewport])

  // ── Pointer handlers ─────────────────────────────────────────────────────

  const beginDraft = useCallback(
    (start: Point) => {
      dragRef.current = { kind: 'drawing', start }
      setInteractionKind('drawing')
      setDraft({ x: start.x, y: start.y, width: 0, height: 0 })
    },
    [setDraft]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas || !imageFile) return

      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      // Capture so move/up still arrive if the finger leaves the canvas.
      try { canvas.setPointerCapture(e.pointerId) } catch { /* noop */ }
      setPointerImage(screenToImage(e.clientX, e.clientY))

      // Two-finger pinch start
      if (pointersRef.current.size === 2) {
        const pts = Array.from(pointersRef.current.values())
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        const rect = canvas.getBoundingClientRect()
        pinchStartRef.current = {
          distance: Math.hypot(dx, dy),
          zoom: viewport.zoom,
          center: {
            x: (pts[0].x + pts[1].x) / 2 - rect.left - rect.width / 2,
            y: (pts[0].y + pts[1].y) / 2 - rect.top - rect.height / 2,
          },
          panX: viewport.panX,
          panY: viewport.panY,
        }
        // Cancel any in-progress single-finger drag.
        dragRef.current = null
        setInteractionKind(null)
        setDraft(null)
        return
      }

      // Pan with middle-click, Space + click, or coarse pointer two-finger… (handled above)
      if (e.button === 1 || (e.button === 0 && spaceHeld)) {
        dragRef.current = {
          kind: 'panning',
          start: { x: 0, y: 0 },
          screenStart: { x: e.clientX, y: e.clientY },
          initialPan: { panX: viewport.panX, panY: viewport.panY },
        }
        setInteractionKind('panning')
        return
      }
      if (e.button !== 0 && e.pointerType === 'mouse') return

      const p = screenToImage(e.clientX, e.clientY)
      const hitPad = coarsePointer ? HANDLE_HIT_PAD_TOUCH : HANDLE_HIT_PAD_MOUSE

      // Resize on selected
      if (selectedRegionId) {
        const sel = regions.find((r) => r.id === selectedRegionId)
        if (sel && !sel.locked) {
          const corner = cornerAt(
            sel,
            p,
            sizeRef.current.width,
            sizeRef.current.height,
            viewport.zoom,
            hitPad
          )
          if (corner) {
            dragRef.current = {
              kind: 'resizing',
              start: p,
              regionId: sel.id,
              corner,
              initialRegion: { ...sel },
            }
            setInteractionKind('resizing')
            setHoverCorner(corner)
            return
          }
        }
      }

      // Move existing
      const hit = topRegionAt(regions, p)
      if (hit && !hit.locked) {
        selectRegion(hit.id)
        dragRef.current = {
          kind: 'moving',
          start: p,
          regionId: hit.id,
          initialRegion: { ...hit },
        }
        setInteractionKind('moving')
        return
      }
      if (hit && hit.locked) {
        selectRegion(hit.id)
        return
      }

      // Otherwise begin drawing
      selectRegion(null)
      beginDraft(p)
    },
    [
      imageFile,
      spaceHeld,
      coarsePointer,
      viewport.panX,
      viewport.panY,
      viewport.zoom,
      screenToImage,
      selectedRegionId,
      regions,
      selectRegion,
      beginDraft,
      setDraft,
    ]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current
      if (!imageFile) return

      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      }
      const currentPoint = screenToImage(e.clientX, e.clientY)
      setPointerImage(currentPoint)

      // Pinch-zoom path
      if (pointersRef.current.size === 2 && pinchStartRef.current) {
        const pts = Array.from(pointersRef.current.values())
        const dx = pts[1].x - pts[0].x
        const dy = pts[1].y - pts[0].y
        const dist = Math.hypot(dx, dy)
        const start = pinchStartRef.current
        const ratio = dist / Math.max(start.distance, 1)
        const nextZoom = clamp(start.zoom * ratio, MIN_ZOOM, MAX_ZOOM)
        const zoomRatio = nextZoom / start.zoom
        // anchor pinch around its initial center
        const nextPanX = start.center.x - (start.center.x - start.panX) * zoomRatio
        const nextPanY = start.center.y - (start.center.y - start.panY) * zoomRatio
        setViewport({ zoom: nextZoom, panX: nextPanX, panY: nextPanY })
        return
      }

      // Hover state for cursor feedback (only when not dragging)
      if (!drag) {
        const hit = topRegionAt(regions, currentPoint)
        setHoverRegionId(hit?.id ?? null)
        if (selectedRegionId) {
          const selected = regions.find((r) => r.id === selectedRegionId)
          setHoverCorner(
            selected && !selected.locked
              ? cornerAt(
                  selected,
                  currentPoint,
                  sizeRef.current.width,
                  sizeRef.current.height,
                  viewport.zoom,
                  coarsePointer ? HANDLE_HIT_PAD_TOUCH : HANDLE_HIT_PAD_MOUSE
                )
              : null
          )
        } else {
          setHoverCorner(null)
        }
        return
      }

      if (drag.kind === 'panning' && drag.screenStart && drag.initialPan) {
        const dx = e.clientX - drag.screenStart.x
        const dy = e.clientY - drag.screenStart.y
        setViewport({ panX: drag.initialPan.panX + dx, panY: drag.initialPan.panY + dy })
        return
      }

      const p = currentPoint

      if (drag.kind === 'drawing') {
        const end = shiftHeld ? constrainSquare(drag.start, p) : p
        let r = rectFromCorners(drag.start, end)
        if (viewport.snapToGrid && imageFile) {
          const stepNX = viewport.gridSize / imageFile.width
          const stepNY = viewport.gridSize / imageFile.height
          r = {
            x: Math.round(r.x / stepNX) * stepNX,
            y: Math.round(r.y / stepNY) * stepNY,
            width: Math.max(stepNX, Math.round(r.width / stepNX) * stepNX),
            height: Math.max(stepNY, Math.round(r.height / stepNY) * stepNY),
          }
        }
        r = clampRect(r, { x: 0, y: 0, width: 1, height: 1 })
        setDraft(r)
      } else if (drag.kind === 'moving' && drag.regionId && drag.initialRegion) {
        const r = drag.initialRegion
        const dx = p.x - drag.start.x
        const dy = p.y - drag.start.y
        let next: Rect = { x: r.x + dx, y: r.y + dy, width: r.width, height: r.height }
        if (viewport.snapToGrid) {
          const stepNX = viewport.gridSize / imageFile.width
          const stepNY = viewport.gridSize / imageFile.height
          next = snapRect(next, Math.min(stepNX, stepNY))
        }
        next = clampRect(next, { x: 0, y: 0, width: 1, height: 1 })
        updateRegion(drag.regionId, { x: next.x, y: next.y })
      } else if (
        drag.kind === 'resizing' &&
        drag.regionId &&
        drag.initialRegion &&
        drag.corner
      ) {
        let next = resizeCorner(
          {
            x: drag.initialRegion.x,
            y: drag.initialRegion.y,
            width: drag.initialRegion.width,
            height: drag.initialRegion.height,
          },
          drag.corner,
          { x: p.x - drag.start.x, y: p.y - drag.start.y },
          MIN_REGION_SIZE,
          { x: 0, y: 0, width: 1, height: 1 }
        )
        if (shiftHeld) {
          // Aspect-lock: equalise width/height around dragged corner
          const s = Math.max(next.width, next.height)
          const isW = drag.corner.includes('w')
          const isN = drag.corner.includes('n')
          next = {
            x: isW ? drag.initialRegion.x + drag.initialRegion.width - s : next.x,
            y: isN ? drag.initialRegion.y + drag.initialRegion.height - s : next.y,
            width: s,
            height: s,
          }
          next = clampRect(next, { x: 0, y: 0, width: 1, height: 1 })
        }
        if (viewport.snapToGrid) {
          const stepNX = viewport.gridSize / imageFile.width
          const stepNY = viewport.gridSize / imageFile.height
          next = snapRect(next, Math.min(stepNX, stepNY))
        }
        updateRegion(drag.regionId, next)
      }
    },
    [
      imageFile,
      regions,
      screenToImage,
      shiftHeld,
      viewport.snapToGrid,
      viewport.gridSize,
      viewport.zoom,
      selectedRegionId,
      coarsePointer,
      setViewport,
      updateRegion,
      setDraft,
    ]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      pointersRef.current.delete(e.pointerId)
      try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* noop */ }
      // End pinch when one finger lifts
      if (pointersRef.current.size < 2) pinchStartRef.current = null

      const drag = dragRef.current
      if (!drag) return

      const finalDraft = draftRectRef.current
      if (drag.kind === 'drawing' && finalDraft) {
        if (finalDraft.width >= MIN_REGION_SIZE && finalDraft.height >= MIN_REGION_SIZE) {
          const newRegion: CustomRegion = {
            id: generateId(),
            label: `Region ${regions.length + 1}`,
            x: finalDraft.x,
            y: finalDraft.y,
            width: finalDraft.width,
            height: finalDraft.height,
          }
          addRegion(newRegion)
          selectRegion(newRegion.id)
        }
        setDraft(null)
      } else if (drag.kind === 'moving' || drag.kind === 'resizing') {
        commitHistory()
      }

      dragRef.current = null
      setInteractionKind(null)
    },
    [regions.length, addRegion, selectRegion, commitHistory, setDraft]
  )

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    pointersRef.current.delete(e.pointerId)
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    if (pointersRef.current.size < 2) pinchStartRef.current = null
    dragRef.current = null
    setInteractionKind(null)
    setDraft(null)
  }, [setDraft])

  const handlePointerLeave = useCallback(() => {
    setHoverRegionId(null)
    setHoverCorner(null)
    setPointerImage(null)
  }, [])

  // ── Cursor ───────────────────────────────────────────────────────────────

  const resizeCursorForCorner = (corner: string | null): string | null => {
    if (corner === 'nw' || corner === 'se') return 'nwse-resize'
    if (corner === 'ne' || corner === 'sw') return 'nesw-resize'
    return null
  }

  const cursor: string =
    interactionKind === 'panning'
      ? 'grabbing'
      : spaceHeld
        ? 'grab'
        : resizeCursorForCorner(hoverCorner) ??
          (interactionKind === 'moving' || hoverRegionId ? 'move' : 'crosshair')

  // ── Hint text ────────────────────────────────────────────────────────────

  const hintText = interactionKind === 'drawing'
    ? coarsePointer
      ? 'Release to create slice'
      : `Release to create slice  ·  ${shiftHeld ? 'Square locked' : 'Hold ⇧ for square'}  ·  Esc cancels`
    : selectedRegionId
      ? coarsePointer
        ? 'Drag corners to resize  ·  Tap empty area to deselect'
        : 'Drag corners to resize  ·  ⇧ to lock aspect  ·  Del to remove'
      : coarsePointer
        ? 'Drag to draw  ·  Pinch to zoom  ·  Two-finger drag to pan'
        : `Draw on the image  ·  Scroll to zoom  ·  ${spaceHeld ? 'Drag to pan' : 'Hold Space to pan'}`

  if (!imageFile) return null

  // ── Image render with viewport transform via CSS ─────────────────────────

  const imageTransform = `translate(calc(-50% + ${viewport.panX}px), calc(-50% + ${viewport.panY}px)) scale(${viewport.zoom})`

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-obsidian-900 rounded-lg"
      style={{ paddingBottom: `${(imageFile.height / imageFile.width) * 100}%` }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={imageFile.url}
          alt="Source"
          draggable={false}
          className="absolute top-1/2 left-1/2 origin-center select-none pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: imageTransform,
            transformOrigin: 'center center',
            imageRendering: viewport.zoom > 2 ? 'pixelated' : 'auto',
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded-lg"
        style={{ cursor, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Slice editor canvas"
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
