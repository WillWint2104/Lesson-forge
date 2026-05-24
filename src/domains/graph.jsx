import { C, SERIF, Instruction } from '../core/ui.jsx'

/* ═══════════════════════════════════════════
   DOMAIN — GRAPH
═══════════════════════════════════════════ */
export function GraphRenderer({ q, isAnswer, worksheet }) {
  const grid = q.content?.grid || {},
    { xMin = -5, xMax = 5, yMin = -5, yMax = 5, step = 1 } = grid
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
      let expr = m[1]
        .trim()
        .replace(/(\d)x/g, '$1*x')
        .replace(/x\^(\d+)/g, '(Math.pow(x,$1))')
      for (let xi = xMin; xi <= xMax; xi += 0.1) {
        try {
          const y = Function('x', 'Math', `"use strict";return(${expr})`)(xi, Math)
          if (isFinite(y) && y >= yMin - 1 && y <= yMax + 1) curve.push([toX(xi), toY(y)])
        } catch (e) {}
      }
    }
  }
  const xT = Array.from(
      { length: Math.floor((xMax - xMin) / step) + 1 },
      (_, i) => xMin + i * step
    ),
    yT = Array.from({ length: Math.floor((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step)
  return (
    <div>
      <Instruction text={q.instruction} worksheet={worksheet} />
      {q.content?.task && (
        <p style={{ fontFamily: SERIF, fontSize: '13px', color: C.slate, marginBottom: '8px' }}>
          {q.content.task}
        </p>
      )}
      <svg
        width={W}
        height={H}
        style={{ display: 'block', border: '1px solid #E2E8F0', background: '#FEFEFE' }}
      >
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
          <line x1={PAD} y1={toY(0)} x2={W - PAD} y2={toY(0)} stroke={C.black} strokeWidth="1.5" />
        )}
        {xMin <= 0 && xMax >= 0 && (
          <line x1={toX(0)} y1={PAD} x2={toX(0)} y2={H - PAD} stroke={C.black} strokeWidth="1.5" />
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
  )
}
