import { Parser } from 'expr-eval'
import { C, SERIF, Instruction } from '../core/ui.jsx'

// Shared parser instance — expr-eval's Parser is a whitelist math-expression
// evaluator (+, -, *, /, ^, parens, common Math functions). It does NOT execute
// arbitrary JavaScript, so a malicious or malformed `rule_expression` from the
// LLM or a pasted lesson can't trigger code execution in the browser the way
// the previous `new Function(...)` call could.
const exprParser = new Parser()

/* ═══════════════════════════════════════════
   DOMAIN — GRAPH
═══════════════════════════════════════════ */
export function GraphRenderer({ q, isAnswer, worksheet }) {
  const grid = q.content?.grid || {},
    { xMin = -5, xMax = 5, yMin = -5, yMax = 5, step = 1 } = grid
  // Guard `step` against 0 / NaN / negative — otherwise Math.floor((max-min)/step)
  // produces Infinity or a negative length and Array.from blows up.
  const safeStep = Math.max(0.1, Math.abs(Number(step) || 1))
  const pts = isAnswer ? q.answer?.points || [] : [],
    rule = q.content?.rule_expression || q.answer?.rule_expression
  const PAD = 32,
    W = 260,
    H = 260,
    toX = (x) => ((x - xMin) / (xMax - xMin || 1)) * (W - PAD * 2) + PAD,
    toY = (y) => ((yMax - y) / (yMax - yMin || 1)) * (H - PAD * 2) + PAD,
    curve = []
  if (isAnswer && rule) {
    const m = rule.match(/y\s*=\s*(.+)/i)
    if (m) {
      try {
        const expr = exprParser.parse(m[1].trim())
        for (let xi = xMin; xi <= xMax; xi += 0.1) {
          const y = expr.evaluate({ x: xi })
          if (isFinite(y) && y >= yMin - 1 && y <= yMax + 1) curve.push([toX(xi), toY(y)])
        }
      } catch (_) {
        // Parse or evaluation failure → no curve. Empty curve renders nothing,
        // which is the same visible outcome as the previous swallow-and-continue.
      }
    }
  }
  const xT = Array.from(
      { length: Math.floor((xMax - xMin) / safeStep) + 1 },
      (_, i) => xMin + i * safeStep
    ),
    yT = Array.from(
      { length: Math.floor((yMax - yMin) / safeStep) + 1 },
      (_, i) => yMin + i * safeStep
    )
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      {q.content?.task && (
        <p style={{ fontFamily: SERIF, fontSize: '13px', color: C.slate, marginBottom: '8px' }}>
          {q.content.task}
        </p>
      )}
      <div
        style={{
          display: 'inline-block',
          background: '#FAFAFA',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '8px',
        }}
      >
        <svg width={W} height={H} style={{ display: 'block', background: '#FEFEFE' }}>
          {xT.map((x) => (
            <line
              key={'gx' + x}
              x1={toX(x)}
              y1={PAD}
              x2={toX(x)}
              y2={H - PAD}
              stroke="#E2E8F0"
              strokeWidth="0.5"
            />
          ))}
          {yT.map((y) => (
            <line
              key={'gy' + y}
              x1={PAD}
              y1={toY(y)}
              x2={W - PAD}
              y2={toY(y)}
              stroke="#E2E8F0"
              strokeWidth="0.5"
            />
          ))}
          {yMin <= 0 && yMax >= 0 && (
            <line
              x1={PAD}
              y1={toY(0)}
              x2={W - PAD}
              y2={toY(0)}
              stroke={C.black}
              strokeWidth="1.5"
            />
          )}
          {xMin <= 0 && xMax >= 0 && (
            <line
              x1={toX(0)}
              y1={PAD}
              x2={toX(0)}
              y2={H - PAD}
              stroke={C.black}
              strokeWidth="1.5"
            />
          )}
          {xT
            .filter((x) => x !== 0)
            .map((x) => (
              <text
                key={'tx' + x}
                x={toX(x)}
                y={toY(0) + 13}
                fontSize="8"
                fill={C.slate}
                textAnchor="middle"
              >
                {x}
              </text>
            ))}
          {yT
            .filter((y) => y !== 0)
            .map((y) => (
              <text
                key={'ty' + y}
                x={toX(0) - 6}
                y={toY(y) + 3}
                fontSize="8"
                fill={C.slate}
                textAnchor="end"
              >
                {y}
              </text>
            ))}
          {curve.length > 1 && (
            <polyline
              points={curve.map((p) => p.join(',')).join(' ')}
              fill="none"
              stroke={C.green}
              strokeWidth="2"
            />
          )}
          {pts.map((pt, pi) => (
            <g key={pi}>
              <circle
                cx={toX(pt.x)}
                cy={toY(pt.y)}
                r={5}
                fill={C.green}
                stroke="#fff"
                strokeWidth="1.5"
              />
              {pt.label && (
                <text
                  x={toX(pt.x) + 8}
                  y={toY(pt.y) - 6}
                  fontSize="10"
                  fontWeight="700"
                  fill={C.greenDk}
                >
                  {pt.label}
                </text>
              )}
            </g>
          ))}
          <text x={W - PAD + 4} y={toY(0) + 4} fontSize="10" fill={C.slate}>
            x
          </text>
          <text x={toX(0) + 4} y={PAD - 4} fontSize="10" fill={C.slate}>
            y
          </text>
        </svg>
      </div>
    </div>
  )
}
