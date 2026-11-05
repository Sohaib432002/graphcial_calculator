import test from 'node:test'
import assert from 'node:assert/strict'
import { compileExpression } from '../js/parser.js'
import { buildFunction, defaultParams, equationHtml, TYPES, TYPE_ORDER } from '../js/functions.js'
import { analyze, findExtrema, findRoots, formatNumber, valueTable } from '../js/analysis.js'

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`)
const evalExpr = (src, x = 0) => {
  const r = compileExpression(src)
  assert.ok(r.f, `"${src}" should compile: ${r.error}`)
  return r.f(x)
}

test('parser: arithmetic and precedence', () => {
  assert.equal(evalExpr('1 + 2 * 3'), 7)
  assert.equal(evalExpr('(1 + 2) * 3'), 9)
  assert.equal(evalExpr('2^3^2'), 512) // right associative
  assert.equal(evalExpr('-2^2'), -4) // unary minus binds looser than ^
  assert.equal(evalExpr('2^-1'), 0.5)
  assert.equal(evalExpr('10 / 4'), 2.5)
  assert.equal(evalExpr('2 * -3'), -6)
})

test('parser: variables, implicit multiplication, constants', () => {
  assert.equal(evalExpr('2x', 5), 10)
  assert.equal(evalExpr('3(x+1)', 1), 6)
  assert.equal(evalExpr('x(x+1)', 2), 6)
  assert.equal(evalExpr('x^2 - 4', 3), 5)
  near(evalExpr('2pi'), 2 * Math.PI)
  near(evalExpr('e^x', 1), Math.E)
  near(evalExpr('2e'), 2 * Math.E)
  assert.equal(evalExpr('2e3'), 2000)
  near(evalExpr('xsin(x)', Math.PI / 2), Math.PI / 2)
})

test('parser: functions and unicode input', () => {
  near(evalExpr('sin(x)', Math.PI / 2), 1)
  assert.equal(evalExpr('sqrt(16)'), 4)
  assert.equal(evalExpr('abs(-3)'), 3)
  assert.equal(evalExpr('log(1000)'), 3)
  near(evalExpr('ln(e)'), 1)
  assert.equal(evalExpr('x²', 4), 16)
  assert.equal(evalExpr('x × 2', 4), 8)
  near(evalExpr('π'), Math.PI)
})

test('parser: rejects bad input with clear messages', () => {
  for (const bad of ['', '2 +', '(1+2', '1+2)', 'foo(x)', 'sin x', '3 $ 4', '* 2']) {
    const r = compileExpression(bad)
    assert.ok(r.error, `"${bad}" should be rejected`)
  }
  assert.match(compileExpression('foo(x)').error, /Unknown name/)
})

test('parser: no code execution', () => {
  const r = compileExpression('constructor.constructor("return 1")()')
  assert.ok(r.error)
})

test('linear: y = 2x + 3', () => {
  const { f } = buildFunction('linear', { m: 2, c: 3 })
  assert.equal(f(0), 3)
  assert.equal(f(-2), -1)
})

test('quadratic: y = x^2 - 4', () => {
  const { f } = buildFunction('quadratic', { a: 1, b: 0, c: -4 })
  assert.equal(f(3), 5)
  assert.equal(f(0), -4)
})

// Regression: the original Flask app overwrote the constant term (d = c after c = p),
// so cubic and quartic graphs were wrong. Every coefficient must be used correctly.
test('cubic uses all four coefficients: y = 2x^3 - 3x^2 + 4x + 5', () => {
  const { f } = buildFunction('cubic', { a: 2, b: -3, c: 4, d: 5 })
  assert.equal(f(0), 5)
  assert.equal(f(1), 2 - 3 + 4 + 5)
  assert.equal(f(2), 16 - 12 + 8 + 5)
  assert.equal(f(-1), -2 - 3 - 4 + 5)
})

test('quartic uses all five coefficients: y = x^4 + 2x^3 - 3x^2 + 4x - 7', () => {
  const { f } = buildFunction('quartic', { a: 1, b: 2, c: -3, d: 4, e: -7 })
  assert.equal(f(0), -7)
  assert.equal(f(1), 1 + 2 - 3 + 4 - 7)
  assert.equal(f(2), 16 + 16 - 12 + 8 - 7)
})

test('exponential: y = a^(bx + d) + c', () => {
  const { f } = buildFunction('exponential', { a: 2, b: 3, d: 1, c: -5 })
  assert.equal(f(0), 2 ** 1 - 5)
  assert.equal(f(1), 2 ** 4 - 5)
  assert.equal(f(-2), 2 ** -5 - 5)
  assert.ok(buildFunction('exponential', { a: 0, b: 1, d: 0, c: 0 }).error)
  assert.ok(buildFunction('exponential', { a: -2, b: 1, d: 0, c: 0 }).error)
})

test('logarithmic: y = a*log_b(x) + c, defined only for x > 0', () => {
  const { f } = buildFunction('logarithmic', { base: 2, a: 1, c: 0 })
  near(f(8), 3)
  near(f(1), 0)
  assert.ok(Number.isNaN(f(0)))
  assert.ok(Number.isNaN(f(-3)))
  near(buildFunction('logarithmic', { base: 10, a: 2, c: 1 }).f(100), 5)
  assert.ok(buildFunction('logarithmic', { base: 1, a: 1, c: 0 }).error)
  assert.ok(buildFunction('logarithmic', { base: -2, a: 1, c: 0 }).error)
})

test('non-numeric parameters give an error instead of NaN curves', () => {
  assert.ok(buildFunction('linear', { m: NaN, c: 0 }).error)
  assert.ok(buildFunction('quadratic', { a: 1, b: Infinity, c: 0 }).error)
})

test('every type has working defaults', () => {
  for (const type of TYPE_ORDER) {
    const r = buildFunction(type, defaultParams(type))
    assert.ok(r.f, `${type} default should build: ${r.error}`)
    assert.ok(Number.isFinite(r.f(2)), `${type} default evaluates`)
    assert.ok(TYPES[type].label)
  }
})

test('roots of x^2 - 4 are -2 and 2', () => {
  const { f } = buildFunction('quadratic', { a: 1, b: 0, c: -4 })
  const roots = findRoots(f, -10, 10)
  assert.equal(roots.length, 2)
  near(roots[0], -2)
  near(roots[1], 2)
})

test('roots of x^4 - 5x^2 + 4 are -2, -1, 1, 2', () => {
  const { f } = buildFunction('quartic', { a: 1, b: 0, c: -5, d: 0, e: 4 })
  const roots = findRoots(f, -10, 10)
  assert.deepEqual(roots.map((r) => Math.round(r)), [-2, -1, 1, 2])
})

test('root exactly at a sample point is found once', () => {
  const { f } = buildFunction('linear', { m: 1, c: 0 })
  assert.deepEqual(findRoots(f, -10, 10), [0])
})

test('no false root across the pole of 1/x', () => {
  const f = compileExpression('1/x').f
  assert.deepEqual(findRoots(f, -5, 5), [])
})

test('sin(x) has 7 roots in [-10, 10]', () => {
  const f = compileExpression('sin(x)').f
  assert.equal(findRoots(f, -10, 10).length, 7)
})

test('extrema of x^3 - 3x: max at x=-1 (y=2), min at x=1 (y=-2)', () => {
  const { f } = buildFunction('cubic', { a: 1, b: 0, c: -3, d: 0 })
  const ex = findExtrema(f, -5, 5)
  assert.equal(ex.length, 2)
  assert.equal(ex[0].kind, 'max')
  near(ex[0].x, -1, 1e-4)
  near(ex[0].y, 2, 1e-4)
  assert.equal(ex[1].kind, 'min')
  near(ex[1].x, 1, 1e-4)
  near(ex[1].y, -2, 1e-4)
})

test('a line has no extrema and a parabola has one vertex', () => {
  assert.equal(findExtrema(buildFunction('linear', { m: 2, c: 1 }).f, -10, 10).length, 0)
  const ex = findExtrema(buildFunction('quadratic', { a: 1, b: 0, c: -4 }).f, -10, 10)
  assert.equal(ex.length, 1)
  assert.equal(ex[0].kind, 'min')
  near(ex[0].y, -4, 1e-6)
})

test('analyze reports intercepts', () => {
  const a = analyze(buildFunction('quadratic', { a: 1, b: 0, c: -4 }).f, -10, 10)
  assert.equal(a.yIntercept, -4)
  assert.equal(a.roots.length, 2)
  assert.equal(analyze(buildFunction('linear', { m: 1, c: 0 }).f, 1, 10).yIntercept, null) // 0 not in domain
})

test('value table: both directions, any sign of range (the original needed 6 branches for this)', () => {
  const f = buildFunction('linear', { m: 2, c: 1 }).f
  const cases = [
    [-3, 3], [3, -3], [-5, -1], [-1, -5], [1, 5], [5, 1], [0, 4], [4, 0], [-4, 0], [0, -4], [2, 2],
  ]
  for (const [s, e] of cases) {
    const { rows } = valueTable(f, s, e, 1)
    assert.equal(rows.length, Math.abs(e - s) + 1, `${s}..${e}`)
    assert.equal(rows[0].x, s)
    assert.equal(rows[rows.length - 1].x, e)
    rows.forEach((r) => assert.equal(r.y, 2 * r.x + 1))
  }
  const { rows } = valueTable(f, 0, 1, 0.25)
  assert.deepEqual(rows.map((r) => r.x), [0, 0.25, 0.5, 0.75, 1])
})

test('value table: undefined values and row cap', () => {
  const log = buildFunction('logarithmic', { base: 2, a: 1, c: 0 }).f
  const { rows } = valueTable(log, -2, 2, 1)
  assert.equal(rows.find((r) => r.x === 0).y, null)
  assert.equal(rows.find((r) => r.x === 2).y, 1)
  const big = valueTable((x) => x, 0, 1e6, 1, 500)
  assert.equal(big.rows.length, 500)
  assert.equal(big.truncated, true)
  assert.equal(valueTable((x) => x, 0, 5, 0).rows.length, 0)
})

test('equation text', () => {
  assert.equal(equationHtml('linear', { m: 1, c: 0 }), 'y = x')
  assert.equal(equationHtml('linear', { m: -2, c: 3 }), 'y = −2x + 3')
  assert.equal(equationHtml('linear', { m: 0, c: 0 }), 'y = 0')
  assert.equal(equationHtml('quadratic', { a: 1, b: 0, c: -4 }), 'y = x² − 4')
  assert.equal(equationHtml('quadratic', { a: -1, b: 2, c: 0 }), 'y = −x² + 2x')
  assert.equal(equationHtml('cubic', { a: 2, b: -3, c: 4, d: 5 }), 'y = 2x³ − 3x² + 4x + 5')
  assert.equal(equationHtml('quartic', { a: 1, b: 0, c: -5, d: 0, e: 4 }), 'y = x⁴ − 5x² + 4')
  assert.equal(equationHtml('exponential', { a: 2, b: 1, d: 0, c: 0 }), 'y = 2<sup>x</sup>')
  assert.equal(equationHtml('exponential', { a: 3, b: 2, d: -1, c: 4 }), 'y = 3<sup>2x − 1</sup> + 4')
  assert.equal(equationHtml('logarithmic', { base: 2, a: 1, c: 0 }), 'y = log<sub>2</sub>(x)')
  assert.equal(equationHtml('custom', { expr: '<b>x</b>' }), 'y = &lt;b&gt;x&lt;/b&gt;')
})

test('number formatting', () => {
  assert.equal(formatNumber(0), '0')
  assert.equal(formatNumber(1.5), '1.5')
  assert.equal(formatNumber(0.1 + 0.2), '0.3')
  assert.equal(formatNumber(1 / 3), '0.3333333')
  assert.equal(formatNumber(null), 'undefined')
  assert.equal(formatNumber(NaN), 'undefined')
  assert.equal(formatNumber(2.5e12), '2.500e12')
})
