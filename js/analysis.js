// Numeric analysis of a curve y = f(x) on an interval: roots, extrema, value tables.

const ok = (v) => Number.isFinite(v)

function bisect(f, a, b, fa, fb) {
  let lo = a
  let hi = b
  let flo = fa
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const fm = f(mid)
    if (!ok(fm)) return null
    if (fm === 0) return mid
    if (Math.sign(fm) === Math.sign(flo)) {
      lo = mid
      flo = fm
    } else hi = mid
  }
  return (lo + hi) / 2
}

function dedupe(values, tol) {
  const out = []
  for (const v of values.sort((a, b) => a - b)) {
    if (!out.length || Math.abs(v - out[out.length - 1]) > tol) out.push(v)
  }
  return out
}

/** x-values where f crosses zero inside [a, b]. */
export function findRoots(f, a, b, samples = 2400) {
  if (!(b > a)) return []
  const step = (b - a) / samples
  const found = []
  let px = a
  let py = f(px)
  for (let i = 1; i <= samples; i++) {
    const x = a + i * step
    const y = f(x)
    if (ok(py) && py === 0) found.push(px)
    else if (ok(py) && ok(y) && Math.sign(py) !== Math.sign(y) && y !== 0) {
      // ignore jumps over poles (e.g. 1/x): the value must be continuous-ish
      const r = bisect(f, px, x, py, y)
      if (r !== null && Math.abs(f(r)) < Math.max(1e-6, Math.min(Math.abs(py), Math.abs(y)))) found.push(r)
    }
    px = x
    py = y
  }
  if (ok(py) && py === 0) found.push(px)
  return dedupe(found, step * 0.5).map(clean)
}

function clean(v) {
  const r = Math.round(v * 1e9) / 1e9
  return Object.is(r, -0) ? 0 : r
}

function refineExtremum(f, lo, hi, isMax) {
  // golden-section search on [lo, hi]
  const g = (Math.sqrt(5) - 1) / 2
  let a = lo
  let b = hi
  let c = b - g * (b - a)
  let d = a + g * (b - a)
  let fc = f(c)
  let fd = f(d)
  for (let i = 0; i < 80; i++) {
    if (isMax ? fc > fd : fc < fd) {
      b = d
      d = c
      fd = fc
      c = b - g * (b - a)
      fc = f(c)
    } else {
      a = c
      c = d
      fc = fd
      d = a + g * (b - a)
      fd = f(d)
    }
  }
  return (a + b) / 2
}

/** Local minima / maxima strictly inside (a, b). */
export function findExtrema(f, a, b, samples = 1200) {
  if (!(b > a)) return []
  const step = (b - a) / samples
  const xs = []
  const ys = []
  for (let i = 0; i <= samples; i++) {
    xs.push(a + i * step)
    ys.push(f(xs[i]))
  }
  const range = Math.max(...ys.filter(ok)) - Math.min(...ys.filter(ok)) || 1
  const out = []
  for (let i = 1; i < samples; i++) {
    const [y0, y1, y2] = [ys[i - 1], ys[i], ys[i + 1]]
    if (!ok(y0) || !ok(y1) || !ok(y2)) continue
    // skip steep poles / discontinuities
    if (Math.abs(y1 - y0) > range * 0.5 || Math.abs(y2 - y1) > range * 0.5) continue
    const isMax = y1 > y0 && y1 >= y2 && (y1 > y2 || y1 - y0 > 0)
    const isMin = y1 < y0 && y1 <= y2 && (y1 < y2 || y0 - y1 > 0)
    if (!isMax && !isMin) continue
    const x = refineExtremum(f, xs[i - 1], xs[i + 1], isMax)
    const y = f(x)
    if (!ok(y)) continue
    if (out.length && Math.abs(out[out.length - 1].x - x) < step) continue
    const xr = Math.round(x * 1e6) / 1e6
    out.push({ x: Object.is(xr, -0) ? 0 : xr, y: clean(y), kind: isMax ? 'max' : 'min' })
  }
  return out.slice(0, 8)
}

/** Everything the UI shows about a curve in [a, b]. */
export function analyze(f, a, b) {
  const y0 = a <= 0 && b >= 0 ? f(0) : NaN
  return {
    yIntercept: ok(y0) ? clean(y0) : null,
    roots: findRoots(f, a, b).slice(0, 10),
    extrema: findExtrema(f, a, b),
  }
}

/** Table of values from `start` to `end` (either direction) every `step`. */
export function valueTable(f, start, end, step, maxRows = 1000) {
  const rows = []
  if (!ok(start) || !ok(end) || !ok(step) || step <= 0) return { rows, truncated: false }
  const dir = end >= start ? 1 : -1
  const n = Math.floor(Math.abs(end - start) / step + 1e-9)
  const count = Math.min(n + 1, maxRows)
  for (let i = 0; i < count; i++) {
    const x = clean(start + dir * i * step)
    const y = f(x)
    rows.push({ x, y: ok(y) ? y : null })
  }
  return { rows, truncated: n + 1 > maxRows }
}

/** Number formatting for display: trims noise, keeps ~6 significant digits. */
export function formatNumber(v) {
  if (v === null || v === undefined || !ok(v)) return 'undefined'
  if (v === 0) return '0'
  const abs = Math.abs(v)
  if (abs >= 1e9 || abs < 1e-6) return v.toExponential(3).replace('e+', 'e')
  return String(parseFloat(v.toPrecision(7)))
}
