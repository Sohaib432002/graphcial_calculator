// Safe math-expression parser (no eval). Supports + - * / ^, parentheses,
// implicit multiplication (2x, 3(x+1), x sin(x)), constants and common functions.

const FUNCS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sign: Math.sign,
}
const CONSTS = { pi: Math.PI, e: Math.E }
const NAMES = [...Object.keys(FUNCS), ...Object.keys(CONSTS), 'x'].sort((a, b) => b.length - a.length)

const SUPERSCRIPTS = { '²': '^2', '³': '^3', '⁴': '^4' }

function normalize(src) {
  return String(src)
    .toLowerCase()
    .replace(/[²³⁴]/g, (m) => SUPERSCRIPTS[m])
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/π/g, 'pi')
    .replace(/\*\*/g, '^')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(src) {
  const tokens = []
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (ch === ' ') {
      i++
      continue
    }
    // e-notation needs digits after the "e" (so "2e" is 2*e, while "2e3" is 2000)
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(src.slice(i))
    if (num) {
      tokens.push({ t: 'num', v: parseFloat(num[0]) })
      i += num[0].length
      continue
    }
    if ('+-*/^'.includes(ch)) {
      tokens.push({ t: 'op', v: ch })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ t: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ t: ')' })
      i++
      continue
    }
    if (/[a-z]/.test(ch)) {
      const rest = src.slice(i)
      const name = NAMES.find((n) => rest.startsWith(n))
      if (!name) {
        const word = /^[a-z]+/.exec(rest)[0]
        throw new Error(`Unknown name "${word}"`)
      }
      if (name in FUNCS) tokens.push({ t: 'func', v: name })
      else if (name in CONSTS) tokens.push({ t: 'num', v: CONSTS[name] })
      else tokens.push({ t: 'x' })
      i += name.length
      continue
    }
    throw new Error(`Unexpected "${ch}"`)
  }
  return tokens
}

function insertImplicit(tokens) {
  const out = []
  for (let i = 0; i < tokens.length; i++) {
    const prev = out[out.length - 1]
    const cur = tokens[i]
    const prevEndsValue = prev && (prev.t === 'num' || prev.t === 'x' || prev.t === ')')
    const curStartsValue = cur.t === 'num' || cur.t === 'x' || cur.t === 'func' || cur.t === '('
    if (prevEndsValue && curStartsValue) out.push({ t: 'op', v: '*' })
    out.push(cur)
  }
  return out
}

const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 }
const RIGHT = new Set(['^', 'neg'])

function toRpn(tokens) {
  const out = []
  const stack = []
  let expectValue = true // true when the next token must start a value (so '-' is unary)
  for (const tk of tokens) {
    if (tk.t === 'num' || tk.t === 'x') {
      out.push(tk)
      expectValue = false
    } else if (tk.t === 'func') {
      stack.push(tk)
      expectValue = true
    } else if (tk.t === '(') {
      stack.push(tk)
      expectValue = true
    } else if (tk.t === ')') {
      while (stack.length && stack[stack.length - 1].t !== '(') out.push(stack.pop())
      if (!stack.length) throw new Error('Unmatched ")"')
      stack.pop()
      if (stack.length && stack[stack.length - 1].t === 'func') out.push(stack.pop())
      expectValue = false
    } else if (tk.t === 'op') {
      if (expectValue) {
        if (tk.v === '-') {
          stack.push({ t: 'op', v: 'neg' })
        } else if (tk.v === '+') {
          // unary plus: ignore
        } else {
          throw new Error(`Unexpected "${tk.v}"`)
        }
      } else {
        const p = PREC[tk.v]
        while (stack.length) {
          const top = stack[stack.length - 1]
          if (top.t !== 'op') break
          const tp = PREC[top.v]
          if (tp > p || (tp === p && !RIGHT.has(tk.v))) out.push(stack.pop())
          else break
        }
        stack.push(tk)
        expectValue = true
      }
    }
  }
  if (expectValue && tokens.length) throw new Error('Expression ends unexpectedly')
  while (stack.length) {
    const top = stack.pop()
    if (top.t === '(') throw new Error('Unmatched "("')
    if (top.t === 'func') throw new Error(`Use ${top.v}(...) with parentheses`)
    out.push(top)
  }
  return out
}

/** Compile an expression in x. Returns { f } or { error }. */
export function compileExpression(source) {
  try {
    const src = normalize(source)
    if (!src) return { error: 'Enter an expression, e.g. sin(x) or x^2 - 4' }
    const rpn = toRpn(insertImplicit(tokenize(src)))
    const f = (x) => {
      const st = []
      for (const tk of rpn) {
        switch (tk.t) {
          case 'num':
            st.push(tk.v)
            break
          case 'x':
            st.push(x)
            break
          case 'func':
            st.push(FUNCS[tk.v](st.pop()))
            break
          case 'op': {
            if (tk.v === 'neg') {
              st.push(-st.pop())
              break
            }
            const b = st.pop()
            const a = st.pop()
            if (a === undefined || b === undefined) throw new Error('Incomplete expression')
            st.push(tk.v === '+' ? a + b : tk.v === '-' ? a - b : tk.v === '*' ? a * b : tk.v === '/' ? a / b : a ** b)
            break
          }
          default:
            break
        }
      }
      if (st.length !== 1) throw new Error('Incomplete expression')
      return st[0]
    }
    f(1) // structural check
    return { f }
  } catch (err) {
    return { error: err.message }
  }
}
