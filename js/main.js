import { Plot } from './plot.js'
import { TYPES, TYPE_ORDER, defaultParams, buildFunction, equationHtml, escapeHtml } from './functions.js'
import { analyze, valueTable, formatNumber } from './analysis.js'

const COLORS = ['#22d3ee', '#f472b6', '#fbbf24', '#a3e635', '#a78bfa', '#fb7185', '#60a5fa', '#34d399']
const MAX_CURVES = 8
const $ = (sel, root = document) => root.querySelector(sel)

const state = { curves: [], tab: 'curves', tableCurveId: null }
let nextId = 1
let urlTimer = 0
let viewTimer = 0
let toastTimer = 0

// ---------- curve model ----------

function pickColor() {
  const used = new Set(state.curves.map((c) => c.color))
  return COLORS.find((c) => !used.has(c)) || COLORS[state.curves.length % COLORS.length]
}

function makeCurve(type = 'quadratic', overrides = {}) {
  return {
    id: nextId++,
    type,
    params: defaultParams(type),
    lo: -10,
    hi: 10,
    color: pickColor(),
    visible: true,
    showPoints: true,
    collapsed: false,
    f: null,
    error: null,
    analysis: null,
    eq: '',
    ...overrides,
  }
}

function paramsValid(c) {
  return TYPES[c.type].params.every((d) => Number.isFinite(c.params[d.key]))
}

function compute(c) {
  const res = buildFunction(c.type, c.params)
  let error = res.error || null
  if (!error) {
    if (!Number.isFinite(c.lo) || !Number.isFinite(c.hi)) error = 'Enter both From and To'
    else if (c.lo >= c.hi) error = 'From must be less than To'
  }
  c.f = error ? null : res.f
  c.error = error
  if (error) c.analysis = null
  c.eq = paramsValid(c) || c.type === 'custom' ? equationHtml(c.type, c.params) : 'y = …'
}

const analysisTimers = new Map()
function scheduleAnalysis(c) {
  clearTimeout(analysisTimers.get(c.id))
  if (!c.f) return updateFacts(c)
  analysisTimers.set(
    c.id,
    setTimeout(() => {
      try {
        c.analysis = analyze(c.f, c.lo, c.hi)
      } catch {
        c.analysis = null
      }
      updateFacts(c)
      plot.setCurves(state.curves)
    }, 140)
  )
}

// ---------- DOM: curve cards ----------

const cardEl = (c) => document.querySelector(`.curve[data-id="${c.id}"]`)

function paramFields(c) {
  if (c.type === 'custom') {
    return `<label class="field">
        <span>f(x) =</span>
        <input type="text" data-key="expr" value="${escapeHtml(String(c.params.expr))}" spellcheck="false"
          autocapitalize="off" autocomplete="off" autocorrect="off" placeholder="e.g. sin(x) + x/2" />
      </label>
      <p class="muted small" style="margin:0">Use <code>x</code>, <code>+ − × ÷ ^</code>, <code>( )</code>, <code>pi</code>, <code>e</code> and
      <code>sin cos tan asin acos atan sqrt abs ln log exp</code>. Example: <code>2x^2 - 3x + 1</code></p>`
  }
  return `<div class="params">${TYPES[c.type].params
    .map(
      (d) => `<label class="field"><span>${escapeHtml(d.label)}</span>
        <input type="number" step="any" inputmode="decimal" data-key="${d.key}" value="${c.params[d.key]}" /></label>`
    )
    .join('')}</div>`
}

function cardHtml(c) {
  const options = TYPE_ORDER.map(
    (t) => `<option value="${t}" ${t === c.type ? 'selected' : ''}>${TYPES[t].label} · ${TYPES[t].hint}</option>`
  ).join('')
  return `
    <header class="curve-head">
      <button class="swatch" type="button" data-act="toggle" aria-label="Show or hide this function" aria-pressed="${c.visible}" title="Show / hide"></button>
      <div class="eq" data-eq aria-live="polite">${c.eq}</div>
      <button class="icon-btn" type="button" data-act="collapse" aria-label="Collapse or expand settings" title="Collapse">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <button class="icon-btn" type="button" data-act="remove" aria-label="Remove this function" title="Remove">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
      </button>
    </header>
    <div class="curve-body">
      <label class="field"><span>Type</span><select data-type>${options}</select></label>
      <div data-params>${paramFields(c)}</div>
      <div class="domain">
        <label class="field"><span>From x</span><input type="number" step="any" inputmode="decimal" data-domain="lo" value="${c.lo}" /></label>
        <label class="field"><span>To x</span><input type="number" step="any" inputmode="decimal" data-domain="hi" value="${c.hi}" /></label>
      </div>
      <label class="check"><input type="checkbox" data-points ${c.showPoints ? 'checked' : ''} /> Mark roots, peaks and intercepts</label>
      <p class="error" data-error role="alert" ${c.error ? '' : 'hidden'}>${escapeHtml(c.error || '')}</p>
      <div class="facts" data-facts></div>
    </div>`
}

function buildCard(c) {
  const el = document.createElement('article')
  el.className = 'curve'
  el.dataset.id = c.id
  el.innerHTML = cardHtml(c)
  applyCardState(el, c)
  return el
}

function applyCardState(el, c) {
  el.style.setProperty('--c', c.color)
  el.classList.toggle('hidden-curve', !c.visible)
  el.classList.toggle('collapsed', c.collapsed)
  const sw = $('.swatch', el)
  if (sw) sw.setAttribute('aria-pressed', String(c.visible))
}

function renderCurves(focusId = null) {
  const list = $('#curve-list')
  list.replaceChildren(...state.curves.map(buildCard))
  state.curves.forEach(updateFacts)
  $('#empty').hidden = state.curves.length > 0
  if (focusId) {
    const el = document.querySelector(`.curve[data-id="${focusId}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  refreshTableSelect()
}

function updateFacts(c) {
  const box = cardEl(c) && $('[data-facts]', cardEl(c))
  if (!box) return
  box.replaceChildren()
  if (!c.f) return
  const a = c.analysis
  if (!a) return
  const chips = []
  if (a.yIntercept !== null) chips.push({ k: 'y-intercept', x: 0, y: a.yIntercept, t: `(0, ${formatNumber(a.yIntercept)})` })
  a.roots.forEach((r) => chips.push({ k: 'root', x: r, y: 0, t: `x = ${formatNumber(r)}` }))
  a.extrema.forEach((e) =>
    chips.push({ k: e.kind === 'max' ? 'max' : 'min', x: e.x, y: e.y, t: `(${formatNumber(e.x)}, ${formatNumber(e.y)})` })
  )
  if (!chips.length) {
    const p = document.createElement('span')
    p.className = 'muted small'
    p.textContent = 'No roots, peaks or intercepts in this range.'
    box.append(p)
    return
  }
  for (const ch of chips) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'fact'
    b.dataset.x = ch.x
    b.dataset.y = ch.y
    b.title = 'Show on graph'
    b.innerHTML = `<b>${ch.k}</b> ${escapeHtml(ch.t)}`
    box.append(b)
  }
}

function update(c) {
  compute(c)
  const el = cardEl(c)
  if (el) {
    $('[data-eq]', el).innerHTML = c.eq
    const err = $('[data-error]', el)
    err.hidden = !c.error
    err.textContent = c.error || ''
    applyCardState(el, c)
  }
  scheduleAnalysis(c)
  plot.setCurves(state.curves)
  saveUrl()
  if (state.tab === 'table') renderTable()
}

// ---------- events ----------

const list = $('#curve-list')
const curveOf = (target) => {
  const el = target.closest('.curve')
  return el && state.curves.find((c) => c.id === Number(el.dataset.id))
}

list.addEventListener('input', (e) => {
  const c = curveOf(e.target)
  if (!c) return
  const input = e.target
  if (input.dataset.key) {
    if (input.dataset.key === 'expr') c.params.expr = input.value
    else {
      c.params[input.dataset.key] = input.valueAsNumber
      input.setAttribute('aria-invalid', String(!Number.isFinite(input.valueAsNumber)))
    }
    update(c)
  } else if (input.dataset.domain) {
    c[input.dataset.domain] = input.valueAsNumber
    input.setAttribute('aria-invalid', String(!Number.isFinite(input.valueAsNumber)))
    update(c)
  }
})

list.addEventListener('change', (e) => {
  const c = curveOf(e.target)
  if (!c) return
  if (e.target.matches('[data-type]')) {
    c.type = e.target.value
    c.params = defaultParams(c.type)
    // log curves are only defined for x > 0; make the default window useful
    compute(c)
    const el = cardEl(c)
    $('[data-params]', el).innerHTML = paramFields(c)
    update(c)
    refreshTableSelect()
  } else if (e.target.matches('[data-points]')) {
    c.showPoints = e.target.checked
    plot.setCurves(state.curves)
  }
})

list.addEventListener('click', (e) => {
  const fact = e.target.closest('.fact')
  if (fact) {
    plot.focusPoint(Number(fact.dataset.x), Number(fact.dataset.y))
    if (window.matchMedia('(max-width: 1000px)').matches) $('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const btn = e.target.closest('[data-act]')
  if (!btn) return
  const c = curveOf(btn)
  if (!c) return
  const act = btn.dataset.act
  if (act === 'remove') {
    state.curves = state.curves.filter((x) => x.id !== c.id)
    renderCurves()
    plot.setCurves(state.curves)
    saveUrl()
  } else if (act === 'toggle') {
    c.visible = !c.visible
    applyCardState(cardEl(c), c)
    plot.setCurves(state.curves)
    saveUrl()
  } else if (act === 'collapse') {
    c.collapsed = !c.collapsed
    applyCardState(cardEl(c), c)
  }
})

function addCurve(type, overrides = {}) {
  if (state.curves.length >= MAX_CURVES) return toast(`You can plot up to ${MAX_CURVES} functions`)
  const c = makeCurve(type, overrides)
  if (type === 'logarithmic') Object.assign(c, { lo: 0, hi: 20 })
  compute(c)
  state.curves.push(c)
  renderCurves(c.id)
  scheduleAnalysis(c)
  plot.setCurves(state.curves)
  saveUrl()
  if (state.curves.length === 1) plot.fit()
  cardEl(c)?.querySelector('input')?.focus({ preventScroll: true })
}

// quick-add chips
$('#add-chips').replaceChildren(
  ...TYPE_ORDER.map((t) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'chip plus'
    b.textContent = TYPES[t].label
    b.title = TYPES[t].hint
    b.addEventListener('click', () => addCurve(t))
    return b
  })
)

// ---------- examples ----------

const EXAMPLES = [
  {
    name: 'Parabola & line',
    curves: [
      { type: 'quadratic', params: { a: 1, b: 0, c: -4 }, lo: -6, hi: 6 },
      { type: 'linear', params: { m: 1, c: 1 }, lo: -6, hi: 6 },
    ],
  },
  { name: 'Cubic', curves: [{ type: 'cubic', params: { a: 1, b: 0, c: -3, d: 0 }, lo: -3, hi: 3 }] },
  { name: 'Quartic', curves: [{ type: 'quartic', params: { a: 1, b: 0, c: -5, d: 0, e: 4 }, lo: -3, hi: 3 }] },
  {
    name: 'Growth & decay',
    curves: [
      { type: 'exponential', params: { a: 2, b: 1, d: 0, c: 0 }, lo: -5, hi: 5 },
      { type: 'exponential', params: { a: 0.5, b: 1, d: 0, c: 0 }, lo: -5, hi: 5 },
    ],
  },
  {
    name: 'Logarithms',
    curves: [
      { type: 'logarithmic', params: { base: 2, a: 1, c: 0 }, lo: 0, hi: 20 },
      { type: 'logarithmic', params: { base: 10, a: 1, c: 0 }, lo: 0, hi: 20 },
    ],
  },
  {
    name: 'Sine & cosine',
    curves: [
      { type: 'custom', params: { expr: 'sin(x)' }, lo: -10, hi: 10 },
      { type: 'custom', params: { expr: 'cos(x)' }, lo: -10, hi: 10 },
    ],
  },
  { name: 'Damped wave', curves: [{ type: 'custom', params: { expr: 'e^(-x/4) * sin(3x)' }, lo: 0, hi: 20 }] },
]

function loadCurves(defs, { fit = true } = {}) {
  state.curves = []
  for (const d of defs) state.curves.push(makeCurve(d.type, { ...d, params: { ...defaultParams(d.type), ...d.params } }))
  state.curves.forEach(compute)
  renderCurves()
  state.curves.forEach(scheduleAnalysis)
  plot.setCurves(state.curves)
  if (fit) plot.fit()
  saveUrl()
}

$('#example-chips').replaceChildren(
  ...EXAMPLES.map((ex) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'chip'
    b.textContent = ex.name
    b.addEventListener('click', () => loadCurves(ex.curves))
    return b
  })
)

// ---------- table ----------

function refreshTableSelect() {
  const sel = $('#table-curve')
  const prev = state.tableCurveId
  sel.replaceChildren(
    ...state.curves.map((c, i) => {
      const o = document.createElement('option')
      o.value = c.id
      const tmp = document.createElement('div')
      tmp.innerHTML = c.eq
      o.textContent = `${i + 1}. ${tmp.textContent}`
      return o
    })
  )
  if (!state.curves.length) {
    state.tableCurveId = null
  } else {
    state.tableCurveId = state.curves.some((c) => c.id === prev) ? prev : state.curves[0].id
    sel.value = state.tableCurveId
  }
  if (state.tab === 'table') renderTable()
}

function currentTable(maxRows) {
  const c = state.curves.find((x) => x.id === state.tableCurveId)
  const step = parseFloat($('#table-step').value)
  if (!c || !c.f) return { c, rows: [], truncated: false, step }
  return { c, step, ...valueTable(c.f, c.lo, c.hi, step, maxRows) }
}

function renderTable() {
  const body = $('#table tbody')
  const note = $('#table-note')
  const { c, rows, truncated, step } = currentTable(1000)
  body.replaceChildren()
  if (!c) {
    note.textContent = 'Add a function to see its values.'
    return
  }
  if (!c.f) {
    note.textContent = c.error || 'Fix the function to see its values.'
    return
  }
  if (!(step > 0)) {
    note.textContent = 'Enter a step greater than 0.'
    return
  }
  note.textContent = `${rows.length} values from x = ${formatNumber(c.lo)} to ${formatNumber(c.hi)}${
    truncated ? ' (showing the first 1000, increase the step to see more)' : ''
  }`
  const frag = document.createDocumentFragment()
  for (const r of rows) {
    const tr = document.createElement('tr')
    const tx = document.createElement('td')
    tx.textContent = formatNumber(r.x)
    const ty = document.createElement('td')
    if (r.y === null) {
      ty.textContent = 'undefined'
      ty.className = 'undef'
    } else ty.textContent = formatNumber(r.y)
    tr.append(tx, ty)
    frag.append(tr)
  }
  body.append(frag)
}

$('#table-curve').addEventListener('change', (e) => {
  state.tableCurveId = Number(e.target.value)
  renderTable()
})
$('#table-step').addEventListener('input', renderTable)
$('#table-csv').addEventListener('click', () => {
  const { c, rows, step } = currentTable(200000)
  if (!c || !c.f || !(step > 0) || !rows.length) return toast('Nothing to export yet')
  const csv = 'x,y\n' + rows.map((r) => `${r.x},${r.y === null ? '' : r.y}`).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'graphica-values.csv' })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})

// ---------- tabs ----------

function setTab(tab) {
  state.tab = tab
  for (const t of ['curves', 'table']) {
    $(`#tab-btn-${t}`).setAttribute('aria-selected', String(t === tab))
    $(`#tab-${t}`).hidden = t !== tab
  }
  if (tab === 'table') renderTable()
}
$('#tab-btn-curves').addEventListener('click', () => setTab('curves'))
$('#tab-btn-table').addEventListener('click', () => setTab('table'))

// ---------- plot + toolbar ----------

const readout = $('#readout')
const short = (v) => formatNumber(Number(v.toPrecision(3)))
const plot = new Plot($('#plot'), {
  onViewChange: (b) => {
    readout.textContent = `x ${short(b.x0)} … ${short(b.x1)}   y ${short(b.y0)} … ${short(b.y1)}`
    scheduleViewSave()
  },
})
$('#zoom-in').addEventListener('click', () => plot.zoom(1.35))
$('#zoom-out').addEventListener('click', () => plot.zoom(1 / 1.35))
$('#fit').addEventListener('click', () => plot.fit())
$('#reset').addEventListener('click', () => plot.reset())
$('#btn-png').addEventListener('click', () => plot.exportPng('graphica.png'))

// ---------- theme ----------

$('#btn-theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem('graphica-theme', next)
  } catch {
    /* storage unavailable */
  }
  $('meta[name="theme-color"]').setAttribute('content', next === 'dark' ? '#070b14' : '#eef3fa')
  plot.draw()
})

// ---------- share / URL ----------

const b64 = {
  enc: (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)))
  },
}

function saveUrl() {
  clearTimeout(urlTimer)
  urlTimer = setTimeout(writeUrl, 250)
}
function scheduleViewSave() {
  clearTimeout(viewTimer)
  viewTimer = setTimeout(writeUrl, 400)
}

function writeUrl() {
  if (!state.curves.length && !location.hash) return
  const data = state.curves.map((c) => ({ t: c.type, p: c.params, l: c.lo, h: c.hi, v: c.visible ? 1 : 0, k: c.showPoints ? 1 : 0 }))
  const v = plot.view
  const r = (n) => Number(n.toPrecision(5))
  const hash = `#c=${b64.enc(JSON.stringify(data))}&v=${[v.cx, v.cy, v.sx, v.sy].map(r).join(',')}`
  history.replaceState(null, '', hash)
}

function readUrl() {
  try {
    const m = /[#&]c=([^&]+)/.exec(location.hash)
    if (!m) return null
    const raw = JSON.parse(b64.dec(m[1]))
    if (!Array.isArray(raw) || !raw.length) return null
    const curves = raw.slice(0, MAX_CURVES).map((d) => {
      if (!TYPES[d.t]) throw new Error('bad type')
      const params = defaultParams(d.t)
      for (const def of TYPES[d.t].params) if (Number.isFinite(d.p?.[def.key])) params[def.key] = d.p[def.key]
      if (d.t === 'custom') params.expr = String(d.p?.expr ?? '').slice(0, 200)
      return {
        type: d.t,
        params,
        lo: Number.isFinite(d.l) ? d.l : -10,
        hi: Number.isFinite(d.h) ? d.h : 10,
        visible: d.v !== 0,
        showPoints: d.k !== 0,
      }
    })
    const vm = /[#&]v=([^&]+)/.exec(location.hash)
    const view = vm ? vm[1].split(',').map(Number) : null
    return { curves, view: view && view.length === 4 && view.every(Number.isFinite) && view[2] > 0 && view[3] > 0 ? view : null }
  } catch {
    return null
  }
}

$('#btn-share').addEventListener('click', async () => {
  clearTimeout(urlTimer)
  writeUrl()
  const url = location.href
  try {
    await navigator.clipboard.writeText(url)
    toast('Link copied to clipboard')
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: url })
    document.body.append(ta)
    ta.select()
    const ok = document.execCommand?.('copy')
    ta.remove()
    toast(ok ? 'Link copied to clipboard' : 'Copy the link from the address bar')
  }
})

function toast(msg) {
  const t = $('#toast')
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200)
}

// ---------- start ----------

const initial = readUrl()
if (initial) {
  // restore the shared viewport synchronously (rAF is paused in background tabs)
  loadCurves(initial.curves, { fit: !initial.view })
  if (initial.view) {
    const [cx, cy, sx, sy] = initial.view
    plot.setView({ cx, cy, sx, sy })
  }
} else {
  loadCurves(EXAMPLES[0].curves)
}

