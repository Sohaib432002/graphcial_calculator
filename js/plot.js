import { formatNumber } from './analysis.js'

const MIN_SCALE = 1e-3
const MAX_SCALE = 1e6

function niceStep(raw) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / pow
  const base = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return base * pow
}

function decimalsFor(step) {
  return Math.min(8, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)))
}

function labelText(v, step) {
  if (Math.abs(v) < step * 1e-6) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e7 || abs < 1e-4) return v.toExponential(1).replace('e+', 'e')
  return v.toFixed(decimalsFor(step))
}

export class Plot {
  constructor(canvas, { onViewChange } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.onViewChange = onViewChange
    this.curves = []
    this.view = { cx: 0, cy: 0, sx: 40, sy: 40 }
    this.hover = null
    this.pointers = new Map()
    this.drag = null
    this.pinch = null
    this.raf = 0
    this.w = 0
    this.h = 0
    this.dpr = 1

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.bindEvents()
    this.resize()
  }

  // ---------- coordinates ----------
  x2s(x) {
    return this.w / 2 + (x - this.view.cx) * this.view.sx
  }
  y2s(y) {
    return this.h / 2 - (y - this.view.cy) * this.view.sy
  }
  sx2x(px) {
    return this.view.cx + (px - this.w / 2) / this.view.sx
  }
  sy2y(py) {
    return this.view.cy - (py - this.h / 2) / this.view.sy
  }

  bounds() {
    return {
      x0: this.sx2x(0),
      x1: this.sx2x(this.w),
      y0: this.sy2y(this.h),
      y1: this.sy2y(0),
    }
  }

  // ---------- public API ----------
  setCurves(curves) {
    this.curves = curves
    this.draw()
  }

  setView(v) {
    this.view = { ...this.view, ...v }
    this.view.sx = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.view.sx))
    this.view.sy = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.view.sy))
    this.requestDraw()
    this.onViewChange?.(this.bounds())
  }

  reset() {
    this.setView({ cx: 0, cy: 0, sx: 40, sy: 40 })
  }

  zoom(factor, px = this.w / 2, py = this.h / 2, axis = 'both') {
    const wx = this.sx2x(px)
    const wy = this.sy2y(py)
    const sx = axis === 'y' ? this.view.sx : this.view.sx * factor
    const sy = axis === 'x' ? this.view.sy : this.view.sy * factor
    const cx = wx - (px - this.w / 2) / sx
    const cy = wy + (py - this.h / 2) / sy
    this.setView({ sx, sy, cx, cy })
  }

  /** Frame all visible curves (ignores extreme outliers such as asymptotes). */
  fit() {
    const vis = this.curves.filter((c) => c.visible && c.f)
    if (!vis.length || !this.w) return this.reset()
    let xmin = Infinity
    let xmax = -Infinity
    const ys = []
    for (const c of vis) {
      xmin = Math.min(xmin, c.lo)
      xmax = Math.max(xmax, c.hi)
      const n = 400
      for (let i = 0; i <= n; i++) {
        const y = c.f(c.lo + ((c.hi - c.lo) * i) / n)
        if (Number.isFinite(y)) ys.push(y)
      }
    }
    if (!Number.isFinite(xmin) || !Number.isFinite(xmax)) return this.reset()
    if (xmax - xmin < 1e-9) {
      xmin -= 1
      xmax += 1
    }
    let ymin = 0
    let ymax = 0
    if (ys.length) {
      ys.sort((a, b) => a - b)
      ymin = ys[Math.floor(ys.length * 0.01)]
      ymax = ys[Math.ceil(ys.length * 0.99) - 1]
    }
    ymin = Math.min(ymin, 0)
    ymax = Math.max(ymax, 0)
    if (ymax - ymin < 1e-9) {
      ymin -= 1
      ymax += 1
    }
    const mx = (xmax - xmin) * 0.08
    const my = (ymax - ymin) * 0.12
    const xr = xmax - xmin + 2 * mx
    const yr = ymax - ymin + 2 * my
    this.setView({
      cx: (xmin + xmax) / 2,
      cy: (ymin + ymax) / 2,
      sx: this.w / xr,
      sy: this.h / yr,
    })
  }

  /** Centre the view on a point and show its trace marker. */
  focusPoint(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    this.setView({ cx: x, cy: y })
    this.hover = { px: this.w / 2, py: this.h / 2 }
    this.requestDraw()
  }

  exportPng(filename = 'graph.png') {
    this.draw(true)
    this.canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }

  // ---------- sizing / scheduling ----------
  resize() {
    const r = this.canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const w = Math.max(1, Math.round(r.width))
    const h = Math.max(1, Math.round(r.height))
    if (w === this.w && h === this.h && dpr === this.dpr) return
    this.w = w
    this.h = h
    this.dpr = dpr
    this.canvas.width = Math.round(w * dpr)
    this.canvas.height = Math.round(h * dpr)
    this.draw()
    this.onViewChange?.(this.bounds())
  }

  requestDraw() {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.draw()
    })
  }

  // ---------- drawing ----------
  theme() {
    const s = getComputedStyle(this.canvas)
    const v = (n, d) => s.getPropertyValue(n).trim() || d
    return {
      bg: v('--plot-bg', '#0b1220'),
      minor: v('--plot-minor', 'rgba(255,255,255,0.04)'),
      major: v('--plot-major', 'rgba(255,255,255,0.10)'),
      axis: v('--plot-axis', 'rgba(255,255,255,0.55)'),
      label: v('--plot-label', 'rgba(255,255,255,0.6)'),
      tipBg: v('--plot-tip-bg', '#111a2e'),
      tipText: v('--plot-tip-text', '#fff'),
      font: v('--font-mono', 'ui-monospace, monospace'),
    }
  }

  draw() {
    const { ctx, w, h } = this
    const t = this.theme()
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = t.bg
    ctx.fillRect(0, 0, w, h)

    this.drawGrid(t)
    for (const c of this.curves) if (c.visible && c.f) this.drawCurve(c)
    for (const c of this.curves) if (c.visible && c.f && c.showPoints) this.drawKeyPoints(c, t)
    this.drawHover(t)
  }

  drawGrid(t) {
    const { ctx, w, h, view } = this
    const { x0, x1, y0, y1 } = this.bounds()
    const stepX = niceStep(95 / view.sx)
    const stepY = niceStep(80 / view.sy)
    const divX = stepX.toExponential().startsWith('2') ? 4 : 5
    const divY = stepY.toExponential().startsWith('2') ? 4 : 5

    const minor = (x, step, div, vertical) => {
      const m = step / div
      if (m * (vertical ? view.sx : view.sy) < 9) return
      const start = Math.floor((vertical ? x0 : y0) / m) * m
      const end = vertical ? x1 : y1
      ctx.beginPath()
      for (let v = start; v <= end; v += m) {
        if (vertical) {
          const px = Math.round(this.x2s(v)) + 0.5
          ctx.moveTo(px, 0)
          ctx.lineTo(px, h)
        } else {
          const py = Math.round(this.y2s(v)) + 0.5
          ctx.moveTo(0, py)
          ctx.lineTo(w, py)
        }
      }
      ctx.strokeStyle = t.minor
      ctx.lineWidth = 1
      ctx.stroke()
    }
    minor(0, stepX, divX, true)
    minor(0, stepY, divY, false)

    // major lines
    ctx.beginPath()
    for (let v = Math.ceil(x0 / stepX) * stepX; v <= x1; v += stepX) {
      const px = Math.round(this.x2s(v)) + 0.5
      ctx.moveTo(px, 0)
      ctx.lineTo(px, h)
    }
    for (let v = Math.ceil(y0 / stepY) * stepY; v <= y1; v += stepY) {
      const py = Math.round(this.y2s(v)) + 0.5
      ctx.moveTo(0, py)
      ctx.lineTo(w, py)
    }
    ctx.strokeStyle = t.major
    ctx.lineWidth = 1
    ctx.stroke()

    // axes
    const ax = this.x2s(0)
    const ay = this.y2s(0)
    ctx.strokeStyle = t.axis
    ctx.lineWidth = 1.6
    ctx.beginPath()
    if (ay >= 0 && ay <= h) {
      ctx.moveTo(0, ay)
      ctx.lineTo(w, ay)
    }
    if (ax >= 0 && ax <= w) {
      ctx.moveTo(ax, 0)
      ctx.lineTo(ax, h)
    }
    ctx.stroke()

    // labels (pinned to the screen edge when the axis is off-screen)
    ctx.fillStyle = t.label
    ctx.font = `11px ${t.font}`
    const labelY = Math.min(h - 6, Math.max(14, ay + 15))
    const labelX = Math.min(w - 6, Math.max(6, ax - 6))
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'center'
    for (let v = Math.ceil(x0 / stepX) * stepX; v <= x1; v += stepX) {
      if (Math.abs(v) < stepX * 1e-6) continue
      const px = this.x2s(v)
      if (px < 14 || px > w - 14) continue
      ctx.fillText(labelText(v, stepX), px, labelY)
    }
    ctx.textAlign = ax > w - 40 ? 'right' : ax < 0 ? 'left' : 'right'
    for (let v = Math.ceil(y0 / stepY) * stepY; v <= y1; v += stepY) {
      if (Math.abs(v) < stepY * 1e-6) continue
      const py = this.y2s(v)
      if (py < 10 || py > h - 10) continue
      ctx.fillText(labelText(v, stepY), ax < 0 ? 6 : labelX, py + 4)
    }
    if (ax >= 0 && ax <= w && ay >= 0 && ay <= h) {
      ctx.textAlign = 'right'
      ctx.fillText('0', ax - 6, ay + 15)
    }
  }

  drawCurve(c) {
    const { ctx, w, h } = this
    const { x0, x1 } = this.bounds()
    const lo = Math.max(c.lo, x0)
    const hi = Math.min(c.hi, x1)
    if (!(hi > lo)) return
    const pxLo = this.x2s(lo)
    const pxHi = this.x2s(hi)
    const n = Math.min(4000, Math.max(2, Math.ceil(pxHi - pxLo)))
    const jump = h * 1.6
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    ctx.clip()
    ctx.strokeStyle = c.color
    ctx.lineWidth = 2.6
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.shadowColor = c.color
    ctx.shadowBlur = 7
    ctx.beginPath()
    let penDown = false
    let prevPy = 0
    for (let i = 0; i <= n; i++) {
      const x = lo + ((hi - lo) * i) / n
      const y = c.f(x)
      if (!Number.isFinite(y)) {
        penDown = false
        continue
      }
      const px = this.x2s(x)
      let py = this.y2s(y)
      py = Math.max(-1e5, Math.min(1e5, py))
      if (penDown && Math.abs(py - prevPy) > jump) penDown = false
      if (penDown) ctx.lineTo(px, py)
      else ctx.moveTo(px, py)
      penDown = true
      prevPy = py
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // domain end points
    for (const x of [c.lo, c.hi]) {
      const y = c.f(x)
      if (!Number.isFinite(y)) continue
      const px = this.x2s(x)
      const py = this.y2s(y)
      if (px < -5 || px > w + 5 || py < -5 || py > h + 5) continue
      ctx.fillStyle = c.color
      ctx.beginPath()
      ctx.arc(px, py, 3.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  keyPoints(c) {
    const pts = []
    const a = c.analysis
    if (!a) return pts
    if (a.yIntercept !== null) pts.push({ x: 0, y: a.yIntercept, label: 'y-intercept' })
    for (const r of a.roots) pts.push({ x: r, y: 0, label: 'root' })
    for (const e of a.extrema) pts.push({ x: e.x, y: e.y, label: e.kind === 'max' ? 'local max' : 'local min' })
    return pts
  }

  drawKeyPoints(c, t) {
    const { ctx, w, h } = this
    for (const p of this.keyPoints(c)) {
      const px = this.x2s(p.x)
      const py = this.y2s(p.y)
      if (px < -6 || px > w + 6 || py < -6 || py > h + 6) continue
      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = t.bg
      ctx.fill()
      ctx.lineWidth = 2.2
      ctx.strokeStyle = c.color
      ctx.stroke()
    }
  }

  /** Nearest curve point (or key point) to a screen position. */
  pick(px, py) {
    const wx = this.sx2x(px)
    let best = null
    for (const c of this.curves) {
      if (!c.visible || !c.f || wx < c.lo || wx > c.hi) continue
      // snap to key points first
      for (const p of this.keyPoints(c)) {
        const d = Math.hypot(this.x2s(p.x) - px, this.y2s(p.y) - py)
        if (d < 12 && (!best || d < best.d - 4)) best = { c, x: p.x, y: p.y, d, label: p.label }
      }
      const y = c.f(wx)
      if (!Number.isFinite(y)) continue
      const d = Math.abs(this.y2s(y) - py)
      if (d < 42 && (!best || d < best.d)) best = { c, x: wx, y, d, label: '' }
    }
    return best
  }

  drawHover(t) {
    const { ctx, w, h } = this
    if (!this.hover) return
    const { px, py } = this.hover
    const hit = this.pick(px, py)
    if (!hit) return
    const sx = this.x2s(hit.x)
    const sy = this.y2s(hit.y)

    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = hit.c.color
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, h)
    ctx.moveTo(0, sy)
    ctx.lineTo(w, sy)
    ctx.stroke()
    ctx.restore()

    ctx.beginPath()
    ctx.arc(sx, sy, 6.5, 0, Math.PI * 2)
    ctx.fillStyle = hit.c.color
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = t.bg
    ctx.stroke()

    const lines = [`x = ${formatNumber(Number(hit.x.toPrecision(7)))}`, `y = ${formatNumber(Number(hit.y.toPrecision(7)))}`]
    if (hit.label) lines.unshift(hit.label)
    ctx.font = `12px ${t.font}`
    const wMax = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22
    const hBox = lines.length * 17 + 12
    let bx = sx + 14
    let by = sy - hBox - 12
    if (bx + wMax > w - 6) bx = sx - wMax - 14
    if (by < 6) by = sy + 14
    ctx.fillStyle = t.tipBg
    ctx.strokeStyle = hit.c.color
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.roundRect(bx, by, wMax, hBox, 9)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = t.tipText
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    lines.forEach((l, i) => {
      if (hit.label && i === 0) {
        ctx.fillStyle = hit.c.color
        ctx.fillText(l, bx + 11, by + 6 + 8.5)
        ctx.fillStyle = t.tipText
      } else ctx.fillText(l, bx + 11, by + 6 + 8.5 + i * 17)
    })
  }

  // ---------- interaction ----------
  bindEvents() {
    const c = this.canvas
    c.style.touchAction = 'none'

    const pos = (e) => {
      const r = c.getBoundingClientRect()
      return { px: e.clientX - r.left, py: e.clientY - r.top }
    }

    c.addEventListener('pointerdown', (e) => {
      try {
        c.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
      const p = pos(e)
      this.pointers.set(e.pointerId, p)
      if (this.pointers.size === 1) {
        this.drag = { ...p, cx: this.view.cx, cy: this.view.cy, moved: false, type: e.pointerType }
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()]
        const mx = (a.px + b.px) / 2
        const my = (a.py + b.py) / 2
        this.pinch = {
          dist: Math.hypot(a.px - b.px, a.py - b.py),
          sx: this.view.sx,
          sy: this.view.sy,
          // world point under the fingers when the gesture starts: it stays pinned while pinching/panning
          wx: this.sx2x(mx),
          wy: this.sy2y(my),
        }
        this.drag = null
      }
    })

    c.addEventListener('pointermove', (e) => {
      const p = pos(e)
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p)

      if (this.pinch && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()]
        const dist = Math.hypot(a.px - b.px, a.py - b.py)
        const factor = dist / this.pinch.dist
        const mx = (a.px + b.px) / 2
        const my = (a.py + b.py) / 2
        const sx = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.pinch.sx * factor))
        const sy = Math.min(MAX_SCALE, Math.max(MIN_SCALE, this.pinch.sy * factor))
        this.setView({ sx, sy, cx: this.pinch.wx - (mx - this.w / 2) / sx, cy: this.pinch.wy + (my - this.h / 2) / sy })
        return
      }

      if (this.drag && this.pointers.size === 1) {
        const dx = p.px - this.drag.px
        const dy = p.py - this.drag.py
        if (Math.hypot(dx, dy) > 4) this.drag.moved = true
        if (this.drag.moved) {
          this.hover = null
          this.setView({ cx: this.drag.cx - dx / this.view.sx, cy: this.drag.cy + dy / this.view.sy })
          c.style.cursor = 'grabbing'
        }
        return
      }
      if (e.pointerType === 'mouse') {
        this.hover = p
        this.requestDraw()
      }
    })

    const end = (e) => {
      const tap = this.drag && !this.drag.moved && this.pointers.size === 1
      if (tap) {
        // tap / click: show the trace marker at this spot (touch keeps it until the next tap)
        const p = pos(e)
        this.hover = this.drag.type === 'mouse' ? p : this.hover && this.pick(p.px, p.py) ? null : p
        this.requestDraw()
      }
      this.pointers.delete(e.pointerId)
      if (this.pointers.size < 2) this.pinch = null
      if (this.pointers.size === 0) this.drag = null
      c.style.cursor = ''
    }
    c.addEventListener('pointerup', end)
    c.addEventListener('pointercancel', end)
    c.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !this.drag) {
        this.hover = null
        this.requestDraw()
      }
    })

    c.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const { px, py } = pos(e)
        const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016))
        this.zoom(factor, px, py, e.shiftKey ? 'x' : e.altKey ? 'y' : 'both')
      },
      { passive: false }
    )

    c.addEventListener('dblclick', () => this.fit())

    c.addEventListener('keydown', (e) => {
      const step = 60
      const k = e.key
      if (k === 'ArrowLeft') this.setView({ cx: this.view.cx - step / this.view.sx })
      else if (k === 'ArrowRight') this.setView({ cx: this.view.cx + step / this.view.sx })
      else if (k === 'ArrowUp') this.setView({ cy: this.view.cy + step / this.view.sy })
      else if (k === 'ArrowDown') this.setView({ cy: this.view.cy - step / this.view.sy })
      else if (k === '+' || k === '=') this.zoom(1.25)
      else if (k === '-' || k === '_') this.zoom(0.8)
      else if (k === '0') this.fit()
      else return
      e.preventDefault()
    })
  }
}
