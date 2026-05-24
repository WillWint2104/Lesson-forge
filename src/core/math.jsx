/* ═══════════════════════════════════════════
   CORE — MATH RENDERING
═══════════════════════════════════════════ */

// Brand colors come from core/colors.js (a leaf module) so we don't pull in
// core/ui.jsx and create a cycle (ui.jsx already imports from this file).
import { GREEN as _GREEN, GREEN_DK as _GREEN_DK, BLACK as _BLACK } from './colors.js'

const MATH_FONT = "'STIX Two Text',Georgia,'Times New Roman',serif"
const MATH_SIZE = '16px'
const MATH_FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'sec',
  'csc',
  'cot',
  'log',
  'ln',
  'exp',
  'lim',
  'max',
  'min',
  'inf',
  'abs',
  'mod',
  'div',
  'gcd',
  'lcm',
  'det',
])
const ENGLISH_WORDS = new Set([
  'find',
  'solve',
  'show',
  'given',
  'hence',
  'write',
  'state',
  'prove',
  'using',
  'where',
  'when',
  'then',
  'with',
  'from',
  'into',
  'over',
  'that',
  'this',
  'each',
  'both',
  'left',
  'right',
  'true',
  'false',
  'note',
  'case',
  'let',
  'the',
  'and',
  'for',
  'not',
  'but',
  'any',
  'all',
  'use',
  'add',
  'sub',
  'see',
  'set',
  'put',
  'get',
  'out',
  'one',
  'two',
  'six',
  'ten',
  'per',
  'check',
  'expand',
  'collect',
  'simplify',
  'divide',
  'multiply',
  'subtract',
])

export function renderLetters(tok, key) {
  const lower = tok.toLowerCase()
  if (MATH_FUNCTIONS.has(lower) || ENGLISH_WORDS.has(lower) || tok.length > 4)
    return (
      <span key={key} style={{ fontFamily: MATH_FONT, fontSize: MATH_SIZE, fontStyle: 'normal' }}>
        {tok}
      </span>
    )
  return (
    <span
      key={key}
      style={{ fontFamily: MATH_FONT, fontStyle: 'italic', fontSize: MATH_SIZE, fontWeight: 400 }}
    >
      {tok}
    </span>
  )
}
export function renderMathText(s, key) {
  if (!s) return null
  const tokens = s.match(/[a-zA-Z]+|[^a-zA-Z]+/g) || [s]
  return (
    <span
      key={key}
      style={{ fontFamily: MATH_FONT, fontSize: MATH_SIZE, lineHeight: 1.6, fontStyle: 'normal' }}
    >
      {tokens.map((tok, ti) =>
        /^[a-zA-Z]+$/.test(tok) ? (
          renderLetters(tok, ti)
        ) : (
          <span key={ti} style={{ fontFamily: MATH_FONT, fontStyle: 'normal' }}>
            {tok}
          </span>
        )
      )}
    </span>
  )
}
export function MathFrac({ num, den }) {
  const p = {
    display: 'block',
    textAlign: 'center',
    fontFamily: MATH_FONT,
    fontSize: MATH_SIZE,
    lineHeight: 1.2,
    padding: '0 4px',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        verticalAlign: 'middle',
        margin: '0 2px',
        gap: 0,
      }}
    >
      <span style={{ ...p, borderBottom: '1px solid ' + _BLACK, paddingBottom: '1px' }}>
        {renderMathText(num, 'num')}
      </span>
      <span style={{ ...p, paddingTop: '1px' }}>{renderMathText(den, 'den')}</span>
    </span>
  )
}
export function MathExpr({ text }) {
  if (!text) return null
  const str = String(text)
  const wd = str.replace(
    /([^\s÷(]+|\([^)]+\))\s*÷\s*(\([^)]+\)|[^\s÷]+)/g,
    (_, n, d) => `${n.trim()}/${d.trim()}`
  )
  const fracRe = /(\([^)]+\)|[\w−\-]+)\s*\/\s*(\([^)]+\)|[\w−\-]+)/g
  const segs = []
  let last = 0,
    m
  fracRe.lastIndex = 0
  while ((m = fracRe.exec(wd)) !== null) {
    const num = m[1].replace(/^\(|\)$/g, ''),
      den = m[2].replace(/^\(|\)$/g, '')
    if (num.trim() === 'd' && /^d[a-zA-Z]/.test(den.trim())) continue
    if (m.index > last) segs.push({ type: 'text', val: wd.slice(last, m.index) })
    segs.push({ type: 'frac', num, den })
    last = m.index + m[0].length
  }
  if (last < wd.length) segs.push({ type: 'text', val: wd.slice(last) })
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        verticalAlign: 'middle',
      }}
    >
      {segs.map((seg, si) =>
        seg.type === 'frac' ? (
          <MathFrac key={si} num={seg.num} den={seg.den} />
        ) : (
          renderMathText(seg.val, si)
        )
      )}
    </span>
  )
}
export function NumberLine({ nl }) {
  if (!nl) return null
  const val = nl.value ?? 0,
    dir = nl.direction || (nl.right ? 'right' : 'left'),
    open = nl.open !== false && !nl.closed
  const rW = nl.range || 8,
    min = nl.min ?? val - rW / 2,
    max = nl.max ?? val + rW / 2
  const W = 320,
    H = 48,
    PL = 24,
    PR = 24,
    plotW = W - PL - PR,
    toX = (v) => PL + ((v - min) / (max - min)) * plotW,
    cx = toX(val)
  const ticks = []
  for (let i = Math.ceil(min); i <= Math.floor(max); i++) {
    const tx = toX(i)
    ticks.push(
      <g key={i}>
        <line x1={tx} y1={H / 2 - 5} x2={tx} y2={H / 2 + 5} stroke="#94A3B8" strokeWidth="1" />
        <text
          x={tx}
          y={H / 2 + 16}
          textAnchor="middle"
          fontSize="9"
          fill="#94A3B8"
          fontFamily="sans-serif"
        >
          {i}
        </text>
      </g>
    )
  }
  const al = 10
  let lp, ah
  if (dir === 'right') {
    const ex = Math.min(W - PR + 8, W - 4)
    lp = `M${cx},${H / 2} L${ex},${H / 2}`
    ah = `M${ex},${H / 2} L${ex - al},${H / 2 - 5} L${ex - al},${H / 2 + 5} Z`
  } else {
    const ex = Math.max(PL - 8, 4)
    lp = `M${cx},${H / 2} L${ex},${H / 2}`
    ah = `M${ex},${H / 2} L${ex + al},${H / 2 - 5} L${ex + al},${H / 2 + 5} Z`
  }
  return (
    <svg width={W} height={H} style={{ display: 'block', margin: '6px 0', overflow: 'visible' }}>
      <line x1={PL} y1={H / 2} x2={W - PR} y2={H / 2} stroke="#CBD5E1" strokeWidth="1.5" />
      <path d={lp} stroke={_GREEN} strokeWidth="2.5" fill="none" />
      <path d={ah} fill={_GREEN} />
      <circle
        cx={cx}
        cy={H / 2}
        r={6}
        fill={open ? 'white' : _GREEN}
        stroke={_GREEN}
        strokeWidth="2"
      />
      {ticks}
      <text
        x={cx}
        y={H / 2 - 12}
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill={_GREEN_DK}
        fontFamily="sans-serif"
      >
        {val}
      </text>
    </svg>
  )
}
