import { compileExpression } from './parser.js'

// Function families supported by the calculator. Each family defines its
// parameters, how to evaluate it, and how to display its equation.
export const TYPES = {
  linear: {
    label: 'Linear',
    hint: 'y = mx + c',
    params: [
      { key: 'm', label: 'm (slope)', def: 1 },
      { key: 'c', label: 'c (intercept)', def: 0 },
    ],
  },
  quadratic: {
    label: 'Quadratic',
    hint: 'y = ax² + bx + c',
    params: [
      { key: 'a', label: 'a', def: 1 },
      { key: 'b', label: 'b', def: 0 },
      { key: 'c', label: 'c', def: -4 },
    ],
  },
  cubic: {
    label: 'Cubic',
    hint: 'y = ax³ + bx² + cx + d',
    params: [
      { key: 'a', label: 'a', def: 1 },
      { key: 'b', label: 'b', def: 0 },
      { key: 'c', label: 'c', def: -3 },
      { key: 'd', label: 'd', def: 0 },
    ],
  },
  quartic: {
    label: 'Quartic',
    hint: 'y = ax⁴ + bx³ + cx² + dx + e',
    params: [
      { key: 'a', label: 'a', def: 1 },
      { key: 'b', label: 'b', def: 0 },
      { key: 'c', label: 'c', def: -5 },
      { key: 'd', label: 'd', def: 0 },
      { key: 'e', label: 'e', def: 4 },
    ],
  },
  exponential: {
    label: 'Exponential',
    hint: 'y = a^(bx + d) + c',
    params: [
      { key: 'a', label: 'a (base)', def: 2 },
      { key: 'b', label: 'b', def: 1 },
      { key: 'd', label: 'd (shift in exponent)', def: 0 },
      { key: 'c', label: 'c (vertical shift)', def: 0 },
    ],
  },
  logarithmic: {
    label: 'Logarithmic',
    hint: 'y = a·log_b(x) + c',
    params: [
      { key: 'base', label: 'b (base)', def: 2 },
      { key: 'a', label: 'a (scale)', def: 1 },
      { key: 'c', label: 'c (vertical shift)', def: 0 },
    ],
  },
  custom: {
    label: 'Custom f(x)',
    hint: 'any expression in x',
    params: [],
  },
}

export const TYPE_ORDER = ['linear', 'quadratic', 'cubic', 'quartic', 'exponential', 'logarithmic', 'custom']

export function defaultParams(type) {
  const p = {}
  for (const d of TYPES[type].params) p[d.key] = d.def
  if (type === 'custom') p.expr = 'sin(x)'
  return p
}

const finite = (v) => typeof v === 'number' && Number.isFinite(v)

/** Returns { f } for a valid curve, or { error } explaining what is wrong. */
export function buildFunction(type, p) {
  for (const d of TYPES[type].params) {
    if (!finite(p[d.key])) return { error: `Enter a number for ${d.label.split(' ')[0]}` }
  }
  switch (type) {
    case 'linear':
      return { f: (x) => p.m * x + p.c }
    case 'quadratic':
      return { f: (x) => p.a * x * x + p.b * x + p.c }
    case 'cubic':
      return { f: (x) => ((p.a * x + p.b) * x + p.c) * x + p.d }
    case 'quartic':
      return { f: (x) => (((p.a * x + p.b) * x + p.c) * x + p.d) * x + p.e }
    case 'exponential':
      if (p.a <= 0) return { error: 'The base a must be greater than 0' }
      return { f: (x) => p.a ** (p.b * x + p.d) + p.c }
    case 'logarithmic':
      if (p.base <= 0 || p.base === 1) return { error: 'The base must be greater than 0 and not 1' }
      return { f: (x) => (x > 0 ? (p.a * Math.log(x)) / Math.log(p.base) + p.c : NaN) }
    case 'custom': {
      const res = compileExpression(p.expr)
      return res.error ? { error: res.error } : { f: res.f }
    }
    default:
      return { error: 'Unknown function type' }
  }
}

// ---------- equation display (HTML) ----------

const SUP = { 2: '²', 3: '³', 4: '⁴' }
const fmt = (n) => {
  const r = Math.round(n * 1e6) / 1e6
  return String(Object.is(r, -0) ? 0 : r)
}

function polynomial(coeffs, powers) {
  let out = ''
  coeffs.forEach((c, i) => {
    if (c === 0) return
    const pow = powers[i]
    const abs = Math.abs(c)
    const sign = c < 0 ? '−' : '+'
    let term
    if (pow === 0) term = fmt(abs)
    else {
      const coef = abs === 1 ? '' : fmt(abs)
      term = `${coef}x${pow === 1 ? '' : SUP[pow]}`
    }
    if (!out) out = (c < 0 ? '−' : '') + term
    else out += ` ${sign} ${term}`
  })
  return out || '0'
}

const sub = (s) => `<sub>${s}</sub>`
const sup = (s) => `<sup>${s}</sup>`

export function equationHtml(type, p) {
  switch (type) {
    case 'linear':
      return `y = ${polynomial([p.m, p.c], [1, 0])}`
    case 'quadratic':
      return `y = ${polynomial([p.a, p.b, p.c], [2, 1, 0])}`
    case 'cubic':
      return `y = ${polynomial([p.a, p.b, p.c, p.d], [3, 2, 1, 0])}`
    case 'quartic':
      return `y = ${polynomial([p.a, p.b, p.c, p.d, p.e], [4, 3, 2, 1, 0])}`
    case 'exponential': {
      const bx = p.b === 1 ? 'x' : p.b === -1 ? '−x' : p.b === 0 ? '0' : `${fmt(p.b)}x`
      const exp = p.d === 0 ? bx : `${bx} ${p.d < 0 ? '−' : '+'} ${fmt(Math.abs(p.d))}`
      const tail = p.c === 0 ? '' : ` ${p.c < 0 ? '−' : '+'} ${fmt(Math.abs(p.c))}`
      return `y = ${fmt(p.a)}${sup(exp)}${tail}`
    }
    case 'logarithmic': {
      const lead = p.a === 1 ? '' : p.a === -1 ? '−' : fmt(p.a)
      const tail = p.c === 0 ? '' : ` ${p.c < 0 ? '−' : '+'} ${fmt(Math.abs(p.c))}`
      return `y = ${lead}log${sub(fmt(p.base))}(x)${tail}`
    }
    case 'custom':
      return `y = ${escapeHtml(String(p.expr || '').trim() || '…')}`
    default:
      return 'y = ?'
  }
}

export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}
